import React, { useState } from "react";
import {
  Compass, Activity, PlusSquare, Tags, User, ShieldAlert, BadgeCheck, ListCollapse, ShieldCheck,
  LogOut, Bell, Search, Sun, Moon, Sparkles, CheckCheck, Play, Users, Shield, Settings, AlertTriangle,
  Menu, X, ArrowRight
} from "lucide-react";
import { useAppState } from "../context/AppState.js";
import { Role } from "../types.js";
import { db } from "../lib/db.js";
import { RoleBadge } from "./RoleBadge.js";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const {
    user, logout, activeTab, navigateTo, viewProfile, theme, toggleTheme,
    notifications, unreadNotificationsCount, markNotificationsAsRead,
    globalSearchQuery, searchResults, triggerSearch, setFocusedContent,
    systemSettings, followActionCount, toggleFollow
  } = useAppState();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const [followedUserIds, setFollowedUserIds] = useState<Set<string>>(new Set());

  // Keep followed set in sync
  React.useEffect(() => {
    if (user) {
      setFollowedUserIds(new Set(db.follows.getFollowing(user.id)));
    }
  }, [user, followActionCount]);

  const handleFollowClick = async (e: React.MouseEvent, targetId: string) => {
    e.stopPropagation();
    await toggleFollow(targetId);
  };

  if (!user) return null;

  // Resolve user clearance levels
  const isElevated = user.role === "SUPER_ADMIN" || user.role === "ADMIN" || user.role === "MODERATOR";

  // Navigation Items according to standard Role-Based Access Controls
  const generalSidebarMenu = [
    { label: "Explore Feed", tab: "explore", icon: Compass, glow: false },
    { label: "Creator Directory", tab: "user-directory", icon: Users, glow: false },
    { label: "Create Work", tab: "creator", icon: PlusSquare, glow: true },
    { label: "Tags Directory", tab: "tags", icon: Tags, glow: false },
    { label: "Profile Settings", tab: "profile-settings", icon: Settings, glow: false },
    { label: "Notifications", tab: "notifications", icon: Bell, glow: false },
  ];

  const adminSidebarMenu = [
    { label: "Dashboard", tab: "admin-dashboard", icon: Activity, glow: false },
    { label: "Directory", tab: "admin-directory", icon: Users, glow: false },
    { label: "Content Center", tab: "admin-content", icon: BadgeCheck, glow: false },
    { label: "Reports", tab: "admin-reports", icon: AlertTriangle, glow: false },
    { label: "Badges", tab: "admin-badges", icon: ShieldCheck, glow: false },
    { label: "System Settings", tab: "admin-settings", icon: Settings, glow: false },
    { label: "Audit Center", tab: "admin-audit", icon: Shield, glow: false },
    ...(user.role === "SUPER_ADMIN" ? [{ label: "Super Admin Tools", tab: "admin-super", icon: ShieldAlert, glow: true }] : []),
  ];

  const handleNav = (tab: string) => {
    navigateTo("dashboard", tab);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans select-none overflow-x-hidden">

      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ------------------ collapsible sidebar left ------------------ */}
      <aside
        className={`bg-slate-900 border-r border-slate-800 backdrop-blur-2xl h-[100dvh] sticky top-0 self-start flex flex-col transition-all duration-300 z-50 flex-shrink-0
          ${sidebarCollapsed ? "w-16 md:w-20 px-2 md:px-3" : "w-64 px-5"}
          ${mobileMenuOpen ? "max-md:fixed max-md:left-0 max-md:translate-x-0" : "max-md:hidden"}
        `}
        id="dashboard-sidebar-rail"
      >
        <div className="flex flex-col h-full py-6 overflow-hidden">
          <div className="flex flex-col gap-6 flex-1 min-h-0">

            {/* Logo brand mapping */}
            <div className={`flex items-center ${sidebarCollapsed && !mobileMenuOpen ? "justify-center" : "justify-between gap-2.5"} h-10 px-2 flex-shrink-0`}>
              {(!sidebarCollapsed || mobileMenuOpen) && (
                <div className="flex items-center gap-2 select-none pointer-events-none">
                  {systemSettings?.logoUrl ? (
                    <img src={systemSettings.logoUrl || undefined} className="w-8 h-8 rounded-lg object-cover" alt="app logo" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 p-[1px]">
                      <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center font-space font-bold uppercase text-[10px] text-transparent bg-clip-text bg-gradient-to-tr from-purple-400 to-indigo-300">
                        {systemSettings?.logoText?.substring(0, 2) || "NV"}
                      </div>
                    </div>
                  )}
                  <span className="font-space font-black tracking-wider uppercase text-sm bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-400">
                    {systemSettings?.logoText || "NIGHTVERSE"}
                  </span>
                </div>
              )}

              {sidebarCollapsed && !mobileMenuOpen && (
                <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center text-purple-400 font-bold text-xs">
                   {systemSettings?.logoText?.substring(0, 2) || "NV"}
                </div>
              )}

              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden md:flex p-1.5 text-slate-500 hover:text-white cursor-pointer active:scale-95 transition-all"
                id="btn-toggle-sidebar"
              >
                <ListCollapse className={`w-5 h-5 transition-transform ${sidebarCollapsed ? "rotate-0" : "rotate-180"}`} />
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                }}
                className="md:hidden p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Items menu */}
            <nav className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar pr-1">
              <span className={`text-[9px] uppercase tracking-widest font-mono text-slate-600 font-bold block mb-3 px-3 ${sidebarCollapsed && !mobileMenuOpen ? "text-center" : ""}`}>
                {sidebarCollapsed && !mobileMenuOpen ? "•••" : "General Menu"}
              </span>
              {generalSidebarMenu.map((item) => {
                const IconComp = item.icon;
                const isSelected = activeTab === item.tab;
                return (
                  <button
                    key={item.tab}
                    onClick={() => handleNav(item.tab)}
                    className={`w-full flex items-center gap-3 py-3 px-3.5 rounded-xl transition-all font-semibold font-space text-[12px] uppercase cursor-pointer ${
                      sidebarCollapsed && !mobileMenuOpen ? "justify-center" : ""
                    } ${
                      isSelected
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-500/10 border border-purple-500/20"
                        : "text-slate-400 hover:bg-slate-900/60 hover:text-white"
                    }`}
                    id={`btn-menu-${item.tab}`}
                    title={sidebarCollapsed ? item.label : ""}
                  >
                    <IconComp className={`w-4 h-4 flex-shrink-0 ${isSelected ? "text-white" : (item.glow ? "text-purple-400" : "text-slate-400")}`} />
                    {(!sidebarCollapsed || mobileMenuOpen) && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}

              {/* Integrated Logout inside General Menu for better mobile/desktop flow */}
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className={`w-full flex items-center gap-3 py-3.5 px-4 mt-2 rounded-2xl transition-all font-bold font-space text-[12px] uppercase cursor-pointer border border-rose-500/10 bg-rose-500/5 text-rose-500 hover:bg-rose-500/10 active:scale-95 ${
                  sidebarCollapsed && !mobileMenuOpen ? "justify-center" : ""
                }`}
                id="btn-sidebar-integrated-logout"
                title={sidebarCollapsed ? "Logout System" : ""}
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                {(!sidebarCollapsed || mobileMenuOpen) && <span className="truncate">Logout System</span>}
              </button>

              {/* RBAC protected admin routes view panels */}
              {isElevated && (
                <div className="pt-6 space-y-1.5">
                  <span className={`text-[9px] uppercase tracking-widest font-mono text-rose-500 font-bold block mb-3 px-3 ${sidebarCollapsed && !mobileMenuOpen ? "text-center" : ""}`}>
                    {sidebarCollapsed && !mobileMenuOpen ? "ADM" : "Admin Rails [RBAC]"}
                  </span>
                  {adminSidebarMenu.map((item) => {
                    const IconComp = item.icon;
                    const isSelected = activeTab === item.tab;
                    return (
                      <button
                        key={item.tab}
                        onClick={() => handleNav(item.tab)}
                        className={`w-full flex items-center gap-3 py-3 px-3.5 rounded-xl transition-all font-semibold font-space text-[12px] uppercase cursor-pointer ${
                          sidebarCollapsed && !mobileMenuOpen ? "justify-center" : ""
                        } ${
                          isSelected
                            ? "bg-rose-600 text-white shadow-lg shadow-rose-500/10 border border-rose-500/20"
                            : "text-slate-400 hover:bg-slate-900/60 hover:text-white"
                        }`}
                        id={`btn-menu-${item.tab}`}
                        title={sidebarCollapsed ? item.label : ""}
                      >
                        <IconComp className="w-4 h-4 flex-shrink-0" />
                        {(!sidebarCollapsed || mobileMenuOpen) && <span className="truncate">{item.label}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </nav>
          </div>
        </div>
      </aside>

      {/* ------------------ Core view container right ------------------ */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen relative p-0 md:p-4 bg-slate-950">

        {/* top header navigation dashboard */}
        <header className="h-14 md:h-20 bg-slate-900/40 border-b border-slate-900 md:border md:rounded-3xl p-3 md:p-4 flex items-center justify-between gap-2.5 md:gap-4 sticky top-0 md:top-4 z-40 backdrop-blur-xl mb-0 md:mb-6">

          <div className="flex items-center gap-2 flex-1 md:flex-initial">
            {/* Mobile Menu Icon */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 bg-slate-950 rounded-lg border border-slate-850 text-slate-400 hover:text-white transition-all active:scale-90 shrink-0"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Global Search Input - Collapsible */}
            <div className={`relative transition-all duration-300 ${isSearchExpanded ? "w-full max-w-[140px] md:max-w-sm" : "w-9 md:w-12 h-9 md:h-12"}`}>
              <div className="relative w-full h-full">
                <button 
                  onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                  className={`absolute left-0 top-0 bottom-0 z-20 flex items-center justify-center transition-all ${isSearchExpanded ? "w-9 text-purple-400" : "w-full h-full bg-slate-950 rounded-lg md:rounded-2xl border border-slate-850 text-slate-400 hover:text-white"}`}
                  title="Toggle search"
                >
                  <Search className="w-3.5 h-3.5 md:w-5 h-5" />
                </button>
                
                <input
                  type="text"
                  placeholder="Search..."
                  value={globalSearchQuery}
                  onChange={(e) => {
                    triggerSearch(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                  onFocus={() => setShowSearchDropdown(true)}
                  className={`w-full h-full text-[9px] md:text-xs py-1.5 md:py-2.5 pl-9 pr-3 bg-slate-950 rounded-lg md:rounded-2xl border border-slate-850 focus:outline-none focus:border-purple-600 text-slate-100 placeholder-slate-500 font-mono transition-all duration-300 ${isSearchExpanded ? "opacity-100 scale-100 z-10" : "opacity-0 scale-95 pointer-events-none z-0"}`}
                  id="global-search-input"
                />
              </div>

              {/* Instant Search Dropdown results overlay */}
              {showSearchDropdown && globalSearchQuery && (
                <div
                  className="fixed md:absolute top-19 md:top-13 left-3 md:left-0 right-3 md:right-auto md:w-full max-h-[60vh] md:max-h-[300px] overflow-y-auto bg-slate-900 rounded-xl md:rounded-2xl p-4 md:p-4 border border-slate-800 shadow-2xl z-50 text-xs custom-scrollbar"
                  id="search-dropdown-popup"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3 select-none">
                    <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-widest">Query directory outputs</span>
                    <button onClick={() => setShowSearchDropdown(false)} className="text-[10px] text-slate-500 hover:text-slate-350 cursor-pointer">Close</button>
                  </div>

                  {/* Users list matching */}
                  {searchResults.users?.length > 0 && (
                    <div className="mb-4">
                      <span className="text-[9px] font-mono text-slate-600 uppercase block mb-1">Creators</span>
                      {searchResults.users.map((x) => {
                        const isFollowed = followedUserIds.has(x.id);
                        return (
                          <div
                            key={x.id}
                            onClick={() => {
                              viewProfile(x.id);
                              setShowSearchDropdown(false);
                            }}
                            className="p-1 px-2.5 hover:bg-slate-950 rounded-lg cursor-pointer text-slate-300 font-bold flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <div className="w-5 h-5 rounded-full bg-slate-800 overflow-hidden shrink-0">
                                <img src={x.profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${x.username}`} className="w-full h-full object-cover" alt="avatar" />
                              </div>
                              <span className="truncate">@{x.username}</span>
                              <RoleBadge role={x.profile?.activeBadge || x.role} size="xs" />
                            </div>
                            {user && user.id !== x.id && (
                              <button
                                onClick={(e) => handleFollowClick(e, x.id)}
                                className={`px-2 py-0.5 rounded text-[8px] font-black font-space uppercase transition-all ${
                                  isFollowed
                                    ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                    : 'bg-white text-slate-950 hover:bg-slate-200'
                                }`}
                              >
                                {isFollowed ? 'Unfollow' : 'Follow'}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Blogs lists matching */}
                  {searchResults.blogs?.length > 0 && (
                    <div className="mb-4">
                      <span className="text-[9px] font-mono text-slate-600 uppercase block mb-1">Blogs articles</span>
                      {searchResults.blogs.map((b) => (
                        <div
                          key={b.id}
                          onClick={() => {
                            setFocusedContent({ type: "blog", item: b });
                            setShowSearchDropdown(false);
                          }}
                          className="p-1.5 hover:bg-slate-950 rounded-lg cursor-pointer text-slate-300 font-semibold truncate"
                        >
                          📝 {b.title}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Photos lists matching */}
                  {searchResults.photos?.length > 0 && (
                    <div className="mb-4">
                      <span className="text-[9px] font-mono text-slate-600 uppercase block mb-1">Photography prints</span>
                      {searchResults.photos.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setFocusedContent({ type: "photo", item: p });
                            setShowSearchDropdown(false);
                          }}
                          className="p-1.5 hover:bg-slate-950 rounded-lg cursor-pointer text-slate-300 font-semibold truncate"
                        >
                          📸 {p.title}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Videos lists matching */}
                  {searchResults.videos?.length > 0 && (
                    <div className="mb-4">
                      <span className="text-[9px] font-mono text-slate-600 uppercase block mb-1">AV reels content</span>
                      {searchResults.videos.map((v) => (
                        <div
                          key={v.id}
                          onClick={() => {
                            setFocusedContent({ type: "video", item: v });
                            setShowSearchDropdown(false);
                          }}
                          className="p-1.5 hover:bg-slate-950 rounded-lg cursor-pointer text-slate-300 font-semibold truncate"
                        >
                          🎥 {v.title}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tags list matching */}
                  {searchResults.tags?.length > 0 && (
                    <div>
                      <span className="text-[9px] font-mono text-slate-600 uppercase block mb-1">Tags</span>
                      <div className="flex flex-wrap gap-1">
                        {searchResults.tags.map((t) => (
                          <span
                            key={t.id}
                            onClick={() => {
                              navigateTo("dashboard", "tags");
                              setShowSearchDropdown(false);
                            }}
                            className="px-2 py-0.5 bg-slate-950 text-purple-400 hover:text-white rounded text-[10px] uppercase font-mono cursor-pointer"
                          >
                            #{t.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty check */}
                  {!searchResults.users?.length && !searchResults.blogs?.length && !searchResults.photos?.length && !searchResults.videos?.length && !searchResults.tags?.length && (
                    <p className="text-center text-xs text-slate-500 py-4">No matching indices found inside NightVerse</p>
                  )}

                </div>
              )}
            </div>
          </div>

          {/* Right Header Navigation Items */}
          <div className="flex items-center gap-3">

            {/* Mobile Profile shortcut (Replacing theme toggle for mobile UX) */}
            <div
              className="md:hidden w-9 h-9 rounded-lg bg-slate-950 border border-slate-850 flex items-center justify-center overflow-hidden"
              id="btn-mobile-profile-slot"
            >
              <img
                src={user.profile?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                className="w-full h-full object-cover pointer-events-none"
                alt="mobile-avatar"
              />
            </div>

            {/* Notifications feed dropdown bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotificationsDropdown(!showNotificationsDropdown);
                  if (!showNotificationsDropdown) markNotificationsAsRead();
                }}
                className="p-2 w-9 h-9 rounded-lg bg-slate-950 border border-slate-850 hover:bg-slate-900 cursor-pointer flex items-center justify-center text-xs relative"
                id="btn-notifications-indicator"
              >
                <Bell className="w-3.5 h-3.5 text-slate-300 bg-transparent rotate-0" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-purple-650 text-[9px] text-white flex items-center justify-center font-bold font-mono rounded-full animate-bounce">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {showNotificationsDropdown && (
                <div
                  className="fixed md:absolute left-3 md:left-auto right-3 md:right-0 top-19 md:top-13 md:w-80 max-h-[60vh] md:max-h-[400px] overflow-y-auto bg-slate-900 border border-slate-850 rounded-xl md:rounded-2xl p-4 md:p-4 shadow-2xl z-50 text-xs text-slate-300 custom-scrollbar"
                  id="notifications-dropdown"
                >
                  <div className="flex items-center justify-between border-b border-sidebar border-slate-800 pb-2 mb-2 select-none">
                    <span className="font-bold text-slate-200">Personal Ticker Bells</span>
                    <button
                      onClick={() => setShowNotificationsDropdown(false)}
                      className="text-[10px] text-slate-500 hover:text-white cursor-pointer"
                    >
                      Hide
                    </button>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-slate-550 text-xs">No pending notifications ticker currently.</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 mt-2">
                        {notifications.slice(0, 5).map((n) => (
                          <div key={n.id} className="p-2.5 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800/60 rounded-xl transition-all cursor-pointer" onClick={() => handleNav("notifications")}>
                            <h6 className="font-bold text-slate-100 flex items-center gap-1">
                              {!n.isRead && <span className="w-1.5 h-1.5 bg-purple-500 rounded-full inline-block"></span>}
                              {n.title}
                            </h6>
                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{n.message}</p>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          handleNav("notifications");
                          setShowNotificationsDropdown(false);
                        }}
                        className="w-full mt-4 py-2 bg-slate-850 hover:bg-slate-800 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        Viewing all signals <ArrowRight className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* User credentials badge (Desktop only now) */}
            <div
              onClick={() => navigateTo("dashboard", "profile-settings")}
              className="hidden md:flex items-center gap-2 h-12 cursor-pointer transition-all active:scale-95 group"
            >
              <div className="relative">
                <img
                  src={user.profile?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                  className="w-11 h-11 rounded-full object-cover border-2 border-purple-500/30 group-hover:border-purple-500 transition-colors shadow-lg shadow-black/40"
                  alt="user"
                />
              </div>
              <div className="flex flex-col items-start leading-none gap-0.5 bg-slate-900/60 p-3 pr-4 rounded-2xl border border-slate-800">
                <span className="text-xs font-black font-space text-slate-100 uppercase tracking-tight truncate max-w-[100px]">
                  {user.profile?.fullName || user.username}
                </span>
                <RoleBadge role={user.profile?.activeBadge || user.role} size="xs" />
              </div>
            </div>

          </div>

        </header>

        {/* Unified sub-view inject workspace body */}
        <main className="flex-1 min-w-0" id="dashboard-main-content-workspace">
          {children}
        </main>

        {/* LOGOUT CONFIRMATION MODAL */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
              onClick={() => setShowLogoutConfirm(false)}
            />
            <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-3xl flex flex-col items-center gap-6 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center border border-rose-500/20">
                <AlertTriangle className="w-8 h-8 text-rose-500 animate-pulse" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-black font-space uppercase tracking-tight text-white">System Exit?</h3>
                <p className="text-slate-400 text-xs md:text-sm leading-relaxed px-4">
                  Are you sure you want to terminate your session in NightVerse? Unsaved creator progress might be lost.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3.5 px-6 rounded-2xl font-bold text-xs uppercase bg-slate-850 hover:bg-slate-800 text-slate-300 transition-all active:scale-95"
                >
                  Stay in System
                </button>
                <button
                  onClick={logout}
                  className="flex-1 py-3.5 px-6 rounded-2xl font-bold text-xs uppercase bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-900/20 transition-all active:scale-95"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
