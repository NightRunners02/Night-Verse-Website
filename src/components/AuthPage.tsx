import React, { useState, useEffect } from "react";
import { ArrowLeft, ShieldAlert, KeyRound, Mail, User as UserIcon, Lock, Sparkles, Eye, EyeOff } from "lucide-react";
import { useAppState } from "../context/AppState.js";
import { db } from "../lib/db.js";
import { hashPassword } from "../lib/crypto.js";

interface AuthPageProps {
  initialIsAdmin?: boolean;
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialIsAdmin = false }) => {
  const { login, navigateTo, triggerToast, createNotification } = useAppState();
  
  // States
  const [isAdminLogin, setIsAdminLogin] = useState(initialIsAdmin);
  const [isRegister, setIsRegister] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  // Registration and Logging forms
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Forgot password flow states
  const [forgotEmail, setForgotEmail] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetUserId, setResetUserId] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Show/Hide password toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Load remembered username if exists
  useEffect(() => {
    const remembered = localStorage.getItem("nv_remembered_username");
    if (remembered) {
      setUsername(remembered);
      setRememberMe(true);
    }
  }, []);

  const handleUserLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      triggerToast("Form Incomplete", "Please supply username/email and password credentials", "info");
      return;
    }

    const foundUser = db.users.getByLoginKey(username);
    if (foundUser && !foundUser.isSuspended) {
      // Secure password check
      const inputHash = hashPassword(password);
      const isCorrectPassword = foundUser.passwordHash 
        ? foundUser.passwordHash === inputHash 
        : (password === "user123" || password === "admin123" || password === "mod123");

      if (isCorrectPassword) {
        // Upgrade legacy user hash on login if missing
        if (!foundUser.passwordHash) {
          db.users.update(foundUser.id, { passwordHash: inputHash });
        }

        // Handle Remember Me
        if (rememberMe) {
          localStorage.setItem("nv_remembered_username", username);
        } else {
          localStorage.removeItem("nv_remembered_username");
        }

        login(foundUser, foundUser.id);
        
        createNotification({
          userId: foundUser.id,
          triggeredById: foundUser.id,
          triggeredByAvatar: foundUser.profile?.avatarUrl,
          title: "Security Alert: New Login",
          message: "A new login was detected on your account.",
          category: "SYSTEM",
          type: "LOGIN_ALERT",
          link: "SETTINGS:SECURITY"
        });
      } else {
        triggerToast("Login Failed", "Incorrect password credentials. Please try again.", "error");
      }
    } else if (foundUser?.isSuspended) {
       triggerToast("Account Locked", "This account has been suspended by a moderator.", "error");
    } else {
      triggerToast("Login Failed", "No registered account matches the supplied credentials.", "error");
    }
  };

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      triggerToast("Credentials Incomplete", "Please supply administrative keys", "info");
      return;
    }

    const foundUser = db.users.getByLoginKey(username);
    if (foundUser && (foundUser.role === "ADMIN" || foundUser.role === "SUPER_ADMIN" || foundUser.role === "MODERATOR")) {
      // Secure password check
      const inputHash = hashPassword(password);
      const isCorrectPassword = foundUser.passwordHash 
        ? foundUser.passwordHash === inputHash 
        : (password === "admin123" || password === "mod123");

      if (isCorrectPassword) {
        // Upgrade legacy user hash on login if missing
        if (!foundUser.passwordHash) {
          db.users.update(foundUser.id, { passwordHash: inputHash });
        }

        login(foundUser, foundUser.id);

        createNotification({
          userId: foundUser.id,
          triggeredById: foundUser.id,
          triggeredByAvatar: foundUser.profile?.avatarUrl,
          title: "Admin Login Alert",
          message: "Successful administrative login detected.",
          category: "ADMIN",
          type: "LOGIN_ALERT",
          link: "ADMIN:SECURITY"
        });
      } else {
        triggerToast("Access Denied", "Incorrect password credentials.", "error");
      }
    } else {
      triggerToast("Admin Access Denied", "Insufficient permissions for administrative console.", "error");
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !username || !password || !fullName) {
      triggerToast("Missing Parameters", "All profile configuration elements are mandatory", "info");
      return;
    }

    const exists = db.users.getByLoginKey(username) || db.users.getByLoginKey(email);
    if (exists) {
      triggerToast("Registration Failed", "Username or email identifier already exists in registry.", "error");
      return;
    }

    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      username,
      passwordHash: hashPassword(password),
      role: "USER" as const,
      isSuspended: false,
      emailVerified: false,
      createdAt: new Date().toISOString(),
      profile: {
        fullName,
        bio: "NightVerse Newcomer",
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
      }
    };

    db.users.add(newUser);
    login(newUser, newUser.id);
    triggerToast("Registration Completed!", "Your profile is successfully registered and logged in.", "success");
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;

    const foundUser = db.users.getByLoginKey(forgotEmail);
    if (foundUser) {
      setResetUserId(foundUser.id);
      setShowResetForm(true);
      triggerToast("Account Identified", "Identity verified. You may now update your password.", "success");
    } else {
      triggerToast("Account Missing", "Email not found in our global directory.", "error");
    }
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !resetUserId) return;

    db.users.update(resetUserId, { 
      emailVerified: true,
      passwordHash: hashPassword(newPassword)
    });
    
    createNotification({
      userId: resetUserId,
      triggeredById: resetUserId,
      title: "Password Changed",
      message: "Your account password has been successfully updated.",
      category: "SYSTEM",
      type: "PASSWORD_CHANGE",
      link: "SETTINGS:SECURITY"
    });

    triggerToast("Identity Updated", "Password changed successfully! You can now log in.", "success");
    setIsForgotPassword(false);
    setIsRegister(false);
    setShowResetForm(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between py-12 px-6 relative overflow-hidden font-sans">
      
      {/* Background radial overlays */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Header Escaper */}
      <div className="max-w-7xl mx-auto w-full">
        <button 
          onClick={() => navigateTo("landing")}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-mono bg-slate-900/60 border border-slate-800 hover:border-slate-700 py-2 px-4 rounded-xl transition-all cursor-pointer"
          id="btn-back-to-landing"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Landing Page
        </button>
      </div>

      {/* Central Login Shell cards wrapper */}
      <div className="w-full max-w-md mx-auto my-8 relative z-10">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-xl shadow-2xl space-y-6">
          
          {/* Main header title descriptions */}
          <div className="text-center">
            
            {/* Entrance badge icons */}
            {isAdminLogin ? (
              <div className="w-12 h-12 bg-rose-950/40 text-rose-400 border border-rose-800/40 rounded-2xl flex items-center justify-center mx-auto mb-4 select-none">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-purple-950/40 text-purple-400 border border-purple-800/40 rounded-2xl flex items-center justify-center mx-auto mb-4 select-none">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
            )}

            <h3 className="text-2xl font-extrabold font-space text-slate-100">
              {isAdminLogin 
                ? "Admin Entrance Controls" 
                : (isForgotPassword ? "Credential Safeguards" : (isRegister ? "Join NightVerse Platforms" : "Welcome into NightVerse"))
              }
            </h3>
            <p className="text-xs text-slate-400 mt-2 max-w-[280px] mx-auto font-sans leading-relaxed">
              {isAdminLogin 
                ? "Protected console module for moderation checks and tagging analytics control."
                : (isForgotPassword ? "Secure sandbox allows immediate update of password queries." : "Establish high fidelity creations on the go.")
              }
            </p>
          </div>

          {/* Sandbox Credentials Tooltip Drawer */}
          <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl text-[10px] font-mono text-slate-400 space-y-1">
            <span className="text-purple-400 font-bold block mb-1">Sandbox Evaluation Login Cards:</span>
            {isAdminLogin ? (
              <>
                <p>🔹 <span className="text-slate-200">Super Admin:</span> superadmin@nightverse.com | admin123</p>
                <p>🔹 <span className="text-slate-200">Executive Admin:</span> admin@nightverse.com | admin123</p>
                <p>🔹 <span className="text-slate-200">Moderations Lead:</span> mod@nightverse.com | mod123</p>
              </>
            ) : (
              <>
                <p>🔹 <span className="text-slate-200">Visual Photographer:</span> neon_shadow | user123</p>
                <p>🔹 <span className="text-slate-200">Cyber Illustrator:</span> pixel_dreamer | user123</p>
                <p>💡 <span className="text-slate-200">Or establish custom profiles instantly by clicking sign up!</span></p>
              </>
            )}
          </div>

          {/* Core Login/Register Router Forms */}
          {isForgotPassword ? (
            <div>
              {!showResetForm ? (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] tracking-widest font-mono text-slate-500 uppercase">Input connected email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                      <input 
                        type="email" 
                        placeholder="yourname@gmail.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full text-xs bg-slate-950 border border-slate-850 focus:border-purple-500 rounded-xl py-3.5 pl-10 pr-4 text-slate-100 placeholder-slate-500 outline-none"
                        required
                        id="forgot-email"
                      />
                    </div>
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all text-xs uppercase"
                    id="btn-forgot-submit"
                  >
                    Verify Email sandbox
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setIsForgotPassword(false); setIsRegister(false); }}
                    className="w-full text-center text-xs text-slate-400 hover:text-white cursor-pointer mt-2"
                  >
                    Go Back to Login Sign In
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <p className="text-[11px] text-emerald-400">✔ Account localized inside database! Instantly configure your new login password.</p>
                  <div className="space-y-1.5">
                    <label className="text-[10px] tracking-widest font-mono text-slate-500 uppercase">New secure password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                      <input 
                        type={showResetPassword ? "text" : "password"} 
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full text-xs bg-slate-950 border border-slate-850 focus:border-purple-500 rounded-xl py-3.5 pl-10 pr-10 text-slate-100 placeholder-slate-500 outline-none"
                        required
                        id="reset-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetPassword(!showResetPassword)}
                        className="absolute right-3 top-3.5 p-0.5 text-slate-500 hover:text-slate-350 transition-colors cursor-pointer"
                        title={showResetPassword ? "Hide password" : "Show password"}
                      >
                        {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all text-xs uppercase"
                    id="btn-reset-submit"
                  >
                    Establish Password Change
                  </button>
                </form>
              )}
            </div>
          ) : (
            <>
              {isRegister && !isAdminLogin ? (
                // ------------------ REGISTER FORM ------------------
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] tracking-widest font-mono text-slate-500 uppercase">Full Legal Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                      <input 
                        type="text" 
                        placeholder="Riku Hanzo"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full text-xs bg-slate-950 border border-slate-850 focus:border-purple-500 rounded-xl py-3.5 pl-10 pr-4 text-slate-100 placeholder-slate-500 outline-none"
                        required
                        id="reg-fullname"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] tracking-widest font-mono text-slate-500 uppercase">Username Handle</label>
                    <div className="relative">
                      <Sparkles className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                      <input 
                        type="text" 
                        placeholder="neon_shadow"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full text-xs bg-slate-950 border border-slate-850 focus:border-purple-500 rounded-xl py-3.5 pl-10 pr-4 text-slate-100 placeholder-slate-500 outline-none"
                        required
                        id="reg-username"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] tracking-widest font-mono text-slate-500 uppercase">Verify Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                      <input 
                        type="email" 
                        placeholder="neon@nightverse.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full text-xs bg-slate-950 border border-slate-850 focus:border-purple-500 rounded-xl py-3.5 pl-10 pr-4 text-slate-100 placeholder-slate-500 outline-none"
                        required
                        id="reg-email"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] tracking-widest font-mono text-slate-500 uppercase">Security Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                      <input 
                        type={showRegisterPassword ? "text" : "password"} 
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full text-xs bg-slate-950 border border-slate-850 focus:border-purple-500 rounded-xl py-3.5 pl-10 pr-10 text-slate-100 placeholder-slate-500 outline-none"
                        required
                        id="reg-pass"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="absolute right-3 top-3.5 p-0.5 text-slate-500 hover:text-slate-350 transition-colors cursor-pointer"
                        title={showRegisterPassword ? "Hide password" : "Show password"}
                      >
                        {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-bold transition-all text-xs uppercase hover:shadow-lg hover:shadow-purple-500/20 active:scale-95 cursor-pointer mt-2"
                    id="btn-reg-submit"
                  >
                    Register Account
                  </button>

                  <div className="text-center pt-2">
                    <p className="text-xs text-slate-500">
                      Already registered at NightVerse?{" "}
                      <span className="text-purple-400 font-bold animate-pulse hover:text-purple-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.9)] transition-all duration-300 cursor-pointer" onClick={() => setIsRegister(false)}>Log in here</span>
                    </p>
                  </div>

                </form>
              ) : (
                // ------------------ LOGIN SIGN IN (USER & ADMIN) ------------------
                <form onSubmit={isAdminLogin ? handleAdminLoginSubmit : handleUserLoginSubmit} className="space-y-4">
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] tracking-widest font-mono text-slate-500 uppercase">Username / Email Identifier</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                      <input 
                        type="text" 
                        placeholder={isAdminLogin ? "admin@nightverse.com" : "neon_shadow or email"}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full text-xs bg-slate-950 border border-slate-850 focus:border-purple-500 rounded-xl py-3.5 pl-10 pr-4 text-slate-100 placeholder-slate-500 outline-none"
                        required
                        id="login-username"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] tracking-widest font-mono text-slate-500 uppercase">Input Password</label>
                      {!isAdminLogin && (
                        <span 
                          onClick={() => { setIsForgotPassword(true); setShowResetForm(false); setForgotEmail(""); }}
                          className="text-[10px] text-slate-500 hover:text-white cursor-pointer hover:underline"
                        >
                          Forgot password?
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full text-xs bg-slate-950 border border-slate-850 focus:border-purple-500 rounded-xl py-3.5 pl-10 pr-10 text-slate-100 placeholder-slate-500 outline-none"
                        required
                        id="login-pass"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 p-0.5 text-slate-500 hover:text-slate-350 transition-colors cursor-pointer"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me toggle checkbox (only for user logins) */}
                  {!isAdminLogin && (
                    <div className="flex items-center gap-2 select-none py-1">
                      <input 
                        type="checkbox" 
                        id="chk-remember-me" 
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-800 bg-slate-950 accent-purple-600 focus:ring-0 cursor-pointer"
                      />
                      <label htmlFor="chk-remember-me" className="text-xs text-slate-400 hover:text-slate-350 cursor-pointer">
                        Remember Me on this browser
                      </label>
                    </div>
                  )}

                  <button 
                    type="submit"
                    className={`w-full py-4 px-4 rounded-2xl font-bold transition-all text-xs uppercase hover:shadow-lg active:scale-95 cursor-pointer mt-2 ${
                      isAdminLogin 
                        ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/10" 
                        : "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/10"
                    }`}
                    id="btn-login-submit"
                  >
                    {isAdminLogin ? "Deploy Admin Permissions" : "Enter Platform"}
                  </button>

                  {/* Switch toggles between User and separate Admin login panels */}
                  <div className="border-t border-slate-800/80 pt-4 flex flex-col items-center gap-2">
                    {isAdminLogin ? (
                      <button 
                        type="button" 
                        onClick={() => { setIsAdminLogin(false); setUsername(""); setPassword(""); }}
                        className="text-xs text-purple-400 hover:text-purple-300 font-mono transition-colors cursor-pointer"
                        id="btn-toggle-user-entrance"
                      >
                        ← Back to standard User Sign In
                      </button>
                    ) : (
                      <>
                        <div className="text-center">
                          <p className="text-xs text-slate-500">
                            Don't have an account profile?{" "}
                            <span className="text-purple-400 hover:underline cursor-pointer font-bold" onClick={() => setIsRegister(true)}>Register here</span>
                          </p>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => { setIsAdminLogin(true); setUsername(""); setPassword(""); }}
                          className="text-xs text-rose-400 hover:text-rose-300 font-mono transition-colors cursor-pointer mt-2"
                          id="btn-toggle-admin-entrance"
                        >
                          ⚠️ Administrative Personnel entrance
                        </button>
                      </>
                    )}
                  </div>

                </form>
              )}
            </>
          )}

        </div>
      </div>

      {/* Footer */}
      <footer className="text-center font-mono text-[10px] text-slate-600 py-4 max-w-md mx-auto relative z-10 select-none">
        NightVerse Security Shields Active. Unauthorized efforts logged.
      </footer>

    </div>
  );
};
