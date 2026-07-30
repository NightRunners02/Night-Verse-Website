import React, { useState, useEffect } from "react";
import { 
  User, 
  MapPin, 
  Link as LinkIcon, 
  Calendar, 
  Camera, 
  Heart, 
  Sliders, 
  Instagram, 
  Twitter, 
  Github, 
  Globe, 
  Sparkles, 
  CheckCircle, 
  RotateCcw,
  Languages,
  Eye,
  Trash2,
  Briefcase,
  Shield,
  Lock,
  Search,
  Plus,
  BookOpen
} from "lucide-react";
import { useAppState } from "../context/AppState.js";
import { db } from "../lib/db.js";
import { motion } from "motion/react";
import { RoleBadge } from "./RoleBadge.js";

type ThemePref = "dark-cosmic" | "light-neon" | "cyberpunk" | "monochrome-slate";
type LangPref = "en" | "id" | "jp" | "fr" | "es" | "kr";

export const ProfileWorkspace: React.FC<{ onCancel?: () => void }> = ({ onCancel }) => {
  const { user, triggerToast, updateLocalProfile, navigateTo, createNotification } = useAppState();

  if (!user) return null;

  // Form Fields State
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [facebook, setFacebook] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [gender, setGender] = useState("Unspecified");
  const [occupation, setOccupation] = useState("Independent Creator");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState("");
  const [badges, setBadges] = useState<string[]>([]);

  // Account Preferences & Security
  const [themePref, setThemePref] = useState<ThemePref>("dark-cosmic");
  const [langPref, setLangPref] = useState<LangPref>("en");
  
  // Privacy Settings
  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    showEmail: "PUBLIC" as any,
    showPhone: "PUBLIC" as any,
    showFullName: "PUBLIC" as any,
    showAvatar: "PUBLIC" as any,
    showLocation: "PUBLIC" as any,
    showSocialLinks: "PUBLIC" as any,
    showActivity: "PUBLIC" as any,
    twoFactorEnabled: false
  });

  const [notificationPreferences, setNotificationPreferences] = useState({
    all: true,
    content: true,
    social: true,
    system: true,
    admin: true
  });

  const [hasLoaded, setHasLoaded] = useState(false);
  const [isCommiting, setIsCommiting] = useState(false);
  const [allSystemTags, setAllSystemTags] = useState<string[]>([]);

  // Load all system and existing content tags
  useEffect(() => {
    const sysTags = db.tags.getAll().map(t => t.name.toLowerCase());
    const contentTags = [
      ...db.blogs.getAll().flatMap(b => b.tags || []),
      ...db.photos.getAll().flatMap(p => p.tags || []),
      ...db.videos.getAll().flatMap(v => v.tags || [])
    ].map(t => t.toLowerCase());
    const uniqueTags = Array.from(new Set([...sysTags, ...contentTags])).filter(Boolean);
    setAllSystemTags(uniqueTags);
  }, []);

  // Load and set state properties
  useEffect(() => {
    if (user.profile) {
      setFullName(user.profile.fullName || "");
      // ... (other fields)
      
      if (user.profile.notificationPreferences) {
        setNotificationPreferences(user.profile.notificationPreferences);
      }
      setBio(user.profile.bio || "");
      setLocation(user.profile.location || "");
      setWebsite(user.profile.website || "");
      setAvatarUrl(user.profile.avatarUrl || "");
      setBannerUrl(user.profile.bannerUrl || "");
      setInstagram(user.profile.instagram || "");
      setTwitter(user.profile.twitter || "");
      setGithub(user.profile.github || ""); // Note: Overview currently uses linkedin as proxy for github
      setLinkedin(user.profile.linkedin || "");
      setTiktok(user.profile.tiktok || "");
      setFacebook(user.profile.facebook || "");
      setPhoneNumber(user.profile.phoneNumber || "");
      setGender(user.profile.gender || "Unspecified");
      setOccupation(user.profile.occupation || "Independent Creator");
      setInterests(user.profile.interests || []);
      setBadges(user.profile.badges || []);
      
      if (user.profile.notificationPreferences) {
        setNotificationPreferences(user.profile.notificationPreferences);
      }
      
      if (user.profile.privacy) {
        setPrivacy(user.profile.privacy);
      }
      
      if (user.profile.dateOfBirth) {
        setDateOfBirth(user.profile.dateOfBirth.slice(0, 10));
      }

      // Restore custom saved preferences from localStorage or profile
      const savedTheme = localStorage.getItem(`nv_pref_theme_${user.id}`);
      if (savedTheme) setThemePref(savedTheme as ThemePref);

      const savedLang = localStorage.getItem(`nv_pref_lang_${user.id}`);
      if (savedLang) setLangPref(savedLang as LangPref);
      setHasLoaded(true);
    }
  }, [user]);

  // Handle local Avatar selection
  const handleAvatarSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAvatarUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Handle local Cover Banner selection
  const handleBannerSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setBannerUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => setAvatarUrl("");
  const removeCoverBanner = () => setBannerUrl("");

  const addInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest("");
    }
  };

  const removeInterest = (tag: string) => {
    setInterests(interests.filter(i => i !== tag));
  };

  // Dynamic progress calculation
  const calculateProgress = () => {
    let score = 0;
    const fields = [
      fullName, bio, location, website, avatarUrl, bannerUrl, 
      twitter, instagram, github, linkedin, tiktok, facebook,
      occupation, dateOfBirth
    ];
    fields.forEach(f => { if (f && f.toString().trim()) score++; });
    if (interests.length > 0) score++;
    return Math.round((score / (fields.length + 1)) * 100);
  };

  const progressPercent = calculateProgress();

  // Auto-save privacy changes
  useEffect(() => {
    if (user && hasLoaded) {
      const currentPrivacy = JSON.stringify(user.profile?.privacy);
      const newPrivacy = JSON.stringify(privacy);
      
      if (currentPrivacy !== newPrivacy && !isCommiting) {
        db.users.update(user.id, { 
          profile: { 
            ...user.profile, 
            privacy 
          } 
        });
        updateLocalProfile({ 
          ...user.profile, 
          privacy 
        });
        // We don't trigger a toast for every toggle to avoid spam, 
        // but we ensure it's saved.
      }
    }
  }, [privacy, user, updateLocalProfile]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCommiting(true);

    const profileData = {
      fullName,
      bio,
      location,
      website,
      avatarUrl,
      bannerUrl,
      instagram,
      twitter,
      github,
      linkedin,
      tiktok,
      facebook,
      phoneNumber,
      gender,
      occupation,
      dateOfBirth,
      interests,
      badges,
      privacy,
      notificationPreferences
    };

    db.users.update(user.id, { profile: profileData });
    try {
      localStorage.setItem(`nv_pref_theme_${user.id}`, themePref);
      localStorage.setItem(`nv_pref_lang_${user.id}`, langPref);
    } catch(err) {
      console.warn("Storage quota limit reached", err);
    }
    updateLocalProfile(profileData);
    
    createNotification({
      userId: user.id,
      triggeredById: user.id,
      triggeredByAvatar: avatarUrl || user.profile?.avatarUrl,
      title: "Profile Updated",
      message: "Your profile information has been successfully updated.",
      category: "SYSTEM",
      type: "PROFILE_UPDATE",
      link: `PROFILE:${user.id}`
    });
    
    setTimeout(() => {
      triggerToast("Profile Blueprint Saved", "All parameters successfully synchronized with worldview.", "success");
      setIsCommiting(false);
    }, 800);
  };

  // Privacy level helper
  const renderPrivacySelect = (field: keyof typeof privacy, label: string, description: string) => {
    const levels = [
      { id: "PUBLIC", label: "Public", icon: Globe, color: "text-emerald-400" },
      { id: "PRIVATE", label: "Private", icon: Shield, color: "text-amber-400" },
      { id: "ONLY_ME", label: "Only Me", icon: Lock, color: "text-rose-400" },
    ];

    const currentLevel = levels.find(l => l.id === privacy[field]) || levels[0];

    return (
      <div className="flex flex-col gap-3 p-4 bg-slate-950 border border-slate-850 rounded-2xl hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-200">{label}</span>
            <span className="text-[9px] text-slate-500 font-mono">{description}</span>
          </div>
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800">
            {levels.map((level) => {
              const Icon = level.icon;
              const isActive = privacy[field] === level.id;
              return (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => setPrivacy(p => ({ ...p, [field]: level.id }))}
                  className={`px-2 py-1 rounded-md text-[9px] font-bold transition-all flex items-center gap-1.5 ${
                    isActive 
                      ? "bg-slate-800 text-white shadow-lg" 
                      : "text-slate-600 hover:text-slate-400"
                  }`}
                  title={level.label}
                >
                  <Icon className={`w-3 h-3 ${isActive ? level.color : "text-current"}`} />
                  <span className={isActive ? "block" : "hidden sm:block"}>{level.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-12 overflow-hidden">
      {/* Header Profile Section - Edit Mode */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800">
        <div className="h-32 md:h-48 bg-slate-800/50 relative overflow-hidden group">
          {bannerUrl ? (
            <img src={bannerUrl || undefined} className="w-full h-full object-cover opacity-60" alt="banner preview" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-slate-900"></div>
          )}
          <label className="absolute inset-0 flex items-center justify-center bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl text-xs font-bold border border-white/20">
              <Camera className="w-4 h-4" /> CHANGE COVER BANNER
            </div>
            <input type="file" accept="image/*" onChange={handleBannerSelection} className="hidden" />
          </label>
          <button 
            type="button" 
            onClick={removeCoverBanner}
            className="absolute top-4 right-4 p-2 bg-rose-500/20 hover:bg-rose-500/40 border border-rose-500/30 rounded-full transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
          </button>
        </div>
        
        <div className="px-6 md:px-8 pb-8 -mt-12 md:-mt-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6">
            <div className="relative group">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-slate-800 border-4 border-slate-950 overflow-hidden shadow-2xl flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl || undefined} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 md:w-16 md:h-16 text-slate-600" />
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                  <Camera className="w-6 h-6 text-white" />
                  <input type="file" accept="image/*" onChange={handleAvatarSelection} className="hidden" />
                </label>
              </div>
              <button 
                type="button" 
                onClick={removeAvatar}
                className="absolute -top-2 -right-2 p-1.5 bg-rose-500 border-4 border-slate-950 rounded-full hover:scale-110 transition-all"
                title="Remove Avatar"
              >
                <Trash2 className="w-3 h-3 text-white" />
              </button>
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-black font-space tracking-tight text-white mb-2">Edit Blueprint</h1>
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 text-xs text-slate-500">
                {user && <RoleBadge role={user.role} size="xs" />}
                <span className="flex items-center gap-1.5 text-emerald-400"><CheckCircle className="w-3.5 h-3.5" /> Identity Verified</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              type="button"
              onClick={() => onCancel ? onCancel() : navigateTo("dashboard", "profile-overview")}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm transition-all font-space"
            >
              Cancel Edit
            </button>
            <button 
              onClick={handleSaveProfile}
              disabled={isCommiting}
              className="px-8 py-2.5 bg-white text-slate-950 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all font-space flex items-center gap-2"
            >
              {isCommiting ? <RotateCcw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              SAVE CHANGES
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form Fields (Matches Overview Hierarchy) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section 1: Detailed Info Form */}
          <div className="p-6 md:p-8 bg-slate-900/50 border border-slate-800 rounded-3xl shadow-xl">
            <div className="flex items-center gap-2 mb-8 border-b border-slate-800 pb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Briefcase className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-lg font-black font-space text-white">Identity Configuration</h3>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] tracking-widest font-mono text-slate-500 uppercase font-semibold">Full Legal Name</label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 outline-none transition-all font-medium"
                    placeholder="E.g. J. Robert Oppenheimer"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] tracking-widest font-mono text-slate-500 uppercase font-semibold">Current Occupation</label>
                  <input 
                    type="text" 
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 outline-none transition-all font-medium"
                    placeholder="E.g. Creative Architect"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] tracking-widest font-mono text-slate-500 uppercase font-semibold">Personal Biography</label>
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-4 text-sm text-white focus:border-purple-500 outline-none transition-all font-medium h-32 resize-none"
                  placeholder="Share your synthesis of the multiverse..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] tracking-widest font-mono text-slate-500 uppercase font-semibold">Location Registry</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
                    <input 
                      type="text" 
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-purple-500 outline-none transition-all"
                      placeholder="Oslo, NO"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] tracking-widest font-mono text-slate-500 uppercase font-semibold">Gender Identity</label>
                  <select 
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="Unspecified">Unspecified Space</option>
                    <option value="Male">Masculine Construct</option>
                    <option value="Female">Feminine Construct</option>
                    <option value="Non-binary">Non-binary Entity</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] tracking-widest font-mono text-slate-500 uppercase font-semibold">Phone Connectivity</label>
                  <input 
                    type="tel" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 outline-none transition-all font-medium"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] tracking-widest font-mono text-slate-500 uppercase font-semibold">Birth Cycle Marker</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
                    <input 
                      type="date" 
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-purple-500 outline-none transition-all font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Social Connectivity Form */}
          <div className="p-6 md:p-8 bg-slate-900/50 border border-slate-800 rounded-3xl shadow-xl">
            <div className="flex items-center gap-2 mb-8 border-b border-slate-800 pb-4">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Globe className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-lg font-black font-space text-white">Digital Bridges & Reach</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] tracking-widest font-mono text-slate-500 uppercase font-semibold flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" /> Domain Portfolio
                </label>
                <input 
                  type="url" 
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 outline-none font-mono"
                  placeholder="https://identity.ai"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] tracking-widest font-mono text-slate-500 uppercase font-semibold flex items-center gap-2">
                  <Twitter className="w-3.5 h-3.5" /> X / Twitter Handle
                </label>
                <input 
                  type="text" 
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 outline-none font-mono"
                  placeholder="@universe"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] tracking-widest font-mono text-slate-500 uppercase font-semibold flex items-center gap-2">
                  <Instagram className="w-3.5 h-3.5" /> Instagram Frame
                </label>
                <input 
                  type="text" 
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 outline-none font-mono"
                  placeholder="@visuals"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] tracking-widest font-mono text-slate-500 uppercase font-semibold flex items-center gap-2">
                  <Github className="w-3.5 h-3.5" /> Source Repository (GitHub)
                </label>
                <input 
                  type="text" 
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 outline-none font-mono"
                  placeholder="username"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] tracking-widest font-mono text-slate-500 uppercase font-semibold flex items-center gap-2">
                  <LinkIcon className="w-3.5 h-3.5" /> LinkedIn Profile
                </label>
                <input 
                  type="text" 
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 outline-none font-mono"
                  placeholder="linkedin.com/in/username"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] tracking-widest font-mono text-slate-500 uppercase font-semibold flex items-center gap-2">
                  <span className="text-[8px] font-bold">TikTok</span>
                </label>
                <input 
                  type="text" 
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 outline-none font-mono"
                  placeholder="@handle"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] tracking-widest font-mono text-slate-500 uppercase font-semibold flex items-center gap-2">
                  <span className="text-[8px] font-bold">Facebook</span>
                </label>
                <input 
                  type="text" 
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 outline-none font-mono"
                  placeholder="fb.com/username"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Cards & Progress */}
        <div className="space-y-8">
          
          {/* Progress Tracker Card */}
          <div className="p-6 bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-900/30 rounded-3xl shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Eye className="w-24 h-24 rotate-12" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold">Integrity Level</span>
                <span className="text-xl font-black font-space text-white">{progressPercent}%</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden mb-6">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                {progressPercent === 100 
                  ? "Maximal. Your neural imprint is fully synchronized and verified."
                  : "Consider adding social links and a covering banner to optimize visibility scale."}
              </p>
            </div>
          </div>

          {/* Neural Interests (Tags Selection) */}
          <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-3xl shadow-xl">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Heart className="w-4 h-4 text-blue-400" />
              </div>
              <h3 className="text-sm font-black font-space text-white uppercase tracking-wider">Interest Vectors</h3>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500 transition-all font-mono"
                  placeholder="Add interest tag..."
                />
                <button 
                  type="button" 
                  onClick={addInterest}
                  className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div>
                <span className="text-[10px] tracking-widest font-mono text-slate-500 uppercase font-bold block mb-2">My Followed Interests</span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {interests.map(interest => (
                    <span 
                      key={interest} 
                      className="group px-3 py-1 bg-slate-950 border border-blue-500/30 rounded-lg text-[10px] font-mono text-blue-400 flex items-center gap-2 hover:border-rose-600 hover:text-rose-400 transition-all"
                    >
                      #{interest}
                      <button type="button" onClick={() => removeInterest(interest)} className="text-slate-500 group-hover:text-rose-400 transition-colors">
                        ×
                      </button>
                    </span>
                  ))}
                  {interests.length === 0 && (
                    <p className="text-xs text-slate-600 italic font-mono">No interest vectors followed yet.</p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/60">
                <span className="text-[10px] tracking-widest font-mono text-slate-500 uppercase font-bold block mb-2">Suggested Interests to Follow</span>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-slate-950/40 border border-slate-850 rounded-2xl custom-scrollbar">
                  {allSystemTags
                    .filter(tag => !interests.includes(tag))
                    .map(tag => (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => setInterests([...interests, tag])}
                        className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-850 rounded-lg text-[10px] font-mono text-slate-400 hover:text-blue-400 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Plus className="w-3 h-3 text-slate-500" />
                        <span>#{tag}</span>
                      </button>
                    ))}
                  {allSystemTags.filter(tag => !interests.includes(tag)).length === 0 && (
                    <span className="text-[10px] text-slate-600 italic font-mono p-1">All available system tags followed!</span>
                  )}
                </div>
              </div>
            </div>
          </div>
           {/* Accent Preferences & Localization */}
          <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-3xl shadow-xl">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-pink-500/10 rounded-lg">
                <Languages className="w-4 h-4 text-pink-400" />
              </div>
              <h3 className="text-sm font-black font-space text-white uppercase tracking-wider">Accent Settings</h3>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] tracking-widest font-mono text-slate-500 uppercase font-semibold flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> Display Theme
                </label>
                <select 
                  value={themePref}
                  onChange={(e) => setThemePref(e.target.value as ThemePref)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:border-purple-500 outline-none cursor-pointer"
                >
                  <option value="dark-cosmic">Cosmic Slate (Dark Premium)</option>
                  <option value="light-neon">Day Neon (Light Radiant)</option>
                  <option value="cyberpunk">Cyberpunk Grid (Purple High-Contrast)</option>
                  <option value="monochrome-slate">Monochrome Slate (Minimalist)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] tracking-widest font-mono text-slate-500 uppercase font-semibold flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> Global Dialect
                </label>
                <select 
                  value={langPref}
                  onChange={(e) => setLangPref(e.target.value as LangPref)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:border-purple-500 outline-none cursor-pointer"
                >
                  <option value="en">English (Universal)</option>
                  <option value="id">Bahasa Indonesia</option>
                  <option value="jp">日本語 (Japanese)</option>
                  <option value="kr">한국어 (Korean)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Privacy & Visibility Card */}
          <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-3xl shadow-xl">
            <div className="flex items-center gap-2 mb-6 text-purple-400">
              <Shield className="w-4 h-4" />
              <h3 className="text-sm font-black font-space uppercase tracking-wider">Privacy & Visibility</h3>
            </div>
            
            <div className="space-y-3">
              {renderPrivacySelect("profileVisible" as any, "Public Profile Link", "Allow others to find your footprint")}
              {renderPrivacySelect("showEmail", "Email Visibility", "Control who can view your electronic mail address")}
              {renderPrivacySelect("showPhone", "Phone Visibility", "Visibility for your contact number registry")}
              {renderPrivacySelect("showFullName", "Legal Identity", "Visibility for your registered full name")}
              {renderPrivacySelect("showAvatar", "Avatar Display", "Visibility for your profile biometric image")}
              {renderPrivacySelect("showLocation", "Location Registry", "Display current planetary location coordinates")}
              {renderPrivacySelect("showSocialLinks", "Neural Social Bridges", "Visibility for X, Instagram, GitHub, etc.")}
              {renderPrivacySelect("showActivity", "Activity Stream", "Display latest interactions and blog transmissions")}
            </div>
          </div>

          <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-3xl shadow-xl">
            <div className="flex items-center gap-2 mb-6 text-purple-400">
              <Camera className="w-4 h-4" />
              <h3 className="text-sm font-black font-space uppercase tracking-wider">Notification Preferences</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-850 rounded-2xl">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-200">Enable All Notifications</span>
                  <span className="text-[9px] text-slate-500 font-mono">Toggle global notification signal</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setNotificationPreferences(p => ({ ...p, all: !p.all }))}
                  className={`w-10 h-5 rounded-full relative transition-colors ${notificationPreferences.all ? 'bg-purple-600' : 'bg-slate-800'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${notificationPreferences.all ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                {[
                  { key: 'content', label: 'Content', icon: BookOpen },
                  { key: 'social', label: 'Social', icon: Heart },
                  { key: 'system', label: 'System', icon: Shield },
                  { key: 'admin', label: 'Admin', icon: Lock }
                ].map((pref) => (
                  <div key={pref.key} className={`flex items-center justify-between p-3 bg-slate-950 border border-slate-850 rounded-2xl ${!notificationPreferences.all ? 'opacity-40 grayscale' : ''}`}>
                    <div className="flex items-center gap-2">
                       {/* @ts-ignore */}
                       <pref.icon className="w-3.5 h-3.5 text-slate-500" />
                       <span className="text-[10px] font-bold text-slate-300 uppercase">{pref.label}</span>
                    </div>
                    <button 
                      type="button"
                      disabled={!notificationPreferences.all}
                      onClick={() => setNotificationPreferences(p => ({ ...p, [pref.key]: !p[pref.key as keyof typeof p] }))}
                      className={`w-8 h-4 rounded-full relative transition-colors ${notificationPreferences[pref.key as keyof typeof notificationPreferences] ? 'bg-purple-600' : 'bg-slate-800'}`}
                    >
                      <div className={`absolute top-0.5 w-[12px] h-[12px] bg-white rounded-full transition-all ${notificationPreferences[pref.key as keyof typeof notificationPreferences] ? 'left-[18px]' : 'left-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Security Summary Widget */}
          <div className="p-6 bg-slate-900/30 border border-slate-900 rounded-3xl shadow-xl">
            <div className="flex items-center gap-2 mb-6 text-emerald-400">
              <Lock className="w-4 h-4" />
              <h3 className="text-sm font-black font-space uppercase tracking-wider">Access Controls</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-850 rounded-2xl">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-200 font-mono">MFA MULTI-FACTOR AUTH</span>
                  <span className="text-[9px] text-slate-500 font-mono italic">Increase account protection status</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setPrivacy(p => ({ ...p, twoFactorEnabled: !p.twoFactorEnabled }))}
                  className={`w-10 h-5 rounded-full relative transition-colors ${privacy.twoFactorEnabled ? 'bg-emerald-600' : 'bg-slate-800'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${privacy.twoFactorEnabled ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono px-3">
                <span className="flex items-center gap-2 text-slate-500"><Shield className="w-3 h-3" /> Hardware Protocol</span>
                <span className="text-emerald-400 font-bold">ACTIVE AES-256</span>
              </div>
            </div>
          </div>

          {/* Earned Badges Showcase (View-only for users) */}
          <div className="p-6 bg-slate-900/10 border border-slate-900/50 rounded-3xl border-dashed">
             <div className="flex items-center gap-2 mb-4 opacity-50">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="text-[10px] font-black font-space uppercase tracking-widest text-slate-400">Earned Accolades</h3>
             </div>
             <div className="flex flex-wrap gap-2">
                {badges.length > 0 ? (
                  badges.map(b => (
                    <div key={b} className="p-2 px-3 bg-purple-950/20 border border-purple-800/20 rounded-xl text-[9px] font-mono text-purple-400 font-bold">
                      {b.toUpperCase()}
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-slate-600 italic font-mono">Constructive achievements unlocked by platform engagement.</p>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

