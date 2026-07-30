export type Role = "SUPER_ADMIN" | "ADMIN" | "MODERATOR" | "USER";
export type ContentStatus = "PENDING" | "APPROVED" | "REJECTED" | "REVISION" | "DRAFT";
export type SourceType = "LAPTOP" | "MOBILE" | "URL" | "EMBED";
export type PrivacyLevel = "PUBLIC" | "PRIVATE" | "ONLY_ME";

export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash?: string;
  role: Role;
  isSuspended: boolean;
  emailVerified: boolean;
  createdAt: string;
  profile?: {
    avatarUrl?: string;
    fullName?: string;
    bio?: string;
    location?: string;
    website?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    tiktok?: string;
    facebook?: string;
    bannerUrl?: string;
    gender?: string;
    dateOfBirth?: string;
    github?: string;
    phoneNumber?: string;
    occupation?: string;
    interests?: string[];
    badges?: string[];
    activeBadge?: string;
    privacy?: {
      profileVisible: boolean;
      showEmail: PrivacyLevel;
      showPhone: PrivacyLevel;
      showFullName: PrivacyLevel;
      showAvatar: PrivacyLevel;
      showLocation: PrivacyLevel;
      showSocialLinks: PrivacyLevel;
      showActivity: PrivacyLevel;
      twoFactorEnabled: boolean;
    };
    notificationPreferences?: {
      all: boolean;
      content: boolean;
      social: boolean;
      system: boolean;
      admin: boolean;
    };
  };
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string;
  content: string;
  createdAt: string;
  contentType: "blog" | "photo" | "video";
  contentId: string;
}

export interface Blog {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar: string;
  title: string;
  description: string;
  content: string;
  thumbnailUrl: string;
  tags: string[];
  status: ContentStatus;
  rejectReason?: string;
  createdAt: string;
  views: number;
  likesCount?: number;
  likedBy?: string[];
  comments?: Comment[];
  favoritedBy?: string[];
  favoritesCount?: number;
  bookmarkedBy?: string[];
  bookmarksCount?: number;
  sharesCount?: number;
}

export interface Photo {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar: string;
  title: string;
  description: string;
  sourceType: SourceType;
  url: string;
  tags: string[];
  status: ContentStatus;
  rejectReason?: string;
  createdAt: string;
  views: number;
  likesCount?: number;
  likedBy?: string[];
  comments?: Comment[];
  favoritedBy?: string[];
  favoritesCount?: number;
  bookmarkedBy?: string[];
  bookmarksCount?: number;
  sharesCount?: number;
}

export interface Video {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar: string;
  title: string;
  description: string;
  sourceType: SourceType;
  url: string;
  thumbnailUrl: string;
  duration: number;
  resolution: string;
  aspectRatio?: string;
  tags: string[];
  status: ContentStatus;
  rejectReason?: string;
  createdAt: string;
  views: number;
  likesCount?: number;
  likedBy?: string[];
  comments?: Comment[];
  favoritedBy?: string[];
  favoritesCount?: number;
  bookmarkedBy?: string[];
  bookmarksCount?: number;
  sharesCount?: number;
}

export interface Tag {
  id: string;
  name: string;
  usageCount: number;
  count?: number; // Alias for compatibility with some components
  growthRate: number;
  mostActiveUsername?: string;
  lastUsedAt: string;
  createdAt: string;
  blogCount: number;
  photoCount: number;
  videoCount: number;
  growthDaily: number;
  growthWeekly: number;
  growthMonthly: number;
  isBanned?: boolean;
}

export type NotificationCategory = "CONTENT" | "SOCIAL" | "SYSTEM" | "ADMIN";

export interface Notification {
  id: string;
  userId: string;
  triggeredById?: string;
  triggeredByName?: string;
  triggeredByAvatar?: string;
  title: string;
  message: string;
  category: NotificationCategory;
  type: string; 
  link?: string; 
  isRead: boolean;
  createdAt: string;
  groupId?: string;
  groupCount?: number;
  actionTaken?: boolean;
  actionBy?: string;
  actionDecision?: string;
  targetType?: "blog" | "photo" | "video";
  targetId?: string;
}

export interface SystemSettings {
  websiteName: string;
  logoText: string;
  logoUrl?: string;
  faviconEmoji?: string;
  primaryColor: string;
  secondaryColor: string;
  homepageBanner: string;
  heroTitle: string;
  heroSubtitle: string;
  footerText: string;
  seoDescription: string;
  seoKeywords: string;
  ogImage: string;
  maxImageSizeMB: number;
  maxVideoSizeMB: number;
  allowedFormats: string[];
  smtpHost: string;
  smtpPort: number;
  enableEmailVerification: boolean;
  enablePushNotifications: boolean;
  enableRealtimeStream: boolean;
}

export interface ToastAlert {
  id: string;
  title: string;
  message: string;
  type: "success" | "error" | "info";
}
