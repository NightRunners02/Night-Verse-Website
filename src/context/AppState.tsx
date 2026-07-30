import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  User, Blog, Photo, Video, Tag, Notification, Comment, SystemSettings, ToastAlert, Role, ContentStatus, SourceType 
} from "../types.js";
import { db, initDB } from "../lib/db.js";

// Initialize local database handled inside AppStateProvider
// initDB(); 

interface AppContextType {
  theme: "dark" | "light";
  toggleTheme: () => void;
  user: User | null;
  token: string | null;
  login: (userData: any, sessionToken: string) => void;
  logout: () => void;
  updateLocalProfile: (updatedProfile: any) => void;
  setActiveBadge: (badgeId: string | null) => Promise<void>;
  activePath: string; 
  activeTab: string; 
  targetUserId: string | null;
  navigateTo: (path: string, tab?: string) => void;
  viewProfile: (userId: string) => void;
  dbLoaded: boolean;
  
  // Real-time notifications and alerts
  notifications: Notification[];
  unreadNotificationsCount: number;
  toastAlerts: ToastAlert[];
  triggerToast: (title: string, message: string, type?: "success" | "error" | "info") => void;
  dismissToast: (id: string) => void;
  refreshNotifications: () => Promise<void>;
  markNotificationsAsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  createNotification: (notification: Omit<Notification, "id" | "createdAt" | "isRead">) => void;
  
  // Content Lightbox
  focusedContent: { type: "blog" | "photo" | "video"; item: any } | null;
  setFocusedContent: (content: { type: "blog" | "photo" | "video"; item: any } | null) => void;

  // Search Results State
  globalSearchQuery: string;
  setGlobalSearchQuery: (q: string) => void;
  searchResults: { users: any[]; blogs: any[]; photos: any[]; videos: any[]; tags: any[] };
  triggerSearch: (q: string) => Promise<void>;

  // Follow Synchronization
  followActionCount: number;
  toggleFollow: (followingId: string) => Promise<boolean>;

  // Global DB Sync Trigger (Real-time updates)
  dbActionCount: number;
  triggerDBSync: () => void;
  takeModerationAction: (notificationId: string, targetId: string, targetType: "blog" | "photo" | "video", approved: boolean, reason?: string, isRevision?: boolean) => Promise<boolean>;

  // Real-time custom settings
  systemSettings: SystemSettings;
  saveSystemSettings: (settings: Partial<SystemSettings>) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dbLoaded, setDbLoaded] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("nv_token"));
  const [activePath, setActivePath] = useState<string>("landing");
  const [activeTab, setActiveTab] = useState<string>("explore");
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toastAlerts, setToastAlerts] = useState<ToastAlert[]>([]);
  const [focusedContent, setFocusedContent] = useState<{ type: "blog" | "photo" | "video"; item: any } | null>(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [followActionCount, setFollowActionCount] = useState(0);
  const [dbActionCount, setDbActionCount] = useState(0);
  const [searchResults, setSearchResults] = useState<{ users: any[]; blogs: any[]; photos: any[]; videos: any[]; tags: any[] }>({
    users: [], blogs: [], photos: [], videos: [], tags: []
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    websiteName: "NightVerse",
    logoText: "NIGHTVERSE",
    faviconEmoji: "🌌",
    primaryColor: "purple-600",
    secondaryColor: "cyan-400",
    homepageBanner: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1500",
    heroTitle: "Universal Hub for Modern Masters",
    heroSubtitle: "Welcome to the future of creative collaboration. Empowering neon creators, visual designers, and sound artists worldwide.",
    footerText: "© 2026 NightVerse Enterprise. All Rights Reserved. Empowered by Google AI Studio.",
    seoDescription: "NightVerse - The premier creative portfolio platform for dark mode enthusiasts, cyberpunk artists, and innovative modern developers.",
    seoKeywords: "cyberpunk, designer portfolio, neon artistry, soundscapes, dark design",
    ogImage: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1200",
    maxImageSizeMB: 10,
    maxVideoSizeMB: 100,
    allowedFormats: ["jpg", "jpeg", "png", "gif", "mp4", "mov"],
    smtpHost: "smtp.nightverse.com",
    smtpPort: 587,
    enableEmailVerification: true,
    enablePushNotifications: false,
    enableRealtimeStream: true,
  });

  // Database Initialization Logic
  useEffect(() => {
    const startDB = async () => {
      await initDB();
      setDbLoaded(true);
      
      // Post-init Sync
      setSystemSettings(db.settings.get());
      
      const storedToken = localStorage.getItem("nv_token");
      if (storedToken) {
        const foundUser = db.users.getById(storedToken);
        if (foundUser) {
          setUser(foundUser);
          setToken(storedToken);
          setActivePath("dashboard");
        } else {
          localStorage.removeItem("nv_token");
          setToken(null);
          setUser(null);
          setActivePath("landing");
        }
      }
    };
    startDB();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('nv_')) {
        setDbActionCount(prev => prev + 1);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Toggle CSS Theme Class
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    const html = document.documentElement;
    if (newTheme === "light") {
      html.classList.remove("dark");
    } else {
      html.classList.add("dark");
    }
    try {
      localStorage.setItem("nv_theme", newTheme);
    } catch(err) {
      console.warn(err);
    }
  };

  // Auth Session Logic
  useEffect(() => {
    if (!dbLoaded) return;
    const checkAuth = () => {
      const storedToken = localStorage.getItem("nv_token");
      if (!storedToken) {
        setToken(null);
        setUser(null);
        if (activePath !== "landing") setActivePath("landing");
        return;
      }

      const foundUser = db.users.getById(storedToken);
      if (foundUser) {
        setUser(foundUser);
        setToken(storedToken);
        if (activePath === "landing") setActivePath("dashboard");
      }
    };

    checkAuth();
  }, [dbLoaded]);

  // Sync System Settings from local db
  useEffect(() => {
    if (dbLoaded) {
      setSystemSettings(db.settings.get());
    }
  }, [dbLoaded]);

  const createNotification = (notification: Omit<Notification, "id" | "createdAt" | "isRead">) => {
    // Check user preferences before adding
    const targetUser = db.users.getById(notification.userId);
    if (targetUser?.profile?.notificationPreferences) {
      const prefs = targetUser.profile.notificationPreferences;
      const category = notification.category?.toLowerCase() as keyof typeof prefs;
      if (category && prefs[category] === false) return;
    }

    db.notifications.add(notification);
    refreshNotifications();
  };

  const markAsRead = async (id: string) => {
    db.notifications.markAsRead(id);
    refreshNotifications();
  };

  const groupNotifications = (raw: Notification[]): Notification[] => {
    const unread = raw.filter(n => !n.isRead);
    const read = raw.filter(n => n.isRead);

    const grouped: { [key: string]: Notification } = {};
    const finalUnread: Notification[] = [];

    unread.forEach(n => {
      if (n.type === 'LIKE' || n.type === 'FOLLOW' || n.type === 'COMMENT') {
        const groupKey = `${n.type}-${n.link || n.userId}`;
        if (grouped[groupKey]) {
          grouped[groupKey].groupCount = (grouped[groupKey].groupCount || 1) + 1;
          // Update title/message for group
          if (n.type === 'LIKE') {
            grouped[groupKey].title = "New Likes";
            grouped[groupKey].message = `${grouped[groupKey].groupCount} users liked your content.`;
          } else if (n.type === 'FOLLOW') {
            grouped[groupKey].title = "New Followers";
            grouped[groupKey].message = `${grouped[groupKey].groupCount} users started following you.`;
          }
        } else {
          grouped[groupKey] = { ...n, groupCount: 1 };
          finalUnread.push(grouped[groupKey]);
        }
      } else {
        finalUnread.push({ ...n });
      }
    });

    return [...finalUnread, ...read].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  // Sync User Notifications (Polling local db)
  useEffect(() => {
    if (!token || !user) {
      setNotifications([]);
      return;
    }

    const fetchNotifications = () => {
      const rawNotes = db.notifications.getByUserId(user.id, user.role);
      setNotifications(groupNotifications(rawNotes));
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [token, user, dbActionCount]);

  useEffect(() => {
    // Restore theme
    const savedTheme = localStorage.getItem("nv_theme") as "dark" | "light";
    if (savedTheme) {
      setTheme(savedTheme);
      const html = document.documentElement;
      if (savedTheme === "light") {
        html.classList.remove("dark");
      } else {
        html.classList.add("dark");
      }
    }
  }, []);

  const triggerToast = (title: string, message: string, type: "success" | "error" | "info" = "info") => {
    const id = Date.now().toString();
    // Only one notification at a time: replace previous ones
    setToastAlerts([{ id, title, message, type }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToastAlerts((prev) => prev.filter((t) => t.id !== id));
  };

  const login = (userData: any, sessionToken: string) => {
    try {
      localStorage.setItem("nv_token", sessionToken);
    } catch(err) {
      console.warn("Quota Exceeded", err);
    }
    setToken(sessionToken);
    setUser(userData);
    triggerToast("Authentication Succeeded", `Welcome back, ${userData.username}!`, "success");
    setActivePath("dashboard");
  };

  const logout = () => {
    localStorage.removeItem("nv_token");
    setToken(null);
    setUser(null);
    setActivePath("landing");
    triggerToast("Logged Out Successfully", "Your session was securely cleared.", "info");
  };

  const updateLocalProfile = (updatedProfile: any) => {
    if (user) {
      setUser({
        ...user,
        profile: updatedProfile,
      });
    }
  };

  const setActiveBadge = async (badgeId: string | null) => {
    if (!user) return;
    try {
      const updatedProfile = {
        ...user.profile,
        activeBadge: badgeId || undefined
      };
      
      db.users.update(user.id, { profile: updatedProfile });
      updateLocalProfile(updatedProfile);
      triggerDBSync();
      triggerToast("Badge Updated", badgeId ? `"${badgeId}" is now your active badge.` : "Active badge cleared.", "success");
    } catch (error) {
      console.error("Set active badge error:", error);
      triggerToast("Update Failed", "Could not save your badge preference.", "error");
    }
  };

  const navigateTo = (path: string, tab: string = "explore") => {
    setActivePath(path);
    if (tab) {
      setActiveTab(tab);
    }
    // Clear target user if not explicitly navigating to profile-overview
    if (tab !== "profile-overview") {
      setTargetUserId(null);
    }
    // Autoscroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const viewProfile = (userId: string) => {
    if (user && userId === user.id) {
      navigateTo("dashboard", "profile-settings");
      return;
    }
    setTargetUserId(userId);
    navigateTo("dashboard", "profile-overview");
  };

  const refreshNotifications = async () => {
     if (!user) return;
     const notes = db.notifications.getByUserId(user.id, user.role);
     setNotifications(groupNotifications(notes));
  };

  const markNotificationsAsRead = async () => {
    if (!user) return;
    try {
      db.notifications.markAllRead(user.id, user.role);
      await refreshNotifications();
      triggerDBSync();
      triggerToast("Notifications Updated", "All records have been marked as read.", "success");
    } catch (error) {
      console.error("Mark all as read error:", error);
      triggerToast("Update Failed", "Could not synchronize read states with the database.", "error");
    }
  };

  const clearNotifications = async () => {
    if (!user) return;
    try {
      db.notifications.clearAll(user.id, user.role);
      await refreshNotifications();
      triggerDBSync();
      triggerToast("Notifications Cleared", "All notifications have been cleared successfully.", "success");
    } catch (error) {
      console.error("Clear all notifications error:", error);
      triggerToast("Action Failed", "Could not remove notifications from the database.", "error");
    }
  };

  const triggerDBSync = () => setDbActionCount(prev => prev + 1);

  const takeModerationAction = async (notificationId: string, targetId: string, targetType: "blog" | "photo" | "video", approved: boolean, reason?: string, isRevision?: boolean) => {
    if (!user || !["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(user.role)) return false;
    
    // Check if notification still exists and not taken
    const allNotes = db.notifications.getAll();
    const note = allNotes.find(n => n.id === notificationId);
    if (!note || note.actionTaken) {
      if (note?.actionTaken) {
        triggerToast("Action Already Taken", `This request was already processed by @${note.actionBy || "another admin"}.`, "info");
      }
      return false;
    }

    const status = isRevision ? "REVISION" : (approved ? "APPROVED" : "REJECTED");
    if (targetType === "blog") db.blogs.update(targetId, { status, rejectReason: reason });
    else if (targetType === "photo") db.photos.update(targetId, { status, rejectReason: reason });
    else if (targetType === "video") db.videos.update(targetId, { status, rejectReason: reason });

    // Mark notification as taken with decision info
    db.notifications.markAsTaken(notificationId, user.username, status);
    
    // Log the action
    db.logs.add("MODERATION", `${user.username} (via Notifications) reviewed ${targetType} ${targetId} as ${status}.`, user.username);

    triggerToast(
      isRevision ? "Revision Requested" : (approved ? "Content Approved" : "Content Rejected"), 
      `Decision synchronized successfully.`, 
      approved ? "success" : "info"
    );

    refreshNotifications();
    triggerDBSync();
    return true;
  };

  const toggleFollow = async (followingId: string) => {
    if (!user || user.id === followingId) return false;
    const isNewFollow = db.follows.toggle(user.id, followingId);
    setFollowActionCount(prev => prev + 1);
    
    if (isNewFollow) {
      createNotification({
        userId: followingId,
        triggeredById: user.id,
        triggeredByAvatar: user.profile?.avatarUrl,
        title: "New Follower",
        message: `${user.username} started following you.`,
        category: "SOCIAL",
        type: "FOLLOW",
        link: `PROFILE:${user.id}`
      });
    }
    return isNewFollow;
  };

  const triggerSearch = async (q: string) => {
    setGlobalSearchQuery(q);
    if (!q.trim()) {
      setSearchResults({ users: [], blogs: [], photos: [], videos: [], tags: [] });
      return;
    }
    
    const results = {
      users: db.users.getAll().filter(u => 
        u.username.toLowerCase().includes(q.toLowerCase()) || 
        u.profile?.fullName?.toLowerCase().includes(q.toLowerCase())
      ),
      blogs: db.blogs.getAll().filter(b => b.title?.toLowerCase()?.includes(q.toLowerCase()) || b.description?.toLowerCase()?.includes(q.toLowerCase())),
      photos: db.photos.getAll().filter(p => p.title?.toLowerCase()?.includes(q.toLowerCase())),
      videos: db.videos.getAll().filter(v => v.title?.toLowerCase()?.includes(q.toLowerCase())),
      tags: db.tags.getAll().filter(t => t.name?.toLowerCase()?.includes(q.toLowerCase()))
    };
    setSearchResults(results);
  };

  const saveSystemSettings = async (settings: Partial<SystemSettings>) => {
    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) return false;
    db.settings.save(settings);
    setSystemSettings(db.settings.get());
    triggerToast("Settings Applied Permanently", "Config registry updated in local storage.", "success");
    return true;
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        user,
        token,
        login,
        logout,
        updateLocalProfile,
        setActiveBadge,
        activePath,
        activeTab,
        targetUserId,
        navigateTo,
        viewProfile,
        dbLoaded,
        notifications,
        unreadNotificationsCount,
        toastAlerts,
        triggerToast,
        dismissToast,
        refreshNotifications,
        markNotificationsAsRead,
        clearNotifications,
        markAsRead,
        createNotification,
        focusedContent,
        setFocusedContent,
        globalSearchQuery,
        setGlobalSearchQuery,
        followActionCount,
        toggleFollow,
        dbActionCount,
        triggerDBSync,
        takeModerationAction,
        searchResults,
        triggerSearch,
        systemSettings,
        saveSystemSettings
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppState must be used inside the AppStateProvider scope");
  }
  return context;
};
