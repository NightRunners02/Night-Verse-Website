import React, { useState, useEffect } from "react";
import { 
  User, 
  Settings, 
  HelpCircle, 
  Info, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp,
  ChevronLeft,
  Award, 
  ShieldCheck, 
  Shield, 
  CheckCircle2, 
  Lock, 
  Trophy, 
  Crown, 
  Camera, 
  Globe, 
  Twitter, 
  Instagram, 
  Github, 
  Link as LinkIcon, 
  LogOut, 
  Sparkles, 
  Check, 
  RotateCcw, 
  FileText, 
  ShieldAlert,
  Search,
  BookOpen,
  Share2,
  Users
} from "lucide-react";
import { useAppState } from "../context/AppState.js";
import { db } from "../lib/db.js";
import { motion, AnimatePresence } from "motion/react";
import { RoleBadge, BadgeType } from "./RoleBadge.js";

type SettingsMenu = null | "edit-profile" | "badges" | "faq" | "about";

export const ProfileSettings: React.FC = () => {
  const { user, logout, triggerToast, updateLocalProfile, createNotification, triggerDBSync } = useAppState();
  const [selectedMenu, setSelectedMenu] = useState<SettingsMenu>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300 pb-16 px-4 md:px-0 select-none">
      <AnimatePresence mode="wait">
        {selectedMenu === null ? (
          /* ROOT SETTINGS MENU LIST (INSTAGRAM STYLE) */
          <motion.div
            key="root-settings"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Settings Top Header */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-600/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                  <Settings className="w-6 h-6 animate-spin-slow" />
                </div>
                <div>
                  <h1 className="text-2xl font-black font-space text-white tracking-tight">Settings</h1>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">
                    Pengaturan akun, profil, badge, serta informasi platform NightVerse
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-3">
                <img
                  src={user.profile?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                  alt={user.username}
                  className="w-10 h-10 rounded-full border border-slate-700 object-cover shadow-md"
                />
                <div className="text-right">
                  <span className="block text-xs font-bold text-white font-space">@{user.username}</span>
                  <span className="text-[10px] text-purple-400 font-mono uppercase font-bold">{user.role}</span>
                </div>
              </div>
            </div>

            {/* Menu Sections Container */}
            <div className="space-y-6">
              {/* Section 1: Pengaturan Akun */}
              <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
                <div className="px-6 pt-5 pb-3 border-b border-slate-800/60 flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-[0.2em]">
                    Pengaturan Akun & Tampilan
                  </span>
                </div>

                <div className="divide-y divide-slate-800/40">
                  {/* Item 1: Edit Profile */}
                  <button
                    onClick={() => setSelectedMenu("edit-profile")}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-850/80 transition-all cursor-pointer group text-left"
                  >
                    <div className="flex items-center gap-4 min-w-0 pr-4">
                      <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-purple-400 group-hover:border-purple-500/50 group-hover:bg-purple-950/20 transition-all shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-white font-space group-hover:text-purple-300 transition-colors">
                          Edit Profile
                        </h3>
                        <p className="text-xs text-slate-400 truncate font-sans mt-0.5">
                          Ubah foto profil, sampul banner, nama, bio, dan tautan sosial media
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all shrink-0" />
                  </button>

                  {/* Item 2: Badge */}
                  <button
                    onClick={() => setSelectedMenu("badges")}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-850/80 transition-all cursor-pointer group text-left"
                  >
                    <div className="flex items-center gap-4 min-w-0 pr-4">
                      <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400 group-hover:border-amber-500/50 group-hover:bg-amber-950/20 transition-all shrink-0">
                        <Award className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white font-space group-hover:text-amber-300 transition-colors">
                            Badge & Status
                          </h3>
                          <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-900/60">
                            Koleksi
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate font-sans mt-0.5">
                          Lihat badge yang diperoleh, persyaratan unlocked, dan pilih badge aktif
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all shrink-0" />
                  </button>
                </div>
              </div>

              {/* Section 2: Informasi & Dukungan */}
              <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
                <div className="px-6 pt-5 pb-3 border-b border-slate-800/60 flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-[0.2em]">
                    Informasi & Dukungan
                  </span>
                </div>

                <div className="divide-y divide-slate-800/40">
                  {/* Item 3: FAQ */}
                  <button
                    onClick={() => setSelectedMenu("faq")}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-850/80 transition-all cursor-pointer group text-left"
                  >
                    <div className="flex items-center gap-4 min-w-0 pr-4">
                      <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400 group-hover:border-cyan-500/50 group-hover:bg-cyan-950/20 transition-all shrink-0">
                        <HelpCircle className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-white font-space group-hover:text-cyan-300 transition-colors">
                          FAQ & Panduan
                        </h3>
                        <p className="text-xs text-slate-400 truncate font-sans mt-0.5">
                          Pertanyaan umum seputar fitur, leaderboard, privasi, dan aturan NightVerse
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all shrink-0" />
                  </button>

                  {/* Item 4: About App */}
                  <button
                    onClick={() => setSelectedMenu("about")}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-850/80 transition-all cursor-pointer group text-left"
                  >
                    <div className="flex items-center gap-4 min-w-0 pr-4">
                      <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-purple-400 group-hover:border-purple-500/50 group-hover:bg-purple-950/20 transition-all shrink-0">
                        <Info className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-white font-space group-hover:text-purple-300 transition-colors">
                          About Application
                        </h3>
                        <p className="text-xs text-slate-400 truncate font-sans mt-0.5">
                          Versi aplikasi, pengembang, Syarat Layanan, dan Kebijakan Privasi
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all shrink-0" />
                  </button>
                </div>
              </div>

              {/* Section 3: Sesi Akun */}
              <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-rose-950/20 transition-all cursor-pointer group text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-rose-950/30 border border-rose-900/40 flex items-center justify-center text-rose-400 group-hover:bg-rose-950/50 transition-all shrink-0">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-rose-400 font-space group-hover:text-rose-300 transition-colors">
                        Keluar dari Akun (Log Out)
                      </h3>
                      <p className="text-xs text-slate-400 font-sans mt-0.5">
                        Akhiri sesi akun NightVerse di perangkat ini secara aman
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-rose-500/50 group-hover:text-rose-400 group-hover:translate-x-1 transition-all shrink-0" />
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* DETAILED SUB-PAGE VIEW (INSTAGRAM STYLE SUB-PANEL) */
          <motion.div
            key={selectedMenu}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Sub-page Navigation Top Header */}
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-4 backdrop-blur-xl shadow-xl flex items-center justify-between sticky top-4 z-30">
              <button
                onClick={() => setSelectedMenu(null)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white rounded-2xl border border-slate-800 text-xs font-bold font-space transition-all cursor-pointer active:scale-95 shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Settings</span>
              </button>

              <h2 className="text-base font-black font-space text-white uppercase tracking-wider truncate px-2">
                {selectedMenu === "edit-profile" && "Edit Profile"}
                {selectedMenu === "badges" && "My Badge Center"}
                {selectedMenu === "faq" && "FAQ & Panduan"}
                {selectedMenu === "about" && "About NightVerse"}
              </h2>

              <div className="w-16 flex justify-end">
                <span className="text-[9px] font-mono text-purple-400 bg-purple-950/60 px-2 py-1 rounded-full border border-purple-900/60 uppercase font-bold">
                  NightVerse
                </span>
              </div>
            </div>

            {/* Sub-panel Content */}
            <div>
              {selectedMenu === "edit-profile" && (
                <EditProfilePanel onBack={() => setSelectedMenu(null)} />
              )}
              {selectedMenu === "badges" && <BadgesPanel />}
              {selectedMenu === "faq" && <FAQPanel />}
              {selectedMenu === "about" && <AboutAppPanel />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
                <LogOut className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-black font-space text-white">Konfirmasi Logout</h3>
                <p className="text-xs text-slate-400 font-sans mt-1">
                  Apakah Anda yakin ingin keluar dari akun @{user.username}?
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    logout();
                    triggerToast("Logout Berhasil 👋", "Sesi akun telah selesai secara aman.", "info");
                  }}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-rose-900/30 active:scale-95"
                >
                  Ya, Keluar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* =========================================================================
   A. EDIT PROFILE PANEL
   ========================================================================= */
const EditProfilePanel: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user, updateLocalProfile, triggerToast, createNotification, triggerDBSync } = useAppState();

  if (!user) return null;

  const [username, setUsername] = useState(user.username || "");
  const [fullName, setFullName] = useState(user.profile?.fullName || "");
  const [bio, setBio] = useState(user.profile?.bio || "");
  const [website, setWebsite] = useState(user.profile?.website || "");
  const [avatarUrl, setAvatarUrl] = useState(user.profile?.avatarUrl || "");
  const [bannerUrl, setBannerUrl] = useState(user.profile?.bannerUrl || "");
  
  // Social Links
  const [twitter, setTwitter] = useState(user.profile?.twitter || "");
  const [instagram, setInstagram] = useState(user.profile?.instagram || "");
  const [github, setGithub] = useState(user.profile?.github || "");
  const [linkedin, setLinkedin] = useState(user.profile?.linkedin || "");
  const [tiktok, setTiktok] = useState(user.profile?.tiktok || "");

  const [isSaving, setIsSaving] = useState(false);

  // Avatar presets helper
  const avatarPresets = [
    `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`,
    `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}-cyber`,
    `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}-neon`,
    `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80`,
    `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80`
  ];

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAvatarUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleBannerFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setBannerUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      triggerToast("Validasi Gagal", "Username tidak boleh kosong.", "error");
      return;
    }

    setIsSaving(true);

    const updatedProfile = {
      ...(user.profile || {}),
      fullName: fullName.trim(),
      bio: bio.trim(),
      website: website.trim(),
      avatarUrl: avatarUrl.trim(),
      bannerUrl: bannerUrl.trim(),
      twitter: twitter.trim(),
      instagram: instagram.trim(),
      github: github.trim(),
      linkedin: linkedin.trim(),
      tiktok: tiktok.trim()
    };

    // Update in Database
    db.users.update(user.id, {
      username: username.trim(),
      profile: updatedProfile
    });

    // Update Context State
    updateLocalProfile(updatedProfile);
    triggerDBSync();

    createNotification({
      userId: user.id,
      triggeredById: user.id,
      triggeredByAvatar: avatarUrl || user.profile?.avatarUrl,
      title: "Profile Diperbarui ✨",
      message: "Informasi profil Anda telah tersimpan secara permanen.",
      category: "SYSTEM",
      type: "PROFILE_UPDATE",
      link: `PROFILE:${user.id}`
    });

    setTimeout(() => {
      setIsSaving(false);
      triggerToast("Profil Disimpan! 🎉", "Perubahan profil berhasil diperbarui ke database NightVerse.", "success");
      onBack();
    }, 600);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Banner & Avatar Header Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {/* Banner Preview */}
        <div className="h-32 sm:h-44 bg-slate-950 relative group overflow-hidden">
          {bannerUrl ? (
            <img src={bannerUrl} alt="Cover Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-purple-900/50 via-slate-900 to-indigo-900/50 flex items-center justify-center">
              <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">
                Belum ada Cover Banner
              </span>
            </div>
          )}
          <label className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer">
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-2xl text-xs font-bold font-space shadow-lg">
              <Camera className="w-4 h-4" /> Ubah Cover Banner
            </div>
            <input type="file" accept="image/*" onChange={handleBannerFile} className="hidden" />
          </label>
        </div>

        {/* Avatar & Username Row */}
        <div className="p-6 pt-0 relative flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-12 sm:-mt-14">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
            <div className="relative group">
              <img
                src={avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`}
                alt="Avatar"
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border-4 border-slate-900 object-cover bg-slate-950 shadow-2xl"
              />
              <label className="absolute inset-0 bg-slate-950/60 rounded-3xl opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer">
                <Camera className="w-6 h-6 text-white" />
                <input type="file" accept="image/*" onChange={handleAvatarFile} className="hidden" />
              </label>
            </div>
            <div className="text-center sm:text-left pb-1">
              <h3 className="text-lg font-black font-space text-white">{fullName || username}</h3>
              <p className="text-xs text-purple-400 font-mono font-bold">@{username}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {avatarPresets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setAvatarUrl(p)}
                className="w-8 h-8 rounded-full border border-slate-700 overflow-hidden hover:scale-110 transition-transform cursor-pointer"
                title="Pilih Avatar Preset"
              >
                <img src={p} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Form Fields */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
        <h4 className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest pb-2 border-b border-slate-800">
          Informasi Utama Profil
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold font-space text-slate-300">Display Name / Nama Lengkap</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Contoh: Alex Vance"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:border-purple-500 outline-none transition-all font-sans"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold font-space text-slate-300">Username</label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-xs text-slate-500 font-mono">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                placeholder="username"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-8 pr-4 py-3 text-xs text-white focus:border-purple-500 outline-none transition-all font-mono"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold font-space text-slate-300">Bio Ringkas</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={180}
            placeholder="Tuliskan bio atau narasi singkat tentang karya Anda..."
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white focus:border-purple-500 outline-none transition-all resize-none font-sans"
          />
          <div className="flex justify-end">
            <span className="text-[10px] font-mono text-slate-500">{bio.length}/180 Karakter</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold font-space text-slate-300">Website / URL Portfolio</label>
          <div className="relative">
            <Globe className="absolute left-4 top-3 w-4 h-4 text-slate-500" />
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://portfolio.nightverse.app"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-xs text-white focus:border-purple-500 outline-none transition-all font-mono"
            />
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h4 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest pb-2 border-b border-slate-800">
          Tautan Sosial Media
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
              <Twitter className="w-3.5 h-3.5 text-sky-400" /> X / Twitter
            </label>
            <input
              type="text"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              placeholder="@username"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:border-purple-500 outline-none font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
              <Instagram className="w-3.5 h-3.5 text-pink-400" /> Instagram
            </label>
            <input
              type="text"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@username"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:border-purple-500 outline-none font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
              <Github className="w-3.5 h-3.5 text-slate-300" /> GitHub
            </label>
            <input
              type="text"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              placeholder="username"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:border-purple-500 outline-none font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-blue-400" /> LinkedIn
            </label>
            <input
              type="text"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="in/username"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:border-purple-500 outline-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold font-space uppercase tracking-wider transition-all cursor-pointer"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-xs font-black font-space uppercase tracking-wider transition-all shadow-lg shadow-purple-900/30 cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <RotateCcw className="w-4 h-4 animate-spin" /> Menyimpan...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" /> Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
};

/* =========================================================================
   B. BADGES PANEL
   ========================================================================= */
const BadgesPanel: React.FC = () => {
  const { user, setActiveBadge } = useAppState();
  const [filter, setFilter] = useState<"all" | "earned" | "locked">("all");

  if (!user) return null;

  const BADGE_METADATA = [
    {
      id: "Administrator",
      role: "ADMIN" as BadgeType,
      name: "Administrator",
      color: "text-rose-400",
      bgColor: "bg-rose-500/10",
      borderColor: "border-rose-500/30",
      icon: ShieldCheck,
      description: "Badge khusus administrator dengan otoritas penuh pengelolaan sistem NightVerse.",
      requirement: "Otomatis diberikan kepada pengguna dengan peran Administrator.",
      check: (u: any) => u.role === "ADMIN" || u.role === "SUPER_ADMIN"
    },
    {
      id: "Moderator",
      role: "MODERATOR" as BadgeType,
      name: "Moderator",
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30",
      icon: Shield,
      description: "Badge untuk tim moderator yang menjaga kenyamanan dan etika komunitas.",
      requirement: "Ditetapkan sebagai Moderator oleh Administrator.",
      check: (u: any) => u.role === "MODERATOR"
    },
    {
      id: "Verified Creator",
      role: "VERIFIED" as BadgeType,
      name: "Verified Creator",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      icon: CheckCircle2,
      description: "Menandakan kreator resmi yang telah terverifikasi identitas dan karyanya.",
      requirement: "Mengajukan verifikasi profil dan disetujui oleh tim NightVerse.",
      check: (u: any) => u.profile?.badges?.includes("Verified Creator")
    },
    {
      id: "Contributor",
      role: "CONTRIBUTOR" as BadgeType,
      name: "Contributor",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
      icon: Trophy,
      description: "Diberikan kepada pengguna yang konsisten berkontribusi dalam diskusi & konten.",
      requirement: "Aktif mempublikasikan karya berkualitas tinggi dan interaksi positif.",
      check: (u: any) => u.profile?.badges?.includes("Contributor")
    },
    {
      id: "VIP",
      role: "VIP" as BadgeType,
      name: "VIP Member",
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/30",
      icon: Crown,
      description: "Badge eksklusif keanggotaan VIP NightVerse dengan hak akses spesial.",
      requirement: "Aktif dalam keanggotaan VIP atau diperoleh melalui event resmi NightVerse.",
      check: (u: any) => u.profile?.badges?.includes("VIP")
    },
    {
      id: "User",
      role: "USER" as BadgeType,
      name: "User (Default)",
      color: "text-slate-400",
      bgColor: "bg-slate-500/10",
      borderColor: "border-slate-500/30",
      icon: User,
      description: "Badge standar milik seluruh pengguna terdaftar di platform NightVerse.",
      requirement: "Otomatis didapatkan setelah pendaftaran akun baru.",
      check: () => true
    }
  ];

  const currentActiveBadge = user.profile?.activeBadge || (user.role === "USER" ? "User" : user.role);
  const earnedBadges = BADGE_METADATA.filter(b => b.check(user));
  const lockedBadges = BADGE_METADATA.filter(b => !b.check(user));

  const filteredBadges = BADGE_METADATA.filter(b => {
    const isEarned = b.check(user);
    if (filter === "earned") return isEarned;
    if (filter === "locked") return !isEarned;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Stats Summary Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black font-space text-white">Status Koleksi Badge</h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Anda telah mengumpulkan <strong className="text-white">{earnedBadges.length}</strong> dari <strong className="text-white">{BADGE_METADATA.length}</strong> total badge platform.
            </p>
          </div>
        </div>

        {/* Active Badge Display */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-3 shrink-0">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">Active Signature:</span>
          <RoleBadge role={currentActiveBadge} size="sm" />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex p-1 bg-slate-900/60 border border-slate-800 rounded-2xl w-fit">
        {[
          { id: "all", label: `Semua (${BADGE_METADATA.length})` },
          { id: "earned", label: `Diperoleh (${earnedBadges.length})` },
          { id: "locked", label: `Terkunci (${lockedBadges.length})` },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-space transition-all cursor-pointer ${
              filter === f.id
                ? "bg-purple-600 text-white shadow-md shadow-purple-900/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Badge Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBadges.map((badge) => {
          const isEarned = badge.check(user);
          const isActive = currentActiveBadge === badge.id || (badge.id === "User" && currentActiveBadge === "USER");
          const Icon = badge.icon;

          return (
            <div
              key={badge.id}
              className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                isEarned
                  ? `${badge.bgColor} ${badge.borderColor} shadow-lg`
                  : "bg-slate-950/40 border-slate-900 opacity-60 grayscale-[0.3]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl border ${isEarned ? badge.borderColor : "border-slate-800 bg-slate-900"}`}>
                    <Icon className={`w-6 h-6 ${isEarned ? badge.color : "text-slate-600"}`} />
                  </div>
                  {isEarned ? (
                    <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-900/60 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Earned
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  )}
                </div>

                <h4 className="text-base font-black font-space text-white mb-1.5">{badge.name}</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-sans mb-4">{badge.description}</p>
              </div>

              <div className="pt-4 border-t border-slate-800/60">
                {isEarned ? (
                  <button
                    disabled={isActive}
                    onClick={() => setActiveBadge(badge.id)}
                    className={`w-full py-2.5 rounded-xl text-xs font-black font-space uppercase tracking-wider transition-all ${
                      isActive
                        ? "bg-purple-600/20 text-purple-300 border border-purple-500/40 cursor-default"
                        : "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/30 cursor-pointer active:scale-95"
                    }`}
                  >
                    {isActive ? "Aktif Sebagai Tanda Profil" : "Gunakan Badge Ini"}
                  </button>
                ) : (
                  <div className="text-[10px] text-slate-500 font-sans italic leading-tight">
                    <strong className="text-slate-400 not-italic block mb-0.5">Persyaratan:</strong>
                    {badge.requirement}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* =========================================================================
   C. FAQ PANEL
   ========================================================================= */
const FAQPanel: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [category, setCategory] = useState<string>("all");

  const faqs = [
    {
      cat: "account",
      question: "Bagaimana cara mengubah profil dan sosial media saya?",
      answer: "Masuk ke Pengaturan -> Edit Profile. Anda dapat mengubah foto avatar, sampul banner, nama lengkap, bio, website, serta akun Twitter, Instagram, GitHub, dan LinkedIn."
    },
    {
      cat: "leaderboard",
      question: "Bagaimana sistem pemeringkatan Leaderboard Kreator dihitung?",
      answer: "Leaderboard dihitung berdasarkan data engagement aktual meliputi Followers, Total Views, Total Likes, Total Favorites, dan Total Komentar pada postingan bernilai Engagement Open."
    },
    {
      cat: "leaderboard",
      question: "Apakah konten Private dimasukkan dalam perhitungan Leaderboard?",
      answer: "Tidak. Konten bertipe Private dilindungi dan tidak pernah disajikan atau dihitung dalam statistik publik Leaderboard demi menjaga kerahasiaan pemilik karya."
    },
    {
      cat: "content",
      question: "Apa perbedaan antara Engagement Open dan Engagement Muted?",
      answer: "Engagement Open mengizinkan komentar publik real-time. Jika diatur Muted, diskusi baru dinonaktifkan tetapi postingan tetap dapat mengumpulkan Views, Likes, dan Favorites."
    },
    {
      cat: "content",
      question: "Bagaimana cara menambahkan beberapa tautan video embed (Multi-Video Embed)?",
      answer: "Saat membuat atau mengedit karya video di Create Work -> External Embed Reference, klik tombol Plus (+) untuk menambahkan beberapa URL video embed eksternal dalam satu publikasi."
    },
    {
      cat: "badges",
      question: "Bagaimana cara mendapatkan badge Verified Creator atau Contributor?",
      answer: "Badge Verified Creator diberikan setelah proses verifikasi profil oleh Administrator. Badge Contributor diperoleh secara otomatis ketika Anda aktif berkontribusi karya bermutu tinggi."
    },
    {
      cat: "privacy",
      question: "Siapa yang dapat melihat informasi email atau nomor telepon saya?",
      answer: "Anda dapat mengatur tingkat privasi di Pengaturan -> Edit Profile -> Privacy Settings untuk mengontrol siapa yang berhak melihat data pribadi Anda."
    }
  ];

  const filteredFaqs = category === "all" ? faqs : faqs.filter(f => f.cat === category);

  return (
    <div className="space-y-6">
      {/* FAQ Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
          <HelpCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-black font-space text-white">Frequently Asked Questions</h3>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Panduan lengkap penggunaan platform, fitur publikasi, leaderboard, dan keamanan NightVerse
          </p>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {[
          { id: "all", label: "Semua FAQ" },
          { id: "account", label: "Akun & Profil" },
          { id: "leaderboard", label: "Leaderboard & Engagement" },
          { id: "content", label: "Konten & Multi-Embed" },
          { id: "privacy", label: "Privasi & Keamanan" }
        ].map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold font-space whitespace-nowrap transition-all cursor-pointer ${
              category === c.id
                ? "bg-cyan-600 text-white shadow-lg shadow-cyan-950/50"
                : "bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Accordions */}
      <div className="space-y-3">
        {filteredFaqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="bg-slate-900/50 border border-slate-800/80 rounded-2xl overflow-hidden transition-all shadow-md"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-850 transition-colors cursor-pointer"
              >
                <span className="text-xs font-bold text-white font-space leading-snug">{faq.question}</span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-cyan-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                )}
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 pt-0 border-t border-slate-800/50 text-xs text-slate-300 font-sans leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* =========================================================================
   D. ABOUT APP PANEL
   ========================================================================= */
const AboutAppPanel: React.FC = () => {
  const [openModal, setOpenModal] = useState<"tos" | "privacy" | null>(null);

  return (
    <div className="space-y-6">
      {/* App Main Specs */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 shadow-xl relative overflow-hidden text-center sm:text-left flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-500 p-0.5 shadow-2xl shrink-0">
          <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center font-space font-black text-2xl text-transparent bg-clip-text bg-gradient-to-tr from-purple-400 to-indigo-300">
            NV
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
            <h3 className="text-xl font-black font-space text-white">NightVerse Platform</h3>
            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] font-mono font-bold rounded-full border border-purple-500/30">
              v2.4.0
            </span>
          </div>
          <p className="text-xs text-slate-300 font-sans leading-relaxed mb-3">
            Ekosistem jejaring kreatif generasi terbaru yang mengintegrasikan publikasi artikel, portofolio foto, pemutar reels video, serta sistem Leaderboard engagement aktual.
          </p>
          <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
              Dev: NightVerse Core Team
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-emerald-900/40 font-bold">
              Engine: Active & Stable
            </span>
          </div>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card 1: Terms of Service */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/30 text-purple-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold font-space text-white">Terms of Service</h4>
              <p className="text-xs text-slate-400 font-sans">Syarat dan ketentuan penggunaan layanan</p>
            </div>
          </div>
          <button
            onClick={() => setOpenModal("tos")}
            className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-2xl text-xs font-bold font-space transition-all cursor-pointer active:scale-95"
          >
            Baca Syarat & Ketentuan
          </button>
        </div>

        {/* Card 2: Privacy Policy */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/30 text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold font-space text-white">Privacy Policy</h4>
              <p className="text-xs text-slate-400 font-sans">Kebijakan kerahasiaan dan enkripsi data</p>
            </div>
          </div>
          <button
            onClick={() => setOpenModal("privacy")}
            className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-2xl text-xs font-bold font-space transition-all cursor-pointer active:scale-95"
          >
            Baca Kebijakan Privasi
          </button>
        </div>
      </div>

      {/* Copyright Footer Notice */}
      <div className="p-6 bg-slate-900/30 border border-slate-800/60 rounded-3xl text-center space-y-1">
        <p className="text-xs font-mono font-bold text-slate-400">
          © 2026 NightVerse Platform. All rights reserved.
        </p>
        <p className="text-[10px] font-sans text-slate-500">
          Dirancang untuk memberikan pengalaman kreasi dan jejaring kreatif tanpa hambatan.
        </p>
      </div>

      {/* TOS Modal */}
      <AnimatePresence>
        {openModal === "tos" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-black font-space text-white">Syarat & Ketentuan Layanan</h3>
                <button onClick={() => setOpenModal(null)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400">
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3 text-xs text-slate-300 font-sans leading-relaxed">
                <p><strong>1. Ketentuan Akun:</strong> Setiap pengguna bertanggung jawab atas keamanan kredensial akun dan seluruh aktivitas yang terjadi di bawah nama pengguna mereka.</p>
                <p><strong>2. Etika Komunitas:</strong> Pengguna dilarang mempublikasikan konten ilegal, ujaran kebencian, spam, atau pelanggaran hak cipta dalam bentuk apa pun.</p>
                <p><strong>3. Hak Cipta Konten:</strong> Hak cipta atas materi artikel, foto, dan video yang dipublikasikan sepenuhnya tetap milik kreator bersangkutan.</p>
                <p><strong>4. Moderasi Konten:</strong> Administrator berhak memoderasi atau menghapus konten yang terbukti melanggar panduan komunitas NightVerse.</p>
              </div>
              <button
                onClick={() => setOpenModal(null)}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-xs font-bold uppercase font-space transition-all cursor-pointer"
              >
                Tutup
              </button>
            </motion.div>
          </div>
        )}

        {openModal === "privacy" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-black font-space text-white">Kebijakan Privasi Data</h3>
                <button onClick={() => setOpenModal(null)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400">
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3 text-xs text-slate-300 font-sans leading-relaxed">
                <p><strong>1. Pengumpulan Data:</strong> Kami mengumpulkan data profil publik seperti username, foto avatar, bio, dan statistik publik demi pengoperasian platform.</p>
                <p><strong>2. Perlindungan Konten Private:</strong> Konten yang ditandai sebagai Private dilindungi dengan aturan keamanan ketat dan tidak dipublikasikan ke publik.</p>
                <p><strong>3. Keamanan Informasi:</strong> Kredensial akun dan preferensi dilindungi menggunakan standar enkripsi modern.</p>
                <p><strong>4. Tidak Ada Penjualan Data:</strong> NightVerse tidak pernah menjual atau membagikan data pengguna pribadi kepada pihak ketiga tanpa izin pengguna.</p>
              </div>
              <button
                onClick={() => setOpenModal(null)}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-xs font-bold uppercase font-space transition-all cursor-pointer"
              >
                Tutup
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
