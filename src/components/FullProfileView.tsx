import React, { useState, useEffect } from "react";
import { 
  User as UserIcon, 
  ChevronLeft, 
  Award, 
  ShieldCheck, 
  Shield, 
  CheckCircle2, 
  Lock, 
  Trophy, 
  Crown, 
  Globe, 
  Twitter, 
  Instagram, 
  Github, 
  Link as LinkIcon, 
  Sparkles, 
  FileText, 
  Share2, 
  Users, 
  Calendar, 
  Eye, 
  Phone, 
  Mail, 
  MapPin, 
  Tag, 
  ExternalLink, 
  Youtube, 
  Heart, 
  MessageCircle, 
  Briefcase, 
  Layers, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  UserPlus, 
  UserMinus, 
  AlertCircle, 
  Clock, 
  X,
  Check
} from "lucide-react";
import { useAppState } from "../context/AppState.js";
import { db } from "../lib/db.js";
import { motion, AnimatePresence } from "motion/react";
import { RoleBadge } from "./RoleBadge.js";
import { BadgeDefinition, User, PrivacyLevel } from "../types.js";

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

export interface FullProfileViewProps {
  userId?: string;
  userObject?: User;
  onBack?: () => void;
  backLabel?: string;
  isOwnerPreview?: boolean;
  stagedProfileData?: any;
  onApplyDraft?: () => void;
}

export const FullProfileView: React.FC<FullProfileViewProps> = ({
  userId,
  userObject,
  onBack,
  backLabel = "Back to Creator Directory",
  isOwnerPreview = false,
  stagedProfileData,
  onApplyDraft
}) => {
  const { user: currentUser, triggerToast, toggleFollow, followActionCount, dbActionCount, navigateTo } = useAppState();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<"visitor" | "owner">("visitor");
  const [activeTab, setActiveTab] = useState<"works" | "blogs" | "photos" | "videos">("works");
  const [selectedBadge, setSelectedBadge] = useState<BadgeDefinition | null>(null);
  const [showFollowersModal, setShowFollowersModal] = useState<"followers" | "following" | null>(null);

  // Load and sync target user data from database
  useEffect(() => {
    setIsLoading(true);

    if (stagedProfileData && userObject) {
      setProfileUser({
        ...userObject,
        username: stagedProfileData.username || userObject.username,
        profile: stagedProfileData
      });
      setIsLoading(false);
      return;
    }

    if (userObject) {
      setProfileUser(userObject);
      setIsLoading(false);
      return;
    }

    const targetId = userId || currentUser?.id;
    if (!targetId) {
      setProfileUser(null);
      setIsLoading(false);
      return;
    }

    const fetched = db.users.getById(targetId);
    setProfileUser(fetched || null);
    setIsLoading(false);
  }, [userId, userObject, stagedProfileData, currentUser?.id, dbActionCount]);

  // Sync follow state
  useEffect(() => {
    if (currentUser && profileUser && currentUser.id !== profileUser.id) {
      setIsFollowing(db.follows.isFollowing(currentUser.id, profileUser.id));
    }
  }, [currentUser, profileUser, followActionCount]);

  // Follow Toggle Handler
  const handleFollowToggle = async () => {
    if (!currentUser) {
      triggerToast("Autentikasi Dibutuhkan", "Silakan login terlebih dahulu untuk mengikuti kreator.", "info");
      return;
    }
    if (!profileUser || currentUser.id === profileUser.id) return;

    const newStatus = await toggleFollow(profileUser.id);
    setIsFollowing(newStatus);
    triggerToast(
      newStatus ? "Mengikuti Kreator! ✨" : "Berhenti Mengikuti",
      `Anda ${newStatus ? "sekarang mengikuti" : "tidak lagi mengikuti"} @${profileUser.username}.`,
      newStatus ? "success" : "info"
    );
  };

  // Direct Message Simulation
  const handleMessage = () => {
    if (!profileUser) return;
    triggerToast(
      "Saluran Pesan Terbuka 💬",
      `Menghubungkan ke saluran pesan privat bersama @${profileUser.username}...`,
      "info"
    );
  };

  // Share profile link
  const handleShare = () => {
    if (!profileUser) return;
    navigator.clipboard?.writeText(window.location.href);
    triggerToast(
      "Tautan Disalin! 🔗",
      `URL profil @${profileUser.username} berhasil disalin ke papan klip.`,
      "success"
    );
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse max-w-5xl mx-auto pb-16">
        <div className="h-14 bg-slate-900/60 rounded-3xl border border-slate-800 flex items-center px-6 justify-between">
          <div className="w-36 h-5 bg-slate-800 rounded-xl"></div>
          <div className="w-24 h-5 bg-slate-800 rounded-xl"></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
          <div className="h-56 bg-slate-950"></div>
          <div className="p-8 -mt-16 flex gap-6">
            <div className="w-32 h-32 rounded-3xl bg-slate-800 border-4 border-slate-900"></div>
            <div className="space-y-3 flex-1 pt-12">
              <div className="w-48 h-6 bg-slate-800 rounded-xl"></div>
              <div className="w-32 h-4 bg-slate-800/60 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not Found State
  if (!profileUser) {
    return (
      <div className="max-w-2xl mx-auto py-24 px-4 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto shadow-2xl">
          <AlertCircle className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black font-space text-white tracking-tight">
            Target Entity Not Found
          </h2>
          <p className="text-xs text-slate-400 font-sans max-w-md mx-auto leading-relaxed">
            Data kreator atau profil pengguna tidak ditemukan di dalam sistem NightVerse Registry. Akun mungkin telah dinonaktifkan atau ID tidak valid.
          </p>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-xs font-bold font-space uppercase tracking-wider transition-all shadow-lg shadow-purple-900/30 cursor-pointer active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{backLabel}</span>
          </button>
        )}
      </div>
    );
  }

  // Privacy evaluation
  const isOwner = Boolean(
    currentUser && (currentUser.id === profileUser.id || currentUser.role === "SUPER_ADMIN" || currentUser.role === "ADMIN")
  );

  // If inside Profile Settings simulation, previewMode controls the visitor simulation
  const isVisitor = isOwnerPreview ? previewMode === "visitor" : !isOwner;

  const profile = profileUser.profile || {};
  const privacy = profile.privacy || {
    profileVisible: true,
    showEmail: "PUBLIC",
    showPhone: "PRIVATE",
    showFullName: "PUBLIC",
    showAvatar: "PUBLIC",
    showBanner: "PUBLIC",
    showLocation: "PUBLIC",
    showSocialLinks: "PUBLIC",
    showInterests: "PUBLIC",
    showIdentity: "PRIVATE",
    showActivity: "PUBLIC",
    showActivityStatus: "PUBLIC",
    twoFactorEnabled: false
  };

  // Profile Restricted Check (if whole profile is set to hidden)
  if (privacy.profileVisible === false && !isOwner && !isOwnerPreview) {
    return (
      <div className="max-w-2xl mx-auto py-24 px-4 text-center space-y-6 animate-fadeIn">
        <div className="w-20 h-20 rounded-3xl bg-purple-950/30 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto shadow-2xl">
          <Lock className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black font-space text-white tracking-tight">
            Neural Vault Restricted
          </h2>
          <p className="text-xs text-slate-400 font-sans max-w-md mx-auto leading-relaxed">
            Kreator ini telah membatasi akses profil publik mereka. Anda tidak memiliki otorisasi privasi untuk menjelajahi profil ini.
          </p>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-bold font-space uppercase tracking-wider transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{backLabel}</span>
          </button>
        )}
      </div>
    );
  }

  // Visibility filters based on privacy settings
  const canSeeAvatar = !isVisitor || privacy.showAvatar !== "PRIVATE";
  const canSeeBanner = !isVisitor || privacy.showBanner !== "PRIVATE";
  const canSeeFullName = !isVisitor || privacy.showFullName !== "PRIVATE";
  const canSeeEmail = !isVisitor || privacy.showEmail !== "PRIVATE";
  const canSeePhone = !isVisitor || privacy.showPhone === "PUBLIC";
  const canSeeLocation = !isVisitor || privacy.showLocation !== "PRIVATE";
  const canSeeSocial = !isVisitor || privacy.showSocialLinks !== "PRIVATE";
  const canSeeInterests = !isVisitor || privacy.showInterests !== "PRIVATE";
  const canSeeIdentity = !isVisitor || privacy.showIdentity === "PUBLIC";
  const canSeeActivity = !isVisitor || privacy.showActivity !== "PRIVATE";
  const canSeeActivityStatus = !isVisitor || privacy.showActivityStatus !== "PRIVATE";

  // Badges logic - Only unlocked/earned badges are displayed on public profile
  const allBadges = db.badges.getAll();
  const userBadgeNames = profile.badges || [];

  const earnedBadges = allBadges.filter((b) => {
    if (userBadgeNames.some((ub) => ub.toLowerCase() === b.id.toLowerCase() || ub.toLowerCase() === b.name.toLowerCase())) {
      return true;
    }
    if ((b.id === "super-admin" || b.name.toLowerCase() === "super admin") && profileUser.role === "SUPER_ADMIN") return true;
    if ((b.id === "administrator" || b.name.toLowerCase() === "administrator") && (profileUser.role === "ADMIN" || profileUser.role === "SUPER_ADMIN")) return true;
    if ((b.id === "moderator" || b.name.toLowerCase() === "moderator") && profileUser.role === "MODERATOR") return true;
    if (b.id === "user" || b.name.toLowerCase() === "user") return true;
    return false;
  });

  // Query user contents (filtered by privacy and approved status for visitors)
  const allUserBlogs = db.blogs.getAll().filter((b) => b.userId === profileUser.id);
  const allUserPhotos = db.photos.getAll().filter((p) => p.userId === profileUser.id);
  const allUserVideos = db.videos.getAll().filter((v) => v.userId === profileUser.id);

  const filterPublicContent = (items: any[]) => {
    if (!isVisitor) return items;
    return items.filter((item) => {
      const isApproved = item.status === "APPROVED" || !item.status;
      const isPublic = item.visibility !== "private" && (item.visibility as any) !== "PRIVATE";
      return isApproved && isPublic;
    });
  };

  const userBlogs = filterPublicContent(allUserBlogs);
  const userPhotos = filterPublicContent(allUserPhotos);
  const userVideos = filterPublicContent(allUserVideos);
  const totalWorks = userBlogs.length + userPhotos.length + userVideos.length;

  // Real-time followers / following
  const followersIds = db.follows.getFollowers(profileUser.id);
  const followingIds = db.follows.getFollowing(profileUser.id);
  const followersList = followersIds.map((id) => db.users.getById(id)).filter(Boolean) as User[];
  const followingList = followingIds.map((id) => db.users.getById(id)).filter(Boolean) as User[];

  // Social links list
  const socialList = [
    { label: "Website", value: profile.website, icon: Globe, color: "text-purple-400", prefix: "" },
    { label: "Instagram", value: profile.instagram, icon: Instagram, color: "text-pink-400", prefix: "@" },
    { label: "X / Twitter", value: profile.twitter, icon: Twitter, color: "text-sky-400", prefix: "@" },
    { label: "YouTube", value: profile.youtube, icon: Youtube, color: "text-rose-500", prefix: "" },
    { label: "Discord", value: profile.discord, icon: DiscordIcon, color: "text-indigo-400", prefix: "" },
    { label: "GitHub", value: profile.github, icon: Github, color: "text-slate-300", prefix: "" },
    { label: "LinkedIn", value: profile.linkedin, icon: LinkIcon, color: "text-blue-400", prefix: "" },
    { label: "TikTok", value: profile.tiktok, icon: TikTokIcon, color: "text-teal-400", prefix: "@" }
  ].filter((s) => Boolean(s.value && s.value.trim() !== ""));

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto pb-16 px-4 md:px-0 select-none">
      {/* Top Navigation & Controls Toolbar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-4 z-30">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-950 hover:bg-slate-850 text-slate-300 hover:text-white rounded-2xl border border-slate-800 text-xs font-bold font-space transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{backLabel}</span>
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black font-space text-white uppercase tracking-wider">
                Full Profile
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-purple-950/60 text-purple-300 border border-purple-800/60">
                @{profileUser.username}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans hidden sm:block">
              {isOwner ? "Tampilan profil publik kreator Anda" : `Menjelajahi profil lengkap @${profileUser.username}`}
            </p>
          </div>
        </div>

        {/* View Mode Switcher if in Owner Simulation */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {isOwnerPreview && (
            <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-space">
              <button
                onClick={() => setPreviewMode("visitor")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  previewMode === "visitor"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Visitor View</span>
              </button>
              <button
                onClick={() => setPreviewMode("owner")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  previewMode === "owner"
                    ? "bg-slate-800 text-white shadow-md border border-slate-700"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>My View (Owner)</span>
              </button>
            </div>
          )}

          {stagedProfileData && onApplyDraft && (
            <button
              onClick={onApplyDraft}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black font-space uppercase tracking-wider transition-all shadow-lg shadow-emerald-900/30 cursor-pointer active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Simpan Sekarang</span>
            </button>
          )}

          <button
            onClick={handleShare}
            className="p-2.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-2xl transition-all cursor-pointer"
            title="Bagikan Tautan Profil"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Profile Canvas Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
        {/* Cover Banner Area */}
        <div className="h-44 sm:h-64 bg-slate-950 relative overflow-hidden group">
          {canSeeBanner && profile.bannerUrl ? (
            <img
              src={profile.bannerUrl}
              alt="Cover Banner"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center relative">
              <div className="absolute inset-0 bg-[radial-gradient(#8b5cf6_1px,transparent_1px)] [background-size:24px_24px] opacity-20"></div>
              <Sparkles className="w-8 h-8 text-purple-400/30 mb-2 animate-pulse" />
              <span className="text-[11px] font-mono font-bold text-slate-500 tracking-widest uppercase">
                {!canSeeBanner ? "Cover Banner Disembunyikan (Privat)" : "NightVerse Cyber Frontier"}
              </span>
            </div>
          )}

          {/* Privacy Tag in Owner Mode */}
          {!isVisitor && (
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-[9px] font-mono font-bold border backdrop-blur-md ${
                privacy.showBanner === "PRIVATE"
                  ? "bg-rose-950/80 text-rose-300 border-rose-500/40"
                  : "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
              }`}>
                Banner: {privacy.showBanner === "PRIVATE" ? "🔒 Privat" : "🌐 Publik"}
              </span>
            </div>
          )}
        </div>

        {/* Profile Identity Bar */}
        <div className="px-6 sm:px-8 pb-6 relative -mt-16 sm:-mt-20 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6 border-b border-slate-800/80">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
            {/* Avatar with Glow Ring */}
            <div className="relative group shrink-0">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl border-4 border-slate-900 bg-slate-950 overflow-hidden shadow-2xl relative">
                {canSeeAvatar ? (
                  <img
                    src={profile.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${profileUser.username}`}
                    alt={profileUser.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-slate-600">
                    <UserIcon className="w-12 h-12" />
                    <span className="text-[9px] font-mono mt-1 text-slate-500">Avatar Privat</span>
                  </div>
                )}
              </div>

              {/* Active Status Dot */}
              {canSeeActivityStatus && (
                <div
                  className="absolute bottom-2 right-2 w-5 h-5 bg-emerald-500 border-4 border-slate-900 rounded-full shadow-lg"
                  title="Online"
                />
              )}
            </div>

            {/* Names & Signature Badges */}
            <div className="space-y-1.5 pb-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-black font-space text-white tracking-tight">
                  {canSeeFullName ? (profile.fullName || profileUser.username) : profileUser.username}
                </h1>
                <RoleBadge role={profile.activeBadge || profileUser.role} size="sm" className="shadow-md" />
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs font-mono">
                <span className="text-purple-400 font-bold">@{profileUser.username}</span>
                {profile.occupation && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400 font-sans flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                      {profile.occupation}
                    </span>
                  </>
                )}
                {canSeeLocation && profile.location && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400 font-sans flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {profile.location}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Social Visitor Actions or Owner Quick Edit */}
          <div className="flex items-center gap-3 shrink-0">
            {currentUser && currentUser.id === profileUser.id ? (
              <button
                onClick={() => navigateTo("dashboard", "profile-settings")}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 rounded-2xl text-xs font-black font-space uppercase tracking-wider transition-all cursor-pointer"
              >
                <UserIcon className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleFollowToggle}
                  className={`flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-xs font-black font-space uppercase tracking-wider transition-all shadow-lg cursor-pointer active:scale-95 ${
                    isFollowing
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30 shadow-rose-950/30"
                      : "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/30"
                  }`}
                >
                  {isFollowing ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  <span>{isFollowing ? "Unfollow" : "Follow"}</span>
                </button>
                <button
                  onClick={handleMessage}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-xs font-bold font-space transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Message</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats Metrics Row */}
        <div className="px-6 sm:px-8 py-4 bg-slate-950/50 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6 sm:gap-10 text-center sm:text-left">
            <div>
              <span className="block text-lg font-black font-space text-white">{totalWorks}</span>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Karya Publik</span>
            </div>
            <button
              onClick={() => setShowFollowersModal("followers")}
              className="hover:opacity-80 transition-opacity cursor-pointer text-left"
            >
              <span className="block text-lg font-black font-space text-purple-400">{followersIds.length}</span>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Followers</span>
            </button>
            <button
              onClick={() => setShowFollowersModal("following")}
              className="hover:opacity-80 transition-opacity cursor-pointer text-left"
            >
              <span className="block text-lg font-black font-space text-cyan-400">{followingIds.length}</span>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Following</span>
            </button>
            <div>
              <span className="block text-lg font-black font-space text-amber-400">{earnedBadges.length}</span>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Badges</span>
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-500 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Bergabung {new Date(profileUser.createdAt || Date.now()).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
            </span>
          </div>
        </div>

        {/* Two Column Layout: Details & Content Stream */}
        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Bio, Interests, Identity, Social Links */}
          <div className="space-y-6">
            {/* Bio Box */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" />
                <span>Bio & Narasi Kreator</span>
              </h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">
                {profile.bio || "Kreator ini belum menuliskan deskripsi bio profil."}
              </p>
            </div>

            {/* Earned Badges Showcase */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-3.5 h-3.5" />
                  <span>Koleksi Badge ({earnedBadges.length})</span>
                </h3>
                <span className="text-[9px] font-mono text-slate-500">Klik info</span>
              </div>

              {earnedBadges.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {earnedBadges.map((badge) => (
                    <button
                      key={badge.id}
                      onClick={() => setSelectedBadge(badge)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 rounded-xl text-xs transition-all cursor-pointer group"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400 group-hover:scale-110 transition-transform" />
                      <span className="font-space font-bold text-white text-[11px]">{badge.name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 font-sans">Belum ada badge yang disematkan.</p>
              )}
            </div>

            {/* Interests / Tags */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Minat & Kategori</span>
                </h3>
                {!isVisitor && (
                  <span className={`text-[9px] font-mono font-bold ${
                    privacy.showInterests === "PRIVATE" ? "text-rose-400" : "text-emerald-400"
                  }`}>
                    {privacy.showInterests === "PRIVATE" ? "🔒 Privat" : "🌐 Publik"}
                  </span>
                )}
              </div>

              {canSeeInterests ? (
                profile.interests && profile.interests.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.interests.map((tag: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-cyan-950/40 text-cyan-300 border border-cyan-900/60 rounded-xl text-[10px] font-mono font-bold hover:bg-cyan-900/40 transition-colors"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 font-sans">Belum memilih topik minat.</p>
                )
              ) : (
                <p className="text-xs text-slate-500 font-sans italic flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-600" />
                  Daftar minat disetel ke privat oleh pemilik akun.
                </p>
              )}
            </div>

            {/* Social & External Links */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Tautan & Sosial</span>
                </h3>
                {!isVisitor && (
                  <span className={`text-[9px] font-mono font-bold ${
                    privacy.showSocialLinks === "PRIVATE" ? "text-rose-400" : "text-emerald-400"
                  }`}>
                    {privacy.showSocialLinks === "PRIVATE" ? "🔒 Privat" : "🌐 Publik"}
                  </span>
                )}
              </div>

              {canSeeSocial ? (
                socialList.length > 0 ? (
                  <div className="space-y-2">
                    {socialList.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon className={`w-4 h-4 ${item.color} shrink-0`} />
                            <span className="text-xs font-space font-bold text-slate-300 truncate">
                              {item.prefix}{item.value}
                            </span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 font-sans">Belum menyertakan tautan sosial.</p>
                )
              ) : (
                <p className="text-xs text-slate-500 font-sans italic flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-600" />
                  Tautan sosial disetel ke privat.
                </p>
              )}
            </div>

            {/* Identity & Verification Card */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Data Identitas & Verifikasi</span>
                </h3>
                {!isVisitor && (
                  <span className={`text-[9px] font-mono font-bold ${
                    privacy.showIdentity === "PUBLIC" ? "text-emerald-400" : "text-rose-400"
                  }`}>
                    {privacy.showIdentity === "PUBLIC" ? "🌐 Publik" : "🔒 Privat"}
                  </span>
                )}
              </div>

              <div className="space-y-2.5 text-xs font-sans">
                {/* Email */}
                {canSeeEmail ? (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> Email:
                    </span>
                    <span className="text-white font-mono text-[11px] truncate max-w-[160px]">{profileUser.email}</span>
                  </div>
                ) : !isVisitor ? (
                  <div className="flex items-center justify-between opacity-60">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" /> Email [Privat]:
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">{profileUser.email}</span>
                  </div>
                ) : null}

                {/* Phone Number */}
                {canSeePhone && profile.phoneNumber ? (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> Telepon:
                    </span>
                    <span className="text-white font-mono text-[11px]">{profile.phoneNumber}</span>
                  </div>
                ) : !isVisitor && profile.phoneNumber ? (
                  <div className="flex items-center justify-between opacity-60">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> Telepon [Privat]:
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">{profile.phoneNumber}</span>
                  </div>
                ) : null}

                {/* Location */}
                {canSeeLocation && profile.location && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> Lokasi:
                    </span>
                    <span className="text-white">{profile.location}</span>
                  </div>
                )}

                {/* Registration Date */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Terdaftar:
                  </span>
                  <span className="text-slate-300 font-mono text-[11px]">
                    {new Date(profileUser.createdAt || Date.now()).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Works & Activity Stream Tabs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Controls */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 overflow-x-auto">
                {[
                  { id: "works", label: `Semua Karya (${totalWorks})`, icon: Layers },
                  { id: "blogs", label: `Blogs (${userBlogs.length})`, icon: FileText },
                  { id: "photos", label: `Photos (${userPhotos.length})`, icon: ImageIcon },
                  { id: "videos", label: `Videos (${userVideos.length})`, icon: VideoIcon }
                ].map((t) => {
                  const Icon = t.icon;
                  const isActive = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id as any)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold font-space transition-all cursor-pointer whitespace-nowrap ${
                        isActive
                          ? "bg-purple-600 text-white shadow-md shadow-purple-900/30"
                          : "text-slate-400 hover:text-white hover:bg-slate-850"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {!isVisitor && (
                <span className={`text-[9px] font-mono font-bold ${
                  privacy.showActivity === "PRIVATE" ? "text-rose-400" : "text-emerald-400"
                }`}>
                  Activity: {privacy.showActivity === "PRIVATE" ? "🔒 Privat" : "🌐 Publik"}
                </span>
              )}
            </div>

            {/* Activity Stream View */}
            {!canSeeActivity ? (
              <div className="bg-slate-950/60 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
                <Lock className="w-10 h-10 text-purple-400/40 mx-auto" />
                <h4 className="text-base font-black font-space text-white">Private Activity Vault</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto font-sans leading-relaxed">
                  Pengguna ini membatasi visibilitas aktivitas dan konten publik mereka kepada umum.
                </p>
              </div>
            ) : totalWorks === 0 ? (
              <div className="bg-slate-950/60 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
                <Sparkles className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-base font-black font-space text-white">Belum Ada Karya</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto font-sans">
                  Karya publik yang dibagikan oleh kreator ini akan muncul di etalase profil.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Render Blogs */}
                {(activeTab === "works" || activeTab === "blogs") &&
                  userBlogs.map((b) => (
                    <div
                      key={b.id}
                      className="bg-slate-950/80 border border-slate-800/80 hover:border-purple-500/50 rounded-2xl overflow-hidden p-4 space-y-3 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 bg-purple-950/60 text-purple-300 text-[10px] font-mono font-bold rounded-lg border border-purple-800/60">
                          Article
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(b.createdAt).toLocaleDateString("id-ID", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold font-space text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                        {b.title}
                      </h4>
                      <p className="text-xs text-slate-400 font-sans line-clamp-2">
                        {b.content?.slice(0, 100)}
                      </p>
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-800/60">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-slate-400" /> {b.views || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5 text-rose-400" /> {b.likesCount || 0}
                        </span>
                      </div>
                    </div>
                  ))}

                {/* Render Photos */}
                {(activeTab === "works" || activeTab === "photos") &&
                  userPhotos.map((p) => (
                    <div
                      key={p.id}
                      className="bg-slate-950/80 border border-slate-800/80 hover:border-emerald-500/50 rounded-2xl overflow-hidden transition-all group"
                    >
                      <div className="h-36 bg-slate-900 overflow-hidden relative">
                        <img
                          src={p.url}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-slate-950/80 backdrop-blur-md rounded-lg text-[9px] font-mono text-emerald-400 font-bold border border-emerald-900/60">
                          Photo
                        </div>
                      </div>
                      <div className="p-3.5 space-y-1.5">
                        <h4 className="text-xs font-bold font-space text-white group-hover:text-emerald-300 transition-colors truncate">
                          {p.title}
                        </h4>
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                          <span>{p.likesCount || 0} Likes</span>
                          <span>{new Date(p.createdAt).toLocaleDateString("id-ID", { month: "short", day: "numeric" })}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                {/* Render Videos */}
                {(activeTab === "works" || activeTab === "videos") &&
                  userVideos.map((v) => (
                    <div
                      key={v.id}
                      className="bg-slate-950/80 border border-slate-800/80 hover:border-cyan-500/50 rounded-2xl overflow-hidden transition-all group"
                    >
                      <div className="h-36 bg-slate-900 overflow-hidden relative">
                        <img
                          src={v.thumbnailUrl || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80"}
                          alt={v.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 to-transparent flex items-end p-2.5">
                          <span className="text-[10px] font-mono text-cyan-300 font-bold">
                            Duration: {v.duration || "0:30"}
                          </span>
                        </div>
                      </div>
                      <div className="p-3.5 space-y-1.5">
                        <h4 className="text-xs font-bold font-space text-white group-hover:text-cyan-300 transition-colors truncate">
                          {v.title}
                        </h4>
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                          <span>{v.views || 0} Views</span>
                          <span>{new Date(v.createdAt).toLocaleDateString("id-ID", { month: "short", day: "numeric" })}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Badge Detail Modal */}
      <AnimatePresence>
        {selectedBadge && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                <Trophy className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-900/60 uppercase">
                  Tier {selectedBadge.tier} • {selectedBadge.category}
                </span>
                <h3 className="text-lg font-black font-space text-white mt-2">{selectedBadge.name}</h3>
                <p className="text-xs text-slate-300 font-sans mt-1 leading-relaxed">
                  {selectedBadge.description}
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 text-left space-y-1">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                  Persyaratan Unlock:
                </span>
                <p className="text-xs text-slate-400 font-sans">{selectedBadge.requirement}</p>
              </div>

              <button
                onClick={() => setSelectedBadge(null)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-bold font-space uppercase transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Followers/Following Modal */}
      <AnimatePresence>
        {showFollowersModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-black font-space text-white uppercase tracking-wider">
                  {showFollowersModal === "followers" ? "Daftar Followers" : "Daftar Following"}
                </h3>
                <button
                  onClick={() => setShowFollowersModal(null)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {(showFollowersModal === "followers" ? followersList : followingList).length > 0 ? (
                  (showFollowersModal === "followers" ? followersList : followingList).map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={f.profile?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${f.username}`}
                          alt={f.username}
                          className="w-9 h-9 rounded-full object-cover border border-slate-700"
                        />
                        <div>
                          <h4 className="text-xs font-bold font-space text-white">
                            {f.profile?.fullName || f.username}
                          </h4>
                          <span className="text-[10px] font-mono text-purple-400">@{f.username}</span>
                        </div>
                      </div>
                      <RoleBadge role={f.profile?.activeBadge || f.role} size="sm" />
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-8 font-sans">
                    Belum ada koneksi pengguna pada daftar ini.
                  </p>
                )}
              </div>

              <button
                onClick={() => setShowFollowersModal(null)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-bold font-space uppercase transition-colors cursor-pointer"
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
export default FullProfileView;
