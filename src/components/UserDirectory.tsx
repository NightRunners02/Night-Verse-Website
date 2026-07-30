import React, { useState, useEffect, useMemo } from "react";
import { Users, Search, UserPlus, Shield, ShieldAlert, ShieldCheck, User, Star, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useAppState } from "../context/AppState.js";
import { db } from "../lib/db.js";
import { motion } from "motion/react";
import { User as UserType } from "../types.js";
import { RoleBadge } from "./RoleBadge.js";

export const UserDirectory: React.FC = () => {
  const { user, viewProfile, followActionCount, toggleFollow } = useAppState();
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<UserType[]>([]);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  
  // Pagination State for standard users
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // standard items per page for cleaner UI grid

  useEffect(() => {
    const allUsers = db.users.getAll().filter(u => u.id !== user?.id);
    setUsers(allUsers);
    
    if (user) {
      setFollowedIds(new Set(db.follows.getFollowing(user.id)));
    }
  }, [user, followActionCount]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.username?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
      u.profile?.fullName?.toLowerCase()?.includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  // Separate users by role
  const superAdmins = useMemo(() => {
    return filteredUsers.filter(u => u.role === "SUPER_ADMIN");
  }, [filteredUsers]);

  const admins = useMemo(() => {
    return filteredUsers.filter(u => u.role === "ADMIN");
  }, [filteredUsers]);

  const moderators = useMemo(() => {
    return filteredUsers.filter(u => u.role === "MODERATOR");
  }, [filteredUsers]);

  const regularUsers = useMemo(() => {
    return filteredUsers.filter(u => u.role === "USER" || !u.role);
  }, [filteredUsers]);

  // Reset pagination on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(regularUsers.length / itemsPerPage);
  const paginatedUsers = regularUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-10" id="user-directory-shell">
      {/* Header */}
      <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-3xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-64 h-32 bg-purple-600/10 blur-[90px] rounded-full pointer-events-none"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono text-[10px] uppercase font-semibold rounded-full tracking-wider">
              <Users className="w-3 h-3" /> Creator directory
            </div>
            <h2 className="text-2xl md:text-3xl font-black font-space text-white">Creator Directory</h2>
            <p className="text-xs text-slate-400 max-w-xl">
              Discover and connect with talented creators across the NightVerse network, separated by administrative clearance.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs py-3 pl-10 pr-4 bg-slate-950/80 rounded-xl border border-slate-850 focus:outline-none focus:border-purple-600 text-slate-200 placeholder-slate-700 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Staff Sections: Display above regular users */}
      
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
                viewProfile={viewProfile}
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
                viewProfile={viewProfile}
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
                viewProfile={viewProfile}
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
                viewProfile={viewProfile}
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
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              className="p-2 bg-slate-900 border border-slate-850 rounded-lg text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 cursor-pointer flex items-center justify-center"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 bg-slate-900 border border-slate-850 rounded-lg text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 cursor-pointer flex items-center justify-center"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>

            <div className="px-3 py-1.5 bg-slate-950 border border-slate-900 rounded-lg flex items-center justify-center min-w-[60px]">
              <span className="text-[10px] font-mono text-purple-400 font-bold">{currentPage} / {totalPages}</span>
            </div>

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 bg-slate-900 border border-slate-850 rounded-lg text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 cursor-pointer flex items-center justify-center"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 bg-slate-900 border border-slate-850 rounded-lg text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 cursor-pointer flex items-center justify-center"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </motion.button>
          </div>
          
          <div className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.2em]">
            Showing creators {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, regularUsers.length)} of {regularUsers.length}
          </div>
        </div>
      )}
    </div>
  );
};

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

      <button 
        onClick={handleFollow}
        className={`w-full py-2 sm:py-2.5 rounded-xl text-[8px] sm:text-[10px] font-black font-space uppercase transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
          isFollowed 
            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20' 
            : 'bg-white text-slate-950 hover:bg-slate-200'
        }`}
      >
        <UserPlus className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
        <span className="truncate">{isFollowed ? 'Unfollow' : 'Follow'}</span>
      </button>
    </motion.div>
  );
};
