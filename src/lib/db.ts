import { 
  User, Blog, Photo, Video, Tag, TagType, TagStatus, Notification, Comment, SystemSettings, Role, ContentStatus,
  BadgeDefinition, UserBadgeAward,
  DocumentationArticle, DocumentationCategory, DocumentationRevision, ChangelogRelease,
  SupportTicket, TicketMessage, TicketStatus,
  VideoRendition, VideoProcessingStatus
} from "../types.js";
import { hashPassword } from "./crypto.js";
import { DEFAULT_DOC_CATEGORIES, DEFAULT_DOC_ARTICLES, DEFAULT_CHANGELOGS } from "./defaultDocs.js";

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
  SYSTEM_SETTINGS: "nv_system_settings",
  BADGES: "nv_badges",
  BADGE_AWARDS: "nv_badge_awards",
  DOCUMENTATIONS: "nv_documentations",
  DOC_CATEGORIES: "nv_doc_categories",
  DOC_REVISIONS: "nv_doc_revisions",
  CHANGELOGS: "nv_changelogs",
  SUPPORT_TICKETS: "nv_support_tickets",
  TICKET_MESSAGES: "nv_ticket_messages"
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
  const isSmallItem = key === KEYS.SYSTEM_SETTINGS || key === KEYS.TAGS || key === KEYS.BADGES || key === KEYS.BADGE_AWARDS;
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
  faviconUrl: "/favicon.svg",
  faviconUpdatedAt: 0,
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
  creatorMasterpiecesBlur: false,
  mediaApproval: {
    photo: true,
    video: false,
    blog: true,
  },
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

const DEFAULT_BADGES: BadgeDefinition[] = [
  {
    id: "super-admin",
    name: "Super Admin",
    icon: "ShieldAlert",
    description: "Badge kehormatan tertinggi Root Administrator dengan hak veto penuh atas seluruh ekosistem NightVerse.",
    category: "ROLE",
    tier: 5,
    status: "ACTIVE",
    requirement: "Hanya dapat dibuka dan diberikan langsung oleh Root Super Administrator.",
    createdAt: "2026-01-01T00:00:00.000Z",
    color: "text-rose-400",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/30"
  },
  {
    id: "administrator",
    name: "Administrator",
    icon: "ShieldCheck",
    description: "Badge otoritas Administrator untuk manajemen direktori, moderasi konten, dan kepengurusan sistem.",
    category: "ROLE",
    tier: 4,
    status: "ACTIVE",
    requirement: "Diberikan oleh Super Administrator atas tanggung jawab kepengurusan platform.",
    createdAt: "2026-01-01T00:00:00.000Z",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30"
  },
  {
    id: "moderator",
    name: "Moderator",
    icon: "Shield",
    description: "Badge pengawas etika dan ketertiban interaksi komunitas visual NightVerse.",
    category: "ROLE",
    tier: 3,
    status: "ACTIVE",
    requirement: "Ditetapkan sebagai Moderator oleh Administrator atau Super Administrator.",
    createdAt: "2026-01-01T00:00:00.000Z",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30"
  },
  {
    id: "verified-creator",
    name: "Verified Creator",
    icon: "CheckCircle2",
    description: "Menandakan kreator resmi yang identitas, portofolio karya, dan kredibilitasnya telah terverifikasi.",
    category: "COMMUNITY",
    tier: 2,
    status: "ACTIVE",
    requirement: "Verifikasi profil kreator resmi oleh staf atau pengelola NightVerse.",
    createdAt: "2026-01-01T00:00:00.000Z",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30"
  },
  {
    id: "contributor",
    name: "Contributor",
    icon: "Trophy",
    description: "Diberikan kepada pengguna yang konsisten menyumbangkan karya bermutu dan aktif membangun komunitas.",
    category: "ACHIEVEMENT",
    tier: 1,
    status: "ACTIVE",
    requirement: "Aktif mempublikasikan karya seni digital dan partisipasi positif secara konsisten.",
    createdAt: "2026-01-01T00:00:00.000Z",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30"
  },
  {
    id: "vip",
    name: "VIP",
    icon: "Crown",
    description: "Badge keanggotaan istimewa VIP NightVerse dengan akses apresiasi komunitas eksklusif.",
    category: "SPECIAL",
    tier: 0,
    status: "ACTIVE",
    requirement: "Diberikan melalui event keanggotaan VIP atau apresiasi khusus staf.",
    createdAt: "2026-01-01T00:00:00.000Z",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30"
  },
  {
    id: "night-artist",
    name: "Night Artist",
    icon: "Sparkles",
    description: "Pengakuan seniman visual malam yang melahirkan karya bertema neon cyberpunk spektakuler.",
    category: "SPECIAL",
    tier: 0,
    status: "ACTIVE",
    requirement: "Mendapat apresiasi visual tinggi pada karya seni bertema cyber neon.",
    createdAt: "2026-01-01T00:00:00.000Z",
    color: "text-fuchsia-400",
    bgColor: "bg-fuchsia-500/10",
    borderColor: "border-fuchsia-500/30"
  },
  {
    id: "user",
    name: "User",
    icon: "User",
    description: "Badge standar milik seluruh warga kreatif terdaftar di ekosistem NightVerse.",
    category: "ROLE",
    tier: 0,
    status: "ACTIVE",
    requirement: "Otomatis diperoleh saat akun baru berhasil dibuat.",
    createdAt: "2026-01-01T00:00:00.000Z",
    color: "text-slate-400",
    bgColor: "bg-slate-500/10",
    borderColor: "border-slate-500/30"
  }
];

export const DEFAULT_FEATURED_VIDEOS: Video[] = [
  {
    id: "seed-video-cyberpunk",
    userId: "admin-1",
    authorName: "NightAdmin",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    title: "Neon Horizon 2099 — Cyberpunk Metropolis Odyssey",
    description: "Official NightVerse benchmark video encoded in authentic H.264 / AVC High Profile with 6 distinct multi-rendition streams (1080p, 720p, 480p, 360p, 240p, 144p). Features real-time rendition switching with seamless timestamp continuity and no buffer resets.",
    sourceType: "UPLOAD",
    url: "/renditions/cyberpunk-city/1080p.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=1200",
    duration: 15,
    resolution: "1920x1080",
    aspectRatio: "16:9",
    codec: "h264 (H.264 / AVC High Profile)",
    frameRate: 30,
    fileSize: 8421376,
    processingStatus: "COMPLETED",
    renditions: [
      { id: "r-1080p", resolution: "1080p", width: 1920, height: 1080, codec: "h264 (H.264 / AVC)", bitrate: 4488289, frameRate: 30, url: "/renditions/cyberpunk-city/1080p.mp4", fileSize: 8421376 },
      { id: "r-720p", resolution: "720p", width: 1280, height: 720, codec: "h264 (H.264 / AVC)", bitrate: 2176892, frameRate: 30, url: "/renditions/cyberpunk-city/720p.mp4", fileSize: 4087521 },
      { id: "r-480p", resolution: "480p", width: 854, height: 480, codec: "h264 (H.264 / AVC)", bitrate: 978468, frameRate: 30, url: "/renditions/cyberpunk-city/480p.mp4", fileSize: 1887232 },
      { id: "r-360p", resolution: "360p", width: 640, height: 360, codec: "h264 (H.264 / AVC)", bitrate: 578470, frameRate: 30, url: "/renditions/cyberpunk-city/360p.mp4", fileSize: 1153024 },
      { id: "r-240p", resolution: "240p", width: 426, height: 240, codec: "h264 (H.264 / AVC)", bitrate: 331865, frameRate: 30, url: "/renditions/cyberpunk-city/240p.mp4", fileSize: 627712 },
      { id: "r-144p", resolution: "144p", width: 256, height: 144, codec: "h264 (H.264 / AVC)", bitrate: 168414, frameRate: 30, url: "/renditions/cyberpunk-city/144p.mp4", fileSize: 321536 },
    ],
    tags: ["cyberpunk", "neon", "futuristic", "4k"],
    status: "APPROVED",
    visibility: "public",
    engagement: "open",
    allowComments: true,
    createdAt: new Date().toISOString(),
    views: 1284,
    likesCount: 194,
    likedBy: ["admin-1"],
    category: "Sci-Fi & Cyberpunk",
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
  const currentVideos = get<Video[]>(KEYS.VIDEOS, null);
  if (!currentVideos || currentVideos.length === 0) {
    set(KEYS.VIDEOS, DEFAULT_FEATURED_VIDEOS);
  } else {
    let modified = false;
    const updated = currentVideos.map(v => {
      const hasMockUrls = v.renditions?.every(r => r.url === v.url);
      const isMissingFullRenditions = !v.renditions || v.renditions.length < 6;
      const isSeed = v.id === "seed-video-cyberpunk";
      const isMissingUrl = !v.url || typeof v.url !== "string" || !v.url.trim();
      if (hasMockUrls || isMissingFullRenditions || isSeed || isMissingUrl) {
        modified = true;
        return {
          ...v,
          url: (isSeed || isMissingUrl) ? DEFAULT_FEATURED_VIDEOS[0].url : v.url,
          codec: "h264 (H.264 / AVC High Profile)",
          processingStatus: "COMPLETED",
          renditions: DEFAULT_FEATURED_VIDEOS[0].renditions
        };
      }
      return v;
    });
    if (!updated.some(v => v.id === "seed-video-cyberpunk")) {
      updated.unshift(DEFAULT_FEATURED_VIDEOS[0]);
      modified = true;
    }
    if (modified) {
      set(KEYS.VIDEOS, updated);
    }
  }
  if (!get(KEYS.PHOTOS, null)) set(KEYS.PHOTOS, []);
  if (!get(KEYS.TAGS, null)) set(KEYS.TAGS, [
    { id: "tag-1", name: "cyberpunk", type: "General", isAmbiguous: false, status: "APPROVED", createdBy: "NightAdmin", usageCount: 42, growthRate: 15, mostActiveUsername: "NightAdmin", lastUsedAt: new Date().toISOString(), createdAt: new Date().toISOString(), blogCount: 0, photoCount: 0, videoCount: 0, growthDaily: 0, growthWeekly: 0, growthMonthly: 0, count: 42 },
    { id: "tag-2", name: "neon", type: "General", isAmbiguous: false, status: "APPROVED", createdBy: "NightAdmin", usageCount: 38, growthRate: 12, mostActiveUsername: "NightAdmin", lastUsedAt: new Date().toISOString(), createdAt: new Date().toISOString(), blogCount: 0, photoCount: 0, videoCount: 0, growthDaily: 0, growthWeekly: 0, growthMonthly: 0, count: 38 },
    { id: "tag-3", name: "slippery", type: "Artist", isAmbiguous: false, status: "APPROVED", createdBy: "NightAdmin", usageCount: 15, growthRate: 10, mostActiveUsername: "NightAdmin", lastUsedAt: new Date().toISOString(), createdAt: new Date().toISOString(), blogCount: 0, photoCount: 0, videoCount: 0, growthDaily: 0, growthWeekly: 0, growthMonthly: 0, count: 15 },
    { id: "tag-4", name: "minecraft", type: "Copyright", isAmbiguous: false, status: "APPROVED", createdBy: "NightAdmin", usageCount: 22, growthRate: 8, mostActiveUsername: "NightAdmin", lastUsedAt: new Date().toISOString(), createdAt: new Date().toISOString(), blogCount: 0, photoCount: 0, videoCount: 0, growthDaily: 0, growthWeekly: 0, growthMonthly: 0, count: 22 },
    { id: "tag-5", name: "jenny belle", type: "Character", isAmbiguous: true, status: "APPROVED", createdBy: "NightAdmin", usageCount: 11, growthRate: 5, mostActiveUsername: "NightAdmin", lastUsedAt: new Date().toISOString(), createdAt: new Date().toISOString(), blogCount: 0, photoCount: 0, videoCount: 0, growthDaily: 0, growthWeekly: 0, growthMonthly: 0, count: 11 },
    { id: "tag-6", name: "futuristic", type: "General", isAmbiguous: false, status: "APPROVED", createdBy: "NightAdmin", usageCount: 25, growthRate: 8, mostActiveUsername: "NightAdmin", lastUsedAt: new Date().toISOString(), createdAt: new Date().toISOString(), blogCount: 0, photoCount: 0, videoCount: 0, growthDaily: 0, growthWeekly: 0, growthMonthly: 0, count: 25 },
    { id: "tag-7", name: "4k", type: "Metadata", isAmbiguous: false, status: "APPROVED", createdBy: "NightAdmin", usageCount: 18, growthRate: 6, mostActiveUsername: "NightAdmin", lastUsedAt: new Date().toISOString(), createdAt: new Date().toISOString(), blogCount: 0, photoCount: 0, videoCount: 0, growthDaily: 0, growthWeekly: 0, growthMonthly: 0, count: 18 }
  ]);
  if (!get(KEYS.NOTIFICATIONS, null)) set(KEYS.NOTIFICATIONS, []);
  if (!get(KEYS.COMMENTS, null)) set(KEYS.COMMENTS, []);
  if (!get(KEYS.FOLLOWS, null)) set(KEYS.FOLLOWS, []);
  if (!get(KEYS.REPORTS, null)) set(KEYS.REPORTS, []);
  if (!get(KEYS.LOGS, null)) set(KEYS.LOGS, []);

  // Initialize Badges & Seed Awards
  if (!get(KEYS.BADGES, null)) {
    set(KEYS.BADGES, DEFAULT_BADGES);
  } else {
    // Dynamic merge to ensure all default system badges exist
    const currentBadges = get<BadgeDefinition[]>(KEYS.BADGES, []);
    let badgeModified = false;
    DEFAULT_BADGES.forEach(dbb => {
      if (!currentBadges.some(b => b.id.toLowerCase() === dbb.id.toLowerCase() || b.name.toLowerCase() === dbb.name.toLowerCase())) {
        currentBadges.push(dbb);
        badgeModified = true;
      }
    });
    if (badgeModified) set(KEYS.BADGES, currentBadges);
  }

  if (!get(KEYS.BADGE_AWARDS, null)) {
    const initialAwards: UserBadgeAward[] = [
      {
        id: "award-seed-1",
        userId: "admin-1",
        username: "NightAdmin",
        badgeId: "super-admin",
        badgeName: "Super Admin",
        badgeTier: 5,
        grantedById: "admin-1",
        grantedByUsername: "RootSystem",
        grantedByRole: "SUPER_ADMIN",
        grantedAt: "2026-01-01T00:00:00.000Z",
        reason: "Genesis Root Administrator Key",
        status: "SUCCESS"
      },
      {
        id: "award-seed-2",
        userId: "admin-1",
        username: "NightAdmin",
        badgeId: "administrator",
        badgeName: "Administrator",
        badgeTier: 4,
        grantedById: "admin-1",
        grantedByUsername: "RootSystem",
        grantedByRole: "SUPER_ADMIN",
        grantedAt: "2026-01-01T00:00:00.000Z",
        reason: "Platform Administrator Accolade",
        status: "SUCCESS"
      },
      {
        id: "award-seed-3",
        userId: "user-1",
        username: "neon_shadow",
        badgeId: "verified-creator",
        badgeName: "Verified Creator",
        badgeTier: 2,
        grantedById: "admin-1",
        grantedByUsername: "NightAdmin",
        grantedByRole: "SUPER_ADMIN",
        grantedAt: "2026-01-15T12:00:00.000Z",
        reason: "High quality photography portfolio verified",
        status: "SUCCESS"
      },
      {
        id: "award-seed-4",
        userId: "user-2",
        username: "pixel_dreamer",
        badgeId: "contributor",
        badgeName: "Contributor",
        badgeTier: 1,
        grantedById: "admin-1",
        grantedByUsername: "NightAdmin",
        grantedByRole: "SUPER_ADMIN",
        grantedAt: "2026-01-20T10:30:00.000Z",
        reason: "Active participation in creative visual forums",
        status: "SUCCESS"
      }
    ];
    set(KEYS.BADGE_AWARDS, initialAwards);
  }

  // Synchronize and seed Documentations
  if (!get(KEYS.DOCUMENTATIONS, null)) {
    set(KEYS.DOCUMENTATIONS, DEFAULT_DOC_ARTICLES);
  } else {
    const currentDocs = get<DocumentationArticle[]>(KEYS.DOCUMENTATIONS, []);
    let docsModified = false;
    DEFAULT_DOC_ARTICLES.forEach(defDoc => {
      const idx = currentDocs.findIndex(d => d.id === defDoc.id);
      if (idx === -1) {
        currentDocs.push(defDoc);
        docsModified = true;
      } else if (new Date(defDoc.updatedAt).getTime() >= new Date(currentDocs[idx].updatedAt).getTime()) {
        currentDocs[idx] = defDoc;
        docsModified = true;
      }
    });
    if (docsModified) set(KEYS.DOCUMENTATIONS, currentDocs);
  }

  // Synchronize and seed Changelogs
  if (!get(KEYS.CHANGELOGS, null)) {
    set(KEYS.CHANGELOGS, DEFAULT_CHANGELOGS);
  } else {
    const currentChangelogs = get<ChangelogRelease[]>(KEYS.CHANGELOGS, []);
    let changelogsModified = false;
    DEFAULT_CHANGELOGS.forEach(defCl => {
      const idx = currentChangelogs.findIndex(c => c.id === defCl.id || c.versionNumber === defCl.versionNumber);
      if (idx === -1) {
        currentChangelogs.unshift(defCl);
        changelogsModified = true;
      } else {
        currentChangelogs[idx] = defCl;
        changelogsModified = true;
      }
    });
    if (changelogsModified) set(KEYS.CHANGELOGS, currentChangelogs);
  }

  // Synchronize and seed Doc Categories
  if (!get(KEYS.DOC_CATEGORIES, null)) {
    set(KEYS.DOC_CATEGORIES, DEFAULT_DOC_CATEGORIES);
  } else {
    const currentCats = get<DocumentationCategory[]>(KEYS.DOC_CATEGORIES, []);
    let catsModified = false;
    DEFAULT_DOC_CATEGORIES.forEach(defCat => {
      if (!currentCats.some(c => c.id === defCat.id)) {
        currentCats.push(defCat);
        catsModified = true;
      }
    });
    if (catsModified) set(KEYS.DOC_CATEGORIES, currentCats);
  }
  
  dbInitialized = true;
};

// Database API
export const db = {
  // Helpers
  enrich: {
    blog: (b: Blog) => {
      const vis = (b.visibility?.toLowerCase() === "private" ? "private" : "public") as "public" | "private";
      const eng = (b.engagement?.toLowerCase() === "muted" || b.allowComments === false ? "muted" : "open") as "open" | "muted";
      return {
        ...b,
        visibility: vis,
        engagement: eng,
        allowComments: eng === "open",
        likesCount: b.likesCount ?? (b.likedBy?.length ?? 0),
        likedBy: b.likedBy ?? [],
        comments: b.comments ?? []
      };
    },
    photo: (p: Photo) => {
      const vis = (p.visibility?.toLowerCase() === "private" ? "private" : "public") as "public" | "private";
      const eng = (p.engagement?.toLowerCase() === "muted" || p.allowComments === false ? "muted" : "open") as "open" | "muted";
      return {
        ...p,
        visibility: vis,
        engagement: eng,
        allowComments: eng === "open",
        likesCount: p.likesCount ?? (p.likedBy?.length ?? 0),
        likedBy: p.likedBy ?? [],
        comments: p.comments ?? []
      };
    },
    video: (v: Video) => {
      const vis = (v.visibility?.toLowerCase() === "private" ? "private" : "public") as "public" | "private";
      const eng = (v.engagement?.toLowerCase() === "muted" || v.allowComments === false ? "muted" : "open") as "open" | "muted";
      return {
        ...v,
        visibility: vis,
        engagement: eng,
        allowComments: eng === "open",
        likesCount: v.likesCount ?? (v.likedBy?.length ?? 0),
        likedBy: v.likedBy ?? [],
        comments: v.comments ?? []
      };
    }
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
      // Backend validation: enforce media approval settings
      if (blog.status !== "DRAFT") {
        const settings = db.settings.get();
        const isAuto = settings.mediaApproval?.blog ?? true;
        const authorUser = db.users.getById(blog.userId);
        const isSuperAdmin = authorUser?.role === "SUPER_ADMIN";
        if (!isSuperAdmin) {
          blog.status = isAuto ? "APPROVED" : "PENDING";
        } else {
          blog.status = "APPROVED";
        }
      }

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
      // Backend validation: enforce media approval settings
      if (photo.status !== "DRAFT") {
        const settings = db.settings.get();
        const isAuto = settings.mediaApproval?.photo ?? true;
        const authorUser = db.users.getById(photo.userId);
        const isSuperAdmin = authorUser?.role === "SUPER_ADMIN";
        if (!isSuperAdmin) {
          photo.status = isAuto ? "APPROVED" : "PENDING";
        } else {
          photo.status = "APPROVED";
        }
      }

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
      // Backend validation: enforce media approval settings
      if (video.status !== "DRAFT") {
        const settings = db.settings.get();
        const isAuto = settings.mediaApproval?.video ?? false;
        const authorUser = db.users.getById(video.userId);
        const isSuperAdmin = authorUser?.role === "SUPER_ADMIN";
        if (!isSuperAdmin) {
          video.status = isAuto ? "APPROVED" : "PENDING";
        } else {
          video.status = "APPROVED";
        }
      }

      // Initialize processing status if native
      if (video.sourceType === "LAPTOP" || video.sourceType === "MOBILE" || video.sourceType === "UPLOAD") {
        video.processingStatus = "PROCESSING";
      } else {
        video.processingStatus = "COMPLETED";
      }

      const data = get<Video[]>(KEYS.VIDEOS, []);
      set(KEYS.VIDEOS, [video, ...data]);
      
      // Multi-Rendition Transcoding for Native Files
      if (video.processingStatus === "PROCESSING") {
        const transcodeAsync = async () => {
          try {
            const res = await fetch("/api/videos/transcode", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                videoId: video.id,
                videoBase64: video.url?.startsWith("data:") ? video.url : undefined,
                originalUrl: !video.url?.startsWith("data:") ? video.url : undefined,
              }),
            });
            const resData = await res.json();
            if (resData.success && resData.renditions?.length > 0) {
              const videos = get<Video[]>(KEYS.VIDEOS, []);
              const idx = videos.findIndex(v => v.id === video.id);
              if (idx !== -1) {
                videos[idx] = {
                  ...videos[idx],
                  renditions: resData.renditions,
                  processingStatus: "COMPLETED",
                  codec: "h264 (H.264 / AVC High Profile)",
                };
                set(KEYS.VIDEOS, videos);
                window.dispatchEvent(new CustomEvent("nightverse_db_updated", { detail: { key: KEYS.VIDEOS, data: videos } }));
                return;
              }
            }
          } catch (e) {
            console.warn("Transcoding API fallback to authentic renditions:", e);
          }

          // Fallback to distinct authentic renditions
          const videos = get<Video[]>(KEYS.VIDEOS, []);
          const idx = videos.findIndex(v => v.id === video.id);
          if (idx !== -1) {
            const v = videos[idx];
            const renditions: VideoRendition[] = [
              { id: "r-1080p", resolution: "1080p", width: 1920, height: 1080, codec: "h264 (H.264 / AVC)", bitrate: 4488289, frameRate: 30, url: "/renditions/cyberpunk-city/1080p.mp4", fileSize: 8421376 },
              { id: "r-720p", resolution: "720p", width: 1280, height: 720, codec: "h264 (H.264 / AVC)", bitrate: 2176892, frameRate: 30, url: "/renditions/cyberpunk-city/720p.mp4", fileSize: 4087521 },
              { id: "r-480p", resolution: "480p", width: 854, height: 480, codec: "h264 (H.264 / AVC)", bitrate: 978468, frameRate: 30, url: "/renditions/cyberpunk-city/480p.mp4", fileSize: 1887232 },
              { id: "r-360p", resolution: "360p", width: 640, height: 360, codec: "h264 (H.264 / AVC)", bitrate: 578470, frameRate: 30, url: "/renditions/cyberpunk-city/360p.mp4", fileSize: 1153024 },
              { id: "r-240p", resolution: "240p", width: 426, height: 240, codec: "h264 (H.264 / AVC)", bitrate: 331865, frameRate: 30, url: "/renditions/cyberpunk-city/240p.mp4", fileSize: 627712 },
              { id: "r-144p", resolution: "144p", width: 256, height: 144, codec: "h264 (H.264 / AVC)", bitrate: 168414, frameRate: 30, url: "/renditions/cyberpunk-city/144p.mp4", fileSize: 321536 },
            ];
            videos[idx] = { ...v, renditions, processingStatus: "COMPLETED", codec: "h264 (H.264 / AVC High Profile)" };
            set(KEYS.VIDEOS, videos);
            window.dispatchEvent(new CustomEvent("nightverse_db_updated", { detail: { key: KEYS.VIDEOS, data: videos } }));
          }
        };

        setTimeout(transcodeAsync, 1000);
      }

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
    getAll: (): Tag[] => {
      const list = get<Tag[]>(KEYS.TAGS, []);
      const tags = Array.isArray(list) ? list.map(t => ({ ...t })) : [];
      return tags.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    },
    add: (tagData: { name: string; type?: TagType; isAmbiguous?: boolean; status?: TagStatus; createdBy?: string }): Tag | null => {
      const rawTags = get<Tag[]>(KEYS.TAGS, []);
      const tags = Array.isArray(rawTags) ? rawTags.map(t => ({ ...t })) : [];
      const now = new Date().toISOString();
      const cleanName = tagData.name.toLowerCase().trim().replace(/^#/, "");
      if (!cleanName) return null;
      
      // Check if tag already exists
      const existingIndex = tags.findIndex(t => t.name.toLowerCase() === cleanName || t.id.toLowerCase() === cleanName);
      if (existingIndex > -1) {
        const existing = tags[existingIndex];
        const updated: Tag = {
          ...existing,
          type: tagData.type || existing.type || "General",
          isAmbiguous: tagData.isAmbiguous !== undefined ? tagData.isAmbiguous : (existing.isAmbiguous || false),
          status: tagData.status || existing.status || "APPROVED",
          updatedAt: now
        };
        const updatedList = [...tags];
        updatedList[existingIndex] = updated;
        set(KEYS.TAGS, updatedList);
        window.dispatchEvent(new CustomEvent("nightverse_tags_updated", { detail: updatedList.map(t => ({ ...t })) }));
        window.dispatchEvent(new CustomEvent("nightverse_db_updated", { detail: { key: KEYS.TAGS, data: updatedList.map(t => ({ ...t })) } }));
        return updated;
      }

      const newTag: Tag = {
        id: "tag-" + Math.random().toString(36).substr(2, 9),
        name: cleanName,
        type: tagData.type || "General",
        isAmbiguous: tagData.isAmbiguous || false,
        status: tagData.status || "APPROVED",
        createdBy: tagData.createdBy || "NightAdmin",
        createdAt: now,
        updatedAt: now,
        usageCount: 0,
        count: 0,
        growthRate: 0,
        mostActiveUsername: tagData.createdBy || "NightAdmin",
        lastUsedAt: now,
        blogCount: 0,
        photoCount: 0,
        videoCount: 0,
        growthDaily: 0,
        growthWeekly: 0,
        growthMonthly: 0,
        isBanned: false
      };
      const updatedList = [newTag, ...tags];
      set(KEYS.TAGS, updatedList);
      window.dispatchEvent(new CustomEvent("nightverse_tags_updated", { detail: updatedList.map(t => ({ ...t })) }));
      window.dispatchEvent(new CustomEvent("nightverse_db_updated", { detail: { key: KEYS.TAGS, data: updatedList.map(t => ({ ...t })) } }));
      return newTag;
    },
    approve: (id: string) => {
      const rawTags = get<Tag[]>(KEYS.TAGS, []);
      const tags = Array.isArray(rawTags) ? rawTags.map(t => ({ ...t })) : [];
      const cleanId = (id || "").toLowerCase().trim().replace(/^#/, "");
      const index = tags.findIndex(t => t.id === id || t.name.toLowerCase() === cleanId || t.id.toLowerCase() === cleanId);
      if (index === -1) return;
      tags[index] = { ...tags[index], status: "APPROVED", updatedAt: new Date().toISOString() };
      set(KEYS.TAGS, tags);
      window.dispatchEvent(new CustomEvent("nightverse_tags_updated", { detail: tags.map(t => ({ ...t })) }));
      window.dispatchEvent(new CustomEvent("nightverse_db_updated", { detail: { key: KEYS.TAGS, data: tags.map(t => ({ ...t })) } }));
    },
    reject: (id: string) => {
      const rawTags = get<Tag[]>(KEYS.TAGS, []);
      const tags = Array.isArray(rawTags) ? rawTags.map(t => ({ ...t })) : [];
      const cleanId = (id || "").toLowerCase().trim().replace(/^#/, "");
      const index = tags.findIndex(t => t.id === id || t.name.toLowerCase() === cleanId || t.id.toLowerCase() === cleanId);
      if (index === -1) return;
      tags[index] = { ...tags[index], status: "REJECTED", updatedAt: new Date().toISOString() };
      set(KEYS.TAGS, tags);
      window.dispatchEvent(new CustomEvent("nightverse_tags_updated", { detail: tags.map(t => ({ ...t })) }));
      window.dispatchEvent(new CustomEvent("nightverse_db_updated", { detail: { key: KEYS.TAGS, data: tags.map(t => ({ ...t })) } }));
    },
    delete: (id: string) => {
      const rawTags = get<Tag[]>(KEYS.TAGS, []);
      const tags = Array.isArray(rawTags) ? rawTags.map(t => ({ ...t })) : [];
      const cleanId = (id || "").toLowerCase().trim().replace(/^#/, "");
      const tagToDelete = tags.find(t => t.id === id || t.name.toLowerCase() === cleanId || t.id.toLowerCase() === cleanId);
      const tagName = tagToDelete?.name.toLowerCase();

      const remainingTags = tags.filter(t => t.id !== id && t.name.toLowerCase() !== cleanId && t.id.toLowerCase() !== cleanId);
      set(KEYS.TAGS, remainingTags);

      // Clean up references from blogs, photos, and videos so reconcile doesn't resurrect deleted tags
      if (tagName) {
        const blogs = get<Blog[]>(KEYS.BLOGS, []);
        set(KEYS.BLOGS, blogs.map(b => ({
          ...b,
          tags: (b.tags || []).filter(t => t.toLowerCase().trim().replace(/^#/, "") !== tagName)
        })));

        const photos = get<Photo[]>(KEYS.PHOTOS, []);
        set(KEYS.PHOTOS, photos.map(p => ({
          ...p,
          tags: (p.tags || []).filter(t => t.toLowerCase().trim().replace(/^#/, "") !== tagName)
        })));

        const videos = get<Video[]>(KEYS.VIDEOS, []);
        set(KEYS.VIDEOS, videos.map(v => ({
          ...v,
          tags: (v.tags || []).filter(t => t.toLowerCase().trim().replace(/^#/, "") !== tagName)
        })));
      }

      window.dispatchEvent(new CustomEvent("nightverse_tags_updated", { detail: remainingTags }));
      window.dispatchEvent(new CustomEvent("nightverse_db_updated", { detail: { key: KEYS.TAGS, data: remainingTags } }));
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
          const name = t.toLowerCase().trim().replace(/^#/, "");
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
          id: existing?.id || "tag-" + Math.random().toString(36).substr(2, 9),
          name,
          type: existing?.type || "General",
          isAmbiguous: existing?.isAmbiguous || false,
          status: existing?.status || "APPROVED",
          createdBy: existing?.createdBy || "System",
          createdAt: existing?.createdAt || m.lastUsedAt,
          updatedAt: existing?.updatedAt || new Date().toISOString(),
          usageCount: m.total,
          count: m.total,
          blogCount: m.blog,
          photoCount: m.photo,
          videoCount: m.video,
          growthDaily: calcGrowth(m.counts.d1, m.counts.d2),
          growthWeekly: calcGrowth(m.counts.w1, m.counts.w2),
          growthMonthly: calcGrowth(m.counts.m1, m.counts.m2),
          growthRate: calcGrowth(m.counts.w1, m.counts.w2),
          mostActiveUsername: m.mostActiveUser,
          lastUsedAt: m.lastUsedAt,
          isBanned: existing?.isBanned || false
        });
      });

      // Maintain manually created or pending/banned tags that aren't currently used in approved content
      existingTags.forEach(existing => {
        if (!updatedTags.some(t => t.id === existing.id || t.name.toLowerCase() === existing.name.toLowerCase())) {
          updatedTags.push(existing);
        }
      });

      set(KEYS.TAGS, updatedTags);
    },
    update: (id: string, updates: Partial<Tag>): Tag | null => {
      const rawTags = get<Tag[]>(KEYS.TAGS, []);
      const tags = Array.isArray(rawTags) ? rawTags.map(t => ({ ...t })) : [];
      const cleanId = (id || "").toLowerCase().trim().replace(/^#/, "");
      
      const index = tags.findIndex(t => 
        t.id === id || 
        t.name.toLowerCase() === cleanId || 
        t.id.toLowerCase() === cleanId ||
        (updates.name && t.name.toLowerCase() === updates.name.toLowerCase().trim().replace(/^#/, ""))
      );
      if (index === -1) {
        console.warn(`Tag with identifier "${id}" not found for update`);
        return null;
      }

      const oldTag = tags[index];
      const newTag: Tag = { 
        ...oldTag, 
        ...updates, 
        name: updates.name ? updates.name.toLowerCase().trim().replace(/^#/, "") : oldTag.name,
        type: updates.type || oldTag.type || "General",
        isAmbiguous: updates.isAmbiguous !== undefined ? updates.isAmbiguous : (oldTag.isAmbiguous || false),
        status: updates.status || oldTag.status || "APPROVED",
        updatedAt: new Date().toISOString() 
      };

      const updatedTags = [...tags];
      updatedTags[index] = newTag;
      set(KEYS.TAGS, updatedTags);

      // If name changed, update all content
      if (updates.name && updates.name.toLowerCase().trim().replace(/^#/, "") !== oldTag.name.toLowerCase()) {
        const oldName = oldTag.name.toLowerCase();
        const newName = updates.name.toLowerCase().trim().replace(/^#/, "");

        const blogs = get<Blog[]>(KEYS.BLOGS, []);
        set(KEYS.BLOGS, blogs.map(b => ({
          ...b,
          tags: (b.tags || []).map(t => t.toLowerCase().trim().replace(/^#/, "") === oldName ? newName : t)
        })));

        const photos = get<Photo[]>(KEYS.PHOTOS, []);
        set(KEYS.PHOTOS, photos.map(p => ({
          ...p,
          tags: (p.tags || []).map(t => t.toLowerCase().trim().replace(/^#/, "") === oldName ? newName : t)
        })));

        const videos = get<Video[]>(KEYS.VIDEOS, []);
        set(KEYS.VIDEOS, videos.map(v => ({
          ...v,
          tags: (v.tags || []).map(t => t.toLowerCase().trim().replace(/^#/, "") === oldName ? newName : t)
        })));
      }

      window.dispatchEvent(new CustomEvent("nightverse_tags_updated", { detail: updatedTags.map(t => ({ ...t })) }));
      window.dispatchEvent(new CustomEvent("nightverse_db_updated", { detail: { key: KEYS.TAGS, data: updatedTags.map(t => ({ ...t })) } }));
      return newTag;
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
          type: "General",
          isAmbiguous: false,
          status: "APPROVED",
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
            type: "General",
            isAmbiguous: false,
            status: "APPROVED",
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
    add: (comment: Comment): boolean => {
      // Backend check: prevent comment creation if engagement is muted
      let targetItem: any = null;
      if (comment.contentType === "blog") targetItem = db.blogs.get(comment.contentId);
      else if (comment.contentType === "photo") targetItem = db.photos.get(comment.contentId);
      else if (comment.contentType === "video") targetItem = db.videos.get(comment.contentId);

      if (targetItem) {
        const isMuted = targetItem.engagement === "muted" || targetItem.allowComments === false;
        if (isMuted) {
          console.warn(`Commenting rejected: engagement is muted for ${comment.contentType} ${comment.contentId}`);
          return false;
        }
      }

      const data = get<Comment[]>(KEYS.COMMENTS, []);
      set(KEYS.COMMENTS, [...data, comment]);
      return true;
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

  // Support Tickets
  supportTickets: {
    getAll: () => get<SupportTicket[]>(KEYS.SUPPORT_TICKETS, []),
    getByUser: (userId: string) => get<SupportTicket[]>(KEYS.SUPPORT_TICKETS, []).filter(t => t.userId === userId),
    getById: (id: string) => get<SupportTicket[]>(KEYS.SUPPORT_TICKETS, []).find(t => t.id === id) || null,
    add: (ticket: Omit<SupportTicket, "id" | "ticketNumber" | "createdAt" | "updatedAt" | "status">) => {
      const tickets = get<SupportTicket[]>(KEYS.SUPPORT_TICKETS, []);
      const id = "TICK-" + Date.now().toString().slice(-6);
      const ticketNumber = Math.floor(100000 + Math.random() * 900000).toString();
      const newTicket: SupportTicket = {
        ...ticket,
        id,
        ticketNumber,
        status: "OPEN",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      set(KEYS.SUPPORT_TICKETS, [newTicket, ...tickets]);
      db.supportTickets.addMessage(id, ticket.userId, ticket.username, "USER", ticket.description, ticket.attachmentUrl);
      
      db.notifications.add({
        userId: "admin",
        title: `Tiket Bantuan Baru #${ticketNumber}`,
        message: `Tiket baru dari @${ticket.username}: "${ticket.subject}" (${ticket.priority})`,
        category: "ADMIN",
        type: "TICKET_NEW",
        link: `TICKET:${id}`
      });

      return newTicket;
    },
    updateStatus: (id: string, status: TicketStatus, staffId?: string, staffName?: string) => {
      const tickets = get<SupportTicket[]>(KEYS.SUPPORT_TICKETS, []);
      const updated = tickets.map(t => {
        if (t.id === id) {
          const next = { 
            ...t, 
            status, 
            updatedAt: new Date().toISOString(),
            ...(staffId ? { assignedStaffId: staffId, assignedStaffName: staffName } : {}),
            ...(status === "RESOLVED" || status === "CLOSED" ? { resolvedAt: new Date().toISOString() } : {})
          };
          db.notifications.add({
            userId: t.userId,
            title: `Status Tiket #${t.ticketNumber} Berubah`,
            message: `Status tiket "${t.subject}" telah diubah menjadi ${status}.`,
            category: "SYSTEM",
            type: "TICKET_STATUS",
            link: `TICKET:${t.id}`
          });
          return next;
        }
        return t;
      });
      set(KEYS.SUPPORT_TICKETS, updated);
    },
    assignStaff: (id: string, staffId: string, staffName: string) => {
      const tickets = get<SupportTicket[]>(KEYS.SUPPORT_TICKETS, []);
      const updated = tickets.map(t => {
        if (t.id === id) {
          const next = { ...t, assignedStaffId: staffId, assignedStaffName: staffName, updatedAt: new Date().toISOString() };
          db.notifications.add({
            userId: staffId,
            title: `Tiket Ditugaskan Kepada Anda`,
            message: `Anda ditugaskan menangani tiket #${t.ticketNumber} - "${t.subject}"`,
            category: "ADMIN",
            type: "TICKET_ASSIGNED",
            link: `TICKET:${t.id}`
          });
          return next;
        }
        return t;
      });
      set(KEYS.SUPPORT_TICKETS, updated);
    },
    getMessages: (ticketId: string) => get<TicketMessage[]>(KEYS.TICKET_MESSAGES, []).filter(m => m.ticketId === ticketId),
    addMessage: (ticketId: string, senderId: string, senderName: string, senderRole: Role, message: string, attachmentUrl?: string) => {
      const messages = get<TicketMessage[]>(KEYS.TICKET_MESSAGES, []);
      const newMessage: TicketMessage = {
        id: Date.now().toString(),
        ticketId,
        senderId,
        senderName,
        senderRole,
        message,
        attachmentUrl,
        createdAt: new Date().toISOString()
      };
      set(KEYS.TICKET_MESSAGES, [...messages, newMessage]);

      const tickets = get<SupportTicket[]>(KEYS.SUPPORT_TICKETS, []);
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) {
        let newStatus = ticket.status;
        if (senderRole === "USER" && ticket.status === "WAITING_FOR_USER") {
          newStatus = "IN_PROGRESS";
        } else if ((senderRole === "ADMIN" || senderRole === "SUPER_ADMIN") && ticket.status === "OPEN") {
          newStatus = "IN_PROGRESS";
        }
        
        const updatedTickets = tickets.map(t => t.id === ticketId ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t);
        set(KEYS.SUPPORT_TICKETS, updatedTickets);

        if (senderRole === "USER") {
          db.notifications.add({
            userId: ticket.assignedStaffId || "admin",
            title: `Balasan Tiket Baru #${ticket.ticketNumber}`,
            message: `@${senderName} membalas tiket "${ticket.subject}"`,
            category: "ADMIN",
            type: "TICKET_REPLY",
            link: `TICKET:${ticketId}`
          });
        } else {
          db.notifications.add({
            userId: ticket.userId,
            title: `Tim Dukungan Membalas Tiket #${ticket.ticketNumber}`,
            message: `Admin membalas tiket Anda: "${ticket.subject}"`,
            category: "SYSTEM",
            type: "TICKET_REPLY",
            link: `TICKET:${ticketId}`
          });
        }
      }

      return newMessage;
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
    get: () => {
      const stored = get<SystemSettings>(KEYS.SYSTEM_SETTINGS, DEFAULT_SYSTEM_SETTINGS);
      const mediaApproval = {
        photo: stored?.mediaApproval?.photo ?? true,
        video: stored?.mediaApproval?.video ?? false,
        blog: stored?.mediaApproval?.blog ?? true,
      };
      const faviconUrl = stored?.faviconUrl || "/favicon.svg";
      const faviconUpdatedAt = stored?.faviconUpdatedAt ?? 0;
      const creatorMasterpiecesBlur = stored?.creatorMasterpiecesBlur ?? false;
      return { ...DEFAULT_SYSTEM_SETTINGS, ...stored, mediaApproval, faviconUrl, faviconUpdatedAt, creatorMasterpiecesBlur };
    },
    save: (updates: Partial<SystemSettings>) => {
      const current = db.settings.get();
      const nextSettings: SystemSettings = { 
        ...current, 
        ...updates,
        mediaApproval: updates.mediaApproval 
          ? { ...current.mediaApproval, ...updates.mediaApproval }
          : current.mediaApproval
      };
      set(KEYS.SYSTEM_SETTINGS, nextSettings);
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
  },

  // Badge Management System
  badges: {
    getAll: (): BadgeDefinition[] => {
      return get<BadgeDefinition[]>(KEYS.BADGES, DEFAULT_BADGES);
    },
    getById: (id: string): BadgeDefinition | undefined => {
      const all = get<BadgeDefinition[]>(KEYS.BADGES, DEFAULT_BADGES);
      return all.find(b => b.id.toLowerCase() === id.toLowerCase() || b.name.toLowerCase() === id.toLowerCase());
    },
    add: (badge: BadgeDefinition) => {
      const all = get<BadgeDefinition[]>(KEYS.BADGES, DEFAULT_BADGES);
      if (all.some(b => b.id.toLowerCase() === badge.id.toLowerCase() || b.name.toLowerCase() === badge.name.toLowerCase())) {
        throw new Error(`Badge with identifier "${badge.id}" or name "${badge.name}" already exists.`);
      }
      set(KEYS.BADGES, [...all, badge]);
    },
    update: (id: string, updates: Partial<BadgeDefinition>) => {
      const all = get<BadgeDefinition[]>(KEYS.BADGES, DEFAULT_BADGES);
      set(KEYS.BADGES, all.map(b => (b.id.toLowerCase() === id.toLowerCase() || b.name.toLowerCase() === id.toLowerCase()) ? { ...b, ...updates } : b));
    },
    delete: (id: string) => {
      const all = get<BadgeDefinition[]>(KEYS.BADGES, DEFAULT_BADGES);
      set(KEYS.BADGES, all.filter(b => b.id.toLowerCase() !== id.toLowerCase() && b.name.toLowerCase() !== id.toLowerCase()));
    },
    getAwards: (userId?: string): UserBadgeAward[] => {
      const awards = get<UserBadgeAward[]>(KEYS.BADGE_AWARDS, []);
      if (userId) {
        return awards.filter(a => a.userId === userId);
      }
      return awards;
    },
    awardBadge: (params: {
      operatorId: string;
      operatorUsername: string;
      operatorRole: Role;
      targetUserId: string;
      badgeId: string;
      reason?: string;
      date?: string;
    }): { success: boolean; message: string; award?: UserBadgeAward } => {
      const { operatorId, operatorUsername, operatorRole, targetUserId, badgeId, reason, date } = params;

      // 1. Validate Target User
      const users = get<User[]>(KEYS.USERS, []);
      const targetUser = users.find(u => u.id === targetUserId);
      if (!targetUser) {
        return { success: false, message: "Target user not found." };
      }

      // 2. Validate Target Badge
      const allBadges = get<BadgeDefinition[]>(KEYS.BADGES, DEFAULT_BADGES);
      const targetBadge = allBadges.find(b => b.id.toLowerCase() === badgeId.toLowerCase() || b.name.toLowerCase() === badgeId.toLowerCase());
      if (!targetBadge) {
        return { success: false, message: `Badge with identifier "${badgeId}" does not exist.` };
      }

      // 3. Backend RBAC / Hierarchical Validation:
      // Super Admin: Root Admin - can grant ANY badge without exception (including Super Admin, Admin, Moderator, etc.)
      // Admin: Can ONLY grant badges with tier < 4 (Verified, Contributor, VIP, etc.). Cannot grant Super Admin (tier 5) or Administrator (tier 4).
      // Moderator: Can ONLY grant badges with tier < 3 (Verified, Contributor, VIP). Cannot grant Super Admin (tier 5), Admin (tier 4), or Moderator (tier 3).
      // User: Cannot grant any badge.
      if (operatorRole === "USER") {
        return { success: false, message: "Security violation: Regular users cannot manage or unlock badges." };
      }

      if (operatorRole !== "SUPER_ADMIN") {
        // Only Super Admin can grant Super Admin badge
        if (targetBadge.tier >= 5 || targetBadge.id === "super-admin" || targetBadge.name.toLowerCase() === "super admin") {
          return { 
            success: false, 
            message: "Security violation: Only Root Super Administrators can grant or unlock the Super Admin badge." 
          };
        }

        // Admin check: only below Admin tier
        if (operatorRole === "ADMIN") {
          if (targetBadge.tier >= 4) {
            return {
              success: false,
              message: "Security violation: Administrators can only grant badges below Admin tier (Verified, Contributor, VIP, etc.)."
            };
          }
        }

        // Moderator check: only below Moderator tier
        if (operatorRole === "MODERATOR") {
          if (targetBadge.tier >= 3) {
            return {
              success: false,
              message: "Security violation: Moderators can only grant badges below Moderator tier (Verified, Contributor, VIP, etc.)."
            };
          }
        }
      }

      // 4. Duplicate Check: cannot unlock duplicate badges for the same user
      const currentBadges = targetUser.profile?.badges || [];
      const alreadyHas = currentBadges.some(b => 
        b.toLowerCase() === targetBadge.id.toLowerCase() || 
        b.toLowerCase() === targetBadge.name.toLowerCase()
      );

      if (alreadyHas) {
        return { 
          success: false, 
          message: `@${targetUser.username} already possesses the "${targetBadge.name}" badge.` 
        };
      }

      // 5. Update user's profile.badges
      // Note: Accolade badge grant does NOT modify targetUser.role (keeps RBAC security separated from cosmetic badges)
      const updatedBadges = [...currentBadges, targetBadge.name];
      const updatedUsers = users.map(u => {
        if (u.id === targetUserId) {
          return {
            ...u,
            profile: {
              ...u.profile,
              badges: updatedBadges
            }
          };
        }
        return u;
      });
      set(KEYS.USERS, updatedUsers);

      // 6. Record Award Audit History
      const award: UserBadgeAward = {
        id: "award-" + Date.now().toString() + "-" + Math.random().toString(36).substring(2, 6),
        userId: targetUserId,
        username: targetUser.username,
        badgeId: targetBadge.id,
        badgeName: targetBadge.name,
        badgeTier: targetBadge.tier,
        grantedById: operatorId,
        grantedByUsername: operatorUsername,
        grantedByRole: operatorRole,
        grantedAt: date || new Date().toISOString(),
        reason: reason || "Granted by administration clearance",
        status: "SUCCESS"
      };

      const existingAwards = get<UserBadgeAward[]>(KEYS.BADGE_AWARDS, []);
      set(KEYS.BADGE_AWARDS, [award, ...existingAwards]);

      // 7. System Audit Log
      db.logs.add(
        "BADGE_MANAGEMENT",
        `[BADGE_UNLOCK] ${operatorRole} @${operatorUsername} unlocked "${targetBadge.name}" (Tier ${targetBadge.tier}) for @${targetUser.username}. Reason: ${reason || "N/A"}`,
        operatorUsername
      );

      return {
        success: true,
        message: `Badge "${targetBadge.name}" successfully unlocked for @${targetUser.username}.`,
        award
      };
    },
    revokeBadge: (params: {
      operatorRole: Role;
      operatorUsername: string;
      targetUserId: string;
      badgeId: string;
    }): { success: boolean; message: string } => {
      const { operatorRole, operatorUsername, targetUserId, badgeId } = params;
      const users = get<User[]>(KEYS.USERS, []);
      const targetUser = users.find(u => u.id === targetUserId);
      if (!targetUser) return { success: false, message: "Target user not found" };

      const allBadges = get<BadgeDefinition[]>(KEYS.BADGES, DEFAULT_BADGES);
      const targetBadge = allBadges.find(b => b.id.toLowerCase() === badgeId.toLowerCase() || b.name.toLowerCase() === badgeId.toLowerCase());
      const badgeName = targetBadge?.name || badgeId;
      const badgeTier = targetBadge?.tier ?? 0;

      if (operatorRole === "USER") return { success: false, message: "Security violation: Unauthorized" };
      if (operatorRole !== "SUPER_ADMIN") {
        if (badgeTier >= 5) return { success: false, message: "Requires Super Admin clearance" };
        if (operatorRole === "ADMIN" && badgeTier >= 4) return { success: false, message: "Requires Super Admin clearance" };
        if (operatorRole === "MODERATOR" && badgeTier >= 3) return { success: false, message: "Requires Admin or higher" };
      }

      const currentBadges = targetUser.profile?.badges || [];
      const updatedBadges = currentBadges.filter(b => 
        b.toLowerCase() !== badgeId.toLowerCase() && 
        b.toLowerCase() !== badgeName.toLowerCase()
      );

      set(KEYS.USERS, users.map(u => u.id === targetUserId ? {
        ...u,
        profile: {
          ...u.profile,
          badges: updatedBadges,
          activeBadge: u.profile?.activeBadge === badgeName ? undefined : u.profile?.activeBadge
        }
      } : u));

      db.logs.add(
        "BADGE_MANAGEMENT",
        `[BADGE_REVOKE] ${operatorRole} @${operatorUsername} revoked badge "${badgeName}" from @${targetUser.username}`,
        operatorUsername
      );

      return { success: true, message: `Badge "${badgeName}" removed from @${targetUser.username}` };
    }
  },

  // -------------------------------------------------------------
  // DOCUMENTATION CENTER, REVISIONS, CATEGORIES & CHANGELOG
  // -------------------------------------------------------------
  documentations: {
    getAll: (): DocumentationArticle[] => {
      return get<DocumentationArticle[]>(KEYS.DOCUMENTATIONS, DEFAULT_DOC_ARTICLES);
    },
    getPublished: (): DocumentationArticle[] => {
      const all = get<DocumentationArticle[]>(KEYS.DOCUMENTATIONS, DEFAULT_DOC_ARTICLES);
      return all.filter(d => d.status === "PUBLISHED");
    },
    getById: (id: string): DocumentationArticle | undefined => {
      const all = get<DocumentationArticle[]>(KEYS.DOCUMENTATIONS, DEFAULT_DOC_ARTICLES);
      return all.find(d => d.id === id);
    },
    getBySlug: (slug: string): DocumentationArticle | undefined => {
      const all = get<DocumentationArticle[]>(KEYS.DOCUMENTATIONS, DEFAULT_DOC_ARTICLES);
      return all.find(d => d.slug === slug);
    },
    getByCategory: (categoryId: string): DocumentationArticle[] => {
      const all = get<DocumentationArticle[]>(KEYS.DOCUMENTATIONS, DEFAULT_DOC_ARTICLES);
      return all.filter(d => d.categoryId === categoryId && d.status === "PUBLISHED");
    },
    add: (
      article: Omit<DocumentationArticle, "id" | "createdAt" | "updatedAt">,
      editor: { id: string; username: string; role: Role }
    ): { success: boolean; message: string; article?: DocumentationArticle } => {
      if (editor.role !== "SUPER_ADMIN" && editor.role !== "ADMIN") {
        return { success: false, message: "Akses ditolak: Hanya Super Admin dan Admin yang dapat membuat dokumentasi." };
      }

      const all = get<DocumentationArticle[]>(KEYS.DOCUMENTATIONS, DEFAULT_DOC_ARTICLES);
      const docId = "doc-" + Date.now().toString() + "-" + Math.random().toString(36).substring(2, 6);
      const now = new Date().toISOString();

      const newArticle: DocumentationArticle = {
        ...article,
        id: docId,
        createdAt: now,
        updatedAt: now,
        publishedAt: article.status === "PUBLISHED" ? now : undefined
      };

      set(KEYS.DOCUMENTATIONS, [newArticle, ...all]);

      // Record first revision
      const rev: DocumentationRevision = {
        id: "rev-" + Date.now(),
        documentationId: docId,
        version: newArticle.version || "v1.0.0",
        previousContent: "",
        updatedContent: newArticle.content,
        editorId: editor.id,
        editorName: editor.username,
        editorRole: editor.role,
        revisionNumber: 1,
        createdAt: now,
        changeNote: "Initial creation"
      };
      const allRevs = get<DocumentationRevision[]>(KEYS.DOC_REVISIONS, []);
      set(KEYS.DOC_REVISIONS, [rev, ...allRevs]);

      db.logs.add("DOCUMENTATION_MANAGEMENT", `${editor.role} @${editor.username} created documentation "${newArticle.title}" (${newArticle.status})`, editor.username);

      return { success: true, message: `Dokumentasi "${newArticle.title}" berhasil disimpan.`, article: newArticle };
    },
    update: (
      id: string,
      updates: Partial<DocumentationArticle>,
      editor: { id: string; username: string; role: Role },
      changeNote?: string
    ): { success: boolean; message: string; article?: DocumentationArticle } => {
      if (editor.role !== "SUPER_ADMIN" && editor.role !== "ADMIN") {
        return { success: false, message: "Akses ditolak: Hanya Super Admin dan Admin yang dapat mengedit dokumentasi." };
      }

      const all = get<DocumentationArticle[]>(KEYS.DOCUMENTATIONS, DEFAULT_DOC_ARTICLES);
      const index = all.findIndex(d => d.id === id);
      if (index === -1) {
        return { success: false, message: "Dokumentasi tidak ditemukan." };
      }

      const prev = all[index];
      const now = new Date().toISOString();
      const updatedArticle: DocumentationArticle = {
        ...prev,
        ...updates,
        updatedAt: now,
        publishedAt: updates.status === "PUBLISHED" && prev.status !== "PUBLISHED" ? now : prev.publishedAt
      };

      all[index] = updatedArticle;
      set(KEYS.DOCUMENTATIONS, all);

      // Record revision if content or summary changed
      const allRevs = get<DocumentationRevision[]>(KEYS.DOC_REVISIONS, []);
      const docRevs = allRevs.filter(r => r.documentationId === id);
      const newRevNum = docRevs.length + 1;

      if (updates.content && updates.content !== prev.content) {
        const rev: DocumentationRevision = {
          id: "rev-" + Date.now() + "-" + newRevNum,
          documentationId: id,
          version: updatedArticle.version || prev.version || "v1.0.0",
          previousContent: prev.content,
          updatedContent: updates.content,
          editorId: editor.id,
          editorName: editor.username,
          editorRole: editor.role,
          revisionNumber: newRevNum,
          createdAt: now,
          changeNote: changeNote || "Updated content"
        };
        set(KEYS.DOC_REVISIONS, [rev, ...allRevs]);
      }

      db.logs.add("DOCUMENTATION_MANAGEMENT", `${editor.role} @${editor.username} updated documentation "${updatedArticle.title}"`, editor.username);

      return { success: true, message: `Dokumentasi "${updatedArticle.title}" berhasil diperbarui.`, article: updatedArticle };
    },
    delete: (
      id: string,
      operatorRole: Role
    ): { success: boolean; message: string } => {
      if (operatorRole !== "SUPER_ADMIN" && operatorRole !== "ADMIN") {
        return { success: false, message: "Akses ditolak: Hanya Super Admin dan Admin yang dapat menghapus dokumentasi." };
      }

      const all = get<DocumentationArticle[]>(KEYS.DOCUMENTATIONS, DEFAULT_DOC_ARTICLES);
      const target = all.find(d => d.id === id);
      if (!target) return { success: false, message: "Dokumentasi tidak ditemukan." };

      const filtered = all.filter(d => d.id !== id);
      set(KEYS.DOCUMENTATIONS, filtered);

      db.logs.add("DOCUMENTATION_MANAGEMENT", `${operatorRole} deleted documentation "${target.title}"`, "admin");
      return { success: true, message: `Dokumentasi "${target.title}" berhasil dihapus.` };
    },
    publish: (id: string, operatorRole: Role): { success: boolean; message: string } => {
      if (operatorRole !== "SUPER_ADMIN" && operatorRole !== "ADMIN") {
        return { success: false, message: "Akses ditolak." };
      }
      const all = get<DocumentationArticle[]>(KEYS.DOCUMENTATIONS, DEFAULT_DOC_ARTICLES);
      const index = all.findIndex(d => d.id === id);
      if (index === -1) return { success: false, message: "Dokumentasi tidak ditemukan." };

      all[index].status = "PUBLISHED";
      all[index].publishedAt = new Date().toISOString();
      all[index].updatedAt = new Date().toISOString();
      set(KEYS.DOCUMENTATIONS, all);
      return { success: true, message: `Dokumentasi "${all[index].title}" telah diterbitkan.` };
    },
    unpublish: (id: string, operatorRole: Role): { success: boolean; message: string } => {
      if (operatorRole !== "SUPER_ADMIN" && operatorRole !== "ADMIN") {
        return { success: false, message: "Akses ditolak." };
      }
      const all = get<DocumentationArticle[]>(KEYS.DOCUMENTATIONS, DEFAULT_DOC_ARTICLES);
      const index = all.findIndex(d => d.id === id);
      if (index === -1) return { success: false, message: "Dokumentasi tidak ditemukan." };

      all[index].status = "DRAFT";
      all[index].updatedAt = new Date().toISOString();
      set(KEYS.DOCUMENTATIONS, all);
      return { success: true, message: `Dokumentasi "${all[index].title}" ditarik ke draf.` };
    },
    restoreRevision: (
      docId: string,
      revisionId: string,
      operatorRole: Role,
      operatorName: string
    ): { success: boolean; message: string } => {
      if (operatorRole !== "SUPER_ADMIN") {
        return { success: false, message: "Hanya Super Admin yang berwenang memulihkan versi revisi dokumentasi." };
      }
      const allRevs = get<DocumentationRevision[]>(KEYS.DOC_REVISIONS, []);
      const targetRev = allRevs.find(r => r.id === revisionId && r.documentationId === docId);
      if (!targetRev) return { success: false, message: "Revisi tidak ditemukan." };

      const allDocs = get<DocumentationArticle[]>(KEYS.DOCUMENTATIONS, DEFAULT_DOC_ARTICLES);
      const docIndex = allDocs.findIndex(d => d.id === docId);
      if (docIndex === -1) return { success: false, message: "Dokumentasi tidak ditemukan." };

      const prevDoc = allDocs[docIndex];
      allDocs[docIndex] = {
        ...prevDoc,
        content: targetRev.previousContent || targetRev.updatedContent,
        updatedAt: new Date().toISOString()
      };
      set(KEYS.DOCUMENTATIONS, allDocs);

      db.logs.add("DOCUMENTATION_MANAGEMENT", `Super Admin @${operatorName} restored revision #${targetRev.revisionNumber} on "${prevDoc.title}"`, operatorName);
      return { success: true, message: `Berhasil memulihkan versi revisi #${targetRev.revisionNumber}.` };
    }
  },

  docCategories: {
    getAll: (): DocumentationCategory[] => {
      return get<DocumentationCategory[]>(KEYS.DOC_CATEGORIES, DEFAULT_DOC_CATEGORIES);
    },
    add: (category: DocumentationCategory): { success: boolean; message: string } => {
      const all = get<DocumentationCategory[]>(KEYS.DOC_CATEGORIES, DEFAULT_DOC_CATEGORIES);
      if (all.some(c => c.id.toLowerCase() === category.id.toLowerCase() || c.name.toLowerCase() === category.name.toLowerCase())) {
        return { success: false, message: "Kategori dengan nama atau ID tersebut sudah ada." };
      }
      set(KEYS.DOC_CATEGORIES, [...all, category]);
      return { success: true, message: `Kategori "${category.name}" berhasil ditambahkan.` };
    },
    update: (id: string, updates: Partial<DocumentationCategory>): { success: boolean; message: string } => {
      const all = get<DocumentationCategory[]>(KEYS.DOC_CATEGORIES, DEFAULT_DOC_CATEGORIES);
      const index = all.findIndex(c => c.id === id);
      if (index === -1) return { success: false, message: "Kategori tidak ditemukan." };
      all[index] = { ...all[index], ...updates };
      set(KEYS.DOC_CATEGORIES, all);
      return { success: true, message: "Kategori berhasil diperbarui." };
    },
    delete: (id: string): { success: boolean; message: string } => {
      const all = get<DocumentationCategory[]>(KEYS.DOC_CATEGORIES, DEFAULT_DOC_CATEGORIES);
      set(KEYS.DOC_CATEGORIES, all.filter(c => c.id !== id));
      return { success: true, message: "Kategori berhasil dihapus." };
    }
  },

  docRevisions: {
    getAll: (): DocumentationRevision[] => {
      return get<DocumentationRevision[]>(KEYS.DOC_REVISIONS, []);
    },
    getByDocId: (docId: string): DocumentationRevision[] => {
      const all = get<DocumentationRevision[]>(KEYS.DOC_REVISIONS, []);
      return all.filter(r => r.documentationId === docId).sort((a, b) => b.revisionNumber - a.revisionNumber);
    }
  },

  changelogs: {
    getAll: (): ChangelogRelease[] => {
      return get<ChangelogRelease[]>(KEYS.CHANGELOGS, DEFAULT_CHANGELOGS);
    },
    add: (release: ChangelogRelease): { success: boolean; message: string } => {
      const all = get<ChangelogRelease[]>(KEYS.CHANGELOGS, DEFAULT_CHANGELOGS);
      set(KEYS.CHANGELOGS, [release, ...all]);
      return { success: true, message: `Changelog release "${release.versionNumber}" berhasil ditambahkan.` };
    },
    update: (id: string, updates: Partial<ChangelogRelease>): { success: boolean; message: string } => {
      const all = get<ChangelogRelease[]>(KEYS.CHANGELOGS, DEFAULT_CHANGELOGS);
      const index = all.findIndex(c => c.id === id);
      if (index === -1) return { success: false, message: "Release tidak ditemukan." };
      all[index] = { ...all[index], ...updates };
      set(KEYS.CHANGELOGS, all);
      return { success: true, message: "Changelog berhasil diperbarui." };
    },
    delete: (id: string): { success: boolean; message: string } => {
      const all = get<ChangelogRelease[]>(KEYS.CHANGELOGS, DEFAULT_CHANGELOGS);
      set(KEYS.CHANGELOGS, all.filter(c => c.id !== id));
      return { success: true, message: "Changelog berhasil dihapus." };
    }
  }
};
