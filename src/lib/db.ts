import { 
  User, Blog, Photo, Video, Tag, Notification, Comment, SystemSettings, Role, ContentStatus 
} from "../types.js";
import { hashPassword } from "./crypto.js";

// Keys for Storage
const KEYS = {
  USERS: "nv_users",
  PROFILES: "nv_profiles",
  BLOGS: "nv_blogs",
  PHOTOS: "nv_photos",
  VIDEOS: "nv_videos",
  TAGS: "nv_tags",
  NOTIFICATIONS: "nv_notifications",
  COMMENTS: "nv_comments",
  FOLLOWS: "nv_follows",
  REPORTS: "nv_reports",
  LOGS: "nv_logs",
  SYSTEM_SETTINGS: "nv_system_settings"
};

// Memory Cache for Synchronous Access
const CACHE: Record<string, any> = {};
let dbInitialized = false;

// Simple IDB wrapper for large data sets
const IDB_NAME = "NightVerseDB";
const IDB_VERSION = 1;
const STORE_NAME = "kv";

const getDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const idb = {
  get: async <T>(key: string): Promise<T | null> => {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const request = transaction.objectStore(STORE_NAME).get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error("IDB Get Error:", err);
      return null;
    }
  },
  set: async <T>(key: string, value: T): Promise<void> => {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const request = transaction.objectStore(STORE_NAME).put(value, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error("IDB Set Error:", err);
    }
  }
};

// Generic helper to get data (sync from cache, defaults to localStorage if not in cache)
const get = <T>(key: string, defaultValue: T): T => {
  if (CACHE[key] !== undefined) return CACHE[key];
  
  const stored = localStorage.getItem(key);
  if (!stored) return defaultValue;
  try {
    const parsed = JSON.parse(stored);
    CACHE[key] = parsed;
    return parsed;
  } catch {
    return defaultValue;
  }
};

// Generic helper to save data (sync to cache + localStorage fallback, async to IDB)
const set = <T>(key: string, data: T): void => {
  // 1. Update Memory Cache (Instant availability)
  CACHE[key] = data;

  // 2. Async Save to IndexedDB (Handles the 10GB capacity)
  idb.set(key, data);

  // 3. Fallback Save to LocalStorage (Only for small items to avoid quota errors)
  const isSmallItem = key === KEYS.SYSTEM_SETTINGS || key === KEYS.TAGS;
  if (isSmallItem) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      // LocalStorage might still fail, but IDB is our main source now
      console.warn("LocalStorage fallback failed for", key, err);
    }
  } else {
    // Large items like photos/videos/blogs are now IDB-exclusive
    // We clear them from localStorage to free up space
    localStorage.removeItem(key);
  }
};

// Initial Seed Data
const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  websiteName: "NightVerse",
  logoText: "NIGHTVERSE",
  faviconEmoji: "🌌",
  primaryColor: "purple-600",
  secondaryColor: "cyan-400",
  homepageBanner: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1500",
  heroTitle: "Universal Hub for Modern Masters",
  heroSubtitle: "Welcome to the future of creative collaboration. Empowering neon creators, visual designers, and sound artists worldwide.",
  footerText: "© 2026 NightVerse Enterprise. All Rights Reserved.",
  seoDescription: "NightVerse - The premier creative portfolio platform.",
  seoKeywords: "cyberpunk, designer portfolio, neon artistry",
  ogImage: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1200",
  maxImageSizeMB: 10,
  maxVideoSizeMB: 100,
  allowedFormats: ["jpg", "jpeg", "png", "gif", "mp4", "mov"],
  smtpHost: "smtp.nightverse.com",
  smtpPort: 587,
  enableEmailVerification: true,
  enablePushNotifications: false,
  enableRealtimeStream: true,
};

const DEFAULT_USERS: User[] = [
  {
    id: "admin-1",
    email: "superadmin@nightverse.com",
    username: "NightAdmin",
    passwordHash: hashPassword("admin123"),
    role: "SUPER_ADMIN",
    isSuspended: false,
    emailVerified: true,
    createdAt: new Date().toISOString(),
    profile: {
      fullName: "System Overseer",
      bio: "Root administrator for the NightVerse ecosystem.",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin"
    }
  },
  {
    id: "admin-2",
    email: "admin@nightverse.com",
    username: "ExecAdmin",
    passwordHash: hashPassword("admin123"),
    role: "ADMIN",
    isSuspended: false,
    emailVerified: true,
    createdAt: new Date().toISOString(),
    profile: {
      fullName: "Executive Admin",
      bio: "Executive administrator of NightVerse.",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=exec"
    }
  },
  {
    id: "mod-1",
    email: "mod@nightverse.com",
    username: "ModLead",
    passwordHash: hashPassword("mod123"),
    role: "MODERATOR",
    isSuspended: false,
    emailVerified: true,
    createdAt: new Date().toISOString(),
    profile: {
      fullName: "Moderations Lead",
      bio: "Content moderation lead.",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=mod"
    }
  },
  {
    id: "user-1",
    email: "neon_shadow@nightverse.com",
    username: "neon_shadow",
    passwordHash: hashPassword("user123"),
    role: "USER",
    isSuspended: false,
    emailVerified: true,
    createdAt: new Date().toISOString(),
    profile: {
      fullName: "Visual Photographer",
      bio: "Capturing the dark cyber landscapes.",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=neon_shadow"
    }
  },
  {
    id: "user-2",
    email: "pixel_dreamer@nightverse.com",
    username: "pixel_dreamer",
    passwordHash: hashPassword("user123"),
    role: "USER",
    isSuspended: false,
    emailVerified: true,
    createdAt: new Date().toISOString(),
    profile: {
      fullName: "Cyber Illustrator",
      bio: "Painting dreams in bright pixels.",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=pixel_dreamer"
    }
  }
];

// Initialize Database (Async loading from IDB)
export const initDB = async (): Promise<void> => {
  if (dbInitialized) return;
  
  // 1. Load all data from IndexedDB into Cache
  const allKeys = Object.values(KEYS);
  await Promise.all(allKeys.map(async (key) => {
    const val = await idb.get(key);
    if (val !== null) {
      CACHE[key] = val;
    }
  }));

  // 2. Initial Seed if needed
  const existingUsers = get<User[]>(KEYS.USERS, []);
  if (!existingUsers || existingUsers.length === 0) {
    set(KEYS.USERS, DEFAULT_USERS);
  } else {
    // Dynamic Merge & Upgrade to ensure all default users are fully configured with passwords
    let modified = false;
    DEFAULT_USERS.forEach(defU => {
      const index = existingUsers.findIndex(u => u.id === defU.id || u.username === defU.username || u.email === defU.email);
      if (index === -1) {
        existingUsers.push(defU);
        modified = true;
      } else {
        const u = existingUsers[index];
        // Upgrade legacy admin properties if they changed, or set missing passwordHash
        if (!u.passwordHash || u.email === "admin@nightverse.com" && u.id === "admin-1") {
          existingUsers[index] = {
            ...u,
            email: u.id === "admin-1" ? "superadmin@nightverse.com" : u.email,
            passwordHash: u.passwordHash || defU.passwordHash
          };
          modified = true;
        }
      }
    });
    if (modified) {
      set(KEYS.USERS, existingUsers);
    }
  }
  if (!get(KEYS.SYSTEM_SETTINGS, null)) set(KEYS.SYSTEM_SETTINGS, DEFAULT_SYSTEM_SETTINGS);
  if (!get(KEYS.PROFILES, null)) set(KEYS.PROFILES, []);
  if (!get(KEYS.BLOGS, null)) set(KEYS.BLOGS, []);
  if (!get(KEYS.PHOTOS, null)) set(KEYS.PHOTOS, []);
  if (!get(KEYS.VIDEOS, null)) set(KEYS.VIDEOS, []);
  if (!get(KEYS.TAGS, null)) set(KEYS.TAGS, [
    { id: "1", name: "cyberpunk", usageCount: 42, growthRate: 15, mostActiveUsername: "NightAdmin", lastUsedAt: new Date().toISOString(), createdAt: new Date().toISOString(), blogCount: 0, photoCount: 0, videoCount: 0, growthDaily: 0, growthWeekly: 0, growthMonthly: 0, count: 0 },
    { id: "2", name: "neon", usageCount: 38, growthRate: 12, mostActiveUsername: "NightAdmin", lastUsedAt: new Date().toISOString(), createdAt: new Date().toISOString(), blogCount: 0, photoCount: 0, videoCount: 0, growthDaily: 0, growthWeekly: 0, growthMonthly: 0, count: 0 },
    { id: "3", name: "futuristic", usageCount: 25, growthRate: 8, mostActiveUsername: "NightAdmin", lastUsedAt: new Date().toISOString(), createdAt: new Date().toISOString(), blogCount: 0, photoCount: 0, videoCount: 0, growthDaily: 0, growthWeekly: 0, growthMonthly: 0, count: 0 }
  ]);
  if (!get(KEYS.NOTIFICATIONS, null)) set(KEYS.NOTIFICATIONS, []);
  if (!get(KEYS.COMMENTS, null)) set(KEYS.COMMENTS, []);
  if (!get(KEYS.FOLLOWS, null)) set(KEYS.FOLLOWS, []);
  if (!get(KEYS.REPORTS, null)) set(KEYS.REPORTS, []);
  if (!get(KEYS.LOGS, null)) set(KEYS.LOGS, []);
  
  dbInitialized = true;
};

// Database API
export const db = {
  // Helpers
  enrich: {
    blog: (b: Blog) => ({
      ...b,
      likesCount: b.likesCount ?? (b.likedBy?.length ?? 0),
      likedBy: b.likedBy ?? [],
      comments: b.comments ?? []
    }),
    photo: (p: Photo) => ({
      ...p,
      likesCount: p.likesCount ?? (p.likedBy?.length ?? 0),
      likedBy: p.likedBy ?? [],
      comments: p.comments ?? []
    }),
    video: (v: Video) => ({
      ...v,
      likesCount: v.likesCount ?? (v.likedBy?.length ?? 0),
      likedBy: v.likedBy ?? [],
      comments: v.comments ?? []
    })
  },

  // Users
  users: {
    getAll: () => get<User[]>(KEYS.USERS, []),
    getById: (id: string) => get<User[]>(KEYS.USERS, []).find(u => u.id === id),
    getByLoginKey: (key: string) => get<User[]>(KEYS.USERS, []).find(u => u.email === key || u.username === key),
    add: (user: User) => {
      const users = get<User[]>(KEYS.USERS, []);
      set(KEYS.USERS, [...users, user]);
    },
    update: (id: string, updates: Partial<User>) => {
      const users = get<User[]>(KEYS.USERS, []);
      set(KEYS.USERS, users.map(u => u.id === id ? { ...u, ...updates } : u));
    }
  },

  // Content
  blogs: {
    getAll: () => get<Blog[]>(KEYS.BLOGS, []).map(db.enrich.blog),
    get: (id: string) => {
      const item = get<Blog[]>(KEYS.BLOGS, []).find(i => i.id === id);
      return item ? db.enrich.blog(item) : undefined;
    },
    add: (blog: Blog) => {
      const data = get<Blog[]>(KEYS.BLOGS, []);
      set(KEYS.BLOGS, [blog, ...data]);
      if (blog.status === "APPROVED") {
        db.tags.updateStats(blog.tags, [], blog.authorName);
        db.notifications.addStatusUpdate(blog.userId, "APPROVED", blog.title, "blog", blog.id);
      } else if (blog.status === "PENDING") {
        db.notifications.addModerationRequest(blog, "blog");
        db.notifications.addStatusUpdate(blog.userId, "PENDING", blog.title, "blog", blog.id);
      }
    },
    update: (id: string, updates: Partial<Blog>) => {
      const data = get<Blog[]>(KEYS.BLOGS, []);
      const index = data.findIndex(i => i.id === id);
      if (index === -1) return;
      const oldItem = data[index];
      const newItem = { ...oldItem, ...updates };
      data[index] = newItem;
      set(KEYS.BLOGS, data);

      if (updates.status && updates.status !== oldItem.status) {
        db.notifications.addStatusUpdate(newItem.userId, updates.status, newItem.title, "blog", newItem.id, updates.rejectReason);
      }
      
      const wasApproved = oldItem.status === "APPROVED";
      const isApproved = newItem.status === "APPROVED";

      if (wasApproved && isApproved) {
        if (updates.tags) {
          db.tags.updateStats(updates.tags, oldItem.tags, newItem.authorName);
        }
      } else if (!wasApproved && isApproved) {
        db.tags.updateStats(newItem.tags, [], newItem.authorName);
      } else if (wasApproved && !isApproved) {
        db.tags.updateStats([], oldItem.tags, newItem.authorName);
      }
      db.tags.reconcile();
    },
    delete: (id: string) => {
      const data = get<Blog[]>(KEYS.BLOGS, []);
      const item = data.find(i => i.id === id);
      if (item) {
        set(KEYS.BLOGS, data.filter(i => i.id !== id));
        if (item.status === "APPROVED") {
          db.tags.updateStats([], item.tags);
        }
        db.tags.reconcile();
      }
    }
  },

  photos: {
    getAll: () => get<Photo[]>(KEYS.PHOTOS, []).map(db.enrich.photo),
    get: (id: string) => {
      const item = get<Photo[]>(KEYS.PHOTOS, []).find(i => i.id === id);
      return item ? db.enrich.photo(item) : undefined;
    },
    add: (photo: Photo) => {
      const data = get<Photo[]>(KEYS.PHOTOS, []);
      set(KEYS.PHOTOS, [photo, ...data]);
      if (photo.status === "APPROVED") {
        db.tags.updateStats(photo.tags, [], photo.authorName);
        db.notifications.addStatusUpdate(photo.userId, "APPROVED", photo.title, "photo", photo.id);
      } else if (photo.status === "PENDING") {
        db.notifications.addModerationRequest(photo, "photo");
        db.notifications.addStatusUpdate(photo.userId, "PENDING", photo.title, "photo", photo.id);
      }
    },
    update: (id: string, updates: Partial<Photo>) => {
      const data = get<Photo[]>(KEYS.PHOTOS, []);
      const index = data.findIndex(i => i.id === id);
      if (index === -1) return;
      const oldItem = data[index];
      const newItem = { ...oldItem, ...updates };
      data[index] = newItem;
      set(KEYS.PHOTOS, data);

      if (updates.status && updates.status !== oldItem.status) {
        db.notifications.addStatusUpdate(newItem.userId, updates.status, newItem.title, "photo", newItem.id, updates.rejectReason);
      }

      const wasApproved = oldItem.status === "APPROVED";
      const isApproved = newItem.status === "APPROVED";

      if (wasApproved && isApproved) {
        if (updates.tags) {
          db.tags.updateStats(updates.tags, oldItem.tags, newItem.authorName);
        }
      } else if (!wasApproved && isApproved) {
        db.tags.updateStats(newItem.tags, [], newItem.authorName);
      } else if (wasApproved && !isApproved) {
        db.tags.updateStats([], oldItem.tags, newItem.authorName);
      }
      db.tags.reconcile();
    },
    delete: (id: string) => {
      const data = get<Photo[]>(KEYS.PHOTOS, []);
      const item = data.find(i => i.id === id);
      if (item) {
        set(KEYS.PHOTOS, data.filter(i => i.id !== id));
        if (item.status === "APPROVED") {
          db.tags.updateStats([], item.tags);
        }
        db.tags.reconcile();
      }
    }
  },

  videos: {
    getAll: () => get<Video[]>(KEYS.VIDEOS, []).map(db.enrich.video),
    get: (id: string) => {
      const item = get<Video[]>(KEYS.VIDEOS, []).find(i => i.id === id);
      return item ? db.enrich.video(item) : undefined;
    },
    add: (video: Video) => {
      const data = get<Video[]>(KEYS.VIDEOS, []);
      set(KEYS.VIDEOS, [video, ...data]);
      if (video.status === "APPROVED") {
        db.tags.updateStats(video.tags, [], video.authorName);
        db.notifications.addStatusUpdate(video.userId, "APPROVED", video.title, "video", video.id);
      } else if (video.status === "PENDING") {
        db.notifications.addModerationRequest(video, "video");
        db.notifications.addStatusUpdate(video.userId, "PENDING", video.title, "video", video.id);
      }
    },
    update: (id: string, updates: Partial<Video>) => {
      const data = get<Video[]>(KEYS.VIDEOS, []);
      const index = data.findIndex(i => i.id === id);
      if (index === -1) return;
      const oldItem = data[index];
      const newItem = { ...oldItem, ...updates };
      data[index] = newItem;
      set(KEYS.VIDEOS, data);

      if (updates.status && updates.status !== oldItem.status) {
        db.notifications.addStatusUpdate(newItem.userId, updates.status, newItem.title, "video", newItem.id, updates.rejectReason);
      }

      const wasApproved = oldItem.status === "APPROVED";
      const isApproved = newItem.status === "APPROVED";

      if (wasApproved && isApproved) {
        if (updates.tags) {
          db.tags.updateStats(updates.tags, oldItem.tags, newItem.authorName);
        }
      } else if (!wasApproved && isApproved) {
        db.tags.updateStats(newItem.tags, [], newItem.authorName);
      } else if (wasApproved && !isApproved) {
        db.tags.updateStats([], oldItem.tags, newItem.authorName);
      }
      db.tags.reconcile();
    },
    delete: (id: string) => {
      const data = get<Video[]>(KEYS.VIDEOS, []);
      const item = data.find(i => i.id === id);
      if (item) {
        set(KEYS.VIDEOS, data.filter(i => i.id !== id));
        if (item.status === "APPROVED") {
          db.tags.updateStats([], item.tags);
        }
        db.tags.reconcile();
      }
    }
  },

  // Tags
  tags: {
    getAll: () => get<Tag[]>(KEYS.TAGS, []),
    delete: (id: string) => {
      const tags = get<Tag[]>(KEYS.TAGS, []);
      const tagToDelete = tags.find(t => t.id === id);
      if (!tagToDelete) return;
      const tagName = tagToDelete.name.toLowerCase();
      set(KEYS.TAGS, tags.filter(t => t.id !== id));
      db.tags.reconcile();
    },
    reconcile: () => {
      const blogs = get<Blog[]>(KEYS.BLOGS, []).filter(b => b && b.status === "APPROVED");
      const photos = get<Photo[]>(KEYS.PHOTOS, []).filter(p => p && p.status === "APPROVED");
      const videos = get<Video[]>(KEYS.VIDEOS, []).filter(v => v && v.status === "APPROVED");
      
      const allContent = [
        ...blogs.map(b => ({ ...b, type: 'blog' })),
        ...photos.map(p => ({ ...p, type: 'photo' })),
        ...videos.map(v => ({ ...v, type: 'video' }))
      ];

      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const tagMetricsMap = new Map<string, { 
        total: number, 
        blog: number, 
        photo: number, 
        video: number,
        lastUsedAt: string,
        mostActiveUser: string,
        counts: {
          d1: number, d2: number,
          w1: number, w2: number,
          m1: number, m2: number
        }
      }>();

      allContent.forEach(item => {
        if (!item) return;
        const itemDate = new Date(item.createdAt);
        (item.tags || []).forEach(t => {
          if (!t || typeof t !== 'string') return;
          const name = t.toLowerCase().trim();
          if (!name) return;
          
          if (!tagMetricsMap.has(name)) {
            tagMetricsMap.set(name, {
              total: 0, blog: 0, photo: 0, video: 0,
              lastUsedAt: item.createdAt || new Date().toISOString(),
              mostActiveUser: item.authorName || "Anonymous",
              counts: { d1: 0, d2: 0, w1: 0, w2: 0, m1: 0, m2: 0 }
            });
          }
          
          const m = tagMetricsMap.get(name)!;
          m.total++;
          if (item.type === 'blog') m.blog++;
          if (item.type === 'photo') m.photo++;
          if (item.type === 'video') m.video++;
          
          if (itemDate > new Date(m.lastUsedAt)) {
            m.lastUsedAt = item.createdAt || new Date().toISOString();
            m.mostActiveUser = item.authorName || "Anonymous";
          }

          // Growth buckets
          if (itemDate > oneDayAgo) m.counts.d1++;
          else if (itemDate > twoDaysAgo) m.counts.d2++;

          if (itemDate > oneWeekAgo) m.counts.w1++;
          else if (itemDate > twoWeeksAgo) m.counts.w2++;

          if (itemDate > oneMonthAgo) m.counts.m1++;
          else if (itemDate > twoMonthsAgo) m.counts.m2++;
        });
      });

      const existingTags = get<Tag[]>(KEYS.TAGS, []);
      const updatedTags: Tag[] = [];

      tagMetricsMap.forEach((m, name) => {
        const existing = existingTags.find(t => t.name.toLowerCase() === name);
        
        const calcGrowth = (curr: number, prev: number) => {
          if (prev === 0) return curr > 0 ? 100 : 0;
          return Math.round(((curr - prev) / prev) * 100);
        };

        updatedTags.push({
          id: existing?.id || Math.random().toString(36).substr(2, 9),
          name,
          usageCount: m.total,
          count: m.total,
          blogCount: m.blog,
          photoCount: m.photo,
          videoCount: m.video,
          growthDaily: calcGrowth(m.counts.d1, m.counts.d2),
          growthWeekly: calcGrowth(m.counts.w1, m.counts.w2),
          growthMonthly: calcGrowth(m.counts.m1, m.counts.m2),
          growthRate: calcGrowth(m.counts.w1, m.counts.w2), // Default growth rate for legacy
          mostActiveUsername: m.mostActiveUser,
          lastUsedAt: m.lastUsedAt,
          createdAt: existing?.createdAt || m.lastUsedAt,
          isBanned: existing?.isBanned || false
        });
      });

      // Maintain banned tags that aren't in tagMetricsMap
      existingTags.forEach(existing => {
        if (existing.isBanned && !tagMetricsMap.has(existing.name.toLowerCase())) {
          updatedTags.push(existing);
        }
      });

      set(KEYS.TAGS, updatedTags);
    },
    update: (id: string, updates: Partial<Tag>) => {
      const tags = get<Tag[]>(KEYS.TAGS, []);
      const index = tags.findIndex(t => t.id === id);
      if (index === -1) return;

      const oldTag = tags[index];
      const newTag = { ...oldTag, ...updates };
      tags[index] = newTag;
      set(KEYS.TAGS, tags);

      // If name changed, update all content
      if (updates.name && updates.name.toLowerCase() !== oldTag.name.toLowerCase()) {
        const oldName = oldTag.name.toLowerCase();
        const newName = updates.name.toLowerCase();

        const blogs = get<Blog[]>(KEYS.BLOGS, []);
        set(KEYS.BLOGS, blogs.map(b => ({
          ...b,
          tags: b.tags.map(t => t.toLowerCase() === oldName ? newName : t)
        })));

        const photos = get<Photo[]>(KEYS.PHOTOS, []);
        set(KEYS.PHOTOS, photos.map(p => ({
          ...p,
          tags: p.tags.map(t => t.toLowerCase() === oldName ? newName : t)
        })));

        const videos = get<Video[]>(KEYS.VIDEOS, []);
        set(KEYS.VIDEOS, videos.map(v => ({
          ...v,
          tags: v.tags.map(t => t.toLowerCase() === oldName ? newName : t)
        })));
      }
    },
    ban: (name: string, isBanned: boolean) => {
      const tags = get<Tag[]>(KEYS.TAGS, []);
      const index = tags.findIndex(t => t.name.toLowerCase() === name.toLowerCase());
      if (index > -1) {
        tags[index] = { ...tags[index], isBanned };
        set(KEYS.TAGS, tags);
      } else {
        const now = new Date().toISOString();
        const newTag: Tag = {
          id: Math.random().toString(36).substr(2, 9),
          name: name.toLowerCase(),
          usageCount: 0,
          growthRate: 0,
          mostActiveUsername: "NightAdmin",
          lastUsedAt: now,
          createdAt: now,
          blogCount: 0,
          photoCount: 0,
          videoCount: 0,
          growthDaily: 0,
          growthWeekly: 0,
          growthMonthly: 0,
          isBanned
        };
        set(KEYS.TAGS, [...tags, newTag]);
      }
    },
    updateStats: (newTags: string[] = [], previousTags: string[] = [], username?: string) => {
      const tags = get<Tag[]>(KEYS.TAGS, []);
      const now = new Date().toISOString();
      let updated = [...tags];
      
      const newActiveTags = (newTags || []).filter(t => t && typeof t === 'string');
      const prevActiveTags = (previousTags || []).filter(t => t && typeof t === 'string');

      const newTagsLower = newActiveTags.map(t => t.toLowerCase());
      const previousTagsLower = prevActiveTags.map(t => t.toLowerCase());

      const added = newActiveTags.filter(t => !previousTagsLower.includes(t.toLowerCase()));
      const removed = prevActiveTags.filter(t => !newTagsLower.includes(t.toLowerCase()));

      // Handle removed tags - decrease count
      removed.forEach(name => {
        const index = updated.findIndex(t => t.name.toLowerCase() === name.toLowerCase());
        if (index > -1) {
          const newCount = Math.max(0, updated[index].usageCount - 1);
          // If count reaches 0, we can either remove it or keep it. 
          // User said "dihapus dari relasi konten terkait dan diperbarui pada sistem", 
          // usually means removing from directory to keep it clean.
          if (newCount === 0) {
            updated = updated.filter((_, i) => i !== index);
          } else {
            updated[index] = {
              ...updated[index],
              usageCount: newCount,
              lastUsedAt: now
            };
          }
        }
      });

      // Handle added tags - increase count or create
      added.forEach(name => {
        const index = updated.findIndex(t => t.name.toLowerCase() === name.toLowerCase());
        if (index > -1) {
          updated[index] = {
            ...updated[index],
            usageCount: updated[index].usageCount + 1,
            lastUsedAt: now,
            mostActiveUsername: username || updated[index].mostActiveUsername
          };
        } else {
          updated.push({
            id: Math.random().toString(36).substr(2, 9),
            name,
            usageCount: 1,
            growthRate: 0,
            mostActiveUsername: username || "NightAdmin",
            lastUsedAt: now,
            createdAt: now,
            blogCount: 0,
            photoCount: 0,
            videoCount: 0,
            growthDaily: 0,
            growthWeekly: 0,
            growthMonthly: 0
          });
        }
      });

      set(KEYS.TAGS, updated);
      db.tags.reconcile();
    }
  },

  // Notifications
  notifications: {
    getAll: () => get<Notification[]>(KEYS.NOTIFICATIONS, []),
    getByUserId: (userId: string, role?: Role) => {
      const all = get<Notification[]>(KEYS.NOTIFICATIONS, []);
      const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN" || role === "MODERATOR";
      return all.filter(n => 
        n.userId === userId || 
        n.userId === "all" || 
        (isAdmin && n.category === "ADMIN")
      );
    },
    add: (notification: Omit<Notification, "id" | "createdAt" | "isRead">) => {
      const data = get<Notification[]>(KEYS.NOTIFICATIONS, []);
      const newNote: Notification = { 
        ...notification, 
        id: Math.random().toString(36).substr(2, 9), 
        createdAt: new Date().toISOString(),
        isRead: false
      };
      set(KEYS.NOTIFICATIONS, [newNote, ...data]);
      return newNote;
    },
    // Actionable notification for admins
    addModerationRequest: (content: Blog | Photo | Video, type: "blog" | "photo" | "video") => {
      return db.notifications.add({
        userId: "admin", // Special handled in getByUserId
        title: "Moderation Required",
        message: `New ${type} "${content.title}" uploaded by ${content.authorName}.`,
        category: "ADMIN",
        type: "moderation_request",
        targetType: type,
        targetId: content.id,
        triggeredById: content.userId,
        triggeredByName: content.authorName,
        triggeredByAvatar: content.authorAvatar,
        link: `/admin/moderate/${type}/${content.id}`
      });
    },
    // Status update for user
    addStatusUpdate: (userId: string, status: ContentStatus, title: string, type: "blog" | "photo" | "video", contentId: string, reason?: string) => {
      const statusMap: Record<string, { title: string, icon: string }> = {
        "APPROVED": { title: "Content Approved", icon: "✅" },
        "REJECTED": { title: "Content Rejected", icon: "❌" },
        "PENDING": { title: "Content Flagged", icon: "⏳" },
        "REVISION": { title: "Revision Requested", icon: "📝" }
      };
      const info = statusMap[status] || { title: "Status Update", icon: "🔔" };
      
      const statusLower = (status || "PENDING").toLowerCase();
      let message = "";
      if (status === "REJECTED") message = `Your ${type} was rejected. Reason: ${reason || "Policy violation"}`;
      else if (status === "REVISION") message = `Revision requested for your ${type}. Notes: ${reason || "Please review and update content."}`;
      else if (status === "PENDING") message = `Your ${type} has been submitted successfully and is waiting for review.`;
      else message = `Your ${type} has been published successfully.`;

      return db.notifications.add({
        userId,
        title: `${info.icon} ${info.title}: ${title}`,
        message,
        category: "CONTENT",
        type: `content_${statusLower}`,
        targetType: type,
        targetId: contentId,
        link: status === "APPROVED" ? `/${type}/${contentId}` : `/dashboard/${type}s`
      });
    },
    markAsRead: (id: string) => {
      const data = get<Notification[]>(KEYS.NOTIFICATIONS, []);
      set(KEYS.NOTIFICATIONS, data.map(n => n.id === id ? { ...n, isRead: true } : n));
    },
    markAsTaken: (id: string, adminId: string, decision: string) => {
      const data = get<Notification[]>(KEYS.NOTIFICATIONS, []);
      set(KEYS.NOTIFICATIONS, data.map(n => n.id === id ? { ...n, isRead: true, actionTaken: true, actionBy: adminId, actionDecision: decision } : n));
    },
    markAllRead: (userId: string, role?: Role) => {
      const data = get<Notification[]>(KEYS.NOTIFICATIONS, []);
      const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN" || role === "MODERATOR";
      set(KEYS.NOTIFICATIONS, data.map(n => {
        const isTargeted = n.userId === userId || n.userId === "all" || (isAdmin && n.category === "ADMIN");
        return isTargeted ? { ...n, isRead: true } : n;
      }));
    },
    clearAll: (userId: string, role?: Role) => {
      const data = get<Notification[]>(KEYS.NOTIFICATIONS, []);
      const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN" || role === "MODERATOR";
      set(KEYS.NOTIFICATIONS, data.filter(n => {
        const isTargeted = n.userId === userId || n.userId === "all" || (isAdmin && n.category === "ADMIN");
        return !isTargeted;
      }));
    }
  },

  // Comments
  comments: {
    getByContentId: (contentId: string) => get<Comment[]>(KEYS.COMMENTS, []).filter(c => c.contentId === contentId),
    add: (comment: Comment) => {
      const data = get<Comment[]>(KEYS.COMMENTS, []);
      set(KEYS.COMMENTS, [...data, comment]);
    }
  },

  // Follows
  follows: {
    isFollowing: (followerId: string, followingId: string) => 
      get<any[]>(KEYS.FOLLOWS, []).some(f => f.followerId === followerId && f.followingId === followingId),
    getFollowers: (followingId: string) => 
      get<any[]>(KEYS.FOLLOWS, []).filter(f => f.followingId === followingId).map(f => f.followerId),
    getFollowing: (followerId: string) => 
      get<any[]>(KEYS.FOLLOWS, []).filter(f => f.followerId === followerId).map(f => f.followingId),
    toggle: (followerId: string, followingId: string) => {
      const data = get<any[]>(KEYS.FOLLOWS, []);
      const exists = data.find(f => f.followerId === followerId && f.followingId === followingId);
      if (exists) {
        set(KEYS.FOLLOWS, data.filter(f => !(f.followerId === followerId && f.followingId === followingId)));
        return false;
      } else {
        set(KEYS.FOLLOWS, [...data, { followerId, followingId, createdAt: new Date().toISOString() }]);
        return true;
      }
    }
  },

  // Reports
  reports: {
    getAll: () => get<any[]>(KEYS.REPORTS, []),
    add: (report: any) => {
      const data = get<any[]>(KEYS.REPORTS, []);
      const newReport = { ...report, id: Date.now().toString(), status: "OPEN", createdAt: new Date().toISOString() };
      set(KEYS.REPORTS, [newReport, ...data]);
      return newReport;
    },
    update: (id: string, updates: any) => {
      const data = get<any[]>(KEYS.REPORTS, []);
      set(KEYS.REPORTS, data.map(r => r.id === id ? { ...r, ...updates } : r));
    },
    resolve: (id: string, notes: string) => {
      const data = get<any[]>(KEYS.REPORTS, []);
      set(KEYS.REPORTS, data.map(r => r.id === id ? { ...r, status: "RESOLVED", isResolved: true, resolutionNotes: notes, resolvedAt: new Date().toISOString() } : r));
    }
  },

  // Logs
  logs: {
    getAll: () => get<any[]>(KEYS.LOGS, []),
    add: (action: string, details: string, operator: string) => {
      const data = get<any[]>(KEYS.LOGS, []);
      set(KEYS.LOGS, [{ id: Date.now().toString(), action, details, operator, timestamp: new Date().toISOString() }, ...data]);
    }
  },

  // Settings
  settings: {
    get: () => get<SystemSettings>(KEYS.SYSTEM_SETTINGS, DEFAULT_SYSTEM_SETTINGS),
    save: (updates: Partial<SystemSettings>) => {
      const current = get<SystemSettings>(KEYS.SYSTEM_SETTINGS, DEFAULT_SYSTEM_SETTINGS);
      set(KEYS.SYSTEM_SETTINGS, { ...current, ...updates });
    }
  },

  // Maintenance & Quota Management
  maintenance: {
    getUsage: () => {
      let total = 0;
      // Approximate memory footprint of CACHE
      try {
        const cacheStr = JSON.stringify(CACHE);
        total = cacheStr.length * 2; // UTF-16
      } catch {
        // Fallback calculation if stringify fails
        for (const key in CACHE) {
          if (CACHE.hasOwnProperty(key)) {
            total += (JSON.stringify(CACHE[key]).length + key.length) * 2;
          }
        }
      }

      const quotaBytes = 1024 * 1024 * 1024 * 1024; // 1TB
      return {
        used: total,
        usedMB: (total / (1024 * 1024)).toFixed(2),
        quotaMB: 1048576, // 1TB in MB
        percentage: Math.min(100, (total / quotaBytes) * 100).toFixed(4)
      };
    },
    purgeOldData: () => {
      // 1. Purge old logs (keep last 50)
      const logs = get<any[]>(KEYS.LOGS, []);
      if (logs.length > 50) {
        set(KEYS.LOGS, logs.slice(0, 50));
      }

      // 2. Clear old notifications (keep last 100)
      const notifications = get<Notification[]>(KEYS.NOTIFICATIONS, []);
      if (notifications.length > 100) {
        set(KEYS.NOTIFICATIONS, notifications.slice(0, 100));
      }

      // 3. Clear read notifications older than 7 days
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const filteredNotes = notifications.filter(n => !n.isRead || new Date(n.createdAt) > weekAgo);
      if (filteredNotes.length !== notifications.length) {
        set(KEYS.NOTIFICATIONS, filteredNotes);
      }
      
      console.log("Maintenance: Purged non-essential historical data.");
    }
  }
};
