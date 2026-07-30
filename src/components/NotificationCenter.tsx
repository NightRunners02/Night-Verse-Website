import React, { useState, useMemo, useEffect } from "react";
import { 
  Bell, 
  Search, 
  Filter, 
  CheckCheck, 
  BadgeCheck, 
  Users, 
  Shield, 
  ShieldAlert, 
  Calendar,
  X,
  MessageSquare,
  Heart,
  UserPlus,
  AtSign,
  ArrowRight,
  Check,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { useAppState } from "../context/AppState.js";
import { Notification, NotificationCategory } from "../types.js";
import { db } from "../lib/db.js";
import { motion, AnimatePresence } from "motion/react";

const formatRelativeTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 172800) return "Yesterday";
  return date.toLocaleDateString();
};

const getCategoryIcon = (category: NotificationCategory) => {
  switch (category) {
    case "CONTENT": return <BadgeCheck className="w-4 h-4 text-emerald-400" />;
    case "SOCIAL": return <Users className="w-4 h-4 text-blue-400" />;
    case "SYSTEM": return <Shield className="w-4 h-4 text-purple-400" />;
    case "ADMIN": return <ShieldAlert className="w-4 h-4 text-rose-400" />;
    default: return <Bell className="w-4 h-4 text-slate-400" />;
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case "LIKE": return <Heart className="w-3.5 h-3.5 text-rose-500" fill="currentColor" />;
    case "COMMENT": return <MessageSquare className="w-3.5 h-3.5 text-blue-400" />;
    case "FOLLOW": return <UserPlus className="w-3.5 h-3.5 text-emerald-400" />;
    case "MENTION": return <AtSign className="w-3.5 h-3.5 text-purple-400" />;
    case "content_approved": return <Check className="w-3.5 h-3.5 text-emerald-400" />;
    case "content_rejected": return <XCircle className="w-3.5 h-3.5 text-rose-400" />;
    case "content_revision": return <MessageSquare className="w-3.5 h-3.5 text-amber-400" />;
    case "moderation_request": return <ShieldAlert className="w-3.5 h-3.5 text-rose-500 animate-pulse" />;
    default: return null;
  }
};

export const NotificationCenter: React.FC = () => {
  const { 
    notifications, 
    unreadNotificationsCount,
    markNotificationsAsRead,
    clearNotifications,
    markAsRead, 
    viewProfile, 
    setFocusedContent,
    navigateTo,
    takeModerationAction,
    triggerToast,
    user
  } = useAppState();

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" || user?.role === "MODERATOR";

  const getHeaderTitle = () => {
    if (user?.role === "SUPER_ADMIN") return "Super Admin Notification Center";
    if (user?.role === "ADMIN") return "Admin Notification Center";
    if (user?.role === "MODERATOR") return "Moderator Notification Center";
    return "User Notification Center";
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<NotificationCategory | "ALL">("ALL");
  const [dateFilter, setDateFilter] = useState<"ALL" | "TODAY" | "WEEK">("ALL");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilter, dateFilter]);

  const filteredNotifications = useMemo(() => {
    let list = [...notifications];

    if (activeFilter !== "ALL") {
      list = list.filter(n => n.category === activeFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(n => n.title?.toLowerCase()?.includes(q) || n.message?.toLowerCase()?.includes(q));
    }

    if (dateFilter === "TODAY") {
      const today = new Date().setHours(0,0,0,0);
      list = list.filter(n => new Date(n.createdAt).getTime() >= today);
    } else if (dateFilter === "WEEK") {
      const weekAgo = new Date().getTime() - 7 * 24 * 60 * 60 * 1000;
      list = list.filter(n => new Date(n.createdAt).getTime() >= weekAgo);
    }

    return list;
  }, [notifications, activeFilter, searchQuery, dateFilter]);

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage) || 1;
  const validPage = Math.max(1, Math.min(currentPage, totalPages));
  
  const paginatedNotifications = useMemo(() => {
    return filteredNotifications.slice((validPage - 1) * itemsPerPage, validPage * itemsPerPage);
  }, [filteredNotifications, validPage, itemsPerPage]);

  const handleNotificationClick = (n: Notification) => {
    if (!n.isRead) markAsRead(n.id);

    if (n.link) {
      if (n.link.startsWith('PROFILE:')) {
        const userId = n.link.split(':')[1];
        viewProfile(userId);
      } else if (n.link.includes('/moderate/')) {
        // Moderation link
        navigateTo('dashboard', 'admin-reviews');
      } else if (n.targetType && n.targetId) {
        // Content link
        const item = db[n.targetType === 'blog' ? 'blogs' : n.targetType === 'photo' ? 'photos' : 'videos'].get(n.targetId);
        if (item) {
          setFocusedContent({ type: n.targetType, item });
        } else {
          navigateTo('dashboard', 'explore');
        }
      } else {
        // Fallback for path-based links
        if (n.link.includes('dashboard')) {
          navigateTo('dashboard', 'explore');
        } else {
          navigateTo('dashboard', 'explore');
        }
      }
    }
  };

  const handleClearAll = async () => {
    await clearNotifications();
    setShowClearConfirm(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900/50 border border-slate-800 rounded-3xl backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-600/20 rounded-2xl border border-purple-500/20">
            <Bell className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black font-space text-white uppercase tracking-tight">{getHeaderTitle()}</h1>
            <p className="text-xs text-slate-500 font-mono">Real-time telemetry and social interaction logs.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => markNotificationsAsRead()}
            disabled={unreadNotificationsCount === 0}
            className="flex items-center gap-2 px-4 py-2 bg-slate-950 border border-slate-800 hover:border-purple-500/50 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none disabled:active:scale-100"
            title="Mark all as read"
          >
            <CheckCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Mark All as Read</span>
          </button>
          <button 
            onClick={() => setShowClearConfirm(true)}
            disabled={notifications.length === 0}
            className="flex items-center justify-center p-2 bg-slate-950 border border-slate-800 hover:border-rose-500/50 hover:text-rose-400 rounded-xl text-slate-400 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none group relative"
            title="Clear All Messages"
          >
            <Trash2 className="w-4 h-4" />
            {/* Tooltip visible on hover (desktop only) */}
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden md:block">
              Clear All Messages
            </span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[2rem] p-8 shadow-2xl space-y-6"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-rose-500/10 rounded-full border border-rose-500/20">
                  <AlertTriangle className="w-8 h-8 text-rose-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black font-space uppercase text-white">Clear All Notifications?</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Are you sure you want to delete all notifications? This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all active:scale-95 text-xs uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl transition-all active:scale-95 text-xs uppercase tracking-widest shadow-lg shadow-rose-900/20"
                >
                  Clear All
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Filters & Search Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-5 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:border-purple-600 outline-none transition-all font-mono"
          />
        </div>

        <div className="md:col-span-4 flex p-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto scrollbar-hide">
          {["ALL", "CONTENT", "SOCIAL", "SYSTEM", "ADMIN"].map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f as any)}
              className={`flex-1 px-4 py-2 rounded-xl text-[10px] font-black font-space uppercase transition-all whitespace-nowrap ${
                activeFilter === f ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="md:col-span-3 flex p-1 bg-slate-900 border border-slate-800 rounded-2xl">
          {["ALL", "TODAY", "WEEK"].map((d) => (
            <button
              key={d}
              onClick={() => setDateFilter(d as any)}
              className={`flex-1 px-4 py-2 rounded-xl text-[10px] font-black font-space uppercase transition-all ${
                dateFilter === d ? 'bg-slate-950 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {paginatedNotifications.length > 0 ? (
            paginatedNotifications.map((n) => (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => handleNotificationClick(n)}
                className={`group flex items-start gap-4 p-4 rounded-3xl border transition-all hover:translate-x-1 cursor-pointer hover:border-purple-500/30 ${
                  n.isRead 
                    ? 'bg-slate-900/30 border-slate-900 text-slate-400 hover:bg-slate-900/50' 
                    : n.type === 'moderation_request' 
                      ? 'bg-rose-950/20 border-rose-900/50 shadow-2xl shadow-rose-900/10 text-rose-100 ring-1 ring-rose-500/20 hover:bg-rose-950/30'
                      : n.type?.toLowerCase()?.includes('approved') 
                        ? 'bg-emerald-950/10 border-emerald-900/30 shadow-lg shadow-emerald-900/5 text-emerald-100 hover:bg-emerald-950/20'
                        : n.type?.toLowerCase()?.includes('rejected')
                          ? 'bg-rose-950/10 border-rose-900/30 shadow-lg shadow-rose-900/5 text-rose-100 hover:bg-rose-950/20'
                          : n.type?.toLowerCase()?.includes('revision')
                            ? 'bg-amber-950/10 border-amber-900/30 shadow-lg shadow-amber-900/5 text-amber-100 hover:bg-amber-950/20'
                            : 'bg-slate-900/80 border-slate-800 shadow-xl shadow-purple-900/5 text-slate-200 hover:bg-slate-900'
                }`}
              >
                {/* Avatar/Icon Slot */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-2xl border border-slate-800 overflow-hidden bg-slate-950">
                    {n.triggeredByAvatar ? (
                      <img src={n.triggeredByAvatar || undefined} className="w-full h-full object-cover" alt="avatar" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {getCategoryIcon(n.category)}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 p-1 bg-slate-900 rounded-lg border border-slate-800 shadow-sm">
                    {getTypeIcon(n.type) || getCategoryIcon(n.category)}
                  </div>
                </div>

                {/* Content Slot */}
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                      {n.category === 'CONTENT' ? 'Content Activity' : n.category === 'ADMIN' ? 'Moderation' : n.category}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                    <span className="text-[10px] font-mono text-slate-500">{formatRelativeTime(n.createdAt)}</span>
                    {n.isRead ? (
                      <span className="px-2 py-0.5 bg-slate-950 border border-slate-800/80 text-slate-500 text-[8px] font-bold uppercase rounded-full">Read</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[8px] font-bold uppercase rounded-full animate-pulse ring-1 ring-purple-500/30">Unread</span>
                    )}
                    {n.type === "moderation_request" && !n.actionTaken && (
                      <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 text-[8px] font-bold uppercase rounded-full animate-pulse border border-rose-500/20">Pending Review</span>
                    )}
                  </div>
                  <h3 className={`text-sm font-bold truncate ${!n.isRead && 'text-white'}`}>{n.title}</h3>
                  <p className="text-[11px] leading-relaxed mt-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    {n.message}
                  </p>

                  {/* Content Actions for Users */}
                  {n.category === "CONTENT" && (n.type?.toLowerCase()?.includes("rejected") || n.type?.toLowerCase()?.includes("revision")) && (
                    <div className="mt-3 flex items-center gap-2">
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           navigateTo("dashboard", "creator");
                           // In a real app we would pass the ID to creator state
                           triggerToast("Draft Ready", "Content re-loaded into workspace for adjustments.", "info");
                         }}
                         className="flex items-center gap-2 px-3 py-1.5 bg-purple-600/10 border border-purple-500/20 hover:bg-purple-600/20 text-purple-400 rounded-lg text-[10px] font-bold uppercase transition-all"
                       >
                         <Shield className="w-3 h-3" /> Edit & Resubmit
                       </button>
                    </div>
                  )}

                  {/* Moderation Actions UI */}
                  {n.type === "moderation_request" && isAdmin && (
                    <div className="mt-4 flex flex-col gap-3 p-3 bg-slate-950/50 border border-slate-800 rounded-2xl">
                      {!n.actionTaken ? (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-mono text-slate-500 uppercase font-black">Moderation Controls</span>
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>
                              <span className="text-[8px] text-rose-400 font-bold uppercase">Pending Review</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                takeModerationAction(n.id, n.targetId!, n.targetType!, true);
                              }}
                              className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600/20 hover:border-emerald-500/40 text-emerald-400 rounded-xl text-[10px] font-black font-space uppercase transition-all active:scale-95"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                const reason = prompt("Enter rejection reason:");
                                if (reason !== null) {
                                  takeModerationAction(n.id, n.targetId!, n.targetType!, false, reason);
                                }
                              }}
                              className="flex-1 flex items-center justify-center gap-2 py-2 bg-rose-600/10 border border-rose-500/20 hover:bg-rose-600/20 hover:border-rose-500/40 text-rose-400 rounded-xl text-[10px] font-black font-space uppercase transition-all active:scale-95"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                const reason = prompt("Enter revision instructions:");
                                if (reason !== null) {
                                  takeModerationAction(n.id, n.targetId!, n.targetType!, false, reason, true);
                                }
                              }}
                              className="flex-1 flex items-center justify-center gap-2 py-2 bg-amber-600/10 border border-amber-500/20 hover:bg-amber-600/20 hover:border-amber-500/40 text-amber-400 rounded-xl text-[10px] font-black font-space uppercase transition-all active:scale-95"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> Revise
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col gap-2 p-2 bg-slate-900/50 rounded-xl border border-slate-800">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                n.actionDecision === 'APPROVED' ? 'bg-emerald-500' : 
                                n.actionDecision === 'REJECTED' ? 'bg-rose-500' : 'bg-amber-500'
                              }`}></div>
                              <span className="text-[9px] font-mono text-slate-300 uppercase tracking-tighter">
                                Result: <strong className={
                                  n.actionDecision === 'APPROVED' ? 'text-emerald-400' : 
                                  n.actionDecision === 'REJECTED' ? 'text-rose-400' : 'text-amber-400'
                                }>{n.actionDecision}</strong>
                              </span>
                            </div>
                            <span className="text-[8px] text-slate-600 font-mono">Sync ID: {n.targetId?.substring(0, 4)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="w-2.5 h-2.5 text-slate-600" />
                            <span className="text-[9px] font-mono text-slate-500 italic">Moderated by @{n.actionBy}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions Slot */}
                <div className="flex flex-col gap-2 shrink-0">
                  {n.link && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNotificationClick(n);
                      }}
                      className="p-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-400 hover:text-purple-400 hover:border-purple-500/50 transition-all active:scale-95"
                      title="Navigate to destination"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  {!n.isRead && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(n.id);
                      }}
                      className="p-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all active:scale-95"
                      title="Mark as read"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 flex flex-col items-center justify-center text-slate-600 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl"
            >
              <Bell className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm font-space uppercase tracking-widest">No telemetry matching current filters.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pagination Controls */}
      {filteredNotifications.length > itemsPerPage && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <div className="text-sm text-slate-400 font-mono">
            Showing {(validPage - 1) * itemsPerPage + 1}&ndash;{Math.min(validPage * itemsPerPage, filteredNotifications.length)} of {filteredNotifications.length} notifications
          </div>
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 border border-slate-900 rounded-xl select-none">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={() => setCurrentPage(1)} 
              disabled={validPage === 1}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:pointer-events-none rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={() => setCurrentPage(v => Math.max(1, v - 1))} 
              disabled={validPage === 1}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:pointer-events-none rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>

            <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center min-w-[60px]">
              <span className="text-[10px] font-mono font-bold text-purple-400">{validPage} / {totalPages}</span>
            </div>

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={() => setCurrentPage(v => Math.min(totalPages, v + 1))} 
              disabled={validPage === totalPages}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:pointer-events-none rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={() => setCurrentPage(totalPages)} 
              disabled={validPage === totalPages}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:pointer-events-none rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      )}

    </div>
  );
};
