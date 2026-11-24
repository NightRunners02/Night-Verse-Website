import {
  supabaseSelect,
  supabaseUpsert,
  supabaseDeleteIds,
  supabaseDeleteFollows,
  isSupabaseConfigured,
} from "./supabase.js";

export const STORAGE_KEYS = {
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
  TICKET_MESSAGES: "nv_ticket_messages",
} as const;

type Mapper = {
  table: string;
  orderQuery?: string;
  isSingleton?: boolean;
  isCompositeFollow?: boolean;
  getKey: (item: any) => string;
  toRow: (item: any) => Record<string, any>;
  fromRow: (row: Record<string, any>) => any;
};

const toIso = (val?: string | null): string => {
  if (!val) return new Date().toISOString();
  return val;
};

let hasUsersUpdatedAtColumn = false;

const MAPPERS: Record<string, Mapper> = {
  [STORAGE_KEYS.USERS]: {
    table: "users",
    orderQuery: "select=*&order=created_at.asc",
    getKey: (u) => String(u.id),
    toRow: (u) => {
      const row: Record<string, any> = {
        id: u.id,
        email: u.email,
        username: u.username,
        password_hash: u.passwordHash || "",
        role: u.role || "USER",
        is_suspended: Boolean(u.isSuspended),
        email_verified: u.emailVerified ?? true,
        profile: u.profile || {},
        created_at: toIso(u.createdAt),
      };
      if (hasUsersUpdatedAtColumn) {
        row.updated_at = toIso(u.updatedAt || u.createdAt);
      }
      return row;
    },
    fromRow: (r) => ({
      id: r.id,
      email: r.email,
      username: r.username,
      passwordHash: r.password_hash,
      role: r.role,
      isSuspended: Boolean(r.is_suspended),
      emailVerified: r.email_verified ?? true,
      profile: r.profile || {},
      createdAt: r.created_at,
      updatedAt: r.updated_at || r.created_at,
    }),
  },

  [STORAGE_KEYS.SYSTEM_SETTINGS]: {
    table: "system_settings",
    orderQuery: "select=*&id=eq.1",
    isSingleton: true,
    getKey: () => "1",
    toRow: (s) => ({
      id: 1,
      website_name: s.websiteName ?? "NightVerse",
      logo_text: s.logoText ?? "NIGHTVERSE",
      logo_url: s.logoUrl ?? null,
      favicon_emoji: s.faviconEmoji ?? "🌌",
      favicon_url: s.faviconUrl ?? "/favicon.svg",
      favicon_updated_at: s.faviconUpdatedAt ?? 0,
      primary_color: s.primaryColor ?? "purple-600",
      secondary_color: s.secondaryColor ?? "cyan-400",
      homepage_banner: s.homepageBanner ?? "",
      hero_title: s.heroTitle ?? "",
      hero_subtitle: s.heroSubtitle ?? "",
      footer_text: s.footerText ?? "",
      seo_description: s.seoDescription ?? "",
      seo_keywords: s.seoKeywords ?? "",
      og_image: s.ogImage ?? "",
      max_image_size_mb: s.maxImageSizeMB ?? 10,
      max_video_size_mb: s.maxVideoSizeMB ?? 100,
      allowed_formats: s.allowedFormats ?? ["jpg", "jpeg", "png", "gif", "mp4", "mov"],
      smtp_host: s.smtpHost ?? "smtp.nightverse.com",
      smtp_port: s.smtpPort ?? 587,
      enable_email_verification: s.enableEmailVerification ?? true,
      enable_push_notifications: s.enablePushNotifications ?? false,
      enable_realtime_stream: s.enableRealtimeStream ?? true,
      enable_floating_toasts: s.enableFloatingToasts ?? true,
      creator_masterpieces_blur: s.creatorMasterpiecesBlur ?? false,
      explore_items_per_page: s.exploreItemsPerPage ?? 12,
      media_approval: s.mediaApproval ?? { photo: true, video: false, blog: true },
    }),
    fromRow: (r) => ({
      websiteName: r.website_name,
      logoText: r.logo_text,
      logoUrl: r.logo_url ?? undefined,
      faviconEmoji: r.favicon_emoji,
      faviconUrl: r.favicon_url,
      faviconUpdatedAt: Number(r.favicon_updated_at ?? 0),
      primaryColor: r.primary_color,
      secondaryColor: r.secondary_color,
      homepageBanner: r.homepage_banner,
      heroTitle: r.hero_title,
      heroSubtitle: r.hero_subtitle,
      footerText: r.footer_text,
      seoDescription: r.seo_description,
      seoKeywords: r.seo_keywords,
      ogImage: r.og_image,
      maxImageSizeMB: Number(r.max_image_size_mb ?? 10),
      maxVideoSizeMB: Number(r.max_video_size_mb ?? 100),
      allowedFormats: Array.isArray(r.allowed_formats) ? r.allowed_formats : ["jpg", "jpeg", "png", "gif", "mp4", "mov"],
      smtpHost: r.smtp_host,
      smtpPort: Number(r.smtp_port ?? 587),
      enableEmailVerification: Boolean(r.enable_email_verification),
      enablePushNotifications: Boolean(r.enable_push_notifications),
      enableRealtimeStream: Boolean(r.enable_realtime_stream),
      enableFloatingToasts: r.enable_floating_toasts !== undefined ? Boolean(r.enable_floating_to_asts) : true,
      creatorMasterpiecesBlur: Boolean(r.creator_masterpieces_blur),
      exploreItemsPerPage: Number(r.explore_items_per_page ?? 12),
      mediaApproval: r.media_approval ?? { photo: true, video: false, blog: true },
    }),
  },

  [STORAGE_KEYS.BLOGS]: {
    table: "blogs",
    orderQuery: "select=*&order=created_at.desc",
    getKey: (b) => String(b.id),
    toRow: (b) => ({
      id: b.id,
      user_id: b.userId,
      author_name: b.authorName,
      author_avatar: b.authorAvatar || "",
      title: b.title,
      description: b.description || "",
      content: b.content || "",
      thumbnail_url: b.thumbnailUrl || "",
      tags: Array.isArray(b.tags) ? b.tags : [],
      status: b.status || "APPROVED",
      visibility: (b.visibility || "public").toLowerCase(),
      engagement: (b.engagement || "open").toLowerCase(),
      allow_comments: b.allowComments ?? true,
      reject_reason: b.rejectReason ?? null,
      category: b.category || "General",
      views: Number(b.views || 0),
      likes_count: Number(b.likesCount ?? (b.likedBy?.length || 0)),
      liked_by: Array.isArray(b.likedBy) ? b.likedBy : [],
      favorites_count: Number(b.favoritesCount ?? (b.favoritedBy?.length || 0)),
      favorited_by: Array.isArray(b.favoritedBy) ? b.favoritedBy : [],
      bookmarks_count: Number(b.bookmarksCount ?? (b.bookmarkedBy?.length || 0)),
      bookmarked_by: Array.isArray(b.bookmarkedBy) ? b.bookmarkedBy : [],
      shares_count: Number(b.sharesCount || 0),
      comments: Array.isArray(b.comments) ? b.comments : [],
      created_at: toIso(b.createdAt),
    }),
    fromRow: (r) => ({
      id: r.id,
      userId: r.user_id,
      authorName: r.author_name,
      authorAvatar: r.author_avatar || "",
      title: r.title,
      description: r.description || "",
      content: r.content || "",
      thumbnailUrl: r.thumbnail_url || "",
      tags: Array.isArray(r.tags) ? r.tags : [],
      status: r.status,
      visibility: r.visibility || "public",
      engagement: r.engagement || "open",
      allowComments: r.allow_comments ?? true,
      rejectReason: r.reject_reason ?? undefined,
      category: r.category || "General",
      views: Number(r.views || 0),
      likesCount: Number(r.likes_count || 0),
      likedBy: Array.isArray(r.liked_by) ? r.liked_by : [],
      favoritesCount: Number(r.favorites_count || 0),
      favoritedBy: Array.isArray(r.favorited_by) ? r.favorited_by : [],
      bookmarksCount: Number(r.bookmarks_count || 0),
      bookmarkedBy: Array.isArray(r.bookmarked_by) ? r.bookmarked_by : [],
      sharesCount: Number(r.shares_count || 0),
      comments: Array.isArray(r.comments) ? r.comments : [],
      createdAt: r.created_at,
    }),
  },

  [STORAGE_KEYS.PHOTOS]: {
    table: "photos",
    orderQuery: "select=*&order=created_at.desc",
    getKey: (p) => String(p.id),
    toRow: (p) => ({
      id: p.id,
      user_id: p.userId,
      author_name: p.authorName,
      author_avatar: p.authorAvatar || "",
      title: p.title,
      description: p.description || "",
      source_type: p.sourceType || "URL",
      url: p.url || "",
      thumbnail_url: p.thumbnailUrl || p.url || "",
      resolution: p.resolution ?? null,
      aspect_ratio: p.aspectRatio ?? "16:9",
      tags: Array.isArray(p.tags) ? p.tags : [],
      status: p.status || "APPROVED",
      visibility: (p.visibility || "public").toLowerCase(),
      engagement: (p.engagement || "open").toLowerCase(),
      allow_comments: p.allowComments ?? true,
      reject_reason: p.rejectReason ?? null,
      category: p.category || "Photography",
      views: Number(p.views || 0),
      likes_count: Number(p.likesCount ?? (p.likedBy?.length || 0)),
      liked_by: Array.isArray(p.likedBy) ? p.likedBy : [],
      favorites_count: Number(p.favoritesCount ?? (p.favoritedBy?.length || 0)),
      favorited_by: Array.isArray(p.favoritedBy) ? p.favoritedBy : [],
      bookmarks_count: Number(p.bookmarksCount ?? (p.bookmarkedBy?.length || 0)),
      bookmarked_by: Array.isArray(p.bookmarkedBy) ? p.bookmarkedBy : [],
      shares_count: Number(p.sharesCount || 0),
      comments: Array.isArray(p.comments) ? p.comments : [],
      created_at: toIso(p.createdAt),
    }),
    fromRow: (r) => ({
      id: r.id,
      userId: r.user_id,
      authorName: r.author_name,
      authorAvatar: r.author_avatar || "",
      title: r.title,
      description: r.description || "",
      sourceType: r.source_type || "URL",
      url: r.url || "",
      thumbnailUrl: r.thumbnail_url || r.url || "",
      resolution: r.resolution ?? undefined,
      aspectRatio: r.aspect_ratio ?? undefined,
      tags: Array.isArray(r.tags) ? r.tags : [],
      status: r.status,
      visibility: r.visibility || "public",
      engagement: r.engagement || "open",
      allowComments: r.allow_comments ?? true,
      rejectReason: r.reject_reason ?? undefined,
      category: r.category || "Photography",
      views: Number(r.views || 0),
      likesCount: Number(r.likes_count || 0),
      likedBy: Array.isArray(r.liked_by) ? r.liked_by : [],
      favoritesCount: Number(r.favorites_count || 0),
      favoritedBy: Array.isArray(r.favorited_by) ? r.favorited_by : [],
      bookmarksCount: Number(r.bookmarks_count || 0),
      bookmarkedBy: Array.isArray(r.bookmarked_by) ? r.bookmarked_by : [],
      sharesCount: Number(r.shares_count || 0),
      comments: Array.isArray(r.comments) ? r.comments : [],
      createdAt: r.created_at,
    }),
  },

  [STORAGE_KEYS.VIDEOS]: {
    table: "videos",
    orderQuery: "select=*&order=created_at.desc",
    getKey: (v) => String(v.id),
    toRow: (v) => ({
      id: v.id,
      user_id: v.userId,
      author_name: v.authorName,
      author_avatar: v.authorAvatar || "",
      title: v.title,
      description: v.description || "",
      source_type: v.sourceType || "URL",
      url: v.url || "",
      video_urls: Array.isArray(v.videoUrls) ? v.videoUrls : [],
      renditions: Array.isArray(v.renditions) ? v.renditions : [],
      thumbnail_url: v.thumbnailUrl || "",
      duration: Number(v.duration || 0),
      resolution: v.resolution || "1080p",
      aspect_ratio: v.aspectRatio || "16:9",
      codec: v.codec ?? null,
      frame_rate: v.frameRate != null ? Number(v.frameRate) : 30,
      file_size: v.fileSize != null ? Number(v.fileSize) : 0,
      processing_status: v.processingStatus || "COMPLETED",
      is_external: Boolean(v.isExternal),
      external_provider: v.externalProvider ?? null,
      embed_url: v.embedUrl ?? null,
      external_reference: v.externalReference ?? null,
      tags: Array.isArray(v.tags) ? v.tags : [],
      status: v.status || "PENDING",
      visibility: (v.visibility || "public").toLowerCase(),
      engagement: (v.engagement || "open").toLowerCase(),
      allow_comments: v.allowComments ?? true,
      reject_reason: v.rejectReason ?? null,
      category: v.category || "Motion",
      views: Number(v.views || 0),
      likes_count: Number(v.likesCount ?? (v.likedBy?.length || 0)),
      liked_by: Array.isArray(v.likedBy) ? v.likedBy : [],
      favorites_count: Number(v.favoritesCount ?? (v.favoritedBy?.length || 0)),
      favorited_by: Array.isArray(v.favoritedBy) ? v.favoritedBy : [],
      bookmarks_count: Number(v.bookmarksCount ?? (v.bookmarkedBy?.length || 0)),
      bookmarked_by: Array.isArray(v.bookmarkedBy) ? v.bookmarkedBy : [],
      shares_count: Number(v.sharesCount || 0),
      comments: Array.isArray(v.comments) ? v.comments : [],
      created_at: toIso(v.createdAt),
    }),
    fromRow: (r) => ({
      id: r.id,
      userId: r.user_id,
      authorName: r.author_name,
      authorAvatar: r.author_avatar || "",
      title: r.title,
      description: r.description || "",
      sourceType: r.source_type || "URL",
      url: r.url || "",
      videoUrls: Array.isArray(r.video_urls) && r.video_urls.length > 0 ? r.video_urls : undefined,
      renditions: Array.isArray(r.renditions) ? r.renditions : [],
      thumbnailUrl: r.thumbnail_url || "",
      duration: Number(r.duration || 0),
      resolution: r.resolution || "1080p",
      aspectRatio: r.aspect_ratio || "16:9",
      codec: r.codec ?? undefined,
      frameRate: r.frame_rate != null ? Number(r.frame_rate) : undefined,
      fileSize: r.file_size != null ? Number(r.file_size) : undefined,
      processingStatus: r.processing_status || "COMPLETED",
      isExternal: Boolean(r.is_external),
      externalProvider: r.external_provider ?? undefined,
      embedUrl: r.embed_url ?? undefined,
      externalReference: r.external_reference ?? undefined,
      tags: Array.isArray(r.tags) ? r.tags : [],
      status: r.status,
      visibility: r.visibility || "public",
      engagement: r.engagement || "open",
      allowComments: r.allow_comments ?? true,
      rejectReason: r.reject_reason ?? undefined,
      category: r.category || "Motion",
      views: Number(r.views || 0),
      likesCount: Number(r.likes_count || 0),
      likedBy: Array.isArray(r.liked_by) ? r.liked_by : [],
      favoritesCount: Number(r.favorites_count || 0),
      favoritedBy: Array.isArray(r.favorited_by) ? r.favorited_by : [],
      bookmarksCount: Number(r.bookmarks_count || 0),
      bookmarkedBy: Array.isArray(r.bookmarked_by) ? r.bookmarked_by : [],
      sharesCount: Number(r.shares_count || 0),
      comments: Array.isArray(r.comments) ? r.comments : [],
      createdAt: r.created_at,
    }),
  },

  [STORAGE_KEYS.TAGS]: {
    table: "tags",
    orderQuery: "select=*&order=name.asc",
    getKey: (t) => String(t.id),
    toRow: (t) => ({
      id: t.id,
      name: t.name,
      type: t.type || "General",
      is_ambiguous: Boolean(t.isAmbiguous),
      status: t.status || "APPROVED",
      created_by: t.createdBy || "NightAdmin",
      usage_count: Number(t.usageCount || 0),
      count: Number(t.count ?? t.usageCount ?? 0),
      growth_rate: Number(t.growthRate || 0),
      most_active_username: t.mostActiveUsername || "NightAdmin",
      last_used_at: toIso(t.lastUsedAt),
      created_at: toIso(t.createdAt),
      updated_at: toIso(t.updatedAt || t.createdAt),
      blog_count: Number(t.blogCount || 0),
      photo_count: Number(t.photoCount || 0),
      video_count: Number(t.videoCount || 0),
      growth_daily: Number(t.growthDaily || 0),
      growth_weekly: Number(t.growthWeekly || 0),
      growth_monthly: Number(t.growthMonthly || 0),
      is_banned: Boolean(t.isBanned),
    }),
    fromRow: (r) => ({
      id: r.id,
      name: r.name,
      type: r.type || "General",
      isAmbiguous: Boolean(r.is_ambiguous),
      status: r.status || "APPROVED",
      createdBy: r.created_by || "NightAdmin",
      usageCount: Number(r.usage_count || 0),
      count: Number(r.count ?? r.usage_count ?? 0),
      growthRate: Number(r.growth_rate || 0),
      mostActiveUsername: r.most_active_username || "NightAdmin",
      lastUsedAt: r.last_used_at,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      blogCount: Number(r.blog_count || 0),
      photoCount: Number(r.photo_count || 0),
      videoCount: Number(r.video_count || 0),
      growthDaily: Number(r.growth_daily || 0),
      growthWeekly: Number(r.growth_weekly || 0),
      growthMonthly: Number(r.growth_monthly || 0),
      isBanned: Boolean(r.is_banned),
    }),
  },

  [STORAGE_KEYS.COMMENTS]: {
    table: "comments",
    orderQuery: "select=*&order=created_at.asc",
    getKey: (c) => String(c.id),
    toRow: (c) => ({
      id: c.id,
      user_id: c.userId,
      username: c.username,
      avatar_url: c.avatarUrl || "",
      content: c.content,
      content_type: c.contentType,
      content_id: c.contentId,
      created_at: toIso(c.createdAt),
    }),
    fromRow: (r) => ({
      id: r.id,
      userId: r.user_id,
      username: r.username,
      avatarUrl: r.avatar_url || "",
      content: r.content,
      contentType: r.content_type,
      contentId: r.content_id,
      createdAt: r.created_at,
    }),
  },

  [STORAGE_KEYS.FOLLOWS]: {
    table: "follows",
    orderQuery: "select=*&order=created_at.desc",
    isCompositeFollow: true,
    getKey: (f) => `${f.followerId}:::${f.followingId}`,
    toRow: (f) => ({
      follower_id: f.followerId,
      following_id: f.followingId,
      created_at: toIso(f.createdAt),
    }),
    fromRow: (r) => ({
      followerId: r.follower_id,
      followingId: r.following_id,
      createdAt: r.created_at,
    }),
  },

  [STORAGE_KEYS.NOTIFICATIONS]: {
    table: "notifications",
    orderQuery: "select=*&order=created_at.desc",
    getKey: (n) => String(n.id),
    toRow: (n) => ({
      id: n.id,
      user_id: n.userId,
      triggered_by_id: n.triggeredById ?? null,
      triggered_by_name: n.triggeredByName ?? null,
      triggered_by_avatar: n.triggeredByAvatar ?? null,
      title: n.title,
      message: n.message,
      category: n.category || "SYSTEM",
      type: n.type || "INFO",
      link: n.link ?? null,
      target_type: n.targetType ?? null,
      target_id: n.targetId ?? null,
      is_read: Boolean(n.isRead),
      group_id: n.groupId ?? null,
      group_count: n.groupCount ?? 1,
      action_taken: Boolean(n.actionTaken),
      action_by: n.actionBy ?? null,
      action_decision: n.actionDecision ?? null,
      created_at: toIso(n.createdAt),
    }),
    fromRow: (r) => ({
      id: r.id,
      userId: r.user_id,
      triggeredById: r.triggered_by_id ?? undefined,
      triggeredByName: r.triggered_by_name ?? undefined,
      triggeredByAvatar: r.triggered_by_avatar ?? undefined,
      title: r.title,
      message: r.message,
      category: r.category,
      type: r.type,
      link: r.link ?? undefined,
      targetType: r.target_type ?? undefined,
      targetId: r.target_id ?? undefined,
      isRead: Boolean(r.is_read),
      groupId: r.group_id ?? undefined,
      groupCount: r.group_count ?? undefined,
      actionTaken: r.action_taken ?? undefined,
      actionBy: r.action_by ?? undefined,
      actionDecision: r.action_decision ?? undefined,
      createdAt: r.created_at,
    }),
  },

  [STORAGE_KEYS.REPORTS]: {
    table: "reports",
    orderQuery: "select=*&order=created_at.desc",
    getKey: (r) => String(r.id),
    toRow: (r) => ({
      id: String(r.id),
      reporter_id: r.reporterId || "anonymous",
      reporter_username: r.reporterUsername ?? null,
      content_id: r.contentId ?? r.targetId ?? null,
      content_type: r.contentType ?? r.targetType ?? null,
      content_title: r.contentTitle ?? null,
      creator_id: r.creatorId ?? null,
      creator_username: r.creatorUsername ?? null,
      target_type: r.targetType || r.contentType || "content",
      target_id: r.targetId || r.contentId || "",
      reason: r.reason || "Violation",
      description: r.description ?? "",
      status: r.status || (r.isResolved ? "RESOLVED" : "OPEN"),
      is_resolved: Boolean(r.isResolved),
      resolution_notes: r.resolutionNotes ?? null,
      created_at: toIso(r.createdAt),
      resolved_at: r.resolvedAt ?? null,
    }),
    fromRow: (r) => ({
      id: r.id,
      reporterId: r.reporter_id,
      reporterUsername: r.reporter_username ?? undefined,
      contentId: r.content_id ?? r.target_id,
      contentType: r.content_type ?? r.target_type,
      contentTitle: r.content_title ?? undefined,
      creatorId: r.creator_id ?? undefined,
      creatorUsername: r.creator_username ?? undefined,
      targetType: r.target_type,
      targetId: r.target_id,
      reason: r.reason,
      description: r.description ?? "",
      status: r.status,
      isResolved: Boolean(r.is_resolved),
      resolutionNotes: r.resolution_notes ?? undefined,
      createdAt: r.created_at,
      resolvedAt: r.resolved_at ?? undefined,
    }),
  },

  [STORAGE_KEYS.LOGS]: {
    table: "logs",
    orderQuery: "select=*&order=timestamp.desc",
    getKey: (l) => String(l.id),
    toRow: (l) => ({
      id: String(l.id),
      action: l.action,
      details: l.details,
      operator: l.operator,
      timestamp: toIso(l.timestamp),
    }),
    fromRow: (r) => ({
      id: r.id,
      action: r.action,
      details: r.details,
      operator: r.operator,
      timestamp: r.timestamp,
    }),
  },

  [STORAGE_KEYS.BADGES]: {
    table: "badges",
    orderQuery: "select=*&order=tier.desc",
    getKey: (b) => String(b.id),
    toRow: (b) => ({
      id: b.id,
      name: b.name,
      icon: b.icon,
      description: b.description,
      category: b.category || "ROLE",
      tier: Number(b.tier || 0),
      status: b.status || "ACTIVE",
      requirement: b.requirement || "",
      color: b.color ?? null,
      bg_color: b.bgColor ?? null,
      border_color: b.borderColor ?? null,
      created_at: toIso(b.createdAt),
    }),
    fromRow: (r) => ({
      id: r.id,
      name: r.name,
      icon: r.icon,
      description: r.description,
      category: r.category,
      tier: Number(r.tier || 0),
      status: r.status,
      requirement: r.requirement,
      color: r.color ?? undefined,
      bgColor: r.bg_color ?? undefined,
      borderColor: r.border_color ?? undefined,
      createdAt: r.created_at,
    }),
  },

  [STORAGE_KEYS.BADGE_AWARDS]: {
    table: "badge_awards",
    orderQuery: "select=*&order=granted_at.desc",
    getKey: (a) => String(a.id),
    toRow: (a) => ({
      id: a.id,
      user_id: a.userId,
      username: a.username,
      badge_id: a.badgeId,
      badge_name: a.badgeName,
      badge_tier: Number(a.badgeTier || 0),
      granted_by_id: a.grantedById,
      granted_by_username: a.grantedByUsername,
      granted_by_role: a.grantedByRole,
      granted_at: toIso(a.grantedAt),
      reason: a.reason ?? null,
      status: a.status || "SUCCESS",
    }),
    fromRow: (r) => ({
      id: r.id,
      userId: r.user_id,
      username: r.username,
      badgeId: r.badge_id,
      badgeName: r.badge_name,
      badgeTier: Number(r.badge_tier || 0),
      grantedById: r.granted_by_id,
      grantedByUsername: r.granted_by_username,
      grantedByRole: r.granted_by_role,
      grantedAt: r.granted_at,
      reason: r.reason ?? undefined,
      status: r.status || "SUCCESS",
    }),
  },

  [STORAGE_KEYS.DOC_CATEGORIES]: {
    table: "doc_categories",
    orderQuery: "select=*&order=display_order.asc",
    getKey: (c) => String(c.id),
    toRow: (c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      icon: c.icon,
      display_order: Number(c.displayOrder || 0),
    }),
    fromRow: (r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      icon: r.icon,
      displayOrder: Number(r.display_order || 0),
    }),
  },

  [STORAGE_KEYS.DOCUMENTATIONS]: {
    table: "documentations",
    orderQuery: "select=*&order=display_order.asc",
    getKey: (d) => String(d.id),
    toRow: (d) => ({
      id: d.id,
      title: d.title,
      slug: d.slug,
      category_id: d.categoryId,
      summary: d.summary,
      content: d.content,
      cover_image: d.coverImage ?? null,
      status: d.status || "PUBLISHED",
      version: d.version || "v2.7.0",
      author_id: d.authorId || "admin-1",
      author_name: d.authorName || "NightAdmin",
      author_role: d.authorRole || "SUPER_ADMIN",
      display_order: Number(d.displayOrder || 0),
      steps: Array.isArray(d.steps) ? d.steps : [],
      callouts: Array.isArray(d.callouts) ? d.callouts : [],
      tags: Array.isArray(d.tags) ? d.tags : [],
      created_at: toIso(d.createdAt),
      updated_at: toIso(d.updatedAt),
      published_at: d.publishedAt ?? null,
    }),
    fromRow: (r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      categoryId: r.category_id,
      summary: r.summary,
      content: r.content,
      coverImage: r.cover_image ?? undefined,
      status: r.status,
      version: r.version,
      authorId: r.author_id,
      authorName: r.author_name,
      authorRole: r.author_role ?? undefined,
      displayOrder: Number(r.display_order || 0),
      steps: Array.isArray(r.steps) ? r.steps : [],
      callouts: Array.isArray(r.callouts) ? r.callouts : [],
      tags: Array.isArray(r.tags) ? r.tags : [],
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      publishedAt: r.published_at ?? undefined,
    }),
  },

  [STORAGE_KEYS.DOC_REVISIONS]: {
    table: "doc_revisions",
    orderQuery: "select=*&order=created_at.desc",
    getKey: (rv) => String(rv.id),
    toRow: (rv) => ({
      id: rv.id,
      documentation_id: rv.documentationId,
      version: rv.version,
      previous_content: rv.previousContent || "",
      updated_content: rv.updatedContent || "",
      editor_id: rv.editorId,
      editor_name: rv.editorName,
      editor_role: rv.editorRole,
      revision_number: Number(rv.revisionNumber || 1),
      change_note: rv.changeNote ?? null,
      created_at: toIso(rv.createdAt),
    }),
    fromRow: (r) => ({
      id: r.id,
      documentationId: r.documentation_id,
      version: r.version,
      previousContent: r.previous_content,
      updatedContent: r.updated_content,
      editorId: r.editor_id,
      editorName: r.editor_name,
      editorRole: r.editor_role,
      revisionNumber: Number(r.revision_number || 1),
      changeNote: r.change_note ?? undefined,
      createdAt: r.created_at,
    }),
  },

  [STORAGE_KEYS.CHANGELOGS]: {
    table: "changelogs",
    orderQuery: "select=*&order=created_at.desc",
    getKey: (cl) => String(cl.id),
    toRow: (cl) => ({
      id: cl.id,
      version_number: cl.versionNumber,
      release_title: cl.releaseTitle,
      release_date: cl.releaseDate,
      summary: cl.summary ?? null,
      new_features: Array.isArray(cl.newFeatures) ? cl.newFeatures : [],
      improvements: Array.isArray(cl.improvements) ? cl.improvements : [],
      bug_fixes: Array.isArray(cl.bugFixes) ? cl.bugFixes : [],
      breaking_changes: Array.isArray(cl.breakingChanges) ? cl.breakingChanges : [],
      created_by: cl.createdBy || "Super Admin",
      created_at: toIso(cl.createdAt),
    }),
    fromRow: (r) => ({
      id: r.id,
      versionNumber: r.version_number,
      releaseTitle: r.release_title,
      releaseDate: r.release_date,
      summary: r.summary ?? undefined,
      newFeatures: Array.isArray(r.new_features) ? r.new_features : [],
      improvements: Array.isArray(r.improvements) ? r.improvements : [],
      bugFixes: Array.isArray(r.bug_fixes) ? r.bug_fixes : [],
      breakingChanges: Array.isArray(r.breaking_changes) ? r.breaking_changes : [],
      createdBy: r.created_by,
      createdAt: r.created_at,
    }),
  },

  [STORAGE_KEYS.SUPPORT_TICKETS]: {
    table: "support_tickets",
    orderQuery: "select=*&order=created_at.desc",
    getKey: (t) => String(t.id),
    toRow: (t) => ({
      id: t.id,
      ticket_number: t.ticketNumber,
      user_id: t.userId,
      username: t.username,
      subject: t.subject,
      category: t.category,
      priority: t.priority || "Medium",
      description: t.description,
      attachment_url: t.attachmentUrl ?? null,
      status: t.status || "OPEN",
      assigned_staff_id: t.assignedStaffId ?? null,
      assigned_staff_name: t.assignedStaffName ?? null,
      created_at: toIso(t.createdAt),
      updated_at: toIso(t.updatedAt),
      resolved_at: t.resolvedAt ?? null,
    }),
    fromRow: (r) => ({
      id: r.id,
      ticketNumber: r.ticket_number,
      userId: r.user_id,
      username: r.username,
      subject: r.subject,
      category: r.category,
      priority: r.priority,
      description: r.description,
      attachmentUrl: r.attachment_url ?? undefined,
      status: r.status,
      assignedStaffId: r.assigned_staff_id ?? undefined,
      assignedStaffName: r.assigned_staff_name ?? undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      resolvedAt: r.resolved_at ?? undefined,
    }),
  },

  [STORAGE_KEYS.TICKET_MESSAGES]: {
    table: "ticket_messages",
    orderQuery: "select=*&order=created_at.asc",
    getKey: (m) => String(m.id),
    toRow: (m) => ({
      id: String(m.id),
      ticket_id: m.ticketId,
      sender_id: m.senderId,
      sender_name: m.senderName,
      sender_role: m.senderRole,
      message: m.message,
      attachment_url: m.attachmentUrl ?? null,
      created_at: toIso(m.createdAt),
    }),
    fromRow: (r) => ({
      id: r.id,
      ticketId: r.ticket_id,
      senderId: r.sender_id,
      senderName: r.sender_name,
      senderRole: r.sender_role,
      message: r.message,
      attachmentUrl: r.attachment_url ?? undefined,
      createdAt: r.created_at,
    }),
  },
};

// Snapshot of serialized DB rows synced with Supabase per storage key
const SYNC_SNAPSHOT: Record<string, Map<string, string>> = {};
// Sequential promise chain per key to prevent race conditions during rapid updates
const SYNC_QUEUE: Record<string, Promise<any>> = {};
const DIRTY_KEYS = new Set<string>();
const IN_FLIGHT_KEYS = new Set<string>();
const LAST_LOCAL_WRITE_AT: Record<string, number> = {};
const LATEST_DATA: Record<string, any> = {};
let supabaseSchemaReady = false;

export const isSupabaseSchemaReady = () => supabaseSchemaReady;

export const isKeyPendingSync = (key: string): boolean => {
  if (DIRTY_KEYS.has(key) || IN_FLIGHT_KEYS.has(key)) return true;
  const lastWrite = LAST_LOCAL_WRITE_AT[key] || 0;
  return Date.now() - lastWrite < 3000;
};

const updateSnapshot = (key: string, items: any) => {
  const mapper = MAPPERS[key];
  if (!mapper) return;
  const map = new Map<string, string>();
  if (mapper.isSingleton) {
    if (items && typeof items === "object") {
      map.set("1", JSON.stringify(mapper.toRow(items)));
    }
  } else if (Array.isArray(items)) {
    for (const item of items) {
      if (!item) continue;
      map.set(mapper.getKey(item), JSON.stringify(mapper.toRow(item)));
    }
  }
  SYNC_SNAPSHOT[key] = map;
};

export interface HydrationReport {
  connected: boolean;
  missingSchema: boolean;
  loadedKeys: Set<string>;
  remoteHasCoreSeed: boolean;
  dataByKey: Record<string, any>;
}

export async function hydrateAllFromSupabase(): Promise<HydrationReport> {
  const report: HydrationReport = {
    connected: false,
    missingSchema: false,
    loadedKeys: new Set<string>(),
    remoteHasCoreSeed: false,
    dataByKey: {},
  };

  if (!isSupabaseConfigured()) {
    return report;
  }

  const entries = Object.entries(MAPPERS);
  const results = await Promise.all(
    entries.map(async ([key, mapper]) => {
      const res = await supabaseSelect<Record<string, any>>(
        mapper.table,
        mapper.orderQuery || "select=*"
      );
      return { key, mapper, res };
    })
  );

  let anyOk = false;
  let anyMissing = false;

  for (const { key, mapper, res } of results) {
    if (!res.ok) {
      if (res.missingTable) anyMissing = true;
      continue;
    }
    anyOk = true;
    const rows = res.data || [];

    if (key === STORAGE_KEYS.USERS && rows.length > 0 && Object.prototype.hasOwnProperty.call(rows[0], "updated_at")) {
      hasUsersUpdatedAtColumn = true;
    }

    // Do not overwrite snapshot if local key has pending/in-flight writes
    const keepLocalPending = isKeyPendingSync(key);

    if (mapper.isSingleton) {
      if (rows.length > 0) {
        const mapped = mapper.fromRow(rows[0]);
        if (!keepLocalPending) {
          report.dataByKey[key] = mapped;
          report.loadedKeys.add(key);
          updateSnapshot(key, mapped);
        }
        report.remoteHasCoreSeed = true;
      } else if (!keepLocalPending) {
        SYNC_SNAPSHOT[key] = new Map();
      }
    } else {
      const mapped = rows.map((r) => mapper.fromRow(r));
      if (!keepLocalPending) {
        report.dataByKey[key] = mapped;
        report.loadedKeys.add(key);
        updateSnapshot(key, mapped);
      }
      if (key === STORAGE_KEYS.USERS && mapped.length > 0) {
        report.remoteHasCoreSeed = true;
      }
    }
  }

  report.connected = anyOk;
  report.missingSchema = !anyOk && anyMissing;
  supabaseSchemaReady = anyOk;

  if (report.missingSchema) {
    console.warn(
      "[NightVerse Supabase] Database tables not found in Supabase yet. Execute /schema.sql in Supabase SQL Editor to enable persistent cloud sync."
    );
  }

  return report;
}

export async function pushInitialSnapshotToSupabase(
  cache: Record<string, any>
): Promise<void> {
  if (!supabaseSchemaReady || !isSupabaseConfigured()) return;

  // Ordered parent tables first so FK references succeed cleanly
  const orderedKeys = [
    STORAGE_KEYS.USERS,
    STORAGE_KEYS.SYSTEM_SETTINGS,
    STORAGE_KEYS.BADGES,
    STORAGE_KEYS.DOC_CATEGORIES,
    STORAGE_KEYS.DOCUMENTATIONS,
    STORAGE_KEYS.DOC_REVISIONS,
    STORAGE_KEYS.CHANGELOGS,
    STORAGE_KEYS.BADGE_AWARDS,
    STORAGE_KEYS.TAGS,
    STORAGE_KEYS.BLOGS,
    STORAGE_KEYS.PHOTOS,
    STORAGE_KEYS.VIDEOS,
    STORAGE_KEYS.COMMENTS,
    STORAGE_KEYS.FOLLOWS,
    STORAGE_KEYS.NOTIFICATIONS,
    STORAGE_KEYS.REPORTS,
    STORAGE_KEYS.LOGS,
    STORAGE_KEYS.SUPPORT_TICKETS,
    STORAGE_KEYS.TICKET_MESSAGES,
  ];

  for (const key of orderedKeys) {
    if (cache[key] !== undefined) {
      await syncKeyToSupabaseNow(key, cache[key]);
    }
  }
}

async function syncKeyToSupabaseNow(
  key: string,
  data: any
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase not configured" };
  }
  if (!supabaseSchemaReady) {
    return { ok: false, error: "Database schema belum siap. Jalankan /schema.sql di Supabase SQL Editor." };
  }
  const mapper = MAPPERS[key];
  if (!mapper) return { ok: true };

  IN_FLIGHT_KEYS.add(key);
  try {
    const prevMap = SYNC_SNAPSHOT[key] || new Map<string, string>();
    const nextMap = new Map<string, string>();

    if (mapper.isSingleton) {
      if (!data || typeof data !== "object") return { ok: true };
      const row = mapper.toRow(data);
      const serialized = JSON.stringify(row);
      nextMap.set("1", serialized);
      if (prevMap.get("1") !== serialized) {
        const res = await supabaseUpsert(mapper.table, [row], "id");
        if (!res.ok) {
          return { ok: false, error: res.error || `Gagal menyimpan ${mapper.table}` };
        }
        SYNC_SNAPSHOT[key] = nextMap;
      }
      DIRTY_KEYS.delete(key);
      return { ok: true };
    }

    if (!Array.isArray(data)) return { ok: true };

    const toUpsert: Record<string, any>[] = [];
    for (const item of data) {
      if (!item) continue;
      const k = mapper.getKey(item);
      const row = mapper.toRow(item);
      const serialized = JSON.stringify(row);
      nextMap.set(k, serialized);
      if (prevMap.get(k) !== serialized) {
        toUpsert.push(row);
      }
    }

    const removedKeys: string[] = [];
    prevMap.forEach((_, k) => {
      if (!nextMap.has(k)) {
        removedKeys.push(k);
      }
    });

    if (toUpsert.length === 0 && removedKeys.length === 0) {
      DIRTY_KEYS.delete(key);
      return { ok: true };
    }

    if (toUpsert.length > 0) {
      const conflictTarget = mapper.isCompositeFollow ? "follower_id,following_id" : "id";
      const upsertRes = await supabaseUpsert(mapper.table, toUpsert, conflictTarget);
      if (!upsertRes.ok) {
        return { ok: false, error: upsertRes.error || `Gagal menyimpan ke tabel ${mapper.table}` };
      }
    }

    if (removedKeys.length > 0) {
      if (mapper.isCompositeFollow) {
        const pairs = removedKeys.map((k) => {
          const [followerId, followingId] = k.split(":::");
          return { followerId, followingId };
        });
        const delRes = await supabaseDeleteFollows(pairs);
        if (!delRes.ok) {
          return { ok: false, error: delRes.error || "Gagal menghapus data follow" };
        }
      } else {
        const delRes = await supabaseDeleteIds(mapper.table, removedKeys, "id");
        if (!delRes.ok) {
          return { ok: false, error: delRes.error || `Gagal menghapus dari tabel ${mapper.table}` };
        }
      }
    }

    SYNC_SNAPSHOT[key] = nextMap;
    DIRTY_KEYS.delete(key);
    return { ok: true };
  } finally {
    IN_FLIGHT_KEYS.delete(key);
  }
}

export function scheduleSupabaseSync(key: string, data: any): void {
  if (!MAPPERS[key]) return;
  LATEST_DATA[key] = data;
  DIRTY_KEYS.add(key);
  LAST_LOCAL_WRITE_AT[key] = Date.now();
  if (!supabaseSchemaReady || !isSupabaseConfigured()) return;
  const prevChain = SYNC_QUEUE[key] || Promise.resolve();
  SYNC_QUEUE[key] = prevChain
    .catch(() => undefined)
    .then(() => syncKeyToSupabaseNow(key, data));
}

export async function flushSupabaseSync(
  keys?: string[],
  cacheRef?: Record<string, any>
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase belum dikonfigurasi." };
  }
  if (!supabaseSchemaReady) {
    return { ok: false, error: "Schema Supabase belum siap. Jalankan /schema.sql di Supabase SQL Editor." };
  }

  const targetKeys =
    keys && keys.length > 0
      ? keys.filter((k) => Boolean(MAPPERS[k]))
      : Object.keys(MAPPERS).filter((k) => DIRTY_KEYS.has(k) || Boolean(SYNC_QUEUE[k]));

  let firstError: string | undefined;

  for (const key of targetKeys) {
    if (SYNC_QUEUE[key]) {
      try {
        const queuedRes = await SYNC_QUEUE[key];
        if (queuedRes && queuedRes.ok === false && !firstError) {
          firstError = queuedRes.error;
        }
      } catch (err: any) {
        if (!firstError) firstError = err?.message || "Sync error";
      }
    }

    const latest = cacheRef?.[key] !== undefined ? cacheRef[key] : LATEST_DATA[key];
    if (latest !== undefined && DIRTY_KEYS.has(key)) {
      const res = await syncKeyToSupabaseNow(key, latest);
      if (!res.ok && !firstError) {
        firstError = res.error;
      }
    }
  }

  if (firstError) {
    return { ok: false, error: firstError };
  }
  return { ok: true };
}
