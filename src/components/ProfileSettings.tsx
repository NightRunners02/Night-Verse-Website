import React, { useState, useEffect, useMemo } from "react";
import { 
  User as UserIcon, 
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
  Users,
  Star,
  Calendar,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  X,
  Upload,
  Phone,
  Mail,
  MapPin,
  Hash,
  Sparkle,
  Tag,
  ExternalLink,
  Youtube,
  Heart,
  MessageCircle,
  Briefcase,
  Layers,
  Image as ImageIcon,
  Video as VideoIcon,
  LifeBuoy,
  Lightbulb,
  MessageSquare,
  Send,
  Paperclip
} from "lucide-react";
import { useAppState } from "../context/AppState.js";
import { db } from "../lib/db.js";
import { motion, AnimatePresence } from "motion/react";
import { RoleBadge, BadgeType } from "./RoleBadge.js";
import { 
  BadgeDefinition, 
  UserBadgeAward, 
  User, 
  PrivacyLevel,
  SupportTicket,
  TicketMessage,
  TicketCategory,
  TicketPriority 
} from "../types.js";
import { FullProfileView } from "./FullProfileView.js";
import { DocumentationCenter } from "./DocumentationCenter.js";
import { DEFAULT_CHANGELOGS, DEFAULT_DOC_CATEGORIES } from "../lib/defaultDocs.js";

type SettingsMenu = null | "preview" | "edit-profile" | "badges" | "help-center" | "documentation" | "faq" | "about";

// Custom Platform Icons
const DiscordIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

const TikTokIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.97v7.68a7.7 7.7 0 0 1-.82 3.42 7.74 7.74 0 0 1-5.06 4.41c-1.2.35-2.48.37-3.71.07a7.71 7.71 0 0 1-4.78-3.79 7.74 7.74 0 0 1-.94-4.87c.36-2.45 1.9-4.59 4.09-5.64 1.18-.57 2.51-.78 3.82-.64v4.06a3.67 3.67 0 0 0-2.28 1.15 3.75 3.75 0 0 0-.96 2.89c.12 1.14.86 2.17 1.88 2.64 1.01.47 2.25.35 3.16-.31.78-.57 1.23-1.51 1.23-2.49V.02h-.66z" />
  </svg>
);

export const ProfileSettings: React.FC = () => {
  const { user, logout, triggerToast, updateLocalProfile, createNotification, triggerDBSync } = useAppState();
  const [selectedMenu, setSelectedMenu] = useState<SettingsMenu>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [stagedProfileData, setStagedProfileData] = useState<any>(null);

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
            {/* Settings Top Header with Profile Card & Quick Preview Action */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-600/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                  <Settings className="w-6 h-6 animate-spin-slow" />
                </div>
                <div>
                  <h1 className="text-2xl font-black font-space text-white tracking-tight">Settings</h1>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">
                    Pengaturan akun, profil, badge, serta preferensi privasi NightVerse
                  </p>
                </div>
              </div>

              {/* Quick Actions Header */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3">
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
            </div>

            {/* Menu Sections Container */}
            <div className="space-y-6">
              {/* Section 1: Pengaturan Akun & Tampilan */}
              <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
                <div className="px-6 pt-5 pb-3 border-b border-slate-800/60 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-[0.2em]">
                    Pengaturan Akun & Tampilan
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    3 Menu
                  </span>
                </div>

                <div className="divide-y divide-slate-800/40">
                  {/* Item 0: Full Profile Preview */}
                  <button
                    onClick={() => {
                      setStagedProfileData(null);
                      setSelectedMenu("preview");
                    }}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-850/80 transition-all cursor-pointer group text-left"
                  >
                    <div className="flex items-center gap-4 min-w-0 pr-4">
                      <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400 group-hover:border-cyan-500/50 group-hover:bg-cyan-950/20 transition-all shrink-0">
                        <Eye className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white font-space group-hover:text-cyan-300 transition-colors">
                            Full Profile Preview
                          </h3>
                          <span className="text-[9px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-900/60">
                            Live Mode
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate font-sans mt-0.5">
                          Lihat simulasi lengkap profil publik Anda seperti yang dilihat oleh pengunjung platform
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all shrink-0" />
                  </button>

                  {/* Item 1: Edit Profile */}
                  <button
                    onClick={() => setSelectedMenu("edit-profile")}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-850/80 transition-all cursor-pointer group text-left"
                  >
                    <div className="flex items-center gap-4 min-w-0 pr-4">
                      <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-purple-400 group-hover:border-purple-500/50 group-hover:bg-purple-950/20 transition-all shrink-0">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-white font-space group-hover:text-purple-300 transition-colors">
                          Edit Profile
                        </h3>
                        <p className="text-xs text-slate-400 truncate font-sans mt-0.5">
                          Ubah informasi dasar, foto avatar, banner, minat, tautan sosial, dan visibilitas privasi
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
                <div className="px-6 pt-5 pb-3 border-b border-slate-800/60 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-[0.2em]">
                    Informasi & Dukungan
                  </span>
                  <span className="text-[9px] font-mono text-slate-500 font-bold">
                    Official NightVerse Center
                  </span>
                </div>

                <div className="divide-y divide-slate-800/40">
                  {/* Item A: Help Center */}
                  <button
                    onClick={() => setSelectedMenu("help-center")}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-850/80 transition-all cursor-pointer group text-left"
                  >
                    <div className="flex items-center gap-4 min-w-0 pr-4">
                      <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-rose-400 group-hover:border-rose-500/50 group-hover:bg-rose-950/20 transition-all shrink-0">
                        <LifeBuoy className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white font-space group-hover:text-rose-300 transition-colors">
                            Help Center
                          </h3>
                          <span className="px-2 py-0.2 rounded-full text-[8px] font-mono font-bold uppercase bg-rose-950/80 text-rose-300 border border-rose-900/80">
                            Bantuan
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate font-sans mt-0.5">
                          Tempat menemukan bantuan cepat, panduan pemecahan masalah, dan dukungan teknis
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-1 transition-all shrink-0" />
                  </button>

                  {/* Item B: Documentation */}
                  <button
                    onClick={() => setSelectedMenu("documentation")}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-850/80 transition-all cursor-pointer group text-left"
                  >
                    <div className="flex items-center gap-4 min-w-0 pr-4">
                      <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-purple-400 group-hover:border-purple-500/50 group-hover:bg-purple-950/20 transition-all shrink-0">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white font-space group-hover:text-purple-300 transition-colors">
                            Documentation
                          </h3>
                          <span className="px-2 py-0.2 rounded-full text-[8px] font-mono font-bold uppercase bg-purple-950/80 text-purple-300 border border-purple-900/80">
                            Pusat Resmi
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate font-sans mt-0.5">
                          Pusat dokumentasi lengkap, panduan fitur, taksonomi, dan catatan rilis website
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all shrink-0" />
                  </button>

                  {/* Item C: FAQ */}
                  <button
                    onClick={() => setSelectedMenu("faq")}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-850/80 transition-all cursor-pointer group text-left"
                  >
                    <div className="flex items-center gap-4 min-w-0 pr-4">
                      <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400 group-hover:border-cyan-500/50 group-hover:bg-cyan-950/20 transition-all shrink-0">
                        <HelpCircle className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white font-space group-hover:text-cyan-300 transition-colors">
                            FAQ
                          </h3>
                          <span className="px-2 py-0.2 rounded-full text-[8px] font-mono font-bold uppercase bg-cyan-950/80 text-cyan-300 border border-cyan-900/80">
                            Tanya Jawab
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate font-sans mt-0.5">
                          Pertanyaan umum dan jawaban mengenai fitur, leaderboard, privasi, dan aturan NightVerse
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all shrink-0" />
                  </button>

                  {/* Item D: About Application */}
                  <button
                    onClick={() => setSelectedMenu("about")}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-850/80 transition-all cursor-pointer group text-left"
                  >
                    <div className="flex items-center gap-4 min-w-0 pr-4">
                      <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400 group-hover:border-emerald-500/50 group-hover:bg-emerald-950/20 transition-all shrink-0">
                        <Info className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white font-space group-hover:text-emerald-300 transition-colors">
                            About Application
                          </h3>
                          <span className="px-2 py-0.2 rounded-full text-[8px] font-mono font-bold uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-900/80">
                            Aplikasi
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate font-sans mt-0.5">
                          Informasi resmi aplikasi, sinkronisasi logo, Syarat Layanan, dan Kebijakan Privasi
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all shrink-0" />
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
                onClick={() => {
                  if (selectedMenu === "preview" && stagedProfileData) {
                    setSelectedMenu("edit-profile");
                  } else {
                    setSelectedMenu(null);
                    setStagedProfileData(null);
                  }
                }}
                className="flex items-center gap-2 px-3 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white rounded-2xl border border-slate-800 text-xs font-bold font-space transition-all cursor-pointer active:scale-95 shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{selectedMenu === "preview" && stagedProfileData ? "Edit Profile" : "Settings"}</span>
              </button>

              <h2 className="text-base font-black font-space text-white uppercase tracking-wider truncate px-2">
                {selectedMenu === "preview" && "Full Profile Preview"}
                {selectedMenu === "edit-profile" && "Edit Profile"}
                {selectedMenu === "badges" && "My Badge Center"}
                {selectedMenu === "help-center" && "Help Center"}
                {selectedMenu === "documentation" && "Documentation Center"}
                {selectedMenu === "faq" && "FAQ & Panduan"}
                {selectedMenu === "about" && "About NightVerse"}
              </h2>

              <div className="w-24 flex justify-end">
                {selectedMenu === "preview" && stagedProfileData ? (
                  <span className="text-[9px] font-mono text-amber-400 bg-amber-950/60 px-2 py-1 rounded-full border border-amber-900/60 uppercase font-bold">
                    Draft Preview
                  </span>
                ) : (
                  <span className="text-[9px] font-mono text-purple-400 bg-purple-950/60 px-2 py-1 rounded-full border border-purple-900/60 uppercase font-bold">
                    NightVerse
                  </span>
                )}
              </div>
            </div>

            {/* Sub-panel Content */}
            <div>
              {selectedMenu === "preview" && (
                <FullProfileView
                  userId={user.id}
                  userObject={
                    stagedProfileData
                      ? {
                          ...user,
                          username: stagedProfileData.username || user.username,
                          profile: stagedProfileData
                        }
                      : user
                  }
                  stagedProfileData={stagedProfileData}
                  isOwnerPreview={true}
                  onApplyDraft={() => {
                    if (!stagedProfileData) return;
                    db.users.update(user.id, {
                      username: stagedProfileData.username || user.username,
                      profile: stagedProfileData
                    });
                    updateLocalProfile(stagedProfileData);
                    triggerDBSync();
                    triggerToast("Profil Berhasil Disimpan! 🎉", "Perubahan profil telah diterapkan ke akun publik Anda.", "success");
                    setStagedProfileData(null);
                    setSelectedMenu(null);
                  }}
                />
              )}

              {selectedMenu === "edit-profile" && (
                <EditProfilePanel
                  onBack={() => setSelectedMenu(null)}
                  onPreviewDraft={(draftData) => {
                    setStagedProfileData(draftData);
                    setSelectedMenu("preview");
                  }}
                />
              )}

              {selectedMenu === "badges" && <BadgesPanel />}
              {selectedMenu === "help-center" && (
                <HelpCenterPanel 
                  onOpenDocs={() => setSelectedMenu("documentation")} 
                  onOpenFaq={() => setSelectedMenu("faq")} 
                />
              )}
              {selectedMenu === "documentation" && (
                <DocumentationCenter onBack={() => setSelectedMenu(null)} />
              )}
              {selectedMenu === "faq" && <FAQPanel />}
              {selectedMenu === "about" && <AboutAppPanel onOpenDocs={() => setSelectedMenu("documentation")} />}
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
   2. EXPANDED EDIT PROFILE PANEL
   ========================================================================= */
interface EditProfilePanelProps {
  onBack: () => void;
  onPreviewDraft: (draftData: any) => void;
}

const EditProfilePanel: React.FC<EditProfilePanelProps> = ({ onBack, onPreviewDraft }) => {
  const { user, updateLocalProfile, triggerToast, createNotification, triggerDBSync } = useAppState();

  if (!user) return null;

  // Active section tabs
  const [activeSection, setActiveSection] = useState<
    "basic" | "appearance" | "interests" | "social" | "identity" | "privacy"
  >("basic");

  // Basic Information
  const [username, setUsername] = useState(user.username || "");
  const [fullName, setFullName] = useState(user.profile?.fullName || "");
  const [bio, setBio] = useState(user.profile?.bio || "");
  const [gender, setGender] = useState(user.profile?.gender || "Tidak ditentukan");
  const [location, setLocation] = useState(user.profile?.location || "");
  const [occupation, setOccupation] = useState(user.profile?.occupation || "");
  const [website, setWebsite] = useState(user.profile?.website || "");

  // Appearance
  const [avatarUrl, setAvatarUrl] = useState(user.profile?.avatarUrl || "");
  const [bannerUrl, setBannerUrl] = useState(user.profile?.bannerUrl || "");

  // Interests
  const [interests, setInterests] = useState<string[]>(user.profile?.interests || [
    "Cyberpunk Art",
    "Neon Lighting",
    "3D Rendering"
  ]);
  const [customTagInput, setCustomTagInput] = useState("");

  // Social Links
  const [twitter, setTwitter] = useState(user.profile?.twitter || "");
  const [instagram, setInstagram] = useState(user.profile?.instagram || "");
  const [github, setGithub] = useState(user.profile?.github || "");
  const [linkedin, setLinkedin] = useState(user.profile?.linkedin || "");
  const [tiktok, setTiktok] = useState(user.profile?.tiktok || "");
  const [youtube, setYoutube] = useState(user.profile?.youtube || "");
  const [discord, setDiscord] = useState(user.profile?.discord || "");

  // Identity Details
  const [phoneNumber, setPhoneNumber] = useState(user.profile?.phoneNumber || "");

  // Privacy & Visibility Settings (8 independent controls)
  const [profileVisible, setProfileVisible] = useState<boolean>(
    user.profile?.privacy?.profileVisible !== false
  );
  const [showAvatar, setShowAvatar] = useState<PrivacyLevel>(
    user.profile?.privacy?.showAvatar || "PUBLIC"
  );
  const [showBanner, setShowBanner] = useState<PrivacyLevel>(
    user.profile?.privacy?.showBanner || "PUBLIC"
  );
  const [showInterests, setShowInterests] = useState<PrivacyLevel>(
    user.profile?.privacy?.showInterests || "PUBLIC"
  );
  const [showSocialLinks, setShowSocialLinks] = useState<PrivacyLevel>(
    user.profile?.privacy?.showSocialLinks || "PUBLIC"
  );
  const [showPhone, setShowPhone] = useState<PrivacyLevel>(
    user.profile?.privacy?.showPhone || "PRIVATE" // default phone is Private
  );
  const [showIdentity, setShowIdentity] = useState<PrivacyLevel>(
    user.profile?.privacy?.showIdentity || "PRIVATE" // default identity is Private
  );
  const [showActivity, setShowActivity] = useState<PrivacyLevel>(
    user.profile?.privacy?.showActivity || "PUBLIC"
  );
  const [showActivityStatus, setShowActivityStatus] = useState<PrivacyLevel>(
    user.profile?.privacy?.showActivityStatus || "PUBLIC"
  );

  const [isSaving, setIsSaving] = useState(false);

  // Avatar presets
  const avatarPresets = [
    `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`,
    `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}-cyber`,
    `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}-neon`,
    `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80`,
    `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80`
  ];

  // Preset interests list
  const presetInterests = [
    "Cyberpunk Art",
    "Neon Lighting",
    "3D Rendering",
    "Photography",
    "Synthwave",
    "UI/UX Design",
    "Sound Design",
    "Motion Graphics",
    "AI Art",
    "Pixel Art",
    "VFX",
    "Game Dev",
    "Architecture",
    "Streetwear"
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

  const handleAddTag = (tagToAdd: string) => {
    const cleaned = tagToAdd.trim().replace(/^#/, "");
    if (!cleaned) return;
    if (interests.some((t) => t.toLowerCase() === cleaned.toLowerCase())) {
      triggerToast("Tag Sudah Ada", `Minat #${cleaned} telah terdaftar.`, "info");
      return;
    }
    setInterests([...interests, cleaned]);
    setCustomTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setInterests(interests.filter((t) => t !== tagToRemove));
  };

  // Build draft profile snapshot
  const buildCurrentDraft = () => {
    return {
      ...(user.profile || {}),
      fullName: fullName.trim(),
      bio: bio.trim(),
      gender,
      location: location.trim(),
      occupation: occupation.trim(),
      website: website.trim(),
      avatarUrl: avatarUrl.trim(),
      bannerUrl: bannerUrl.trim(),
      interests,
      twitter: twitter.trim(),
      instagram: instagram.trim(),
      github: github.trim(),
      linkedin: linkedin.trim(),
      tiktok: tiktok.trim(),
      youtube: youtube.trim(),
      discord: discord.trim(),
      phoneNumber: phoneNumber.trim(),
      privacy: {
        ...(user.profile?.privacy || {}),
        profileVisible,
        showAvatar,
        showBanner,
        showInterests,
        showSocialLinks,
        showPhone,
        showIdentity,
        showActivity,
        showActivityStatus,
        showFullName: showAvatar === "PRIVATE" ? "PRIVATE" : "PUBLIC",
        showEmail: showIdentity === "PRIVATE" ? "PRIVATE" : "PUBLIC",
        showLocation: showIdentity === "PRIVATE" ? "PRIVATE" : "PUBLIC",
        twoFactorEnabled: user.profile?.privacy?.twoFactorEnabled ?? false
      },
      username: username.trim()
    };
  };

  const handlePreview = () => {
    const draft = buildCurrentDraft();
    onPreviewDraft(draft);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      triggerToast("Validasi Gagal", "Username akun tidak boleh kosong.", "error");
      return;
    }

    setIsSaving(true);
    const updatedProfile = buildCurrentDraft();

    // Persist to Centralized Database
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
      title: "Profile Berhasil Diperbarui ✨",
      message: "Data profil, tampilan, dan preferensi privasi telah disimpan permanen.",
      category: "SYSTEM",
      type: "PROFILE_UPDATE",
      link: `PROFILE:${user.id}`
    });

    setTimeout(() => {
      setIsSaving(false);
      triggerToast("Profil Berhasil Disimpan! 🎉", "Perubahan profil NightVerse Anda telah aktif.", "success");
      onBack();
    }, 500);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Top Section Nav Tabs */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-2 flex items-center gap-1.5 overflow-x-auto shadow-xl">
        {[
          { id: "basic", label: "Info Dasar", icon: UserIcon },
          { id: "appearance", label: "Tampilan", icon: Camera },
          { id: "interests", label: "Minat & Tags", icon: Tag },
          { id: "social", label: "Sosial & Web", icon: Globe },
          { id: "identity", label: "Data Identitas", icon: ShieldCheck },
          { id: "privacy", label: "Privasi & Visibilitas", icon: Lock }
        ].map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSection(sec.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold font-space transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-purple-600 text-white shadow-md shadow-purple-900/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-850"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 1: BASIC INFORMATION */}
      {activeSection === "basic" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 animate-in fade-in duration-200">
          <div className="border-b border-slate-800 pb-3">
            <h4 className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest">
              A. Informasi Dasar Pengguna
            </h4>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Identitas publik akun yang membedakan Anda di dalam ekosistem NightVerse
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold font-space text-slate-300">
                Display Name / Nama Lengkap
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Contoh: Alex Vance"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:border-purple-500 outline-none transition-all font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold font-space text-slate-300">
                Username Akun
              </label>
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
            <label className="block text-xs font-bold font-space text-slate-300">
              Bio Ringkas
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={250}
              placeholder="Ceritakan latar belakang, fokus artistik, atau moto Anda di NightVerse..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white focus:border-purple-500 outline-none transition-all resize-none font-sans"
            />
            <div className="flex justify-end">
              <span className="text-[10px] font-mono text-slate-500">{bio.length}/250 Karakter</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold font-space text-slate-300">
                Jenis Kelamin (Gender)
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:border-purple-500 outline-none transition-all font-sans"
              >
                <option value="Tidak ditentukan">Tidak ditentukan</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Rahasia">Rahasia</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold font-space text-slate-300">
                Lokasi / Domisili
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Contoh: Neo Jakarta / Tokyo"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:border-purple-500 outline-none transition-all font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold font-space text-slate-300">
                Profesi / Bidang
              </label>
              <input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="Contoh: 3D Visual Artist"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:border-purple-500 outline-none transition-all font-sans"
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: PROFILE APPEARANCE */}
      {activeSection === "appearance" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 animate-in fade-in duration-200">
          <div className="border-b border-slate-800 pb-3">
            <h4 className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest">
              B. Tampilan Profil (Avatar & Cover Banner)
            </h4>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Kustomisasi visual avatar dan banner sampul dengan pratinjau langsung sebelum disimpan
            </p>
          </div>

          {/* Banner Upload & Management */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold font-space text-slate-300">Cover Banner</label>
              {bannerUrl && (
                <button
                  type="button"
                  onClick={() => setBannerUrl("")}
                  className="text-[11px] font-mono text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus Banner
                </button>
              )}
            </div>

            <div className="h-36 sm:h-44 bg-slate-950 border border-slate-800 rounded-2xl relative overflow-hidden group">
              {bannerUrl ? (
                <img src={bannerUrl} alt="Cover Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 flex items-center justify-center">
                  <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">
                    Default NightVerse Gradient
                  </span>
                </div>
              )}
              <label className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-2xl text-xs font-bold font-space shadow-lg">
                  <Upload className="w-4 h-4" /> Unggah File Banner
                </div>
                <input type="file" accept="image/*" onChange={handleBannerFile} className="hidden" />
              </label>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-500">Atau masukkan URL gambar banner eksternal:</span>
              <input
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:border-purple-500 outline-none font-mono"
              />
            </div>
          </div>

          {/* Avatar Upload & Management */}
          <div className="space-y-4 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold font-space text-slate-300">Avatar Profil</label>
              <button
                type="button"
                onClick={() => setAvatarUrl(`https://api.dicebear.com/7.x/bottts/svg?seed=${username}`)}
                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset ke Bawaan
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="relative group shrink-0">
                <img
                  src={avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`}
                  alt="Avatar"
                  className="w-24 h-24 rounded-3xl border-4 border-slate-800 object-cover bg-slate-950 shadow-2xl"
                />
                <label className="absolute inset-0 bg-slate-950/60 rounded-3xl opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer">
                  <Camera className="w-6 h-6 text-white" />
                  <input type="file" accept="image/*" onChange={handleAvatarFile} className="hidden" />
                </label>
              </div>

              <div className="space-y-3 flex-1 min-w-0 w-full">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-500">Preset Avatar Robot / Cyber:</span>
                  <div className="flex items-center gap-2">
                    {avatarPresets.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatarUrl(p)}
                        className={`w-9 h-9 rounded-2xl border overflow-hidden hover:scale-105 transition-all cursor-pointer ${
                          avatarUrl === p ? "border-purple-500 ring-2 ring-purple-500/50" : "border-slate-800"
                        }`}
                        title={`Preset ${idx + 1}`}
                      >
                        <img src={p} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-500">Atau masukkan URL foto avatar:</span>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://api.dicebear.com/..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:border-purple-500 outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: INTERESTS & TAGS */}
      {activeSection === "interests" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 animate-in fade-in duration-200">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
                C. Minat & Kategori Karya (Interests)
              </h4>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Pilih topik dan tag yang relevan dengan eksplorasi kreatif Anda di NightVerse
              </p>
            </div>
            <span className="text-xs font-mono text-purple-400 font-bold">
              {interests.length} Terpilih
            </span>
          </div>

          {/* Current Selected Tags */}
          <div className="space-y-2">
            <label className="text-xs font-bold font-space text-slate-300">Minat Terpilih Saat Ini:</label>
            <div className="flex flex-wrap gap-2 min-h-12 p-3 bg-slate-950 rounded-2xl border border-slate-800">
              {interests.length > 0 ? (
                interests.map((tag, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-950/60 text-purple-300 border border-purple-800/60 rounded-xl text-xs font-mono font-bold shadow-sm"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500 font-sans italic self-center">
                  Belum ada minat yang dipilih. Klik preset di bawah atau tambahkan sendiri.
                </span>
              )}
            </div>
          </div>

          {/* Custom Tag Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold font-space text-slate-300">Tambah Tag Kustom:</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Hash className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                <input
                  type="text"
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag(customTagInput);
                    }
                  }}
                  placeholder="Ketik topik minat lalu tekan Tambah atau Enter..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-xs text-white focus:border-cyan-500 outline-none font-mono"
                />
              </div>
              <button
                type="button"
                onClick={() => handleAddTag(customTagInput)}
                className="px-5 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl text-xs font-bold font-space transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Preset Recommendation Chips */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              Rekomendasi Tag Populer Platform:
            </span>
            <div className="flex flex-wrap gap-2">
              {presetInterests.map((preset) => {
                const isSelected = interests.some((t) => t.toLowerCase() === preset.toLowerCase());
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        handleRemoveTag(preset);
                      } else {
                        handleAddTag(preset);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-purple-600 text-white border border-purple-400"
                        : "bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800"
                    }`}
                  >
                    {isSelected ? "✓" : "+"} #{preset}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: WEBSITES & SOCIAL LINKS */}
      {activeSection === "social" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 animate-in fade-in duration-200">
          <div className="border-b border-slate-800 pb-3">
            <h4 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">
              D. Website & Tautan Sosial Media
            </h4>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Hubungkan akun portofolio dan kanal jejaring eksternal Anda ke profil NightVerse
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold font-space text-slate-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-purple-400" /> Website / URL Portofolio
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://portfolio.nightverse.app"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:border-purple-500 outline-none font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-space">
                <Instagram className="w-3.5 h-3.5 text-pink-400" /> Instagram
              </label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@username atau URL"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:border-purple-500 outline-none font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-space">
                <Twitter className="w-3.5 h-3.5 text-sky-400" /> X / Twitter
              </label>
              <input
                type="text"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="@username atau URL"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:border-purple-500 outline-none font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-space">
                <Youtube className="w-3.5 h-3.5 text-rose-500" /> YouTube
              </label>
              <input
                type="text"
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                placeholder="@channel atau URL YouTube"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:border-purple-500 outline-none font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-space">
                <DiscordIcon className="w-3.5 h-3.5 text-indigo-400" /> Discord
              </label>
              <input
                type="text"
                value={discord}
                onChange={(e) => setDiscord(e.target.value)}
                placeholder="username#0000 atau server link"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:border-purple-500 outline-none font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-space">
                <Github className="w-3.5 h-3.5 text-slate-300" /> GitHub
              </label>
              <input
                type="text"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="username GitHub"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:border-purple-500 outline-none font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-space">
                <LinkIcon className="w-3.5 h-3.5 text-blue-400" /> LinkedIn
              </label>
              <input
                type="text"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="in/username atau profile URL"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:border-purple-500 outline-none font-mono"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-space">
                <TikTokIcon className="w-3.5 h-3.5 text-teal-400" /> TikTok
              </label>
              <input
                type="text"
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
                placeholder="@username TikTok"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:border-purple-500 outline-none font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: IDENTITY DETAILS */}
      {activeSection === "identity" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 animate-in fade-in duration-200">
          <div className="border-b border-slate-800 pb-3">
            <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
              E. Data Identitas & Verifikasi Akun
            </h4>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Informasi kontak dan metadata sistem. Visibilitas nomor HP disetel ke Private secara bawaan demi keamanan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold font-space text-slate-300 flex items-center justify-between">
                <span>Nomor HP / WhatsApp</span>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-900/60">
                  Default: Privat
                </span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+62 812-3456-7890"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-xs text-white focus:border-purple-500 outline-none font-mono"
                />
              </div>
              <p className="text-[10px] text-slate-500 font-sans">
                Nomor kontak tidak akan pernah ditampilkan ke publik kecuali Anda mengaktifkan opsi Publik di tab Privasi.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold font-space text-slate-300">
                Alamat Email Terdaftar
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full bg-slate-950/50 border border-slate-800/60 rounded-2xl pl-11 pr-4 py-3 text-xs text-slate-400 cursor-not-allowed font-mono"
                />
              </div>
              <p className="text-[10px] text-slate-500 font-sans">
                Email primer akun dilindungi oleh sistem otentikasi NightVerse.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Status Email:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">ID Pengguna Sistem:</span>
              <span className="text-slate-500 truncate max-w-[200px]">{user.id}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Tanggal Pendaftaran:</span>
              <span className="text-slate-300">
                {new Date(user.createdAt || Date.now()).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: PRIVACY & VISIBILITY CONTROLS (8 CONTROLS) */}
      {activeSection === "privacy" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 animate-in fade-in duration-200">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-mono font-bold text-rose-400 uppercase tracking-widest">
                F. Pengaturan Privasi & Visibilitas Publik
              </h4>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Kontrol independen untuk menentukan elemen apa saja yang boleh dilihat oleh pengunjung publik
              </p>
            </div>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>

          {/* Privacy Level Segmented Switch Helper */}
          <div className="space-y-3">
            {[
              {
                id: "showAvatar",
                title: "1. Foto Profil (Avatar)",
                description: "Jika privat, pengunjung akan melihat robot placeholder default tanpa foto Anda.",
                value: showAvatar,
                setter: setShowAvatar
              },
              {
                id: "showBanner",
                title: "2. Cover Banner Sampul",
                description: "Jika privat, banner sampul Anda diganti dengan gradasi warna standar platform.",
                value: showBanner,
                setter: setShowBanner
              },
              {
                id: "showInterests",
                title: "3. Daftar Minat & Kategori",
                description: "Tampilkan atau sembunyikan tag minat karya dari etalase pengunjung.",
                value: showInterests,
                setter: setShowInterests
              },
              {
                id: "showSocialLinks",
                title: "4. Tautan Sosial & Website",
                description: "Sembunyikan tautan eksternal (Instagram, X, YouTube, Discord, dll.) dari publik.",
                value: showSocialLinks,
                setter: setShowSocialLinks
              },
              {
                id: "showPhone",
                title: "5. Nomor HP / Kontak",
                description: "Secara default privat. Aktifkan hanya jika Anda ingin pengunjung menghubungi Anda secara langsung.",
                value: showPhone,
                setter: setShowPhone,
                defaultPrivate: true
              },
              {
                id: "showIdentity",
                title: "6. Data Identitas Lengkap (Email & Domisili)",
                description: "Sembunyikan alamat email dan domisili kota dari pandangan publik.",
                value: showIdentity,
                setter: setShowIdentity,
                defaultPrivate: true
              },
              {
                id: "showActivity",
                title: "7. Aliran Aktivitas & Karya Terbaru",
                description: "Kunci etalase artikel, foto, dan video publik sehingga hanya terlihat oleh Anda.",
                value: showActivity,
                setter: setShowActivity
              },
              {
                id: "showActivityStatus",
                title: "8. Status Keaktifan (Online Indicator)",
                description: "Tampilkan titik indikator hijau penanda keaktifan online di NightVerse.",
                value: showActivityStatus,
                setter: setShowActivityStatus
              }
            ].map((item) => (
              <div
                key={item.id}
                className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
              >
                <div className="space-y-0.5 max-w-md">
                  <div className="flex items-center gap-2">
                    <h5 className="text-xs font-bold font-space text-white">{item.title}</h5>
                    {item.defaultPrivate && (
                      <span className="text-[9px] font-mono text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-900/60">
                        Default Privat
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">{item.description}</p>
                </div>

                {/* Switcher Buttons */}
                <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800 shrink-0 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={() => item.setter("PUBLIC")}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      item.value === "PUBLIC"
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Globe className="w-3 h-3" />
                    <span>Publik</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => item.setter("PRIVATE")}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      item.value === "PRIVATE"
                        ? "bg-rose-600 text-white shadow-md shadow-rose-900/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Lock className="w-3 h-3" />
                    <span>Privat</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Persistent Form Actions Bar */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-4 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 z-20">
        <button
          type="button"
          onClick={handlePreview}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-slate-950 hover:bg-slate-800 border border-purple-500/40 text-purple-300 hover:text-white rounded-2xl text-xs font-black font-space uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-md shadow-purple-950/30"
        >
          <Eye className="w-4 h-4 text-purple-400" />
          <span>Preview Changes</span>
        </button>

        <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 sm:flex-none px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold font-space uppercase tracking-wider transition-all cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 sm:flex-none px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-xs font-black font-space uppercase tracking-wider transition-all shadow-lg shadow-purple-900/30 cursor-pointer active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
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
      </div>
    </form>
  );
};

/* =========================================================================
   3. BADGES PANEL
   ========================================================================= */
const BadgesPanel: React.FC = () => {
  const { user, setActiveBadge, dbActionCount } = useAppState();
  const [filter, setFilter] = useState<"all" | "earned" | "locked">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [allBadges, setAllBadges] = useState<BadgeDefinition[]>([]);
  const [userAwards, setUserAwards] = useState<UserBadgeAward[]>([]);

  // Real-time synchronization with centralized database
  useEffect(() => {
    if (!user) return;
    const badges = db.badges.getAll();
    const awards = db.badges.getAwards(user.id);
    setAllBadges(badges);
    setUserAwards(awards);
  }, [user, dbActionCount]);

  if (!user) return null;

  // Determine if a badge is unlocked/earned by the user
  const checkIsEarned = (badge: BadgeDefinition) => {
    const userBadges = user.profile?.badges || [];
    if (userBadges.some(b => b.toLowerCase() === badge.id.toLowerCase() || b.toLowerCase() === badge.name.toLowerCase())) {
      return true;
    }
    // Also consider role-based default badge if user holds the role
    if ((badge.id === "super-admin" || badge.name.toLowerCase() === "super admin") && user.role === "SUPER_ADMIN") return true;
    if ((badge.id === "administrator" || badge.name.toLowerCase() === "administrator") && (user.role === "ADMIN" || user.role === "SUPER_ADMIN")) return true;
    if ((badge.id === "moderator" || badge.name.toLowerCase() === "moderator") && user.role === "MODERATOR") return true;
    if (badge.id === "user" || badge.name.toLowerCase() === "user") return true;
    return false;
  };

  // Get earned date from awards log or user creation
  const getEarnedDate = (badge: BadgeDefinition) => {
    const award = userAwards.find(a => 
      a.badgeId.toLowerCase() === badge.id.toLowerCase() || 
      a.badgeName.toLowerCase() === badge.name.toLowerCase()
    );
    if (award) {
      return new Date(award.grantedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    if (user.createdAt) {
      return new Date(user.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    return "Akun Terverifikasi";
  };

  const currentActiveBadge = user.profile?.activeBadge || (user.role === "USER" ? "User" : user.role);

  // Group into Unlocked and Locked
  const earnedList = allBadges.filter(b => checkIsEarned(b));
  const lockedList = allBadges.filter(b => !checkIsEarned(b));

  // Search filter
  const matchesSearch = (b: BadgeDefinition) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return b.name.toLowerCase().includes(q) || 
           b.description.toLowerCase().includes(q) || 
           b.category.toLowerCase().includes(q);
  };

  const filteredEarned = earnedList.filter(matchesSearch);
  const filteredLocked = lockedList.filter(matchesSearch);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Stats Summary Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black font-space text-white">Status Koleksi Badge Profil</h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Anda telah mengantongi <strong className="text-amber-400 font-mono font-bold">{earnedList.length}</strong> dari <strong className="text-white font-mono font-bold">{allBadges.length}</strong> total badge dalam sistem NightVerse.
            </p>
          </div>
        </div>

        {/* Active Badge Display */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-3 shrink-0">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Active Signature:</span>
          <RoleBadge role={currentActiveBadge} size="sm" />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex p-1 bg-slate-900/60 border border-slate-800 rounded-2xl w-fit">
          {[
            { id: "all", label: `Semua (${allBadges.length})` },
            { id: "earned", label: `Diperoleh (${earnedList.length})` },
            { id: "locked", label: `Terkunci (${lockedList.length})` },
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

        {/* Search */}
        <div className="relative sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari badge atau kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-500 outline-none font-mono"
          />
        </div>
      </div>

      {/* SECTION A: UNLOCKED BADGES (Diperoleh Pengguna) */}
      {(filter === "all" || filter === "earned") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h4 className="font-space font-black text-sm text-white uppercase tracking-wider">
                A. Unlocked Badges ({filteredEarned.length})
              </h4>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-900/50 px-2.5 py-0.5 rounded-full">
              Status: Earned
            </span>
          </div>

          {filteredEarned.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/30 rounded-3xl border border-slate-800/50">
              <Award className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-sans">
                {searchQuery ? "Tidak ada badge diperoleh yang cocok dengan pencarian." : "Belum ada badge yang diperoleh."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEarned.map((badge) => {
                const isCurrentActive = currentActiveBadge.toLowerCase() === badge.id.toLowerCase() || 
                                       currentActiveBadge.toLowerCase() === badge.name.toLowerCase();

                return (
                  <div
                    key={badge.id}
                    className={`bg-slate-900/60 border rounded-3xl p-5 shadow-xl transition-all relative overflow-hidden flex flex-col justify-between gap-4 ${
                      isCurrentActive 
                        ? "border-purple-500/80 ring-2 ring-purple-500/20 bg-slate-900/80" 
                        : "border-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 shadow-lg">
                        <Sparkles className="w-6 h-6" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h5 className="text-sm font-black font-space text-white">{badge.name}</h5>
                          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-900/60 font-bold">
                            Tier {badge.tier}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800 uppercase font-bold">
                            {badge.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 font-sans leading-relaxed line-clamp-2">
                          {badge.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono">
                      <div className="text-slate-400 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-purple-400" />
                        <span>Diperoleh: {getEarnedDate(badge)}</span>
                      </div>

                      <button
                        onClick={() => {
                          setActiveBadge(badge.name);
                        }}
                        disabled={isCurrentActive}
                        className={`px-3 py-1.5 rounded-xl font-bold font-space text-xs transition-all cursor-pointer ${
                          isCurrentActive
                            ? "bg-purple-600/20 text-purple-300 border border-purple-500/40 cursor-default"
                            : "bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-900/30 active:scale-95"
                        }`}
                      >
                        {isCurrentActive ? "Active Profile" : "Pakai Badge"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION B: LOCKED BADGES */}
      {(filter === "all" || filter === "locked") && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600"></span>
              <h4 className="font-space font-black text-sm text-slate-400 uppercase tracking-wider">
                B. Locked Badges ({filteredLocked.length})
              </h4>
            </div>
            <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-950 border border-slate-800 px-2.5 py-0.5 rounded-full">
              Status: Locked
            </span>
          </div>

          {filteredLocked.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/30 rounded-3xl border border-slate-800/50">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-sans">
                {searchQuery ? "Tidak ada badge terkunci yang cocok." : "Luar biasa! Anda telah membuka seluruh badge yang tersedia."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLocked.map((badge) => (
                <div
                  key={badge.id}
                  className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-5 shadow-xl opacity-75 hover:opacity-100 transition-all flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                      <Lock className="w-6 h-6" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h5 className="text-sm font-bold font-space text-slate-300">{badge.name}</h5>
                        <span className="text-[9px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800 uppercase font-bold">
                          Tier {badge.tier}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-sans leading-relaxed line-clamp-2">
                        {badge.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800/60 text-left">
                    <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block mb-0.5">
                      Syarat Memperoleh:
                    </span>
                    <p className="text-xs text-slate-400 font-sans">
                      {badge.requirement || "Diberikan oleh Administrator atau melalui pencapaian komunitas."}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   3.5. HELP CENTER PANEL (With Ticket Center Integration)
   ========================================================================= */
interface HelpCenterPanelProps {
  onOpenDocs: () => void;
  onOpenFaq: () => void;
}

const HelpCenterPanel: React.FC<HelpCenterPanelProps> = ({ onOpenDocs, onOpenFaq }) => {
  const { user, triggerToast } = useAppState();
  const [supportCategory, setSupportCategory] = useState<TicketCategory>("Technical Issue");
  const [supportPriority, setSupportPriority] = useState<TicketPriority>("Medium");
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openTroubleshoot, setOpenTroubleshoot] = useState<number | null>(null);

  // Active Ticket Conversation Modal state
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyAttachment, setReplyAttachment] = useState("");
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>("ALL");

  const myTickets = useMemo(() => {
    if (!user) return [];
    let list = db.supportTickets.getByUser(user.id);
    if (ticketSearch) {
      const q = ticketSearch.toLowerCase();
      list = list.filter(t => t.subject.toLowerCase().includes(q) || t.ticketNumber.includes(q) || t.id.toLowerCase().includes(q));
    }
    if (ticketStatusFilter !== "ALL") {
      list = list.filter(t => t.status === ticketStatusFilter);
    }
    return list;
  }, [user, ticketSearch, ticketStatusFilter, db.supportTickets.getAll()]);

  const troubleShoots = [
    {
      q: "Animasi GIF tidak bergerak atau macet?",
      a: "Pastikan Anda mengunggah file asli dengan format .gif melalui formulir Create Work > tab Photo. NightVerse menerapkan kompresi bypass khusus untuk file GIF sehingga seluruh frame dan perulangan (looping) tetap dipertahankan."
    },
    {
      q: "Bagaimana cara menyembunyikan data nomor telepon dan email dari publik?",
      a: "Buka menu Edit Profile > tab Privasi & Visibilitas. Ubah saklar Nomor Telepon atau Email menjadi 'Privat'. Sistem Visitor View akan secara otomatis menyembunyikan informasi tersebut tanpa menampilkan tanda placeholder."
    },
    {
      q: "Mengapa video tidak diputar secara otomatis di feed atau lightbox?",
      a: "NightVerse menerapkan standar Non-Autoplay ketat demi kenyamanan pengguna dan efisiensi kuota. Video selalu dalam kondisi Pause saat dibuka. Tekan tombol Play besar di tengah video untuk memulai."
    },
    {
      q: "Apa maksud simbol tanda tanya (?) pada tag di Tags Directory?",
      a: "Simbol (?) menandakan status Ambiguous Tag, yaitu tag yang berpotensi memiliki arti ganda atau ambigu antar kategori (misalnya nama karakter yang identik dengan kata umum)."
    }
  ];

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!supportSubject.trim() || !supportMessage.trim()) {
      triggerToast("Validasi Gagal", "Silakan isi subjek dan rincian pesan bantuan.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = db.supportTickets.add({
        userId: user.id,
        username: user.username,
        subject: supportSubject.trim(),
        category: supportCategory,
        priority: supportPriority,
        description: supportMessage.trim(),
        attachmentUrl: attachmentUrl.trim() || undefined
      });

      triggerToast(
        "Tiket Bantuan Berhasil Dikirim! 🎫",
        `Tiket #${created.ticketNumber} (ID: ${created.id}) telah diterima oleh tim dukungan NightVerse.`,
        "success"
      );
      setSupportSubject("");
      setSupportMessage("");
      setAttachmentUrl("");
      setActiveTicket(created);
    } catch (err) {
      triggerToast("Gagal Mengirim", "Terjadi kesalahan saat menyimpan tiket.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !user || !replyMessage.trim()) return;

    db.supportTickets.addMessage(
      activeTicket.id,
      user.id,
      user.username,
      user.role,
      replyMessage.trim(),
      replyAttachment.trim() || undefined
    );

    setReplyMessage("");
    setReplyAttachment("");
    setActiveTicket(db.supportTickets.getById(activeTicket.id));
    triggerToast("Balasan Terkirim", "Pesan Anda telah ditambahkan ke riwayat tiket.", "success");
  };

  const handleReopenTicket = (ticketId: string) => {
    db.supportTickets.updateStatus(ticketId, "IN_PROGRESS");
    setActiveTicket(db.supportTickets.getById(ticketId));
    triggerToast("Tiket Dibuka Kembali", "Tiket telah diubah statusnya menjadi In Progress.", "success");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Help Center Hero Card */}
      <div className="p-6 bg-gradient-to-r from-rose-950/40 via-slate-900 to-purple-950/40 border border-slate-800 rounded-3xl relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-950/80 border border-rose-800 text-rose-300 font-mono text-[10px] uppercase font-bold rounded-full">
              <LifeBuoy className="w-3.5 h-3.5 text-rose-400" />
              Pusat Dukungan & Ticket Center
            </div>
            <h2 className="text-xl md:text-2xl font-black font-space text-white">
              Ada yang dapat kami bantu, @{user?.username}?
            </h2>
            <p className="text-xs text-slate-300 font-sans max-w-xl leading-relaxed">
              Kirimkan tiket bantuan, pantau status tiket secara real-time, atau jelajahi dokumentasi dan FAQ resmi NightVerse.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenDocs}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-xs font-bold font-space uppercase tracking-wider transition-all shadow-lg shadow-purple-950/40 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Buka Dokumentasi</span>
            </button>
            <button
              onClick={onOpenFaq}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-950 hover:bg-slate-850 text-cyan-300 rounded-2xl border border-cyan-800/60 text-xs font-bold font-space transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
              <span>FAQ Resmi</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Support Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={onOpenDocs}
          className="p-5 bg-slate-900/60 border border-slate-800 hover:border-purple-500/50 rounded-2xl space-y-2 cursor-pointer transition-all hover:-translate-y-0.5 group"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-950/60 border border-purple-800 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
            <BookOpen className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold font-space text-white group-hover:text-purple-300 transition-colors">
            Documentation Center
          </h3>
          <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
            Panduan 19 kategori fitur, sistem taksonomi, dan changelog resmi.
          </p>
        </div>

        <div 
          onClick={onOpenFaq}
          className="p-5 bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 rounded-2xl space-y-2 cursor-pointer transition-all hover:-translate-y-0.5 group"
        >
          <div className="w-9 h-9 rounded-xl bg-cyan-950/60 border border-cyan-800 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
            <HelpCircle className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold font-space text-white group-hover:text-cyan-300 transition-colors">
            FAQ & Tanya Jawab
          </h3>
          <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
            Solusi cepat untuk pertanyaan umum mengenai aturan dan leaderboard.
          </p>
        </div>

        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-800 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-xs font-bold font-space text-white">Status Sistem</h3>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
            Seluruh layanan API, IndexedDB, dan media server 100% online normal.
          </p>
        </div>

        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
          <div className="w-9 h-9 rounded-xl bg-amber-950/60 border border-amber-800 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold font-space text-white">Keamanan Akun</h3>
          <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
            Pengendalian privasi akun, enkripsi data, dan autentikasi peran.
          </p>
        </div>
      </div>

      {/* MY SUPPORT TICKETS SECTION */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-sm font-bold font-space text-white">Tiket Bantuan Saya (My Support Tickets)</h3>
              <p className="text-xs text-slate-400 font-sans">Kelola dan lacak status tiket dukungan yang pernah Anda buat.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Cari tiket..."
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 w-40 sm:w-48"
              />
            </div>
            <select
              value={ticketStatusFilter}
              onChange={(e) => setTicketStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-mono"
            >
              <option value="ALL">Semua Status</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_FOR_USER">Waiting for User</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>

        {myTickets.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs font-mono">
            Belum ada tiket bantuan yang dibuat. Gunakan formulir di bawah untuk mengirimkan tiket baru.
          </div>
        ) : (
          <div className="space-y-3">
            {myTickets.map(ticket => {
              const statusColors: Record<string, string> = {
                OPEN: "bg-blue-950/40 text-blue-400 border-blue-900/50",
                IN_PROGRESS: "bg-amber-950/40 text-amber-400 border-amber-900/50",
                WAITING_FOR_USER: "bg-purple-950/40 text-purple-400 border-purple-900/50",
                RESOLVED: "bg-emerald-950/40 text-emerald-400 border-emerald-900/50",
                CLOSED: "bg-slate-950 text-slate-400 border-slate-800"
              };
              const priorityColors: Record<string, string> = {
                Low: "text-slate-400 bg-slate-900",
                Medium: "text-blue-400 bg-blue-950/30",
                High: "text-amber-400 bg-amber-950/30",
                Urgent: "text-rose-400 bg-rose-950/30 animate-pulse"
              };
              return (
                <div 
                  key={ticket.id} 
                  onClick={() => setActiveTicket(ticket)}
                  className="p-4 bg-slate-950/80 border border-slate-800 hover:border-purple-500/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer transition-all hover:bg-slate-900/80"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-900">
                        #{ticket.id}
                      </span>
                      <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${statusColors[ticket.status] || "bg-slate-800 text-slate-300"}`}>
                        {ticket.status.replace(/_/g, " ")}
                      </span>
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${priorityColors[ticket.priority]}`}>
                        {ticket.priority} Priority
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(ticket.updatedAt).toLocaleString()}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold font-space text-white truncate">{ticket.subject}</h4>
                    <p className="text-xs text-slate-400 line-clamp-1">{ticket.description}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] font-mono text-slate-400">
                      Staff: {ticket.assignedStaffName || "Unassigned"}
                    </span>
                    <button className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold font-space transition-colors">
                      Buka Percakapan
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CONTACT SUPPORT TICKET FORM */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <FileText className="w-4 h-4 text-purple-400" />
          <div>
            <h3 className="text-sm font-bold font-space text-white">Kirim Tiket Bantuan Baru (Contact Support)</h3>
            <p className="text-xs text-slate-400 font-sans">
              Isi formulir di bawah untuk membuat tiket dukungan resmi. Tim kami akan segera merespons.
            </p>
          </div>
        </div>

        <form onSubmit={handleSupportSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Kategori Kendala</label>
              <select
                value={supportCategory}
                onChange={(e) => setSupportCategory(e.target.value as TicketCategory)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
              >
                <option value="Account">Account</option>
                <option value="Login">Login</option>
                <option value="Profile">Profile</option>
                <option value="Creator Dashboard">Creator Dashboard</option>
                <option value="Content">Content</option>
                <option value="Payment">Payment</option>
                <option value="Technical Issue">Technical Issue</option>
                <option value="Bug Report">Bug Report</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Prioritas (Priority)</label>
              <select
                value={supportPriority}
                onChange={(e) => setSupportPriority(e.target.value as TicketPriority)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Subjek Permasalahan *</label>
            <input
              type="text"
              required
              value={supportSubject}
              onChange={(e) => setSupportSubject(e.target.value)}
              placeholder="cth: Kendala saat mengunggah video berdurasi panjang di creator hub"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-sans"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Penjelasan Rinci / Deskripsi *</label>
            <textarea
              required
              rows={4}
              value={supportMessage}
              onChange={(e) => setSupportMessage(e.target.value)}
              placeholder="Jelaskan kronologi kendala, langkah yang telah dilakukan, atau pesan error yang muncul..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-sans"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Lampiran (Opsional URL Gambar/File)</label>
            <input
              type="url"
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
              placeholder="https://images.unsplash.com/... (atau tautan file pendukung)"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold font-space uppercase tracking-wider transition-all shadow-lg shadow-purple-950/40 cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? "Mengirim Tiket..." : "Submit Ticket"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* TICKET CONVERSATION MODAL */}
      <AnimatePresence>
        {activeTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-2xl border border-purple-500/30">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-purple-300">#{activeTicket.id}</span>
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-mono rounded uppercase font-bold">
                        {activeTicket.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold font-space text-white mt-0.5">{activeTicket.subject}</h3>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTicket(null)}
                  className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Ticket Details Bar */}
              <div className="px-5 py-3 bg-slate-950/50 border-b border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-400">
                <span>Kategori: <strong className="text-white">{activeTicket.category}</strong></span>
                <span>Prioritas: <strong className="text-white">{activeTicket.priority}</strong></span>
                <span>Staff Ditugaskan: <strong className="text-emerald-400">{activeTicket.assignedStaffName || "Belum Ditugaskan"}</strong></span>
                <span>Dibuat: <strong className="text-white">{new Date(activeTicket.createdAt).toLocaleString()}</strong></span>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                {db.supportTickets.getMessages(activeTicket.id).map((msg: TicketMessage) => {
                  const isUser = msg.senderRole === "USER";
                  return (
                    <div key={msg.id} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-[10px] font-mono font-bold text-slate-400">@{msg.senderName}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase ${isUser ? "bg-purple-950/60 text-purple-400 border border-purple-900" : "bg-emerald-950/60 text-emerald-400 border border-emerald-900"}`}>
                          {msg.senderRole}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                      </div>
                      
                      <div className={`max-w-xl p-4 rounded-2xl text-xs font-sans leading-relaxed ${
                        isUser 
                          ? "bg-purple-600/20 border border-purple-500/30 text-slate-200 rounded-tr-none" 
                          : "bg-slate-800 border border-slate-700 text-slate-100 rounded-tl-none"
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.message}</p>
                        {msg.attachmentUrl && (
                          <div className="mt-3 pt-2 border-t border-slate-700/50">
                            <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-purple-300 hover:underline text-[11px] font-mono">
                              <Paperclip className="w-3.5 h-3.5" />
                              <span>Lihat Lampiran File</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Footer / Reopen Bar */}
              <div className="p-4 border-t border-slate-800 bg-slate-950">
                {activeTicket.status === "RESOLVED" || activeTicket.status === "CLOSED" ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800">
                    <span className="text-xs text-slate-400 font-sans">
                      Tiket ini telah berstatus <strong>{activeTicket.status}</strong>. Jika kendala belum terselesaikan, Anda dapat membukanya kembali.
                    </span>
                    <button
                      onClick={() => handleReopenTicket(activeTicket.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold font-space uppercase cursor-pointer shrink-0"
                    >
                      Buka Kembali Tiket (Reopen)
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSendReply} className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Tulis balasan untuk tim dukungan..."
                        className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                      <button
                        type="submit"
                        disabled={!replyMessage.trim()}
                        className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold font-space uppercase transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                      >
                        <Send className="w-4 h-4" />
                        <span>Kirim</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* =========================================================================
   4. FAQ PANEL
   ========================================================================= */
const FAQPanel: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const faqs = [
    {
      category: "umum",
      question: "Apa itu platform NightVerse?",
      answer: "NightVerse adalah platform ekosistem kreatif dark-mode cyberpunk yang menggabungkan publikasi artikel mendalam, galeri foto resolusi tinggi, video reels/embed, serta kompetisi karya melalui leaderboard mingguan dan bulanan."
    },
    {
      category: "badge",
      question: "Bagaimana cara mendapatkan Badge profil?",
      answer: "Badge diberikan berdasarkan kontribusi aktif, engagement karya Anda di Leaderboard, serta penugasan wewenang oleh Super Admin atau Administrator platform. Anda dapat melihat persyaratan tiap badge di tab My Badge Center."
    },
    {
      category: "badge",
      question: "Apakah saya bisa memilih badge mana yang ditampilkan ke publik?",
      answer: "Ya! Pada menu Badge & Status, klik tombol 'Pakai Badge' pada badge yang telah Anda peroleh untuk menjadikannya sebagai Active Signature di samping nama profil Anda."
    },
    {
      category: "privasi",
      question: "Bagaimana cara menyembunyikan nomor telepon dan data identitas saya?",
      answer: "Buka menu Edit Profile > tab Privasi & Visibilitas. Di sana Anda dapat mengatur 8 saklar privasi mandiri, termasuk menyetel nomor HP dan data identitas ke status Privat. Secara bawaan, nomor telepon selalu diatur ke Privat demi perlindungan privasi Anda."
    },
    {
      category: "privasi",
      question: "Apa fungsi tombol Preview Profile?",
      answer: "Fitur Full Profile Preview memungkinkan Anda melihat simulasi halaman profil secara persis seperti yang dilihat oleh pengunjung publik. Anda juga dapat beralih ke 'My View' untuk melihat data apa saja yang disembunyikan."
    },
    {
      category: "konten",
      question: "Bagaimana sistem kurasi publikasi konten di NightVerse?",
      answer: "Tergantung pengaturan keamanan media, konten Anda mungkin akan langsung dipublikasikan secara otomatis atau ditinjau terlebih dahulu oleh tim kurator/moderator NightVerse sebelum tayang di feed publik."
    }
  ];

  const categories = [
    { id: "all", label: "Semua Kategori" },
    { id: "umum", label: "Umum" },
    { id: "badge", label: "Badge & Reputasi" },
    { id: "privasi", label: "Keamanan & Privasi" },
    { id: "konten", label: "Konten & Leaderboard" }
  ];

  const filteredFaqs = faqs.filter(f => selectedCategory === "all" || f.category === selectedCategory);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold font-space transition-all cursor-pointer ${
              selectedCategory === c.id
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-900/30"
                : "bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-xl transition-all"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-850/80 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 font-mono text-xs font-bold">
                    Q{idx + 1}
                  </div>
                  <span className="text-sm font-bold font-space text-white">{faq.question}</span>
                </div>
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-cyan-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-500 shrink-0" />
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
   5. ABOUT APP PANEL (Integrated with Documentation & Version v2.6.0)
   ========================================================================= */
interface AboutAppPanelProps {
  onOpenDocs: () => void;
}

const AboutAppPanel: React.FC<AboutAppPanelProps> = ({ onOpenDocs }) => {
  const { systemSettings } = useAppState();
  const [openModal, setOpenModal] = useState<"tos" | "privacy" | null>(null);

  const appTitle = systemSettings?.websiteName || systemSettings?.logoText || "NightVerse Platform";
  const logoUrl = systemSettings?.logoUrl;
  const logoTextAccent = systemSettings?.logoText?.substring(0, 2) || "NV";
  const latestRelease = DEFAULT_CHANGELOGS[0] || {
    versionNumber: "v2.7.0",
    releaseTitle: "Support Ticket System & High-Fidelity Video Engine",
    releaseDate: "2026-11-06",
    summary: "Integrasi Support Ticket System, Real Video Quality (H.264/AVC), dan Unified Creator Dashboard."
  };

  return (
    <div className="space-y-6">
      {/* App Main Specs & Version Integration */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 shadow-xl relative overflow-hidden text-center sm:text-left flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-500 p-0.5 shadow-2xl shrink-0">
          <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center overflow-hidden p-1.5">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={appTitle}
                className="w-full h-full object-contain rounded-[18px]"
              />
            ) : (
              <span className="font-space font-black text-2xl text-transparent bg-clip-text bg-gradient-to-tr from-purple-400 to-indigo-300">
                {logoTextAccent}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
            <h3 className="text-xl font-black font-space text-white">{appTitle}</h3>
            <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-400 text-[11px] font-mono font-bold rounded-full border border-purple-500/30">
              {latestRelease.versionNumber}
            </span>
          </div>
          <p className="text-xs text-slate-300 font-sans leading-relaxed mb-3">
            Ekosistem jejaring kreatif generasi terbaru yang terintegrasi penuh dengan Pusat Dokumentasi Resmi ({DEFAULT_DOC_CATEGORIES.length} Kategori Sistem), manajemen karya multimedia, dan kontrol sistem global.
          </p>
          <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
              Release: {latestRelease.releaseDate}
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-emerald-900/40 font-bold">
              Documentation: Fully Synchronized
            </span>
          </div>
        </div>
      </div>

      {/* Direct Documentation Center Integration Card */}
      <div className="bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-900/60 border border-purple-500/30 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="p-3.5 bg-purple-500/20 rounded-2xl border border-purple-500/40 text-purple-300 shrink-0">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h4 className="text-sm font-bold font-space text-white">Pusat Dokumentasi & Versi Resmi</h4>
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-[9px] font-mono font-bold rounded-md">
                {latestRelease.versionNumber} Active
              </span>
            </div>
            <p className="text-xs text-slate-300 font-sans mt-1">
              Akses panduan lengkap, changelog rilis, dan dokumentasi dari {DEFAULT_DOC_CATEGORIES.length} kategori sistem NightVerse.
            </p>
          </div>
        </div>
        <button
          onClick={onOpenDocs}
          className="px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold font-space shadow-lg shadow-purple-900/40 transition-all cursor-pointer active:scale-95 shrink-0 flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Buka Dokumentasi</span>
        </button>
      </div>

      {/* Latest Version Changelog Highlight */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            <h4 className="text-sm font-bold font-space text-white">Catatan Rilis Terbaru ({latestRelease.versionNumber})</h4>
          </div>
          <span className="text-[10px] font-mono text-slate-400">{latestRelease.releaseTitle}</span>
        </div>
        <p className="text-xs text-slate-300 font-sans leading-relaxed">
          {latestRelease.summary}
        </p>
        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-sans">
          <span>Total Kategori Dokumentasi: <strong>{DEFAULT_DOC_CATEGORIES.length} Kategori</strong></span>
          <button
            onClick={onOpenDocs}
            className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Lihat Semua Changelog</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Info Cards Grid: TOS & Privacy Policy */}
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
          © 2026 NightVerse Platform ({latestRelease.versionNumber}). All rights reserved.
        </p>
        <p className="text-[10px] font-sans text-slate-500">
          Terintegrasi langsung dengan Pusat Dokumentasi Resmi dan Sistem Manajemen Versi.
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
