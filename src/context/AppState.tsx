import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  User, Blog, Photo, Video, Tag, Notification, Comment, SystemSettings, ToastAlert, Role, ContentStatus, SourceType 
} from "../types.js";
import { db, initDB } from "../lib/db.js";
import { updateBrowserFavicon, validateFaviconFile, DEFAULT_FAVICON_URL } from "../lib/favicon.js";

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
  editUserContent?: (item: any) => void;
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
  uploadFavicon: (file: File) => Promise<{ success: boolean; error?: string }>;
  resetFavicon: () => Promise<boolean>;
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
    mediaApproval: {
      photo: true,
      video: false,
      blog: true,
    },
  });

  // Database Initialization Logic
  useEffect(() => {
    const startDB = async () => {
      try {
        await initDB();
      } catch (err) {
        console.error("NightVerse Storage Init Error:", err);
      } finally {
        setDbLoaded(true);
      }
      
      try {
        // Post-init Sync
        const initialSettings = db.settings.get();
        if (initialSettings) {
          setSystemSettings(initialSettings);
          if (initialSettings.faviconUrl) {
            updateBrowserFavicon(initialSettings.faviconUrl, initialSettings.faviconUpdatedAt);
          }
        }

        // Check backend for stored custom favicon if available
        try {
          const favRes = await fetch("/api/settings/favicon");
          if (favRes.ok) {
            const favData = await favRes.json();
            if (favData.isCustom && initialSettings && favData.updatedAt > (initialSettings.faviconUpdatedAt || 0)) {
              db.settings.save({
                faviconUrl: favData.faviconUrl,
                faviconUpdatedAt: favData.updatedAt,
              });
              const updated = db.settings.get();
              if (updated) {
                setSystemSettings(updated);
                updateBrowserFavicon(updated.faviconUrl, updated.faviconUpdatedAt);
              }
            }
          }
        } catch {
          // Continue with local storage if server unreachable
        }
        
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
      } catch (err) {
        console.error("NightVerse Session Sync Error:", err);
      }
    };
    startDB();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('nv_')) {
        setDbActionCount(prev => prev + 1);
      }
    };
    const handleCustomDbUpdate = () => {
      setDbActionCount(prev => prev + 1);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('nightverse_tags_updated', handleCustomDbUpdate);
    window.addEventListener('nightverse_db_updated', handleCustomDbUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('nightverse_tags_updated', handleCustomDbUpdate);
      window.removeEventListener('nightverse_db_updated', handleCustomDbUpdate);
    };
  }, []);

  // Update browser favicon whenever systemSettings favicon changes
  useEffect(() => {
    if (systemSettings?.faviconUrl) {
      updateBrowserFavicon(systemSettings.faviconUrl, systemSettings.faviconUpdatedAt);
    }
  }, [systemSettings?.faviconUrl, systemSettings?.faviconUpdatedAt]);

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

  const editUserContent = (item: any) => {
    if (!user) return;
    if (item.userId !== user.id && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      triggerToast("Akses Ditolak", "Anda hanya dapat mengedit karya milik Anda sendiri.", "error");
      return;
    }
    // Navigate to Creator Dashboard and dispatch custom event for pre-filling edit form
    navigateTo("dashboard", "creator");
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("nightverse_edit_content", { detail: item }));
    }, 150);
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
    
    // Security check: Only Super Admin can modify Media Approval settings
    if (settings.mediaApproval && user.role !== "SUPER_ADMIN") {
      triggerToast("Access Denied 🔒", "Only Super Admin can modify Media Approval settings.", "error");
      return false;
    }

    db.settings.save(settings);
    const updated = db.settings.get();
    setSystemSettings(updated);

    // Synchronize to backend Express server if reachable
    try {
      if (settings.mediaApproval) {
        await fetch("/api/settings/approval", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userRole: user.role,
            mediaApproval: settings.mediaApproval,
          }),
        });
      }
    } catch {
      // Local IDB/localStorage persistence in db.settings.save is primary
    }

    triggerToast("Settings Applied Permanently", "Config registry updated in database.", "success");
    return true;
  };

  const uploadFavicon = async (file: File): Promise<{ success: boolean; error?: string }> => {
    if (!user || user.role !== "SUPER_ADMIN") {
      triggerToast("Akses Ditolak 🔒", "Hanya Super Admin yang dapat mengganti favicon website.", "error");
      return { success: false, error: "Hanya Super Admin yang dapat mengganti favicon website." };
    }

    const validation = validateFaviconFile(file);
    if (!validation.isValid) {
      triggerToast("Format File Tidak Valid", validation.error || "File tidak memenuhi syarat.", "error");
      return { success: false, error: validation.error };
    }

    try {
      // Read file as Base64 Data URL
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Send to backend for permanent filesystem storage
      let newFaviconUrl = "";
      let updatedAt = Date.now();

      try {
        const response = await fetch("/api/settings/favicon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userRole: user.role,
            fileBase64,
            fileName: file.name,
            mimeType: file.type,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Gagal mengunggah favicon ke backend storage.");
        }

        const data = await response.json();
        newFaviconUrl = data.faviconUrl;
        updatedAt = data.updatedAt;
      } catch (backendErr: any) {
        console.warn("Backend favicon sync warning, utilizing local base64 fallback:", backendErr);
        newFaviconUrl = fileBase64;
        updatedAt = Date.now();
      }

      // Persist into database system settings
      db.settings.save({
        faviconUrl: newFaviconUrl,
        faviconUpdatedAt: updatedAt,
      });

      const updated = db.settings.get();
      setSystemSettings(updated);

      // Apply directly to browser tab
      updateBrowserFavicon(newFaviconUrl, updatedAt);
      triggerDBSync();

      triggerToast("Favicon Diperbarui ✨", "Ikon website berhasil disimpan dan diterapkan pada seluruh halaman.", "success");
      return { success: true };
    } catch (err: any) {
      console.error("Upload favicon error:", err);
      triggerToast("Gagal Memperbarui Favicon", err.message || "Terjadi kesalahan saat memproses file favicon.", "error");
      return { success: false, error: err.message };
    }
  };

  const resetFavicon = async (): Promise<boolean> => {
    if (!user || user.role !== "SUPER_ADMIN") {
      triggerToast("Akses Ditolak 🔒", "Hanya Super Admin yang dapat mereset favicon website.", "error");
      return false;
    }

    try {
      try {
        await fetch("/api/settings/favicon/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userRole: user.role }),
        });
      } catch (backendErr) {
        console.warn("Backend reset error:", backendErr);
      }

      const defaultUrl = DEFAULT_FAVICON_URL;
      const updatedAt = Date.now();

      db.settings.save({
        faviconUrl: defaultUrl,
        faviconUpdatedAt: updatedAt,
      });

      const updated = db.settings.get();
      setSystemSettings(updated);
      updateBrowserFavicon(defaultUrl, updatedAt);
      triggerDBSync();

      triggerToast("Favicon Direset 🌌", "Ikon website berhasil dikembalikan ke default NightVerse.", "success");
      return true;
    } catch (err: any) {
      console.error("Reset favicon error:", err);
      triggerToast("Gagal Mereset Favicon", err.message || "Terjadi kesalahan saat mereset favicon.", "error");
      return false;
    }
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
        editUserContent,
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
        saveSystemSettings,
        uploadFavicon,
        resetFavicon
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
