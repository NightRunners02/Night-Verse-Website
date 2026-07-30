import React, { useState, useEffect } from "react";
import { 
  User as UserIcon, 
  Mail, 
  Shield, 
  Clock, 
  Briefcase, 
  MapPin, 
  Link as LinkIcon, 
  Globe, 
  Instagram, 
  Twitter, 
  Github, 
  CheckCircle, 
  AlertCircle, 
  Edit3, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Activity, 
  Tags,
  Lock,
  Eye,
  Key,
  UserPlus,
  UserMinus,
  MessageCircle,
  Users,
  Sparkles,
  BookOpen
} from "lucide-react";
import { db } from "../lib/db.js";
import { useAppState } from "../context/AppState.js";
import { motion } from "motion/react";
import { User } from "../types.js";
import { RoleBadge } from "./RoleBadge.js";

interface ProfileOverviewProps {
  onEditClick?: () => void;
}

const ProfileOverview: React.FC<ProfileOverviewProps> = ({ onEditClick }) => {
  const { user, targetUserId, navigateTo, triggerToast, createNotification, followActionCount, toggleFollow } = useAppState();
  const [displayedUser, setDisplayedUser] = useState<User | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [stats, setStats] = useState({
    blogs: 0,
    photos: 0,
    videos: 0,
    followers: 0,
    following: 0
  });
  const [activities, setActivities] = useState<any[]>([]);
  const [frequentTags, setFrequentTags] = useState<string[]>([]);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  // Modal State
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [userList, setUserList] = useState<User[]>([]);
  const [listTitle, setListTitle] = useState("");

  useEffect(() => {
    // Determine which user to display
    const userIdToFetch = targetUserId || user?.id;
    if (!userIdToFetch) return;

    const foundUser = db.users.getById(userIdToFetch);
    if (foundUser) {
      setDisplayedUser(foundUser);
      
      // Check following status
      if (user && user.id !== foundUser.id) {
        setIsFollowing(db.follows.isFollowing(user.id, foundUser.id));
      }

      // Load stats
      const blogs = db.blogs.getAll().filter(b => b.userId === foundUser.id).length;
      const photos = db.photos.getAll().filter(p => p.userId === foundUser.id).length;
      const videos = db.videos.getAll().filter(v => v.userId === foundUser.id).length;
      const followers = db.follows.getFollowers(foundUser.id).length;
      const following = db.follows.getFollowing(foundUser.id).length;

      setStats({ blogs, photos, videos, followers, following });

      // ... existing activities and tag logic
      const allContent = [
        ...db.blogs.getAll().filter(b => b.userId === foundUser.id).map(i => ({ ...i, type: 'blog' })),
        ...db.photos.getAll().filter(p => p.userId === foundUser.id).map(i => ({ ...i, type: 'photo' })),
        ...db.videos.getAll().filter(v => v.userId === foundUser.id).map(i => ({ ...i, type: 'video' }))
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setActivities(allContent.slice(0, 5));

      const tags = allContent.flatMap(c => c.tags || []);
      const tagCounts = tags.reduce((acc: any, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {});
      const sortedTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]);
      setFrequentTags(sortedTags.slice(0, 6));

      let fCount = 0;
      let completed = 0;
      const profileData = {
        name: foundUser.profile?.fullName || foundUser.username,
        bio: foundUser.profile?.bio,
        location: foundUser.profile?.location,
        website: foundUser.profile?.website,
        github: foundUser.profile?.github,
        linkedin: foundUser.profile?.linkedin,
        tiktok: foundUser.profile?.tiktok,
        facebook: foundUser.profile?.facebook,
        twitter: foundUser.profile?.twitter,
        instagram: foundUser.profile?.instagram,
        interests: foundUser.profile?.interests?.length ? "yes" : ""
      };
      
      Object.values(profileData).forEach(val => {
        fCount++;
        if (val && typeof val === 'string' && val.trim() !== "") completed++;
      });
      setCompletionPercentage(Math.round((completed / fCount) * 100));
    }
  }, [user, targetUserId, followActionCount]);

  const handleFollowToggle = async () => {
    if (!user || !displayedUser || user.id === displayedUser.id) return;

    const newStatus = await toggleFollow(displayedUser.id);
    setIsFollowing(newStatus);

    triggerToast(
      newStatus ? "Following User" : "Unfollowed User", 
      `You are ${newStatus ? 'now' : 'no longer'} following ${displayedUser.username}.`,
      newStatus ? "success" : "info"
    );
  };

  const handleShowList = (type: 'followers' | 'following') => {
    if (!displayedUser) return;
    const ids = type === 'followers' 
      ? db.follows.getFollowers(displayedUser.id)
      : db.follows.getFollowing(displayedUser.id);
    
    const users = ids.map(id => db.users.getById(id)).filter(Boolean) as User[];
    setUserList(users);
    setListTitle(type === 'followers' ? "Neural Followers" : "Bridge Following");
    if (type === 'followers') setShowFollowers(true);
    else setShowFollowing(true);
  };

  const handleMessageUser = () => {
    if (!displayedUser) return;
    triggerToast("Neural Comms Initialized", "Secure messaging channel is being established...", "info");
  };

  if (!displayedUser) return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
      <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
      <p>Target entity not found in global registry.</p>
    </div>
  );

  const isOwnProfile = user?.id === displayedUser.id;
  
  // Visibility helpers
  const canSee = (level: any) => {
    if (isOwnProfile) return true;
    if (!level || level === "PUBLIC") return true;
    if (level === "PRIVATE") return isFollowing;
    if (level === "ONLY_ME") return false;
    return true;
  };

  const isPrivate = !isOwnProfile && displayedUser.profile?.privacy?.profileVisible === false;

  if (isPrivate) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-500 bg-slate-900/50 border border-slate-800 rounded-3xl animate-fadeIn">
        <Lock className="w-16 h-16 mb-4 text-purple-500/40" />
        <h2 className="text-xl font-bold text-white mb-2 font-space uppercase tracking-widest">Neural Vault Locked</h2>
        <p className="text-sm max-w-xs text-center opacity-60">
          This creator has restricted public discovery. You are not authorized to view this blueprint.
        </p>
        <button onClick={() => navigateTo('dashboard', 'explore')} className="mt-8 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all">
          Return to Explore
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-8 pb-12">
      {/* Header Profile Section */}
      <div className="relative rounded-2xl md:rounded-3xl overflow-hidden bg-slate-900 border border-slate-800">
        <div className="h-24 md:h-48 bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-slate-900 overflow-hidden">
          {displayedUser.profile?.bannerUrl && (
            <img src={displayedUser.profile.bannerUrl || undefined} className="w-full h-full object-cover opacity-50" alt="banner" />
          )}
        </div>
        <div className="px-4 md:px-8 pb-4 md:pb-8 -mt-10 md:-mt-16 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-3 md:gap-6">
            <div className="relative group">
              <div className="w-20 h-20 md:w-32 md:h-32 rounded-2xl md:rounded-3xl bg-slate-800 border-[3px] md:border-4 border-slate-950 overflow-hidden shadow-2xl flex items-center justify-center">
                {displayedUser.profile?.avatarUrl && canSee(displayedUser.profile?.privacy?.showAvatar) ? (
                  <img src={displayedUser.profile.avatarUrl || undefined} alt={displayedUser.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon className="w-10 h-10 md:w-16 md:h-16 text-slate-600" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 w-6 h-6 md:w-8 md:h-8 bg-emerald-500 border-[3px] md:border-4 border-slate-950 rounded-full"></div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-center md:justify-start gap-1.5 mb-0.5 md:mb-1">
                <h1 className="text-xl md:text-4xl font-black font-space tracking-tight text-white">
                  {canSee(displayedUser.profile?.privacy?.showFullName) ? (displayedUser.profile?.fullName || displayedUser.username) : displayedUser.username}
                </h1>
                <RoleBadge role={displayedUser.profile?.activeBadge || displayedUser.role} size="sm" className="py-1 px-3" />
              </div>
              {canSee(displayedUser.profile?.privacy?.showEmail) && (
                <p className="text-slate-400 text-xs md:text-base font-medium mb-1 md:mb-2">
                  {displayedUser.email}
                </p>
              )}
              {!canSee(displayedUser.profile?.privacy?.showEmail) && !isOwnProfile && (
                <p className="text-slate-400 text-xs md:text-base font-medium mb-1 md:mb-2">
                  @{displayedUser.username}
                </p>
              )}
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 md:gap-3 text-[10px] md:text-sm text-slate-500">
                {canSee(displayedUser.profile?.privacy?.showLocation) && (
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3 md:w-3.5 h-3.5" /> {displayedUser.profile?.location || "Global Frontier"}</span>
                )}
                <span className="flex items-center gap-1"><Clock className="w-3 h-3 md:w-3.5 h-3.5" /> Logged {new Date().toLocaleTimeString()}</span>
                <span className="flex items-center gap-1 text-emerald-400"><CheckCircle className="w-3 h-3 md:w-3.5 h-3.5" /> Verified Profile</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 md:gap-3 w-full md:w-auto">
            {isOwnProfile ? (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onEditClick ? onEditClick() : navigateTo("dashboard", "profile")}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-4 md:px-6 py-2 md:py-2.5 bg-white text-slate-950 rounded-xl font-bold text-[11px] md:text-sm hover:bg-slate-200 transition-all font-space"
              >
                <Edit3 className="w-3.5 h-3.5 md:w-4 h-4" /> Edit Full Profile
              </motion.button>
            ) : (
              <>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleMessageUser}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-slate-800 text-white rounded-xl font-bold text-[11px] md:text-sm hover:bg-slate-700 transition-all font-space"
                >
                  <MessageCircle className="w-3.5 h-3.5 md:w-4 h-4" /> Message
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleFollowToggle}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-xl font-bold text-[11px] md:text-sm transition-all font-space ${
                    isFollowing 
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-500'
                  }`}
                >
                  {isFollowing ? <UserMinus className="w-3.5 h-3.5 md:w-4 h-4" /> : <UserPlus className="w-3.5 h-3.5 md:w-4 h-4" />}
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </motion.button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        {/* Left Column: Metrics & Info */}
        <div className="lg:col-span-2 space-y-4 md:space-y-8">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4">
            <div className="p-3 md:p-4 bg-slate-900/50 border border-slate-800 rounded-xl md:rounded-2xl hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <span className="text-[8px] md:text-[10px] font-mono text-slate-500 uppercase tracking-wider">Blogs</span>
                <FileText className="w-3 h-3 md:w-4 h-4 text-purple-400" />
              </div>
              <div className="text-lg md:text-2xl font-black font-space text-white">{stats.blogs}</div>
            </div>
            <div className="p-3 md:p-4 bg-slate-900/50 border border-slate-800 rounded-xl md:rounded-2xl hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <span className="text-[8px] md:text-[10px] font-mono text-slate-500 uppercase tracking-wider">Photos</span>
                <ImageIcon className="w-3 h-3 md:w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-lg md:text-2xl font-black font-space text-white">{stats.photos}</div>
            </div>
            <div className="p-3 md:p-4 bg-slate-900/50 border border-slate-800 rounded-xl md:rounded-2xl hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <span className="text-[8px] md:text-[10px] font-mono text-slate-500 uppercase tracking-wider">Videos</span>
                <Video className="w-3 h-3 md:w-4 h-4 text-blue-400" />
              </div>
              <div className="text-lg md:text-2xl font-black font-space text-white">{stats.videos}</div>
            </div>
            
            <button 
              onClick={() => handleShowList('followers')}
              className="p-3 md:p-4 bg-slate-900/50 border border-slate-800 rounded-xl md:rounded-2xl hover:border-purple-500/50 hover:bg-slate-900 transition-all text-left group"
            >
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <span className="text-[8px] md:text-[10px] font-mono text-slate-500 group-hover:text-purple-400 uppercase tracking-wider">Followers</span>
                <UserPlus className="w-3 h-3 md:w-4 h-4 text-purple-400" />
              </div>
              <div className="text-lg md:text-2xl font-black font-space text-white group-hover:scale-110 transition-transform origin-left">{stats.followers}</div>
            </button>
            
            <button 
              onClick={() => handleShowList('following')}
              className="p-3 md:p-4 bg-slate-900/50 border border-slate-800 rounded-xl md:rounded-2xl hover:border-indigo-500/50 hover:bg-slate-900 transition-all text-left group"
            >
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <span className="text-[8px] md:text-[10px] font-mono text-slate-500 group-hover:text-indigo-400 uppercase tracking-wider">Following</span>
                <Users className="w-3 h-3 md:w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-lg md:text-2xl font-black font-space text-white group-hover:scale-110 transition-transform origin-left">{stats.following}</div>
            </button>
          </div>

          {/* Detailed Info Card */}
          <div className="p-5 md:p-8 bg-slate-900/50 border border-slate-800 rounded-2xl md:rounded-3xl">
            <div className="flex items-center gap-2 mb-4 md:mb-6">
              <div className="p-1.5 md:p-2 bg-purple-500/10 rounded-lg">
                <Briefcase className="w-4 h-4 md:w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-sm md:text-lg font-black font-space text-white">Identity Details</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              <div className="space-y-4 md:space-y-6">
                <div>
                  <label className="block text-[8px] md:text-[10px] font-mono text-slate-500 uppercase mb-1">Biography</label>
                  <p className="text-slate-300 text-[11px] md:text-sm leading-relaxed">
                    {displayedUser.profile?.bio || "No biography provided. Share your story with the multiverse."}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 md:gap-4">
                  <div>
                    <label className="block text-[8px] md:text-[10px] font-mono text-slate-500 uppercase mb-0.5 md:mb-1">Occupation</label>
                    <p className="text-white text-[11px] md:text-sm font-medium">{displayedUser.profile?.occupation || "Independent Creator"}</p>
                  </div>
                  <div>
                    <label className="block text-[8px] md:text-[10px] font-mono text-slate-500 uppercase mb-0.5 md:mb-1">Gender</label>
                    <p className="text-white text-[11px] md:text-sm font-medium">{displayedUser.profile?.gender || "Unspecified"}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-1 gap-2 md:gap-4">
                <div className="flex items-center justify-between p-2 md:p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="flex items-center gap-2 md:gap-3">
                    <Globe className="w-3.5 h-3.5 md:w-4 h-4 text-slate-400" />
                    <span className="text-[9px] md:text-sm text-slate-300">Website</span>
                  </div>
                  <span className="text-[9px] md:text-xs font-mono text-purple-400 truncate max-w-[60px] md:max-w-[150px]">{displayedUser.profile?.website || "not set"}</span>
                </div>
                <div className="flex items-center justify-between p-2 md:p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="flex items-center gap-2 md:gap-3">
                    <Twitter className="w-3.5 h-3.5 md:w-4 h-4 text-slate-400" />
                    <span className="text-[9px] md:text-sm text-slate-300">Twitter</span>
                  </div>
                  <span className="text-[9px] md:text-xs font-mono text-purple-400 truncate max-w-[60px]">@{displayedUser.profile?.twitter || "none"}</span>
                </div>
                <div className="flex items-center justify-between p-2 md:p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="flex items-center gap-2 md:gap-3">
                    <Instagram className="w-3.5 h-3.5 md:w-4 h-4 text-slate-400" />
                    <span className="text-[9px] md:text-sm text-slate-300">Instagram</span>
                  </div>
                  <span className="text-[9px] md:text-xs font-mono text-purple-400 truncate max-w-[60px]">@{displayedUser.profile?.instagram || "none"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          {canSee(displayedUser.profile?.privacy?.showActivity) && (
            <div className="p-6 md:p-8 bg-slate-900/50 border border-slate-800 rounded-3xl">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Activity className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-black font-space text-white">Activity Stream</h3>
                </div>
                <button className="text-xs font-mono text-slate-500 hover:text-white transition-colors uppercase">Chronology</button>
              </div>

              <div className="space-y-6 relative ml-4">
                <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-800 -ml-4"></div>
                
                {activities.length > 0 ? (
                  activities.map((item, idx) => (
                    <div key={idx} className="relative pl-6">
                      <div className="absolute left-0 top-1.5 w-2.5 h-2.5 bg-slate-950 border-2 border-emerald-500 rounded-full -ml-[21px] z-10"></div>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                          <p className="text-sm text-slate-200">
                            Published a <span className="text-white font-bold">{item.type}</span>: 
                            <span className="text-slate-400 italic ml-1">"{item.title}"</span>
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${item.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                              {item.status}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-600 uppercase whitespace-nowrap">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-slate-500 text-sm italic">
                    No recent activities recorded in the system.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Cards & Progress */}
        <div className="space-y-6">
          {/* Completion Progress Card */}
          <div className="p-6 bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-900/30 rounded-3xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold">Profile Integrity</span>
                <span className="text-xl font-black font-space text-white">{completionPercentage}%</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden mb-6">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercentage}%` }}
                  className="h-full bg-indigo-500"
                />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {completionPercentage === 100 
                  ? "Identity parameters are fully synchronized with the global index."
                  : "Additional links and biography would optimize neural visibility."}
              </p>
            </div>
          </div>

          {/* Security Overview */}
          <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-3xl">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-rose-500/10 rounded-lg">
                <Shield className="w-4 h-4 text-rose-400" />
              </div>
              <h3 className="text-sm font-black font-space text-white uppercase tracking-wider">Registry State</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Key className="w-4 h-4 text-slate-500" />
                  <span className="text-xs text-slate-300 font-medium">Clearance</span>
                </div>
                <RoleBadge role={displayedUser.role} size="xs" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lock className="w-4 h-4 text-slate-500" />
                  <span className="text-xs text-slate-300 font-medium">Status</span>
                </div>
                <span className={`text-[10px] font-mono ${displayedUser.isSuspended ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {displayedUser.isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Eye className="w-4 h-4 text-slate-500" />
                  <span className="text-xs text-slate-300 font-medium">Visibility</span>
                </div>
                <span className={`text-[10px] font-mono ${displayedUser.profile?.privacy?.profileVisible === false ? 'text-rose-400' : 'text-indigo-400'}`}>
                  {displayedUser.profile?.privacy?.profileVisible === false ? 'PRIVATE VAULT' : 'PUBLIC LISTED'}
                </span>
              </div>
              {canSee(displayedUser.profile?.privacy?.showPhone) && displayedUser.profile?.phoneNumber && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[8px] font-bold text-slate-500 uppercase">Contact</span>
                    <span className="text-xs text-slate-300 font-medium">Registry</span>
                  </div>
                  <span className="text-[10px] font-mono text-purple-400">{displayedUser.profile.phoneNumber}</span>
                </div>
              )}
              <div className="pt-2">
                <span className="text-[9px] font-mono text-slate-600 uppercase block mb-1">Unique Profile ID</span>
                <code className="text-[9px] bg-slate-950 px-2 py-1 rounded border border-slate-900 text-slate-500 font-mono block truncate">
                  {window.location.origin}/profile/{displayedUser.id}
                </code>
              </div>
            </div>
            
            {isOwnProfile && (
              <div className="mt-8 pt-6 border-t border-slate-800">
                <button className="w-full py-2.5 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl text-xs font-bold font-mono hover:bg-slate-900 transition-all">
                  MANAGE SECURITY
                </button>
              </div>
            )}
          </div>

          {/* Interests & Badges Showcase */}
          <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-3xl">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Tags className="w-4 h-4 text-blue-400" />
              </div>
              <h3 className="text-sm font-black font-space text-white uppercase tracking-wider">Interest Vectors</h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {(displayedUser.profile?.interests && displayedUser.profile.interests.length > 0) ? (
                displayedUser.profile.interests.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-mono text-slate-400 hover:text-white hover:border-slate-600 transition-all cursor-default">
                    #{tag}
                  </span>
                ))
              ) : frequentTags.length > 0 ? (
                frequentTags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-mono text-slate-400 hover:text-white hover:border-slate-600 transition-all cursor-default">
                    #{tag}
                  </span>
                ))
              ) : (
                <div className="text-xs text-slate-600 italic py-2">No tags discovered yet.</div>
              )}
            </div>

            {displayedUser.profile?.badges && displayedUser.profile.badges.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-800">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] font-black font-space text-slate-400 uppercase tracking-widest">Platform Accolades</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {displayedUser.profile.badges.map(b => (
                    <div key={b} className="p-2 px-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-mono text-white font-bold flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                      {b.toUpperCase()}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Social Connections */}
          {canSee(displayedUser.profile?.privacy?.showSocialLinks) && (
            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-3xl">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Globe className="w-4 h-4 text-amber-400" />
                </div>
                <h3 className="text-sm font-black font-space text-white uppercase tracking-wider">Digital Bridges</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  onClick={() => displayedUser.profile?.github && window.open(`https://github.com/${displayedUser.profile.github}`, "_blank")}
                  className={`flex flex-col items-center gap-1.5 p-3 bg-slate-950 border border-slate-800 rounded-2xl transition-all ${displayedUser.profile?.github ? 'text-white' : 'text-slate-700 opacity-50 cursor-not-allowed'}`}
                >
                  <Github className="w-5 h-5" />
                  <span className="text-[8px] font-mono">GITHUB</span>
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  onClick={() => displayedUser.profile?.twitter && window.open(`https://twitter.com/${displayedUser.profile.twitter}`, "_blank")}
                  className={`flex flex-col items-center gap-1.5 p-3 bg-slate-950 border border-slate-800 rounded-2xl transition-all ${displayedUser.profile?.twitter ? 'text-white' : 'text-slate-700 opacity-50 cursor-not-allowed'}`}
                >
                  <Twitter className="w-5 h-5" />
                  <span className="text-[8px] font-mono">TWITTER</span>
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  onClick={() => displayedUser.profile?.instagram && window.open(`https://instagram.com/${displayedUser.profile.instagram}`, "_blank")}
                  className={`flex flex-col items-center gap-1.5 p-3 bg-slate-950 border border-slate-800 rounded-2xl transition-all ${displayedUser.profile?.instagram ? 'text-white' : 'text-slate-700 opacity-50 cursor-not-allowed'}`}
                >
                  <Instagram className="w-5 h-5" />
                  <span className="text-[8px] font-mono">INSTA</span>
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  onClick={() => (displayedUser.profile as any)?.linkedin && window.open(`https://linkedin.com/in/${(displayedUser.profile as any).linkedin}`, "_blank")}
                  className={`flex flex-col items-center gap-1.5 p-3 bg-slate-950 border border-slate-800 rounded-2xl transition-all ${(displayedUser.profile as any)?.linkedin ? 'text-white' : 'text-slate-700 opacity-50 cursor-not-allowed'}`}
                >
                  <LinkIcon className="w-5 h-5" />
                  <span className="text-[8px] font-mono">LINKEDIN</span>
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  onClick={() => (displayedUser.profile as any)?.tiktok && window.open(`https://tiktok.com/@${(displayedUser.profile as any).tiktok}`, "_blank")}
                  className={`flex flex-col items-center gap-1.5 p-3 bg-slate-950 border border-slate-800 rounded-2xl transition-all ${(displayedUser.profile as any)?.tiktok ? 'text-white' : 'text-slate-700 opacity-50 cursor-not-allowed'}`}
                >
                  <span className="text-xs font-bold font-space">Tk</span>
                  <span className="text-[8px] font-mono">TIKTOK</span>
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  onClick={() => displayedUser.profile?.website && window.open(displayedUser.profile.website.startsWith('http') ? displayedUser.profile.website : `https://${displayedUser.profile.website}`, "_blank")}
                  className={`flex flex-col items-center gap-1.5 p-3 bg-slate-950 border border-slate-800 rounded-2xl transition-all ${displayedUser.profile?.website ? 'text-white' : 'text-slate-700 opacity-50 cursor-not-allowed'}`}
                >
                  <Globe className="w-5 h-5" />
                  <span className="text-[8px] font-mono">WEB</span>
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User List Modal */}
      {(showFollowers || showFollowing) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowFollowers(false); setShowFollowing(false); }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
          >
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-md">
              <div>
                <h3 className="text-xl font-black font-space text-white uppercase tracking-tight">{listTitle}</h3>
                <p className="text-[10px] font-mono text-slate-500">Retrieving secure biometric registry...</p>
              </div>
              <button 
                onClick={() => { setShowFollowers(false); setShowFollowing(false); }}
                className="p-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-400 hover:text-white transition-all"
              >
                <Lock className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {userList.length > 0 ? (
                userList.map((u) => (
                  <UserCardItem key={u.id} targetUser={u} />
                ))
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-slate-600">
                  <Users className="w-12 h-12 mb-4 opacity-10" />
                  <p className="text-xs font-mono uppercase tracking-widest">Registry Empty</p>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-slate-950/50 border-t border-slate-800 text-center">
              <span className="text-[9px] font-mono text-slate-600 uppercase">Synchronized with core node | 2026.RT</span>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const UserCardItem: React.FC<{ targetUser: User }> = ({ targetUser }) => {
  const { user, toggleFollow, viewProfile, followActionCount } = useAppState();
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (user) {
      setIsFollowing(db.follows.isFollowing(user.id, targetUser.id));
    }
  }, [user, targetUser.id, followActionCount]);

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const status = await toggleFollow(targetUser.id);
    setIsFollowing(status);
  };

  return (
    <div 
      onClick={() => viewProfile(targetUser.id)}
      className="group flex items-center gap-4 p-3 bg-slate-950/50 border border-slate-850 rounded-2xl hover:border-slate-700 hover:bg-slate-950 transition-all cursor-pointer"
    >
      <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0">
        {targetUser.profile?.avatarUrl ? (
          <img src={targetUser.profile.avatarUrl || undefined} className="w-full h-full object-cover" alt="avatar" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><UserIcon className="w-6 h-6 text-slate-700" /></div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold text-white truncate">{targetUser.profile?.fullName || targetUser.username}</h4>
          <RoleBadge role={targetUser.profile?.activeBadge || targetUser.role} size="xs" />
        </div>
        <p className="text-[10px] text-slate-500 font-mono">@{targetUser.username}</p>
      </div>
      
      {user && user.id !== targetUser.id && (
        <button 
          onClick={handleFollow}
          className={`px-4 py-1.5 rounded-lg text-[10px] font-black font-space uppercase transition-all ${
            isFollowing 
              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20' 
              : 'bg-white text-slate-950 hover:bg-slate-200'
          }`}
        >
          {isFollowing ? 'Unfollow' : 'Follow'}
        </button>
      )}
    </div>
  );
};

export default ProfileOverview;
