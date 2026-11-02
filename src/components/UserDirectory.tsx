import React, { useState, useEffect, useMemo } from "react";
import { 
  Users, Search, UserPlus, Shield, ShieldAlert, ShieldCheck, User, Star, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Trophy, Crown, 
  Award, Eye, Heart, Bookmark, MessageSquare, Info, Calendar, Filter, Sparkles, Check
} from "lucide-react";
import { useAppState } from "../context/AppState.js";
import { db } from "../lib/db.js";
import { motion, AnimatePresence } from "motion/react";
import { User as UserType } from "../types.js";
import { RoleBadge } from "./RoleBadge.js";
import { FullProfileView } from "./FullProfileView.js";

type DirectoryViewMode = "directory" | "leaderboard";
type LeaderboardPeriod = "all_time" | "this_month" | "this_week";
type SortMetric = "score" | "followers" | "views" | "likes" | "favorites" | "comments";

interface CreatorMetrics {
  user: UserType;
  followers: number;
  totalViews: number;
  totalLikes: number;
  totalFavorites: number;
  totalComments: number;
  compositeScore: number;
}

export const UserDirectory: React.FC = () => {
  const { user, followActionCount, toggleFollow } = useAppState();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<DirectoryViewMode>("directory");
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<UserType[]>([]);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  
  // Leaderboard filters
  const [period, setPeriod] = useState<LeaderboardPeriod>("all_time");
  const [sortMetric, setSortMetric] = useState<SortMetric>("score");
  const [showFormulaInfo, setShowFormulaInfo] = useState(false);

  // Pagination State for standard users (Directory view)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    // Get all users
    const allUsers = db.users.getAll();
    setUsers(allUsers);
    
    if (user) {
      setFollowedIds(new Set(db.follows.getFollowing(user.id)));
    }
  }, [user, followActionCount]);

  // Filtered users for directory view (exclude current user for standard directory browsing)
  const directoryUsers = useMemo(() => {
    return users.filter(u => u.id !== user?.id && (
      u.username?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
      u.profile?.fullName?.toLowerCase()?.includes(searchQuery.toLowerCase())
    ));
  }, [users, searchQuery, user?.id]);

  // Separate users by role for directory view
  const superAdmins = useMemo(() => directoryUsers.filter(u => u.role === "SUPER_ADMIN"), [directoryUsers]);
  const admins = useMemo(() => directoryUsers.filter(u => u.role === "ADMIN"), [directoryUsers]);
  const moderators = useMemo(() => directoryUsers.filter(u => u.role === "MODERATOR"), [directoryUsers]);
  const regularUsers = useMemo(() => directoryUsers.filter(u => u.role === "USER" || !u.role), [directoryUsers]);

  // Calculate creator leaderboard metrics based on actual DB data and selected period
  const leaderboardCreators = useMemo<CreatorMetrics[]>(() => {
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    let periodCutoff = 0;
    if (period === "this_week") periodCutoff = now - (7 * ONE_DAY);
    if (period === "this_month") periodCutoff = now - (30 * ONE_DAY);

    // Compute metrics for each creator
    const metricsList: CreatorMetrics[] = users.map(u => {
      // 1. Followers
      const allFollowerIds = db.follows.getFollowers(u.id);
      let followersCount = allFollowerIds.length;
      if (periodCutoff > 0) {
        // Filter follows by period if createdAt timestamp exists
        const rawFollows = (db as any).get ? (db as any).get("nv_follows", []) : [];
        const periodFollows = rawFollows.filter((f: any) => 
          f.followingId === u.id && f.createdAt && new Date(f.createdAt).getTime() >= periodCutoff
        );
        if (rawFollows.length > 0) {
          followersCount = periodFollows.length;
        }
      }

      // 2. Fetch approved public content
      const blogs = db.blogs.getAll().filter(b => b.userId === u.id);
      const photos = db.photos.getAll().filter(p => p.userId === u.id);
      const videos = db.videos.getAll().filter(v => v.userId === u.id);

      const allContent = [...blogs, ...photos, ...videos];

      let totalViews = 0;
      let totalLikes = 0;
      let totalFavorites = 0;
      let totalComments = 0;

      allContent.forEach(item => {
        // Exclude unapproved content
        if (item.status && item.status !== "APPROVED") return;

        // Exclude private content from public leaderboard
        const isPrivate = item.visibility?.toLowerCase() === "private";
        if (isPrivate) return;

        // Apply period filter to content
        if (periodCutoff > 0) {
          const itemTime = new Date(item.createdAt).getTime();
          if (isNaN(itemTime) || itemTime < periodCutoff) return;
        }

        // Engagement Muted rule: Views, likes, favorites count, but comments DO NOT count
        const isMuted = item.engagement?.toLowerCase() === "muted" || item.allowComments === false;

        totalViews += item.views || 0;
        totalLikes += (item.likedBy?.length ?? item.likesCount ?? 0);
        totalFavorites += (item.favoritedBy?.length ?? item.favoritesCount ?? 0);

        // Calculate comments strictly on open (non-muted) content
        if (!isMuted) {
          const itemComments = item.comments || db.comments.getByContentId(item.id) || [];
          if (periodCutoff > 0) {
            const periodComments = itemComments.filter((c: any) => 
              c.createdAt && new Date(c.createdAt).getTime() >= periodCutoff
            );
            totalComments += periodComments.length;
          } else {
            totalComments += itemComments.length;
          }
        }
      });

      // Score Formula: (Followers × 10) + (Total Views × 1) + (Total Likes × 5) + (Total Favorites × 8) + (Total Comments × 4)
      const compositeScore = (followersCount * 10) + (totalViews * 1) + (totalLikes * 5) + (totalFavorites * 8) + (totalComments * 4);

      return {
        user: u,
        followers: followersCount,
        totalViews,
        totalLikes,
        totalFavorites,
        totalComments,
        compositeScore
      };
    });

    // Filter by search query
    const searched = metricsList.filter(m => 
      m.user.username?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
      m.user.profile?.fullName?.toLowerCase()?.includes(searchQuery.toLowerCase())
    );

    // Sort according to metric
    return searched.sort((a, b) => {
      if (sortMetric === "score") return b.compositeScore - a.compositeScore;
      if (sortMetric === "followers") return b.followers - a.followers;
      if (sortMetric === "views") return b.totalViews - a.totalViews;
      if (sortMetric === "likes") return b.totalLikes - a.totalLikes;
      if (sortMetric === "favorites") return b.totalFavorites - a.totalFavorites;
      if (sortMetric === "comments") return b.totalComments - a.totalComments;
      return b.compositeScore - a.compositeScore;
    });
  }, [users, period, sortMetric, searchQuery]);

  // Reset pagination on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, viewMode]);

  const totalPages = Math.ceil(regularUsers.length / itemsPerPage);
  const paginatedUsers = regularUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleOpenProfile = (id: string) => {
    setSelectedUserId(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (selectedUserId) {
    return (
      <FullProfileView
        userId={selectedUserId}
        onBack={() => {
          setSelectedUserId(null);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        backLabel="Back to Creator Directory"
      />
    );
  }

  // Top 3 Podium Creators
  const top1 = leaderboardCreators[0];
  const top2 = leaderboardCreators[1];
  const top3 = leaderboardCreators[2];
  const remainingCreators = leaderboardCreators.slice(3);

  return (
    <div className="space-y-8 animate-fadeIn pb-10" id="user-directory-shell">
      {/* Header Banner */}
      <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-3xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-80 h-40 bg-purple-600/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono text-[10px] uppercase font-semibold rounded-full tracking-wider">
                <Users className="w-3 h-3" /> NightVerse Directory
              </span>

              {/* View Switcher Tabs */}
              <div className="inline-flex p-1 bg-slate-950/80 border border-slate-800 rounded-full">
                <button
                  onClick={() => setViewMode("directory")}
                  className={`px-3 py-1 text-[11px] font-space font-bold rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === "directory"
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Users className="w-3 h-3" />
                  Directory
                </button>
                <button
                  onClick={() => setViewMode("leaderboard")}
                  className={`px-3 py-1 text-[11px] font-space font-bold rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === "leaderboard"
                      ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Trophy className="w-3 h-3" />
                  Leaderboard
                </button>
              </div>
            </div>

            <h2 className="text-2xl md:text-3xl font-black font-space text-white">
              {viewMode === "directory" ? "Creator Directory" : "Creator Leaderboard"}
            </h2>
            <p className="text-xs text-slate-400 max-w-xl">
              {viewMode === "directory"
                ? "Discover and connect with talented creators across the NightVerse network, separated by administrative clearance."
                : "Real-time creator performance ranking calculated from verified DB engagement: followers, views, likes, favorites, and open comments."}
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder={viewMode === "directory" ? "Search creators..." : "Search leaderboard..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs py-3 pl-10 pr-4 bg-slate-950/80 rounded-xl border border-slate-850 focus:outline-none focus:border-purple-600 text-slate-200 placeholder-slate-700 font-mono"
            />
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: DIRECTORY */}
      {viewMode === "directory" && (
        <div className="space-y-8">
          {/* Super Admin Section */}
          {superAdmins.length > 0 && (
            <div className="space-y-4" id="section-super-admins">
              <div className="flex items-center justify-between border-b border-rose-500/10 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  <div>
                    <h3 className="text-xs font-black font-space text-rose-400 uppercase tracking-wider">Super Administrators</h3>
                    <p className="text-[10px] text-slate-500 font-mono">Root authority & core developers</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full">{superAdmins.length}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {superAdmins.map((u) => (
                  <DirectoryUserCard 
                    key={u.id} 
                    targetUser={u} 
                    isFollowed={followedIds.has(u.id)} 
                    toggleFollow={toggleFollow}
                    viewProfile={handleOpenProfile}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Admin Section */}
          {admins.length > 0 && (
            <div className="space-y-4" id="section-admins">
              <div className="flex items-center justify-between border-b border-purple-500/10 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-500" />
                  <div>
                    <h3 className="text-xs font-black font-space text-purple-400 uppercase tracking-wider">Administrators</h3>
                    <p className="text-[10px] text-slate-500 font-mono">System executives & security clearance</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full">{admins.length}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {admins.map((u) => (
                  <DirectoryUserCard 
                    key={u.id} 
                    targetUser={u} 
                    isFollowed={followedIds.has(u.id)} 
                    toggleFollow={toggleFollow}
                    viewProfile={handleOpenProfile}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Moderator Section */}
          {moderators.length > 0 && (
            <div className="space-y-4" id="section-moderators">
              <div className="flex items-center justify-between border-b border-cyan-500/10 pb-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-500" />
                  <div>
                    <h3 className="text-xs font-black font-space text-cyan-400 uppercase tracking-wider">Moderators</h3>
                    <p className="text-[10px] text-slate-500 font-mono">Content review & community policy lead</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-full">{moderators.length}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {moderators.map((u) => (
                  <DirectoryUserCard 
                    key={u.id} 
                    targetUser={u} 
                    isFollowed={followedIds.has(u.id)} 
                    toggleFollow={toggleFollow}
                    viewProfile={handleOpenProfile}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Standard Users Section */}
          <div className="space-y-4" id="section-standard-directory">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <div>
                  <h3 className="text-xs font-black font-space text-slate-300 uppercase tracking-wider">Creators & Explorers</h3>
                  <p className="text-[10px] text-slate-500 font-mono">Standard creators directory catalog</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 rounded-full">{regularUsers.length}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((u) => (
                  <DirectoryUserCard 
                    key={u.id} 
                    targetUser={u} 
                    isFollowed={followedIds.has(u.id)} 
                    toggleFollow={toggleFollow}
                    viewProfile={handleOpenProfile}
                  />
                ))
              ) : (
                <div className="col-span-full py-16 bg-slate-900/10 border border-slate-900 border-dashed rounded-3xl flex flex-col items-center justify-center text-slate-500">
                  <Users className="w-10 h-10 mb-3 opacity-10" />
                  <p className="text-xs font-mono uppercase tracking-widest">No regular creators found</p>
                </div>
              )}
            </div>
          </div>

          {/* Pagination Controls for Standard Directory */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center gap-3 py-6 border-t border-slate-900/50">
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 border border-slate-900 rounded-xl select-none">
                <button 
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                  className="p-2 bg-slate-900 border border-slate-850 rounded-lg text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 cursor-pointer flex items-center justify-center"
                  title="First Page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 bg-slate-900 border border-slate-850 rounded-lg text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 cursor-pointer flex items-center justify-center"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="px-3 py-1.5 bg-slate-950 border border-slate-900 rounded-lg flex items-center justify-center min-w-[60px]">
                  <span className="text-[10px] font-mono text-purple-400 font-bold">{currentPage} / {totalPages}</span>
                </div>

                <button 
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-slate-900 border border-slate-850 rounded-lg text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 cursor-pointer flex items-center justify-center"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-slate-900 border border-slate-850 rounded-lg text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 cursor-pointer flex items-center justify-center"
                  title="Last Page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
              
              <div className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.2em]">
                Showing creators {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, regularUsers.length)} of {regularUsers.length}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: LEADERBOARD */}
      {viewMode === "leaderboard" && (
        <div className="space-y-8 animate-fadeIn" id="section-leaderboard">
          {/* Controls Bar: Period Filter + Metric Selector + Formula Button */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            
            {/* Period Filters */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-slate-400 text-xs font-mono shrink-0 mr-1">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                <span>Period:</span>
              </div>
              <div className="inline-flex p-1 bg-slate-950 border border-slate-850 rounded-xl">
                <button
                  onClick={() => setPeriod("all_time")}
                  className={`px-3 py-1 text-[11px] font-mono font-medium rounded-lg transition-colors cursor-pointer ${
                    period === "all_time"
                      ? "bg-purple-600 text-white font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  All Time
                </button>
                <button
                  onClick={() => setPeriod("this_month")}
                  className={`px-3 py-1 text-[11px] font-mono font-medium rounded-lg transition-colors cursor-pointer ${
                    period === "this_month"
                      ? "bg-purple-600 text-white font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  This Month
                </button>
                <button
                  onClick={() => setPeriod("this_week")}
                  className={`px-3 py-1 text-[11px] font-mono font-medium rounded-lg transition-colors cursor-pointer ${
                    period === "this_week"
                      ? "bg-purple-600 text-white font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  This Week
                </button>
              </div>
            </div>

            {/* Sorting Metric Selector */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 text-slate-400 text-xs font-mono shrink-0 mr-1">
                <Filter className="w-3.5 h-3.5 text-amber-400" />
                <span>Sort By:</span>
              </div>
              <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 border border-slate-850 rounded-xl overflow-x-auto">
                <button
                  onClick={() => setSortMetric("score")}
                  className={`px-2.5 py-1 text-[10px] font-mono uppercase font-bold rounded-lg transition-colors cursor-pointer ${
                    sortMetric === "score"
                      ? "bg-amber-500 text-slate-950"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Overall Score
                </button>
                <button
                  onClick={() => setSortMetric("followers")}
                  className={`px-2.5 py-1 text-[10px] font-mono uppercase font-bold rounded-lg transition-colors cursor-pointer ${
                    sortMetric === "followers"
                      ? "bg-purple-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Followers
                </button>
                <button
                  onClick={() => setSortMetric("views")}
                  className={`px-2.5 py-1 text-[10px] font-mono uppercase font-bold rounded-lg transition-colors cursor-pointer ${
                    sortMetric === "views"
                      ? "bg-purple-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Views
                </button>
                <button
                  onClick={() => setSortMetric("likes")}
                  className={`px-2.5 py-1 text-[10px] font-mono uppercase font-bold rounded-lg transition-colors cursor-pointer ${
                    sortMetric === "likes"
                      ? "bg-purple-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Likes
                </button>
                <button
                  onClick={() => setSortMetric("favorites")}
                  className={`px-2.5 py-1 text-[10px] font-mono uppercase font-bold rounded-lg transition-colors cursor-pointer ${
                    sortMetric === "favorites"
                      ? "bg-purple-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Favorites
                </button>
                <button
                  onClick={() => setSortMetric("comments")}
                  className={`px-2.5 py-1 text-[10px] font-mono uppercase font-bold rounded-lg transition-colors cursor-pointer ${
                    sortMetric === "comments"
                      ? "bg-purple-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Comments
                </button>
              </div>

              {/* Info Formula Modal Toggle */}
              <button
                onClick={() => setShowFormulaInfo(!showFormulaInfo)}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  showFormulaInfo
                    ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                }`}
                title="View Calculation Formula"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Formula Info Banner */}
          <AnimatePresence>
            {showFormulaInfo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-5 bg-gradient-to-r from-purple-950/40 via-slate-900/90 to-amber-950/30 border border-purple-500/30 rounded-2xl text-xs space-y-3 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400 font-space font-bold uppercase tracking-wider text-xs">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>NightVerse Leaderboard Score Formula</span>
                  </div>
                  <button 
                    onClick={() => setShowFormulaInfo(false)}
                    className="text-slate-500 hover:text-white text-xs font-mono cursor-pointer"
                  >
                    Close [X]
                  </button>
                </div>
                
                <p className="text-slate-300 leading-relaxed">
                  Creator ranks are dynamically updated based on verified engagement across public non-private content in the selected period:
                </p>

                <div className="p-3 bg-slate-950/80 border border-purple-500/20 rounded-xl font-mono text-[11px] text-purple-300 space-y-1">
                  <div><strong className="text-amber-400">Composite Score</strong> = (Followers × 10) + (Total Views × 1) + (Total Likes × 5) + (Total Favorites × 8) + (Total Comments × 4)</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><strong>Private Content:</strong> Strictly excluded from all public metrics.</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><strong>Muted Engagement:</strong> Comments are disabled and not counted.</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Period Notice if empty */}
          {leaderboardCreators.length === 0 && (
            <div className="py-16 bg-slate-900/20 border border-slate-900 border-dashed rounded-3xl flex flex-col items-center justify-center text-slate-500">
              <Trophy className="w-12 h-12 mb-3 opacity-20 text-amber-400" />
              <p className="text-sm font-space font-bold text-slate-300">No activity recorded for this period</p>
              <p className="text-xs font-mono text-slate-500 mt-1">Try switching to "All Time" to view full platform rankings.</p>
            </div>
          )}

          {/* PODIUM DISPLAY (#1, #2, #3 Spotlight) */}
          {leaderboardCreators.length > 0 && (
            <div className="pt-4 pb-2">
              <div className="text-center mb-6">
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-[0.25em] font-bold">
                  Top Performing Creators — {period === "all_time" ? "All Time" : period === "this_month" ? "This Month" : "This Week"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-end max-w-5xl mx-auto">
                
                {/* RANK #2 (Left - Silver Podium) */}
                <div className="order-2 md:order-1">
                  {top2 ? (
                    <PodiumCard
                      rank={2}
                      metrics={top2}
                      isFollowed={followedIds.has(top2.user.id)}
                      toggleFollow={toggleFollow}
                      viewProfile={handleOpenProfile}
                      sortMetric={sortMetric}
                    />
                  ) : (
                    <div className="h-64 bg-slate-950/40 border border-slate-900 rounded-3xl flex items-center justify-center text-slate-700 font-mono text-xs">
                      #2 Spot Open
                    </div>
                  )}
                </div>

                {/* RANK #1 (Center - Gold Podium Elevated) */}
                <div className="order-1 md:order-2">
                  {top1 ? (
                    <PodiumCard
                      rank={1}
                      metrics={top1}
                      isFollowed={followedIds.has(top1.user.id)}
                      toggleFollow={toggleFollow}
                      viewProfile={handleOpenProfile}
                      sortMetric={sortMetric}
                    />
                  ) : null}
                </div>

                {/* RANK #3 (Right - Bronze Podium) */}
                <div className="order-3 md:order-3">
                  {top3 ? (
                    <PodiumCard
                      rank={3}
                      metrics={top3}
                      isFollowed={followedIds.has(top3.user.id)}
                      toggleFollow={toggleFollow}
                      viewProfile={handleOpenProfile}
                      sortMetric={sortMetric}
                    />
                  ) : (
                    <div className="h-64 bg-slate-950/40 border border-slate-900 rounded-3xl flex items-center justify-center text-slate-700 font-mono text-xs">
                      #3 Spot Open
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* RANKED LIST FOR #4 AND BELOW */}
          {remainingCreators.length > 0 && (
            <div className="space-y-3 pt-6" id="section-leaderboard-ranked-list">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-slate-400" />
                  <h3 className="text-xs font-black font-space text-slate-300 uppercase tracking-wider">
                    Rankings #4 to #{leaderboardCreators.length}
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  Sorted by {sortMetric.toUpperCase()}
                </span>
              </div>

              <div className="space-y-2">
                {remainingCreators.map((m, idx) => (
                  <RankedListRow
                    key={m.user.id}
                    rank={idx + 4}
                    metrics={m}
                    isFollowed={followedIds.has(m.user.id)}
                    toggleFollow={toggleFollow}
                    viewProfile={handleOpenProfile}
                    sortMetric={sortMetric}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* PODIUM CARD COMPONENT FOR #1, #2, #3 */
const PodiumCard: React.FC<{
  rank: 1 | 2 | 3;
  metrics: CreatorMetrics;
  isFollowed: boolean;
  toggleFollow: (id: string) => Promise<boolean>;
  viewProfile: (id: string) => void;
  sortMetric: SortMetric;
}> = ({ rank, metrics, isFollowed, toggleFollow, viewProfile, sortMetric }) => {
  const { user } = metrics;

  const isGold = rank === 1;
  const isSilver = rank === 2;
  const isBronze = rank === 3;

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleFollow(user.id);
  };

  const getMetricDisplay = () => {
    if (sortMetric === "followers") return `${metrics.followers} Followers`;
    if (sortMetric === "views") return `${metrics.totalViews} Views`;
    if (sortMetric === "likes") return `${metrics.totalLikes} Likes`;
    if (sortMetric === "favorites") return `${metrics.totalFavorites} Favorites`;
    if (sortMetric === "comments") return `${metrics.totalComments} Comments`;
    return `${metrics.compositeScore.toLocaleString()} pts`;
  };

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
      onClick={() => viewProfile(user.id)}
      className={`relative p-5 rounded-3xl border cursor-pointer transition-all flex flex-col items-center text-center backdrop-blur-md overflow-hidden ${
        isGold
          ? "bg-gradient-to-b from-amber-500/15 via-slate-900/90 to-slate-950 border-amber-500/60 shadow-xl shadow-amber-500/10 -translate-y-2 md:-translate-y-4"
          : isSilver
          ? "bg-gradient-to-b from-slate-300/15 via-slate-900/90 to-slate-950 border-slate-400/50 shadow-lg shadow-slate-500/5"
          : "bg-gradient-to-b from-amber-700/15 via-slate-900/90 to-slate-950 border-amber-700/50 shadow-lg shadow-amber-700/5"
      }`}
    >
      {/* Background Crown Effect for Gold */}
      {isGold && (
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-amber-500/20 to-transparent pointer-events-none" />
      )}

      {/* Rank Badge Header */}
      <div className="relative mb-3">
        <div className={`px-3 py-1 rounded-full border text-[10px] font-space font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md ${
          isGold
            ? "bg-amber-500 text-slate-950 border-amber-400"
            : isSilver
            ? "bg-slate-300 text-slate-950 border-slate-200"
            : "bg-amber-700 text-white border-amber-600"
        }`}>
          {isGold ? <Crown className="w-3.5 h-3.5 fill-slate-950" /> : <Award className="w-3.5 h-3.5" />}
          <span>#{rank} {isGold ? "Champion" : isSilver ? "Runner-Up" : "3rd Place"}</span>
        </div>
      </div>

      {/* Avatar Container */}
      <div className="relative mb-3">
        <div className={`rounded-2xl p-1 ${
          isGold ? "bg-gradient-to-tr from-amber-400 to-yellow-200" : isSilver ? "bg-gradient-to-tr from-slate-200 to-slate-400" : "bg-gradient-to-tr from-amber-600 to-amber-800"
        }`}>
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-950 overflow-hidden">
            {user.profile?.avatarUrl ? (
              <img src={user.profile.avatarUrl || undefined} className="w-full h-full object-cover" alt="avatar" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-800"><User className="w-8 h-8 text-slate-500" /></div>
            )}
          </div>
        </div>
      </div>

      {/* Creator Info */}
      <div className="w-full space-y-1 mb-4">
        <h4 className="text-sm sm:text-base font-black font-space text-white truncate px-2">
          {user.profile?.fullName || user.username}
        </h4>
        <p className="text-[10px] text-slate-400 font-mono truncate">@{user.username}</p>
        <div className="flex justify-center pt-1">
          <RoleBadge role={user.role} size="xs" />
        </div>
      </div>

      {/* Main Metric Highlight */}
      <div className={`w-full py-2.5 px-3 rounded-2xl border mb-4 ${
        isGold
          ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
          : "bg-purple-500/10 border-purple-500/20 text-purple-300"
      }`}>
        <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest block">
          {sortMetric === "score" ? "Overall Score" : sortMetric.toUpperCase()}
        </span>
        <span className="text-base sm:text-lg font-black font-space">
          {getMetricDisplay()}
        </span>
      </div>

      {/* Stats Breakdown */}
      <div className="w-full grid grid-cols-4 gap-1 text-[9px] font-mono py-2 border-t border-slate-850/80 mb-4 text-slate-400">
        <div>
          <span className="block text-[7px] text-slate-500 uppercase">Views</span>
          <span className="text-slate-200 font-bold">{metrics.totalViews}</span>
        </div>
        <div>
          <span className="block text-[7px] text-slate-500 uppercase">Likes</span>
          <span className="text-slate-200 font-bold">{metrics.totalLikes}</span>
        </div>
        <div>
          <span className="block text-[7px] text-slate-500 uppercase">Favs</span>
          <span className="text-slate-200 font-bold">{metrics.totalFavorites}</span>
        </div>
        <div>
          <span className="block text-[7px] text-slate-500 uppercase">Cmts</span>
          <span className="text-slate-200 font-bold">{metrics.totalComments}</span>
        </div>
      </div>

      {/* Follow & View Profile Buttons */}
      <div className="w-full flex gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            viewProfile(user.id);
          }}
          className="flex-1 py-2 rounded-xl text-[10px] font-black font-space uppercase bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
        >
          <Eye className="w-3.5 h-3.5 text-purple-400" />
          <span>Profile</span>
        </button>
        <button 
          type="button"
          onClick={handleFollow}
          className={`flex-1 py-2 rounded-xl text-[10px] font-black font-space uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-sm ${
            isFollowed 
              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20' 
              : isGold
              ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 font-bold'
              : 'bg-white text-slate-950 hover:bg-slate-200'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>{isFollowed ? 'Unfollow' : 'Follow'}</span>
        </button>
      </div>
    </motion.div>
  );
};

/* RANKED LIST ROW FOR RANK #4+ */
const RankedListRow: React.FC<{
  rank: number;
  metrics: CreatorMetrics;
  isFollowed: boolean;
  toggleFollow: (id: string) => Promise<boolean>;
  viewProfile: (id: string) => void;
  sortMetric: SortMetric;
}> = ({ rank, metrics, isFollowed, toggleFollow, viewProfile, sortMetric }) => {
  const { user } = metrics;

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleFollow(user.id);
  };

  const getMetricDisplay = () => {
    if (sortMetric === "followers") return `${metrics.followers} followers`;
    if (sortMetric === "views") return `${metrics.totalViews} views`;
    if (sortMetric === "likes") return `${metrics.totalLikes} likes`;
    if (sortMetric === "favorites") return `${metrics.totalFavorites} favorites`;
    if (sortMetric === "comments") return `${metrics.totalComments} comments`;
    return `${metrics.compositeScore.toLocaleString()} pts`;
  };

  return (
    <motion.div
      whileHover={{ x: 4 }}
      onClick={() => viewProfile(user.id)}
      className="p-3 bg-slate-900/40 border border-slate-900 rounded-2xl hover:border-purple-600/40 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Rank Number */}
        <div className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-center shrink-0">
          <span className="text-xs font-mono font-bold text-slate-400">#{rank}</span>
        </div>

        {/* Avatar */}
        <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0">
          {user.profile?.avatarUrl ? (
            <img src={user.profile.avatarUrl || undefined} className="w-full h-full object-cover" alt="avatar" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-800"><User className="w-5 h-5 text-slate-500" /></div>
          )}
        </div>

        {/* User details */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-xs sm:text-sm font-black font-space text-white truncate">{user.profile?.fullName || user.username}</h4>
            <RoleBadge role={user.role} size="xs" />
          </div>
          <p className="text-[10px] text-slate-500 font-mono truncate">@{user.username}</p>
        </div>
      </div>

      {/* Metrics & Actions */}
      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-850/60">
        {/* Key Stats Pill */}
        <div className="text-left sm:text-right">
          <span className="text-[11px] font-space font-bold text-purple-400 block">
            {getMetricDisplay()}
          </span>
          <span className="text-[9px] font-mono text-slate-500 flex items-center gap-2">
            <span>{metrics.followers} Followers</span>
            <span>·</span>
            <span>{metrics.totalViews} Views</span>
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              viewProfile(user.id);
            }}
            className="px-3 py-1.5 rounded-xl text-[10px] font-black font-space uppercase bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
          >
            <Eye className="w-3 h-3 text-purple-400" />
            <span className="hidden sm:inline">View Profile</span>
            <span className="sm:hidden">Profile</span>
          </button>
          <button 
            type="button"
            onClick={handleFollow}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black font-space uppercase transition-all flex items-center gap-1 shrink-0 cursor-pointer active:scale-95 shadow-sm ${
              isFollowed 
                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20' 
                : 'bg-white text-slate-950 hover:bg-slate-200'
            }`}
          >
            <UserPlus className="w-3 h-3" />
            <span>{isFollowed ? 'Unfollow' : 'Follow'}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

/* STANDARD DIRECTORY USER CARD COMPONENT */
const DirectoryUserCard: React.FC<{ 
  targetUser: UserType, 
  isFollowed: boolean, 
  toggleFollow: (id: string) => Promise<boolean>,
  viewProfile: (id: string) => void
}> = ({ targetUser, isFollowed, toggleFollow, viewProfile }) => {
  const [stats, setStats] = useState({ followers: 0, content: 0 });

  useEffect(() => {
    const followers = db.follows.getFollowers(targetUser.id).length;
    const blogs = db.blogs.getAll().filter(b => b.userId === targetUser.id).length;
    const photos = db.photos.getAll().filter(p => p.userId === targetUser.id).length;
    const videos = db.videos.getAll().filter(v => v.userId === targetUser.id).length;
    setStats({ followers, content: blogs + photos + videos });
  }, [targetUser.id]);

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleFollow(targetUser.id);
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => viewProfile(targetUser.id)}
      className="p-3 sm:p-5 bg-slate-900/30 border border-slate-900 rounded-2xl hover:border-purple-650 transition-all cursor-pointer group flex flex-col gap-3 sm:gap-4"
    >
      <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 text-center sm:text-left">
        <div className="relative">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-300">
            {targetUser.profile?.avatarUrl ? (
              <img src={targetUser.profile.avatarUrl || undefined} className="w-full h-full object-cover" alt="avatar" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-800"><User className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500" /></div>
            )}
          </div>
          {targetUser.role !== 'USER' && (
            <div className="absolute -top-1 -right-1 p-0.5 sm:p-1 bg-purple-600 rounded-lg shadow-lg">
              <Star className="w-2 sm:w-2.5 h-2 sm:h-2.5 text-white fill-white" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 w-full overflow-hidden">
          <h4 className="text-xs sm:text-sm font-black font-space text-white truncate">{targetUser.profile?.fullName || targetUser.username}</h4>
          <p className="text-[8px] sm:text-[10px] text-slate-500 font-mono truncate">@{targetUser.username}</p>
          <div className="flex items-center justify-center sm:justify-start mt-1">
            <RoleBadge role={targetUser.role} size="xs" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
        <div className="p-1.5 sm:p-2 bg-slate-950/50 rounded-xl border border-slate-850 text-center">
          <span className="text-[7px] sm:text-[9px] text-slate-500 font-mono uppercase block">Followers</span>
          <span className="text-xs sm:text-sm font-black font-space text-white">{stats.followers}</span>
        </div>
        <div className="p-1.5 sm:p-2 bg-slate-950/50 rounded-xl border border-slate-850 text-center">
          <span className="text-[7px] sm:text-[9px] text-slate-500 font-mono uppercase block">Content</span>
          <span className="text-xs sm:text-sm font-black font-space text-white">{stats.content}</span>
        </div>
      </div>

      <div className="flex gap-1.5 sm:gap-2 w-full pt-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            viewProfile(targetUser.id);
          }}
          className="flex-1 py-2 sm:py-2.5 rounded-xl text-[8px] sm:text-[10px] font-black font-space uppercase bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 hover:text-white transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-sm"
        >
          <Eye className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-purple-400" />
          <span className="truncate">View Profile</span>
        </button>
        <button 
          type="button"
          onClick={handleFollow}
          className={`flex-1 py-2 sm:py-2.5 rounded-xl text-[8px] sm:text-[10px] font-black font-space uppercase transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer active:scale-95 shadow-sm ${
            isFollowed 
              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20' 
              : 'bg-white text-slate-950 hover:bg-slate-200'
          }`}
        >
          <UserPlus className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
          <span className="truncate">{isFollowed ? 'Unfollow' : 'Follow'}</span>
        </button>
      </div>
    </motion.div>
  );
};
