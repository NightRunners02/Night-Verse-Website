export type Role = "SUPER_ADMIN" | "ADMIN" | "MODERATOR" | "USER";
export type ContentStatus = "PENDING" | "APPROVED" | "REJECTED" | "REVISION" | "DRAFT";
export type SourceType = "LAPTOP" | "MOBILE" | "UPLOAD" | "URL" | "EMBED";
export type PrivacyLevel = "PUBLIC" | "PRIVATE" | "ONLY_ME";

export type BadgeCategory = "ROLE" | "COMMUNITY" | "ACHIEVEMENT" | "SPECIAL";

export interface BadgeDefinition {
  id: string;
  name: string;
  icon: string; // Lucide icon name or identifier
  description: string;
  category: BadgeCategory;
  tier: number; // 5: Super Admin, 4: Admin, 3: Moderator, 2: Verified, 1: Contributor, 0: VIP/Member
  status: "ACTIVE" | "INACTIVE";
  requirement: string;
  createdAt: string;
  color?: string;
  bgColor?: string;
  borderColor?: string;
}

export interface UserBadgeAward {
  id: string;
  userId: string;
  username: string;
  badgeId: string;
  badgeName: string;
  badgeTier: number;
  grantedById: string;
  grantedByUsername: string;
  grantedByRole: Role;
  grantedAt: string;
  reason?: string;
  status: "SUCCESS";
}

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
    youtube?: string;
    discord?: string;
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
      showBanner?: PrivacyLevel;
      showLocation: PrivacyLevel;
      showSocialLinks: PrivacyLevel;
      showInterests?: PrivacyLevel;
      showIdentity?: PrivacyLevel;
      showActivity: PrivacyLevel;
      showActivityStatus?: PrivacyLevel;
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

export type ContentVisibility = "public" | "private";
export type ContentEngagement = "open" | "muted";

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
  visibility?: ContentVisibility | "PUBLIC" | "PRIVATE";
  engagement?: ContentEngagement | "OPEN" | "MUTED";
  allowComments?: boolean;
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
  category?: string;
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
  thumbnailUrl?: string;
  tags: string[];
  status: ContentStatus;
  visibility?: ContentVisibility | "PUBLIC" | "PRIVATE";
  engagement?: ContentEngagement | "OPEN" | "MUTED";
  allowComments?: boolean;
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
  category?: string;
}

export interface VideoRendition {
  id: string;
  resolution: string; // e.g. "1080p", "720p", "Original"
  width: number;
  height: number;
  codec: string;
  bitrate: number;
  frameRate: number;
  url: string;
  fileSize: number;
}

export type VideoProcessingStatus = "UPLOADING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface Video {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar: string;
  title: string;
  description: string;
  sourceType: SourceType; // LAPTOP, MOBILE, URL, EMBED
  url: string; // Main playback URL or source
  renditions?: VideoRendition[];
  thumbnailUrl: string;
  duration: number;
  resolution: string; // e.g. "1920x1080"
  aspectRatio?: string; // e.g. "16:9"
  codec?: string; // e.g. "h264"
  frameRate?: number;
  fileSize?: number;
  processingStatus?: VideoProcessingStatus;
  
  // External / Embed fields
  isExternal?: boolean;
  externalProvider?: "YOUTUBE" | "VIMEO" | "DIRECT" | "OTHER";
  embedUrl?: string;
  externalReference?: string;

  tags: string[];
  status: ContentStatus;
  visibility?: ContentVisibility | "PUBLIC" | "PRIVATE";
  engagement?: ContentEngagement | "OPEN" | "MUTED";
  allowComments?: boolean;
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
  category?: string;
}

export type TagType = "Copyright" | "General" | "Artist" | "Character" | "Metadata";
export type TagStatus = "APPROVED" | "PENDING" | "REJECTED";

export interface Tag {
  id: string; // tag_id primary key
  name: string;
  type: TagType;
  isAmbiguous?: boolean;
  status?: TagStatus;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
  usageCount: number;
  count?: number; // Alias for compatibility
  growthRate: number;
  mostActiveUsername?: string;
  lastUsedAt: string;
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

export interface MediaApprovalSettings {
  photo: boolean; // ON (true): Automatic Publishing Enabled, OFF (false): Manual Approval Required
  video: boolean; // ON (true): Automatic Publishing Enabled, OFF (false): Manual Approval Required
  blog: boolean;  // ON (true): Automatic Publishing Enabled, OFF (false): Manual Approval Required
}

export interface SystemSettings {
  websiteName: string;
  logoText: string;
  logoUrl?: string;
  faviconEmoji?: string;
  faviconUrl?: string;
  faviconUpdatedAt?: number;
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
  creatorMasterpiecesBlur: boolean;
  mediaApproval?: MediaApprovalSettings;
}

export interface ToastAlert {
  id: string;
  title: string;
  message: string;
  type: "success" | "error" | "info";
}

export interface DocumentationCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  displayOrder: number;
}

export interface DocumentationStep {
  stepNumber: number;
  title: string;
  description: string;
}

export interface DocumentationCallout {
  type: "info" | "warning" | "tip";
  title: string;
  text: string;
}

export interface DocumentationArticle {
  id: string;
  title: string;
  slug: string;
  categoryId: string;
  summary: string;
  content: string;
  coverImage?: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  version: string;
  authorId: string;
  authorName: string;
  authorRole?: string;
  displayOrder: number;
  steps?: DocumentationStep[];
  callouts?: DocumentationCallout[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface DocumentationRevision {
  id: string;
  documentationId: string;
  version: string;
  previousContent: string;
  updatedContent: string;
  editorId: string;
  editorName: string;
  editorRole: string;
  revisionNumber: number;
  createdAt: string;
  changeNote?: string;
}

export interface ChangelogRelease {
  id: string;
  versionNumber: string;
  releaseTitle: string;
  releaseDate: string;
  summary?: string;
  newFeatures: string[];
  improvements: string[];
  bugFixes: string[];
  breakingChanges?: string[];
  createdBy: string;
  createdAt: string;
}

export type TicketCategory = "Account" | "Login" | "Profile" | "Creator Dashboard" | "Content" | "Payment" | "Technical Issue" | "Bug Report" | "Other";
export type TicketPriority = "Low" | "Medium" | "High" | "Urgent";
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "WAITING_FOR_USER" | "RESOLVED" | "CLOSED";

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  username: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  description: string;
  attachmentUrl?: string;
  status: TicketStatus;
  assignedStaffId?: string;
  assignedStaffName?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  message: string;
  attachmentUrl?: string;
  createdAt: string;
}

