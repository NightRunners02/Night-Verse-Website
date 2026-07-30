import React, { useState } from "react";
import { 
  User, 
  Settings, 
  HelpCircle, 
  Info, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Shield,
  Zap,
  Globe,
  Mail,
  Calendar,
  Layers,
  Award,
  Lock,
  CheckCircle2,
  Trophy,
  Crown,
  ShieldCheck,
  ShieldAlert
} from "lucide-react";
import { useAppState } from "../context/AppState.js";
import ProfileOverview from "./ProfileOverview.js";
import { ProfileWorkspace } from "./ProfileWorkspace.js";
import { motion, AnimatePresence } from "motion/react";
import { RoleBadge, BadgeType } from "./RoleBadge.js";

type TabType = "profile" | "edit-profile" | "badges" | "faq" | "about";

export const ProfileSettings: React.FC = () => {
  const { user } = useAppState();
  const [activeTab, setActiveTab] = useState<TabType>("profile");

  if (!user) return null;

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "edit-profile", label: "Edit Profile", icon: Settings },
    { id: "badges", label: "Badges", icon: Award },
    { id: "faq", label: "FAQ", icon: HelpCircle },
    { id: "about", label: "About App", icon: Info },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header with Tabs */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl md:rounded-3xl p-1.5 md:p-3 backdrop-blur-xl sticky top-16 md:top-24 z-30 shadow-2xl">
        <div className="grid grid-cols-2 md:flex md:flex-nowrap items-center gap-1 md:gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center justify-center gap-1.5 md:gap-2 py-1.5 md:py-3 px-1 md:px-4 rounded-lg md:rounded-2xl text-[9px] md:text-sm font-bold transition-all ${
                  isActive 
                    ? "bg-white text-slate-950 shadow-lg shadow-white/5" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Icon className={`w-3 h-3 md:w-4 h-4 ${isActive ? "text-slate-950" : "text-slate-500"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px] md:min-h-[600px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "profile" && <ProfileOverview onEditClick={() => setActiveTab("edit-profile")} />}
            {activeTab === "edit-profile" && <ProfileWorkspace onCancel={() => setActiveTab("profile")} />}
            {activeTab === "badges" && <BadgeSection />}
            {activeTab === "faq" && <FAQSection />}
            {activeTab === "about" && <AboutSection />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

const BadgeSection: React.FC = () => {
  const { user, setActiveBadge } = useAppState();
  
  const BADGE_METADATA = [
    {
      id: "Administrator",
      role: "ADMIN" as BadgeType,
      name: "Administrator",
      color: "text-rose-400",
      bgColor: "bg-rose-500/10",
      borderColor: "border-rose-500/30",
      icon: ShieldCheck,
      description: "Badge khusus untuk administrator yang memiliki akses penuh ke sistem NightVerse.",
      requirement: "Diberikan langsung oleh sistem kepada akun dengan peran Administrator.",
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
      description: "Badge untuk moderator yang bertugas menjaga komunitas dan melakukan moderasi konten.",
      requirement: "Diberikan kepada akun yang ditetapkan sebagai Moderator oleh Administrator.",
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
      description: "Menandakan kreator resmi yang telah berhasil melewati proses verifikasi.",
      requirement: "Ajukan verifikasi akun dan disetujui oleh Administrator setelah memenuhi persyaratan.",
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
      description: "Diberikan kepada pengguna yang aktif memberikan kontribusi positif terhadap komunitas dan platform.",
      requirement: "Aktif mengunggah konten berkualitas, membantu komunitas, dan memenuhi kriteria kontribusi yang ditentukan.",
      check: (u: any) => u.profile?.badges?.includes("Contributor")
    },
    {
      id: "VIP",
      role: "VIP" as BadgeType,
      name: "VIP",
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/30",
      icon: Crown,
      description: "Badge eksklusif untuk anggota VIP yang memperoleh keuntungan dan fitur tambahan.",
      requirement: "Berlangganan paket VIP atau mendapatkannya melalui event khusus NightVerse.",
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
      description: "Badge standar yang dimiliki oleh seluruh pengguna setelah berhasil membuat akun.",
      requirement: "Otomatis diberikan saat registrasi akun baru.",
      check: () => true
    }
  ];

  const ownedBadges = BADGE_METADATA.filter(b => b.check(user));
  const ownedCount = ownedBadges.length;
  const totalCount = BADGE_METADATA.length;
  const progressPercent = (ownedCount / totalCount) * 100;

  const currentActiveBadge = user?.profile?.activeBadge || (user?.role === "USER" ? "User" : user?.role);

  return (
    <div className="space-y-6 md:space-y-12 max-w-5xl mx-auto px-4 md:px-0">
      <div className="text-center space-y-2 md:space-y-4">
        <h2 className="text-2xl md:text-5xl font-black font-space uppercase tracking-tighter text-white">My Badge Center</h2>
        <p className="text-slate-400 text-[10px] md:text-base max-w-2xl mx-auto font-medium">
          Manage your digital identity. Select your active badge to display across the NightVerse ecosystem.
        </p>
      </div>

      {/* Stats Summary & Active Badge Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center gap-6 md:gap-10">
          <div className="relative shrink-0">
            <svg className="w-24 h-24 md:w-32 h-32 transform -rotate-90">
              <circle cx="50%" cy="50%" r="45%" className="stroke-slate-800 stroke-[8px] fill-none" />
              <circle
                cx="50%" cy="50%" r="45%"
                className="stroke-indigo-500 stroke-[8px] fill-none transition-all duration-1000 ease-out"
                strokeDasharray="282.7"
                strokeDashoffset={282.7 - (282.7 * progressPercent) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl md:text-3xl font-black text-white">{ownedCount}</span>
              <span className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Unlocked</span>
            </div>
          </div>
          
          <div className="space-y-3 text-center md:text-left">
            <h3 className="text-lg md:text-2xl font-black text-white font-space">Collection Progress</h3>
            <p className="text-[10px] md:text-sm text-slate-400 leading-relaxed max-w-md">
              You've unlocked {ownedCount} out of {totalCount} prestige badges. {progressPercent < 100 ? "Complete more milestones to fill your registry." : "Maximum status achieved!"}
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
              {ownedBadges.map((b) => (
                <div key={b.id} className={`p-2 rounded-xl ${b.bgColor} border ${b.borderColor} group cursor-help relative`} title={b.name}>
                  <b.icon className={`w-4 h-4 md:w-5 h-5 ${b.color}`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-950/40 to-slate-950 border border-indigo-500/20 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
          <span className="text-[9px] font-mono font-black text-indigo-400 uppercase tracking-[0.2em]">Active Signature</span>
          <div className="relative group">
            <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <RoleBadge role={currentActiveBadge} size="md" className="relative scale-150 py-2 px-4 rounded-xl" />
          </div>
          <p className="text-[10px] text-slate-500 italic mt-4">This badge appears next to your name globally.</p>
        </div>
      </div>

      {/* Main Collection Grid */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <h3 className="text-lg md:text-2xl font-black text-white font-space uppercase">My Badge Collection</h3>
          <div className="h-px flex-1 bg-slate-800"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {BADGE_METADATA.map((badge) => {
            const isOwned = badge.check(user);
            const isActive = currentActiveBadge === badge.id || (badge.id === "User" && currentActiveBadge === "USER");
            const Icon = badge.icon;
            
            return (
              <motion.div
                key={badge.id}
                whileHover={isOwned ? { y: -8 } : {}}
                className={`group relative p-6 rounded-[2.5rem] border transition-all duration-500 flex flex-col h-full overflow-hidden ${
                  isOwned 
                    ? `${badge.bgColor} ${badge.borderColor} shadow-lg shadow-indigo-950/10` 
                    : "bg-slate-950/40 border-slate-900/60 opacity-60 grayscale-[0.5]"
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 right-0 p-3">
                    <div className="bg-indigo-500 text-white p-1 rounded-full shadow-lg">
                      <CheckCircle2 className="w-3 h-3" />
                    </div>
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div className={`p-4 rounded-2xl ${isOwned ? "bg-white/5" : "bg-slate-950/60"} border ${isOwned ? badge.borderColor : "border-slate-800"}`}>
                    <Icon className={`w-6 h-6 ${isOwned ? badge.color : "text-slate-700"}`} />
                  </div>
                  {!isOwned && (
                    <div className="bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-800 flex items-center gap-1.5">
                      <Lock className="w-2.5 h-2.5 text-slate-600" />
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Locked</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <h4 className={`text-sm md:text-base font-black font-space tracking-tight ${isOwned ? "text-white" : "text-slate-600"}`}>
                    {badge.name}
                  </h4>
                  <p className={`text-[9px] md:text-xs leading-relaxed ${isOwned ? "text-slate-400" : "text-slate-700"}`}>
                    {badge.description}
                  </p>
                </div>

                <div className={`mt-6 pt-5 border-t ${isOwned ? "border-white/5" : "border-slate-900/50"}`}>
                  {isOwned ? (
                    <button
                      disabled={isActive}
                      onClick={() => setActiveBadge(badge.id)}
                      className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        isActive
                          ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 cursor-default"
                          : "bg-white text-slate-950 hover:bg-indigo-400 hover:text-white shadow-xl active:scale-95 cursor-pointer"
                      }`}
                    >
                      {isActive ? "Currently Active" : "Set as Active"}
                    </button>
                  ) : (
                    <div className="space-y-1.5">
                      <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest block">Requirement:</span>
                      <p className="text-[9px] text-slate-700 font-medium italic leading-tight">
                        {badge.requirement}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "How do I create an account in NightVerse?",
      answer: "Creating an account is simple. Click the 'Sign Up' button on the landing page, enter your username, email, and password. You can also choose between User or Admin roles during registration for testing purposes."
    },
    {
      question: "How can I add transactions or content?",
      answer: "Navigate to the 'Create Work' tab in your sidebar. From there, you can choose to publish Blogs, Photography prints, or AV Reels content. Fill in the details, add tags, and submit for verification."
    },
    {
      question: "How do I manage my budget and finances?",
      answer: "NightVerse provides an interactive 'Analytics' dashboard where you can monitor your content performance, engagement rates, and platform earnings through graphical visualizers and data cards."
    },
    {
      question: "How do I change my profile information?",
      answer: "Go to 'Profile Settings' and select the 'Edit Profile' tab. You can update your full name, bio, location, social links, and even change your avatar and cover banner."
    },
    {
      question: "How do I activate dark mode?",
      answer: "NightVerse defaults to a premium Cosmic Dark theme. You can switch themes in the 'Edit Profile' tab under 'Accent Settings', where you can choose between Dark Cosmic, Light Neon, Cyberpunk, or Monochrome Slate."
    },
    {
      question: "How do I manage notifications?",
      answer: "Open the 'Profile Settings', go to 'Edit Profile', and scroll down to the 'Notification Preferences' section. You can toggle specific notification channels like Content, Social, System, or Admin signals."
    },
    {
      question: "What is the Creator Directory?",
      answer: "The Creator Directory allows you to discover and follow other NightVerse users. You can see their public blueprints, follow their activity streams, and establish neural bridges with other creators."
    }
  ];

  return (
    <div className="space-y-3 md:space-y-6 max-w-3xl mx-auto">
      <div className="text-center space-y-1 md:space-y-2 mb-4 md:mb-10">
        <h2 className="text-lg md:text-3xl font-black font-space uppercase tracking-tight text-white">Frequently Asked Questions</h2>
        <p className="text-slate-400 text-[9px] md:text-sm">Everything you need to know about the NightVerse ecosystem</p>
      </div>

      <div className="space-y-1.5 md:space-y-4">
        {faqs.map((faq, idx) => (
          <div 
            key={idx}
            className="bg-slate-900/50 border border-slate-800 rounded-xl md:rounded-3xl overflow-hidden transition-all"
          >
            <button
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full flex items-center justify-between p-3 md:p-6 text-left hover:bg-slate-850 transition-colors"
            >
              <span className="font-bold text-[10px] md:text-base text-slate-100">{faq.question}</span>
              {openIndex === idx ? (
                <ChevronUp className="w-3.5 h-3.5 md:w-5 h-5 text-purple-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 md:w-5 h-5 text-slate-500" />
              )}
            </button>
            <AnimatePresence>
              {openIndex === idx && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="px-3 md:px-6 pb-3 md:pb-6 text-slate-400 text-[9px] md:text-sm leading-relaxed border-t border-slate-800 pt-2.5 md:pt-4">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

const AboutSection: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-4 md:space-y-8">
      <div className="text-center space-y-1 md:space-y-2 mb-4 md:mb-10">
        <h2 className="text-lg md:text-3xl font-black font-space uppercase tracking-tight text-white">About Application</h2>
        <p className="text-slate-400 text-[9px] md:text-sm">NightVerse System Specification & Manifest</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
        {/* Main Info Card */}
        <div className="md:col-span-2 p-4 md:p-8 bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-900/30 rounded-2xl md:rounded-[2.5rem] relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-4 md:p-8 opacity-10 pointer-events-none">
            <Sparkles className="w-16 h-16 md:w-40 h-40 rotate-12" />
          </div>
          
          <div className="relative z-10 space-y-3 md:space-y-6">
            <div className="flex items-center gap-2.5 md:gap-4">
              <div className="w-10 h-10 md:w-16 h-16 rounded-xl md:rounded-2xl bg-white flex items-center justify-center shadow-2xl">
                <div className="w-6 h-6 md:w-10 h-10 bg-slate-950 rounded-lg flex items-center justify-center">
                  <span className="text-white font-black font-space text-[10px] md:text-lg">NV</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm md:text-2xl font-black font-space uppercase text-white tracking-tighter">NightVerse</h3>
                <div className="flex items-center gap-1.5 md:gap-2 mt-0.5 md:mt-1">
                  <span className="px-1 py-0.5 bg-indigo-500/20 text-indigo-400 rounded text-[7px] md:text-[10px] font-mono font-bold uppercase tracking-widest border border-indigo-500/20">v1.0.0</span>
                  <span className="px-1 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[7px] md:text-[10px] font-mono font-bold uppercase tracking-widest border border-emerald-500/20">Supabase</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 md:space-y-4">
              <p className="text-slate-300 text-[9px] md:text-sm leading-relaxed font-medium">
                NightVerse is a modern personal finance and content management application designed to help users synchronize their creative output and financial health through a single unified interface.
              </p>
              <div className="grid grid-cols-2 gap-2 md:gap-4">
                <div className="flex items-start gap-2 md:gap-3 p-2 md:p-4 bg-slate-950/40 border border-slate-800 rounded-xl md:rounded-2xl">
                  <Zap className="w-3.5 h-3.5 md:w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[8px] md:text-xs font-black font-space text-white uppercase mb-0.5 md:mb-1">Performance</h4>
                    <p className="text-[7px] md:text-[10px] text-slate-500 leading-tight">Optimized workspace for tracking income and expenses.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 md:gap-3 p-2 md:p-4 bg-slate-950/40 border border-slate-800 rounded-xl md:rounded-2xl">
                  <Layers className="w-3.5 h-3.5 md:w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[8px] md:text-xs font-black font-space text-white uppercase mb-0.5 md:mb-1">Analytics</h4>
                    <p className="text-[7px] md:text-[10px] text-slate-500 leading-tight">Interactive dashboards for financial monitoring.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Specs */}
        <div className="p-3 md:p-6 bg-slate-900/50 border border-slate-800 rounded-xl md:rounded-3xl shadow-xl space-y-2 md:space-y-4">
          <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
            <Shield className="w-3 h-3 md:w-4 h-4 text-emerald-400" />
            <h4 className="text-[8px] md:text-xs font-black font-space text-white uppercase tracking-wider">Security Layer</h4>
          </div>
          <div className="space-y-1.5 md:space-y-3">
            <div className="flex items-center justify-between text-[7px] md:text-[10px] font-mono">
              <span className="text-slate-500">Encryption Standard</span>
              <span className="text-white">AES-256 GCM</span>
            </div>
            <div className="flex items-center justify-between text-[7px] md:text-[10px] font-mono">
              <span className="text-slate-500">Auth Protocol</span>
              <span className="text-white">Neural OAuth 2.0</span>
            </div>
            <div className="flex items-center justify-between text-[7px] md:text-[10px] font-mono">
              <span className="text-slate-500">Session Guard</span>
              <span className="text-emerald-400 font-bold">ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Support Specs */}
        <div className="p-3 md:p-6 bg-slate-900/50 border border-slate-800 rounded-xl md:rounded-3xl shadow-xl space-y-2 md:space-y-4">
          <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
            <Globe className="w-3 h-3 md:w-4 h-4 text-blue-400" />
            <h4 className="text-[8px] md:text-xs font-black font-space text-white uppercase tracking-wider">Network Status</h4>
          </div>
          <div className="space-y-1.5 md:space-y-3">
            <div className="flex items-center justify-between text-[7px] md:text-[10px] font-mono">
              <span className="text-slate-500">Latency Marker</span>
              <span className="text-white">12ms Response</span>
            </div>
            <div className="flex items-center justify-between text-[7px] md:text-[10px] font-mono">
              <span className="text-slate-500">Cloud Node</span>
              <span className="text-white">Global Edge v4</span>
            </div>
            <div className="flex items-center justify-between text-[7px] md:text-[10px] font-mono">
              <span className="text-slate-500">Uptime Metric</span>
              <span className="text-blue-400 font-bold">99.98% SLA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center pt-6 md:pt-8 border-t border-slate-800">
        <p className="text-[8px] md:text-[10px] font-mono text-slate-600 uppercase tracking-[0.2em]">
          NightVerse Systems © 2026 | All Rights Reserved
        </p>
      </div>
    </div>
  );
};
