import React, { useState, useEffect, useRef, useMemo } from "react";
import { X, Heart, MessageSquare, CornerDownRight, Check, UserPlus, Eye, Clock, Monitor, AlertTriangle, RefreshCw, Globe, Plus, Star, Bookmark, Share2, Link, Download, MoreHorizontal, ChevronLeft, ChevronRight, Maximize2, Minimize2, Info, Users, Play, Pause, Volume2, VolumeX, Settings, SquareStack, SkipForward, SkipBack, Flag, Layers, Lock, Unlock, MessageSquareOff, RotateCcw, RotateCw, Zap, Edit3 } from "lucide-react";
import { useAppState } from "../context/AppState.js";
import { motion, AnimatePresence } from "motion/react";
import { db, DEFAULT_FEATURED_VIDEOS } from "../lib/db.js";
import { getAspectRatioClass } from "./ContentCreator.js";
import { RoleBadge, BadgeType } from "./RoleBadge.js";

export const ContentLightbox: React.FC = () => {
  const { focusedContent, setFocusedContent, token, user, triggerToast, createNotification, viewProfile, followActionCount, toggleFollow, triggerDBSync, triggerSearch, navigateTo, dbActionCount, editUserContent } = useAppState();
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [hasLiked, setHasLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);

  // Real-time engagement statistics
  const [hasFavorited, setHasFavorited] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [hasBookmarked, setHasBookmarked] = useState(false);
  const [bookmarksCount, setBookmarksCount] = useState(0);
  const [sharesCount, setSharesCount] = useState(0);

  // High fidelity report expansion states
  const [showAllTags, setShowAllTags] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportNotes, setReportNotes] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Responsive design & aspect ratio states
  const [mediaWidth, setMediaWidth] = useState<number>(1920);
  const [mediaHeight, setMediaHeight] = useState<number>(1080);
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9);
  const [ratioMode, setRatioMode] = useState<"landscape" | "portrait" | "square">("landscape");
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // tab state
  type LightboxTab = 'related' | 'write' | 'list';
  const [activeTab, setActiveTab] = useState<LightboxTab>('related');

  // Detail tab state (Info, Komentar, Kreator, Terkait)
  type DetailTab = 'info' | 'comments' | 'creator' | 'related';
  const [mobileTab, setMobileTab] = useState<DetailTab>('info');
  const [desktopTab, setDesktopTab] = useState<DetailTab>('info');

  // detect related items
  const [relatedItems, setRelatedItems] = useState<any[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Video control states
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeEmbedIndex, setActiveEmbedIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Video settings & quality states
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [settingsSubmenu, setSettingsSubmenu] = useState<"main" | "speed" | "quality">("main");
  const [selectedQuality, setSelectedQuality] = useState<string>("Auto");
  const [sourceVideoHeight, setSourceVideoHeight] = useState<number>(1080);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>("");
  const [isSwitchingQuality, setIsSwitchingQuality] = useState(false);
  const [liveVideoWidth, setLiveVideoWidth] = useState<number>(1920);
  const [liveVideoHeight, setLiveVideoHeight] = useState<number>(1080);
  const [activeRendition, setActiveRendition] = useState<any | null>(null);
  const [showStatsHud, setShowStatsHud] = useState<boolean>(false);
  const [bufferHealthSecs, setBufferHealthSecs] = useState<number>(0);

  // Seamless playback preservation refs
  const targetResumeTimeRef = useRef<number | null>(null);
  const wasPlayingRef = useRef<boolean>(false);
  const targetPlaybackSpeedRef = useRef<number>(1.0);
  const targetVolumeRef = useRef<number>(1.0);
  const targetMutedRef = useRef<boolean>(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      setWindowWidth(window.innerWidth);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Keyboard accessibility (ESC to close, Arrows to navigate)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFocusedContent(null);
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusedContent, relatedItems]);

  // Load related items (exclude private content from public circulation)
  useEffect(() => {
    if (!focusedContent) return;
    const { type, item } = focusedContent;
    const isOwnerOrAdmin = (entry: any) => entry.visibility !== "private" || (user && (user.id === entry.userId || user.role === "SUPER_ADMIN" || user.role === "ADMIN"));
    
    let all: any[] = [];
    if (type === "blog") all = db.blogs.getAll().filter(b => b.status === "APPROVED" && isOwnerOrAdmin(b));
    if (type === "photo") all = db.photos.getAll().filter(p => p.status === "APPROVED" && isOwnerOrAdmin(p));
    if (type === "video") all = db.videos.getAll().filter(v => v.status === "APPROVED" && isOwnerOrAdmin(v));
    
    // Sort or filter related (e.g. same category or just recent)
    setRelatedItems(all.filter(i => i.id !== item.id));
  }, [focusedContent, user]);

  const handleNext = () => {
    if (!focusedContent || relatedItems.length === 0) return;
    const { type, item } = focusedContent;
    const isOwnerOrAdmin = (entry: any) => entry.visibility !== "private" || (user && (user.id === entry.userId || user.role === "SUPER_ADMIN" || user.role === "ADMIN"));
    
    let all: any[] = [];
    if (type === "blog") all = db.blogs.getAll().filter(b => b.status === "APPROVED" && isOwnerOrAdmin(b));
    if (type === "photo") all = db.photos.getAll().filter(p => p.status === "APPROVED" && isOwnerOrAdmin(p));
    if (type === "video") all = db.videos.getAll().filter(v => v.status === "APPROVED" && isOwnerOrAdmin(v));
    
    const currentIndex = all.findIndex(i => i.id === item.id);
    if (currentIndex !== -1 && currentIndex < all.length - 1) {
      setFocusedContent({ type, item: all[currentIndex + 1] });
    } else if (all.length > 0) {
      setFocusedContent({ type, item: all[0] });
    }
  };

  const handlePrev = () => {
    if (!focusedContent || relatedItems.length === 0) return;
    const { type, item } = focusedContent;
    const isOwnerOrAdmin = (entry: any) => entry.visibility !== "private" || (user && (user.id === entry.userId || user.role === "SUPER_ADMIN" || user.role === "ADMIN"));
    
    let all: any[] = [];
    if (type === "blog") all = db.blogs.getAll().filter(b => b.status === "APPROVED" && isOwnerOrAdmin(b));
    if (type === "photo") all = db.photos.getAll().filter(p => p.status === "APPROVED" && isOwnerOrAdmin(p));
    if (type === "video") all = db.videos.getAll().filter(v => v.status === "APPROVED" && isOwnerOrAdmin(v));
    
    const currentIndex = all.findIndex(i => i.id === item.id);
    if (currentIndex > 0) {
      setFocusedContent({ type, item: all[currentIndex - 1] });
    } else if (all.length > 0) {
      setFocusedContent({ type, item: all[all.length - 1] });
    }
  };

  // Prevent background scrolling when focusedContent is present
  useEffect(() => {
    if (focusedContent) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [focusedContent]);

  // Reset comments drawer when asset switches
  useEffect(() => {
    setIsCommentsOpen(!isMobile);
  }, [focusedContent, isMobile]);

  // Parse aspect ratio string
  const parseAspectRatio = (ratioStr?: string): number => {
    if (!ratioStr) return 16 / 9;
    const parts = ratioStr.split(":");
    if (parts.length === 2) {
      const w = Number(parts[0]);
      const h = Number(parts[1]);
      if (w && h) return w / h;
    }
    return 16 / 9;
  };

  // Auto-detect ratio on content switch
  useEffect(() => {
    if (!focusedContent) return;
    const { type, item } = focusedContent;
    
    if (type === "video" || type === "photo") {
      if (item.aspectRatio) {
        const ratio = parseAspectRatio(item.aspectRatio);
        setAspectRatio(ratio);
        if (ratio > 1.2) {
          setRatioMode("landscape");
        } else if (ratio < 0.85) {
          setRatioMode("portrait");
        } else {
          setRatioMode("square");
        }
      } else {
        // Fallback checks
        if (type === "video") {
          if (item.url && (item.url.includes("/shorts/") || item.url.includes("youtube.com/shorts"))) {
            setAspectRatio(9 / 16);
            setRatioMode("portrait");
          } else {
            setAspectRatio(16 / 9);
            setRatioMode("landscape");
          }
        } else {
          setAspectRatio(16 / 9);
          setRatioMode("landscape");
        }
      }
    }
  }, [focusedContent]);

  useEffect(() => {
    if (!focusedContent) return;
    const { type, item } = focusedContent;
    
    // Reset report flows & video states upon focus changes
    setActiveEmbedIndex(0);
    setIsReporting(false);
    setReportReason("");
    setReportNotes("");
    setShowAllTags(false);
    setIsPlaying(false);
    setShowSettingsMenu(false);
    setSettingsSubmenu("main");
    setProgress(0);
    setCurrentTime(0);
    const initialUrl = item.url || (item.renditions && item.renditions[0]?.url) || "";
    setCurrentVideoUrl(initialUrl);
    setSelectedQuality("Auto");
    setIsSwitchingQuality(false);
    setShowStatsHud(false);
    targetResumeTimeRef.current = null;
    wasPlayingRef.current = false;
    targetPlaybackSpeedRef.current = 1.0;
    targetVolumeRef.current = 1.0;
    targetMutedRef.current = false;
    setActiveRendition(item.renditions && item.renditions.length > 0 ? item.renditions[0] : null);

    // Update views in Registry and fetch updated object
    let freshItem = item;
    if (type === "blog") {
      const currentViews = item.views || 0;
      db.blogs.update(item.id, { views: currentViews + 1 });
      freshItem = db.blogs.get(item.id) || item;
    }
    if (type === "photo") {
      const currentViews = item.views || 0;
      db.photos.update(item.id, { views: currentViews + 1 });
      freshItem = db.photos.get(item.id) || item;
    }
    if (type === "video") {
      const currentViews = item.views || 0;
      db.videos.update(item.id, { views: currentViews + 1 });
      freshItem = db.videos.get(item.id) || item;
    }

    // Initial values
    setLikesCount(freshItem.likesCount || 0);
    if (user && freshItem.likedBy) {
      setHasLiked(freshItem.likedBy.includes(user.id));
    } else {
      setHasLiked(false);
    }

    setFavoritesCount(freshItem.favoritesCount || 0);
    if (user && freshItem.favoritedBy) {
      setHasFavorited(freshItem.favoritedBy.includes(user.id));
    } else {
      setHasFavorited(false);
    }

    setBookmarksCount(freshItem.bookmarksCount || 0);
    if (user && freshItem.bookmarkedBy) {
      setHasBookmarked(freshItem.bookmarkedBy.includes(user.id));
    } else {
      setHasBookmarked(false);
    }

    setSharesCount(freshItem.sharesCount || 0);

    // Load comments from local db
    fetchComments();

    // Check following status (simulated)
    if (user && item.userId) {
      setIsFollowing(db.follows.isFollowing(user.id, item.userId));
    } else {
      setIsFollowing(false);
    }
  }, [focusedContent, user, followActionCount]);

  const fetchComments = () => {
    if (!focusedContent) return;
    const { type, item } = focusedContent;
    
    let source: any = null;
    if (type === "blog") source = db.blogs.get(item.id);
    if (type === "photo") source = db.photos.get(item.id);
    if (type === "video") source = db.videos.get(item.id);
    
    if (source && source.comments) {
      setComments(source.comments);
    } else {
      setComments([]);
    }
  };

  if (!focusedContent) return null;

  const { type, item } = focusedContent;
  const isDocBlog = type === "blog";
  const isDocPhoto = type === "photo";
  const isDocVideo = type === "video";

  const isPrivate = item.visibility === "private" || (item.visibility as any) === "PRIVATE";
  const isOwner = Boolean(user && user.id === item.userId);
  const isAdmin = Boolean(user && (user.role === "SUPER_ADMIN" || user.role === "ADMIN" || user.role === "MODERATOR"));
  const canAccess = !isPrivate || isOwner || isAdmin;
  const isCommentsMuted = (item.engagement === "muted") || (item.engagement as any === "MUTED") || (item.allowComments === false);

  if (!canAccess) {
    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-6"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5 shadow-lg shadow-amber-950/20">
              <Lock className="w-8 h-8" />
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest px-2.5 py-1 bg-amber-950/40 border border-amber-900/50 rounded-full mb-3">
              Private Content
            </span>
            <h3 className="text-xl font-black text-white font-space mb-2">Akses Terbatas</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans mb-6">
              Konten ini diatur sebagai <strong>Private</strong> dan hanya dapat diakses oleh pemiliknya.
            </p>
            <button
              onClick={() => setFocusedContent(null)}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-purple-950/30 cursor-pointer"
            >
              Kembali ke Explore Feed
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  const handleLike = () => {
    if (!user || !token) {
      triggerToast("Authentication Required", "Please establish an account or login to react to contents.", "error");
      return;
    }

    let currentItem: any = null;
    if (type === "blog") currentItem = db.blogs.get(item.id);
    if (type === "photo") currentItem = db.photos.get(item.id);
    if (type === "video") currentItem = db.videos.get(item.id);

    if (!currentItem) return;

    const likedBy = currentItem.likedBy || [];
    const isLiked = likedBy.includes(user.id);
    
    let newLikedBy = [];
    if (isLiked) {
      newLikedBy = likedBy.filter((uid: string) => uid !== user.id);
    } else {
      newLikedBy = [...likedBy, user.id];
    }

    const updates = {
      likedBy: newLikedBy,
      likesCount: newLikedBy.length
    };

    if (type === "blog") db.blogs.update(item.id, updates);
    if (type === "photo") db.photos.update(item.id, updates);
    if (type === "video") db.videos.update(item.id, updates);

    setLikesCount(updates.likesCount);
    setHasLiked(!isLiked);
    triggerDBSync();

    if (!isLiked && user.id !== item.userId) {
      createNotification({
        userId: item.userId,
        triggeredById: user.id,
        triggeredByAvatar: user.profile?.avatarUrl,
        title: "New Like",
        message: `${user.username} liked your ${type}: "${item.title}"`,
        category: "SOCIAL",
        type: "LIKE",
        link: `${type.toUpperCase()}:${item.id}`
      });
    }
    
    triggerToast(
      !isLiked ? "Added to Liked Collections ❤️" : "Reaction Cleared", 
      !isLiked ? `You liked "${item.title}"` : `You cleared reaction from "${item.title}"`, 
      "success"
    );
  };

  const handleFollow = async () => {
    if (!user || !token) {
      triggerToast("Access Blocked", "Please login to follow creators", "error");
      return;
    }
    if (user.id === item.userId) {
      triggerToast("Action Denied", "You cannot follow your own profile", "error");
      return;
    }
    
    const newStatus = await toggleFollow(item.userId);
    setIsFollowing(newStatus);
    triggerToast(
      newStatus ? "Creator Followed! 👣" : "Unfollowed Creator", 
      newStatus ? `Now receiving updates from ${item.authorName}` : `Unsubscribed from ${item.authorName}`, 
      "success"
    );
  };

  const handleFavorite = () => {
    if (!user || !token) {
      triggerToast("Authentication Required", "Please login to favorite contents.", "error");
      return;
    }

    let currentItem: any = null;
    if (type === "blog") currentItem = db.blogs.get(item.id);
    if (type === "photo") currentItem = db.photos.get(item.id);
    if (type === "video") currentItem = db.videos.get(item.id);

    if (!currentItem) return;

    const favoritedBy = currentItem.favoritedBy || [];
    const isFavorited = favoritedBy.includes(user.id);
    
    let newFavoritedBy = [];
    if (isFavorited) {
      newFavoritedBy = favoritedBy.filter((uid: string) => uid !== user.id);
    } else {
      newFavoritedBy = [...favoritedBy, user.id];
    }

    const updates = {
      favoritedBy: newFavoritedBy,
      favoritesCount: newFavoritedBy.length
    };

    if (type === "blog") db.blogs.update(item.id, updates);
    if (type === "photo") db.photos.update(item.id, updates);
    if (type === "video") db.videos.update(item.id, updates);

    setFavoritesCount(updates.favoritesCount);
    setHasFavorited(!isFavorited);
    triggerDBSync();

    if (!isFavorited && user.id !== item.userId) {
      createNotification({
        userId: item.userId,
        triggeredById: user.id,
        triggeredByAvatar: user.profile?.avatarUrl,
        title: "New Favorite ⭐",
        message: `${user.username} favorited your ${type}: "${item.title}"`,
        category: "SOCIAL",
        type: "FAVORITE",
        link: `${type.toUpperCase()}:${item.id}`
      });
    }

    triggerToast(
      !isFavorited ? "Added to Favorites ⭐" : "Removed from Favorites",
      !isFavorited ? `You favorited "${item.title}"` : `You removed "${item.title}" from favorites`,
      "success"
    );
  };

  const handleBookmark = () => {
    if (!user || !token) {
      triggerToast("Authentication Required", "Please login to bookmark contents.", "error");
      return;
    }

    let currentItem: any = null;
    if (type === "blog") currentItem = db.blogs.get(item.id);
    if (type === "photo") currentItem = db.photos.get(item.id);
    if (type === "video") currentItem = db.videos.get(item.id);

    if (!currentItem) return;

    const bookmarkedBy = currentItem.bookmarkedBy || [];
    const isBookmarked = bookmarkedBy.includes(user.id);
    
    let newBookmarkedBy = [];
    if (isBookmarked) {
      newBookmarkedBy = bookmarkedBy.filter((uid: string) => uid !== user.id);
    } else {
      newBookmarkedBy = [...bookmarkedBy, user.id];
    }

    const updates = {
      bookmarkedBy: newBookmarkedBy,
      bookmarksCount: newBookmarkedBy.length
    };

    if (type === "blog") db.blogs.update(item.id, updates);
    if (type === "photo") db.photos.update(item.id, updates);
    if (type === "video") db.videos.update(item.id, updates);

    setBookmarksCount(updates.bookmarksCount);
    setHasBookmarked(!isBookmarked);
    triggerDBSync();

    triggerToast(
      !isBookmarked ? "Bookmarked 🔖" : "Removed Bookmark",
      !isBookmarked ? `"${item.title}" added to your bookmarks library` : `Removed "${item.title}" from bookmarks`,
      "success"
    );
  };

  const handleShare = () => {
    let currentItem: any = null;
    if (type === "blog") currentItem = db.blogs.get(item.id);
    if (type === "photo") currentItem = db.photos.get(item.id);
    if (type === "video") currentItem = db.videos.get(item.id);

    if (!currentItem) return;

    const currentShares = currentItem.sharesCount || 0;
    const newShares = currentShares + 1;

    const updates = {
      sharesCount: newShares
    };

    if (type === "blog") db.blogs.update(item.id, updates);
    if (type === "photo") db.photos.update(item.id, updates);
    if (type === "video") db.videos.update(item.id, updates);

    setSharesCount(newShares);
    triggerDBSync();

    // Copy to clipboard as share link
    const shareUrl = `${window.location.origin}/#/${type}/${item.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      triggerToast(
        "Shared Successfully 📤",
        `Share count updated to ${newShares}. Link copied to clipboard!`,
        "success"
      );
    }).catch(() => {
      triggerToast(
        "Shared Successfully 📤",
        `Share count updated to ${newShares}!`,
        "success"
      );
    });
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/#/${type}/${item.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      triggerToast(
        "Link Copied 🔗",
        "Direct link copied to clipboard safely.",
        "success"
      );
    }).catch(() => {
      triggerToast(
        "Copy Failed",
        "Could not access copy clipboard.",
        "error"
      );
    });
  };

  const handleDownload = () => {
    triggerToast(
      "Download Started ⬇",
      `Preparing asset file format download for "${item.title}"...`,
      "info"
    );

    setTimeout(() => {
      const link = document.createElement("a");
      link.href = item.url || "#";
      link.setAttribute("download", `${item.title.toLowerCase().replace(/\s+/g, "_")}_asset`);
      link.setAttribute("target", "_blank");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      triggerToast(
        "Download Finished 🎉",
        "Asset transfer successfully processed.",
        "success"
      );
    }, 1500);
  };

  const handleMore = () => {
    setIsReporting((prev) => !prev);
    if (!isReporting) {
      triggerToast(
        "Form Pelaporan Terbuka 🚩",
        "Pilih kategori pelanggaran untuk mengirim laporan ke tim moderasi.",
        "info"
      );
    }
  };

  const submitReport = () => {
    if (!user || !token) {
      triggerToast("Akses Ditolak", "Silakan masuk untuk melaporkan konten ini.", "error");
      return;
    }
    if (!reportReason) {
      triggerToast("Alasan Diperlukan", "Silakan pilih salah satu alasan pelaporan.", "error");
      return;
    }

    setIsSubmittingReport(true);
    
    const reportData = {
      contentId: item.id,
      contentType: type,
      contentTitle: item.title,
      reporterId: user.id,
      reporterUsername: user.username,
      creatorId: item.userId,
      creatorUsername: item.authorName,
      reason: reportReason,
      description: reportNotes || "",
      isResolved: false,
      status: "PENDING"
    };

    const savedReport = db.reports.add(reportData);

    createNotification({
      userId: item.userId,
      triggeredById: user.id,
      triggeredByAvatar: user.profile?.avatarUrl,
      title: "Konten Dilaporkan ⚠️",
      message: `${type} "${item.title}" Anda telah ditandai oleh pengguna lain.`,
      category: "SYSTEM",
      type: "ALERT",
      link: `${type.toUpperCase()}:${item.id}`
    });

    createNotification({
      userId: "admin",
      triggeredById: user.id,
      triggeredByAvatar: user.profile?.avatarUrl,
      title: "Laporan Pelanggaran Baru",
      message: `User @${user.username} melaporkan konten milik @${item.authorName}`,
      category: "ADMIN",
      type: "REPORT",
      link: `REPORT:${savedReport?.id || "unknown"}`
    });

    triggerDBSync();

    setTimeout(() => {
      triggerToast("Laporan Diterima 🛑", "Terima kasih. Laporan Anda telah terkirim dan akan segera ditinjau oleh tim moderator.", "success");
      setIsReporting(false);
      setReportReason("");
      setReportNotes("");
      setIsSubmittingReport(false);
    }, 1000);
  };

  const renderMobileReportModal = () => {
    const reasons = [
      "Spam or commercially unauthorized distribution",
      "Intellectual property / Copyright / Trademark claims",
      "Explicit, unsafe, or highly inappropriate content",
      "Defamation, harassment, or offensive behavior",
      "Other system guideline violations"
    ];

    return (
      <AnimatePresence>
        {isReporting && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReporting(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-full max-w-lg bg-slate-900 border-t sm:border border-slate-800 rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="w-12 h-1.5 bg-slate-800 rounded-full mx-auto mb-6 shrink-0 sm:hidden" />
              
              <div className="flex items-center justify-between mb-6 shrink-0">
                <div className="flex items-center gap-3 text-rose-500">
                  <Flag className="w-6 h-6" />
                  <h2 className="text-xl font-black font-space tracking-tight">Report Content</h2>
                </div>
                <button onClick={() => setIsReporting(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Select Violation:</label>
                  <div className="space-y-2">
                    {reasons.map((r) => (
                      <button
                        key={r}
                        onClick={() => setReportReason(r)}
                        className={`w-full p-4 text-left rounded-2xl border transition-all active:scale-[0.98] ${
                          reportReason === r 
                            ? "bg-rose-500/10 border-rose-500 text-rose-400 shadow-lg shadow-rose-950/20" 
                            : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold leading-tight pr-4">{r}</span>
                          <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${reportReason === r ? "border-rose-500 bg-rose-500 shadow-inner" : "border-slate-700"}`} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Additional Notes:</label>
                  <textarea
                    placeholder="Provide any details to help moderators review..."
                    value={reportNotes}
                    onChange={(e) => setReportNotes(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-950/40 border border-slate-800 rounded-2xl p-4 text-sm text-white focus:border-rose-500 focus:outline-none transition-all resize-none font-sans"
                  />
                </div>

                <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-800/60">
                  <p className="text-[10px] text-slate-500 leading-relaxed italic text-center">
                    "Use the options above to report content that violates the NightVerse Community Guidelines. Reports will be reviewed by the moderation team."
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-6 mt-2 border-t border-slate-800 shrink-0">
                <button 
                  onClick={() => setIsReporting(false)}
                  className="flex-1 py-4 bg-slate-800 text-slate-300 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  onClick={submitReport}
                  disabled={isSubmittingReport || !reportReason}
                  className="flex-[2] py-4 bg-rose-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest disabled:opacity-50 disabled:grayscale shadow-xl shadow-rose-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {isSubmittingReport ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Submit Report"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  };

  const submitComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isCommentsMuted) {
      triggerToast("Komentar Dinonaktifkan 🔇", "Fitur komentar telah dinonaktifkan untuk postingan ini.", "error");
      return;
    }
    if (!canAccess) {
      triggerToast("Akses Ditolak 🔒", "Anda tidak memiliki izin untuk mengomentari postingan ini.", "error");
      return;
    }
    if (!user || !token || !commentText.trim()) return;

    const newComment = {
      id: Math.random().toString(36).slice(2, 11),
      userId: user.id,
      username: user.username,
      avatarUrl: user.profile?.avatarUrl || user.avatarUrl,
      content: commentText.trim(),
      createdAt: new Date().toISOString(),
      contentId: item.id,
      contentType: type
    };

    let currentItem: any = null;
    if (type === "blog") currentItem = db.blogs.get(item.id);
    if (type === "photo") currentItem = db.photos.get(item.id);
    if (type === "video") currentItem = db.videos.get(item.id);

    if (!currentItem) return;

    const updatedComments = [...(currentItem.comments || []), newComment];

    const updates = {
      comments: updatedComments
    };

    if (type === "blog") db.blogs.update(item.id, updates);
    if (type === "photo") db.photos.update(item.id, updates);
    if (type === "video") db.videos.update(item.id, updates);

    // Also add to global comments collection if supported
    if (db.comments && db.comments.add) {
      db.comments.add(newComment);
    }

    setComments(updatedComments);
    setCommentText("");
    triggerDBSync();

    if (user.id !== item.userId) {
      createNotification({
        userId: item.userId,
        triggeredById: user.id,
        triggeredByAvatar: user.profile?.avatarUrl,
        title: "New Comment 💬",
        message: `${user.username} commented on your ${type}: "${item.title}"`,
        category: "SOCIAL",
        type: "COMMENT",
        link: `${type.toUpperCase()}:${item.id}`
      });
    }

    triggerToast("Signal Transmitted 💬", "Komentar berhasil dipublikasikan secara real-time.", "success");
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (w && h) {
      const ratio = w / h;
      setAspectRatio(ratio);
      if (ratio > 1.2) {
        setRatioMode("landscape");
      } else if (ratio < 0.85) {
        setRatioMode("portrait");
      } else {
        setRatioMode("square");
      }
    }
  };

  const handleVideoMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const vid = e.currentTarget;
    const w = vid.videoWidth;
    const h = vid.videoHeight;
    if (w && h) {
      const ratio = w / h;
      setAspectRatio(ratio);
      if (ratio > 1.2) {
        setRatioMode("landscape");
      } else if (ratio < 0.85) {
        setRatioMode("portrait");
      } else {
        setRatioMode("square");
      }
    }
  };

  // Video player logic
  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch((err) => {
              console.warn("Video play request interrupted or rejected gracefully:", err);
            });
        } else {
          setIsPlaying(true);
        }
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
      resetControlsTimer();
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const dur = videoRef.current.duration;
      setCurrentTime(current);
      if (dur > 0) {
        setProgress((current / dur) * 100);
      }
      try {
        const buffered = videoRef.current.buffered;
        if (buffered && buffered.length > 0) {
          for (let i = 0; i < buffered.length; i++) {
            if (buffered.start(i) <= current && current <= buffered.end(i)) {
              setBufferHealthSecs(Math.max(0, buffered.end(i) - current));
              break;
            }
          }
        }
      } catch {}
    }
  };

  const applyResumedPlaybackState = () => {
    const v = videoRef.current;
    if (!v) return;

    if (v.videoWidth && v.videoHeight) {
      setLiveVideoWidth(v.videoWidth);
      setLiveVideoHeight(v.videoHeight);
      setSourceVideoHeight((prev) => Math.max(prev, v.videoHeight));
    }
    if (v.duration && !isNaN(v.duration) && v.duration > 0) {
      setDuration(v.duration);
    }

    v.playbackRate = targetPlaybackSpeedRef.current;
    v.volume = targetVolumeRef.current;
    v.muted = targetMutedRef.current;

    if (targetResumeTimeRef.current !== null) {
      const resumeTime = targetResumeTimeRef.current;
      const safeTime = v.duration && v.duration > 0 ? Math.min(resumeTime, v.duration) : resumeTime;

      // Only attempt to set currentTime if readyState is at least HAVE_METADATA (1)
      if (v.readyState >= 1) {
        try {
          v.currentTime = safeTime;
          setCurrentTime(safeTime);
          if (v.duration > 0) {
            setProgress((safeTime / v.duration) * 100);
          }
        } catch (err) {
          console.warn("Seek error during rendition switch:", err);
        }

        if (wasPlayingRef.current) {
          const playPromise = v.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setIsPlaying(true);
              })
              .catch((err) => {
                console.warn("Playback resume error handled gracefully:", err);
              });
          }
        }

        targetResumeTimeRef.current = null;
        setIsSwitchingQuality(false);
        triggerToast("Kualitas Aktif ⚡", `Resolusi: ${v.videoWidth}×${v.videoHeight} (${selectedQuality})`, "success");
      }
    } else {
      setIsSwitchingQuality(false);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration || 0;
      const h = videoRef.current.videoHeight || 1080;
      const w = videoRef.current.videoWidth || 1920;
      setDuration(dur);
      setSourceVideoHeight((prev) => Math.max(prev, h));
      setLiveVideoHeight(h);
      setLiveVideoWidth(w);
      videoRef.current.playbackRate = playbackSpeed;
    }
    if (focusedContent?.type === "video") {
      handleVideoMetadata({ currentTarget: videoRef.current } as any);
    }
    applyResumedPlaybackState();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const seekTime = (Number(e.target.value) / 100) * duration;
      videoRef.current.currentTime = seekTime;
      setProgress(Number(e.target.value));
      resetControlsTimer();
    }
  };

  const skipBack10 = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (videoRef.current) {
      const newTime = Math.max(0, videoRef.current.currentTime - 10);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      if (duration > 0) setProgress((newTime / duration) * 100);
      resetControlsTimer();
    }
  };

  const skipForward10 = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (videoRef.current) {
      const newTime = Math.min(duration, videoRef.current.currentTime + 10);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      if (duration > 0) setProgress((newTime / duration) * 100);
      resetControlsTimer();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = Number(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
    }
    setIsMuted(newVol === 0);
    resetControlsTimer();
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      videoRef.current.muted = newMuted;
    }
    resetControlsTimer();
  };

  const speedOptions = [
    { label: "0.5x", value: 0.5 },
    { label: "0.75x", value: 0.75 },
    { label: "Normal (1.0x)", value: 1.0 },
    { label: "1.25x", value: 1.25 },
    { label: "1.5x", value: 1.5 },
    { label: "1.75x", value: 1.75 },
    { label: "2.0x", value: 2.0 },
  ];

  const handleSelectSpeed = (val: number) => {
    setPlaybackSpeed(val);
    if (videoRef.current) {
      videoRef.current.playbackRate = val;
    }
    setShowSettingsMenu(false);
    setSettingsSubmenu("main");
  };

  const maxSourceH = useMemo(() => {
    let maxH = 1080;
    if (item?.resolution && item.resolution.includes("x")) {
      const parsed = parseInt(item.resolution.split("x")[1], 10);
      if (!isNaN(parsed) && parsed > 0) maxH = parsed;
    }
    if (item?.renditions && Array.isArray(item.renditions) && item.renditions.length > 0) {
      const rendMax = Math.max(...item.renditions.map((r: any) => r.height || 0));
      if (rendMax > 0) maxH = Math.max(maxH, rendMax);
    }
    return Math.max(maxH, sourceVideoHeight || 0);
  }, [item, sourceVideoHeight]);

  const allQualities = useMemo(() => [
    { label: "Auto", height: 9999, width: 0, bitrateStr: "Adaptif" },
    { label: "Original", height: maxSourceH, width: 1920, bitrateStr: "Sumber Asli" },
    { label: "1080p", height: 1080, width: 1920, bitrateStr: "4.5 Mbps" },
    { label: "720p", height: 720, width: 1280, bitrateStr: "2.2 Mbps" },
    { label: "480p", height: 480, width: 854, bitrateStr: "1.0 Mbps" },
    { label: "360p", height: 360, width: 640, bitrateStr: "600 kbps" },
    { label: "240p", height: 240, width: 426, bitrateStr: "350 kbps" },
    { label: "144p", height: 144, width: 256, bitrateStr: "180 kbps" },
  ], [maxSourceH]);

  const availableQualities = useMemo(() => {
    return allQualities.filter((q) => {
      if (q.label === "Auto" || q.label === "Original") return true;
      if (q.height > maxSourceH) return false;
      if (item?.renditions && item.renditions.length > 0) {
        return item.renditions.some((r: any) => r.resolution === q.label);
      }
      return true;
    });
  }, [allQualities, maxSourceH, item?.renditions]);

  const handleSelectQuality = (label: string) => {
    if (label === selectedQuality && !isSwitchingQuality) return;

    let targetRendition: any | undefined;
    let targetUrl = item.url;

    const availableRends = (item?.renditions && item.renditions.length > 0)
      ? item.renditions
      : (DEFAULT_FEATURED_VIDEOS[0]?.renditions || []);

    if (label === "Auto" || label === "Original") {
      if (availableRends.length > 0) {
        const sorted = [...availableRends].sort((a, b) => (b.height || 0) - (a.height || 0));
        targetRendition = sorted[0];
        targetUrl = targetRendition.url;
      } else {
        targetUrl = item.url || "/renditions/cyberpunk-city/1080p.mp4";
      }
    } else {
      targetRendition = availableRends.find((r: any) => r.resolution === label);
      if (!targetRendition) {
        triggerToast("Kualitas Belum Tersedia", `File rendition ${label} belum tersedia untuk video ini.`, "error");
        return;
      }
      targetUrl = targetRendition.url;
    }

    // Save exact playback state before source transition
    const prevTime = videoRef.current ? videoRef.current.currentTime : currentTime;
    targetResumeTimeRef.current = prevTime;
    wasPlayingRef.current = isPlaying;
    targetPlaybackSpeedRef.current = playbackSpeed;
    targetVolumeRef.current = videoRef.current ? videoRef.current.volume : volume;
    targetMutedRef.current = videoRef.current ? videoRef.current.muted : isMuted;

    setIsSwitchingQuality(true);
    setSelectedQuality(label);
    setActiveRendition(targetRendition || null);
    setShowSettingsMenu(false);
    setSettingsSubmenu("main");

    // Pause first to safely conclude any pending play requests before reloading
    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch {}
    }

    // Seamlessly swap video source
    setCurrentVideoUrl(targetUrl);

    if (videoRef.current) {
      videoRef.current.src = targetUrl;
      videoRef.current.load();
    }

    // Fallback safety timeout if metadata already loaded or cached
    setTimeout(() => {
      if (targetResumeTimeRef.current !== null && videoRef.current) {
        applyResumedPlaybackState();
      }
      setIsSwitchingQuality(false);
    }, 4000);
  };

  const toggleFullscreen = async () => {
    if (!videoContainerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await videoContainerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error("Fullscreen failed", error);
    }
    resetControlsTimer();
  };

  const togglePiP = async () => {
    if (videoRef.current) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else if (videoRef.current !== document.pictureInPictureElement) {
          await videoRef.current.requestPictureInPicture();
        }
      } catch (error) {
        console.error("PiP failed", error);
      }
    }
    resetControlsTimer();
  };

  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3500);
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleMediaTouch = () => {
    resetControlsTimer();
  };

  const renderTabNavigation = (currentTab: string, setTab: (tab: any) => void) => {
    const tabs = [
      { id: 'info', label: 'Info', icon: Info },
      { id: 'comments', label: 'Komentar', icon: MessageSquare },
      { id: 'creator', label: 'Kreator', icon: Users },
      { id: 'related', label: 'Terkait', icon: Layers },
    ];

    return (
      <div className="flex p-1 gap-1 bg-slate-900/80 rounded-xl border border-slate-800/80 mb-4 backdrop-blur-xl shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id as any)}
            className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-all active:scale-95 cursor-pointer ${
              currentTab === tab.id 
                ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30 font-bold" 
                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 font-medium"
            }`}
          >
            <tab.icon className={`w-3.5 h-3.5 ${currentTab === tab.id ? "scale-110 text-white" : ""}`} />
            <span className="text-[10px] font-bold tracking-tight">{tab.label}</span>
          </button>
        ))}
      </div>
    );
  };

  const renderMultiVideoEmbedSection = () => {
    if (!isDocVideo) return null;
    const allUrls = (item.videoUrls && item.videoUrls.length > 0) ? item.videoUrls : [item.url];
    if (allUrls.length <= 1) return null;

    return (
      <div className="w-full mt-6 bg-slate-900/90 border border-purple-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
              <Play className="w-3.5 h-3.5 fill-current" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white font-space tracking-tight flex items-center gap-2">
                More Videos ({allUrls.length})
                <span className="text-[8px] font-mono font-bold text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded-full border border-purple-900">
                  {activeEmbedIndex + 1}/{allUrls.length} Active
                </span>
              </h4>
              <p className="text-[10px] text-slate-400 font-sans">
                Daftar video embed tambahan. Klik untuk mengaktifkan pemutar utama.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
          {allUrls.map((url: string, index: number) => {
            const isActive = activeEmbedIndex === index;
            let domainName = "Video External";
            try {
              const parsed = new URL(url);
              domainName = parsed.hostname.replace("www.", "");
            } catch (e) {
              domainName = "Video Ref " + (index + 1);
            }

            return (
              <button
                key={index}
                onClick={() => setActiveEmbedIndex(index)}
                className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer active:scale-95 ${
                  isActive
                    ? "bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-950/40 ring-1 ring-purple-500/50"
                    : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-mono font-black shrink-0 ${
                    isActive ? "bg-purple-600 text-white shadow-md shadow-purple-900/40" : "bg-slate-800 text-slate-400"
                  }`}>
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold truncate flex items-center gap-1.5">
                      <span>Video Embed #{index + 1}</span>
                      {isActive && (
                        <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-purple-300 bg-purple-900/80 px-1.5 py-0.2 rounded border border-purple-700">
                          Diputar
                        </span>
                      )}
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono truncate">
                      {domainName} • {url}
                    </div>
                  </div>
                </div>
                <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? "text-purple-400 bg-purple-500/10" : "text-slate-600"}`}>
                  <Play className="w-3.5 h-3.5 fill-current" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMobileActionButtons = () => {
    const isOwnerOrAdmin = isOwner || isAdmin;
    const handleEditClick = () => {
      setFocusedContent(null);
      if (editUserContent) {
        editUserContent({ ...item, type });
      }
    };

    const actions = [
      { id: 'like', icon: Heart, label: likesCount, active: hasLiked, color: "text-rose-400", onClick: handleLike },
      { id: 'fav', icon: Star, label: favoritesCount, active: hasFavorited, color: "text-amber-400", onClick: handleFavorite },
      { id: 'share', icon: Share2, label: sharesCount, active: false, color: "text-indigo-400", onClick: handleShare },
      { id: 'download', icon: Download, label: 'Save', active: false, color: "text-emerald-400", onClick: handleDownload },
      { id: 'report', icon: Flag, label: 'Lapor', active: isReporting, color: "text-slate-400", onClick: handleMore },
      { id: 'bookmark', icon: Bookmark, label: bookmarksCount, active: hasBookmarked, color: "text-sky-400", onClick: handleBookmark },
    ];

    return (
      <div className="space-y-2 mb-4">
        {isOwnerOrAdmin && (
          <button
            onClick={handleEditClick}
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-950/40 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-white" />
            <span>Edit {isDocVideo ? "Video" : isDocPhoto ? "Photo" : "Blog"}</span>
          </button>
        )}
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-2 grid grid-cols-3 gap-1.5 backdrop-blur-sm">
          {actions.map((act) => (
            <button
              key={act.id}
              onClick={act.onClick}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all active:scale-90 ${
                act.active 
                  ? "bg-purple-600/20 border-purple-500/50 text-white shadow-inner" 
                  : "bg-slate-900/40 border-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <act.icon className={`w-3.5 h-3.5 mb-1 ${act.active ? "text-white" : act.color}`} />
              <span className="text-[9px] font-extrabold font-mono">{act.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderContentLightboxGroupedTags = (tagsArray: string[]) => {
    if (!tagsArray || tagsArray.length === 0) return null;
    const allDbTags = db.tags.getAll();

    const uniqueTagsMap = new Map<string, { name: string; type: string; isAmbiguous: boolean }>();
    tagsArray.forEach(rawTag => {
      if (!rawTag || typeof rawTag !== 'string') return;
      const clean = rawTag.toLowerCase().trim().replace(/^#/, "");
      if (!clean || uniqueTagsMap.has(clean)) return;

      const dbMatch = allDbTags.find(t => t.name.toLowerCase() === clean);
      uniqueTagsMap.set(clean, {
        name: clean,
        type: dbMatch?.type || "General",
        isAmbiguous: !!dbMatch?.isAmbiguous
      });
    });

    const uniqueTags = Array.from(uniqueTagsMap.values());

    const groups = [
      { label: "Artists", textStyle: "text-rose-400", badgeStyle: "text-rose-300 bg-rose-500/10 border-rose-500/30 hover:border-rose-400", items: uniqueTags.filter(t => t.type === "Artist") },
      { label: "Copyright", textStyle: "text-purple-400", badgeStyle: "text-purple-300 bg-purple-500/10 border-purple-500/30 hover:border-purple-400", items: uniqueTags.filter(t => t.type === "Copyright") },
      { label: "Characters", textStyle: "text-cyan-400", badgeStyle: "text-cyan-300 bg-cyan-500/10 border-cyan-500/30 hover:border-cyan-400", items: uniqueTags.filter(t => t.type === "Character") },
      { label: "Regular", textStyle: "text-slate-300", badgeStyle: "text-slate-300 bg-slate-800/80 border-slate-700/80 hover:border-slate-500", items: uniqueTags.filter(t => t.type === "General") },
      { label: "Metadata", textStyle: "text-emerald-400", badgeStyle: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-400", items: uniqueTags.filter(t => t.type === "Metadata") }
    ].filter(g => g.items.length > 0);

    if (groups.length === 0) return null;

    return (
      <div className="space-y-3 pt-3 border-t border-slate-800/60 mt-3">
        {groups.map(g => (
          <div key={g.label} className="space-y-1.5">
            <span className={`text-[10px] font-extrabold font-space uppercase tracking-wider block ${g.textStyle}`}>
              {g.label}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {g.items.map(tagObj => (
                <span 
                  key={tagObj.name}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFocusedContent(null);
                    triggerSearch(tagObj.name);
                    navigateTo("dashboard", "explore");
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-[10px] font-mono font-semibold cursor-pointer transition-all active:scale-95 ${g.badgeStyle}`}
                  title={`Cari #${tagObj.name}`}
                >
                  <span>#{tagObj.name}</span>
                  {tagObj.isAmbiguous && <span className="text-amber-400 font-bold" title="Ambiguous Tag">(?)</span>}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderMediaElement = () => {
    if (isDocPhoto) {
      return (
        <img 
          src={item.url || undefined} 
          alt={item.title} 
          onLoad={handleImageLoad}
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain select-none transition-all duration-300"
        />
      );
    }

    if (isDocVideo) {
      const allUrls = (item.videoUrls && item.videoUrls.length > 0) ? item.videoUrls : [item.url];
      const currentUrl = allUrls[activeEmbedIndex] || allUrls[0] || item.url || "";
      const isEmbed = item.sourceType === "EMBED" || item.sourceType === "Real-time Embed" || allUrls.length > 1 || currentUrl.includes("youtube.com") || currentUrl.includes("vimeo.com") || currentUrl.includes("youtu.be");

      if (isEmbed) {
        const iframeSrc = currentUrl.includes("youtube.com/watch?v=") 
          ? currentUrl.replace("watch?v=", "embed/") 
          : currentUrl.includes("youtu.be/")
          ? currentUrl.replace("youtu.be/", "youtube.com/embed/")
          : currentUrl.includes("vimeo.com/")
          ? currentUrl.replace("vimeo.com/", "player.vimeo.com/video/")
          : (currentUrl || undefined);

        return (
          <div className="relative w-full h-full bg-black flex flex-col items-center justify-center">
            <iframe
              src={iframeSrc}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={`Embed Player ${activeEmbedIndex + 1}`}
            />
            {isMobile && (
               <div className="absolute top-4 left-4 z-50">
                  <button onClick={() => setFocusedContent(null)} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
               </div>
            )}
          </div>
        );
      } else {
        return (
          <div 
            ref={videoContainerRef}
            className="relative w-full h-full bg-slate-950 flex items-center justify-center group overflow-hidden select-none" 
            onClick={handleMediaTouch}
            onMouseMove={resetControlsTimer}
          >
            {isSwitchingQuality && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/65 backdrop-blur-md transition-all animate-in fade-in">
                <div className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-slate-900/95 border border-cyan-500/40 shadow-2xl">
                  <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                  <div className="text-center space-y-1">
                    <span className="text-xs font-black text-white uppercase tracking-wider block font-space">
                      Mengoptimalkan Pemutaran Video...
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      Sinkronisasi AVC stream & melanjutkan timestamp
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Technical HUD / Stats for Nerds Overlay */}
            {showStatsHud && (
              <div 
                className="absolute top-4 left-4 z-40 p-3.5 rounded-xl bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 text-[10px] font-mono text-cyan-300 space-y-1.5 shadow-2xl max-w-xs sm:max-w-sm pointer-events-auto select-none"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1.5 mb-1.5">
                  <span className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-white">
                    <Zap className="w-3.5 h-3.5 text-cyan-400" /> Stats for Nerds
                  </span>
                  <button 
                    onClick={() => setShowStatsHud(false)}
                    className="p-0.5 hover:text-white text-slate-400 rounded transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Viewport Dimensions:</span>
                  <span className="text-slate-300">{Math.round(videoContainerRef.current?.clientWidth || 0)} × {Math.round(videoContainerRef.current?.clientHeight || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Video Codec:</span>
                  <span className="text-purple-300">H.264 / AVC High Profile</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Active Bitrate:</span>
                  <span className="font-bold text-cyan-300">
                    {activeRendition?.bitrate 
                      ? `${(activeRendition.bitrate / 1000).toLocaleString()} kbps` 
                      : "4,488 kbps"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Buffer Health:</span>
                  <span className="text-emerald-300">{bufferHealthSecs.toFixed(2)}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Playback Timestamp:</span>
                  <span className="text-slate-200">{currentTime.toFixed(2)}s / {duration.toFixed(2)}s</span>
                </div>
              </div>
            )}

            <video 
              ref={videoRef}
              src={currentVideoUrl || currentUrl || "/renditions/cyberpunk-city/1080p.mp4"} 
              autoPlay={false} 
              loop={!isMobile}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onCanPlay={applyResumedPlaybackState}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onClick={togglePlay}
              onEnded={() => setIsPlaying(false)}
              onError={(e) => {
                e.stopPropagation();
                const mediaErr = videoRef.current?.error;
                console.warn("Video playback error handled gracefully:", mediaErr || e);
                if (mediaErr && mediaErr.code === 4 && !isSwitchingQuality) {
                  if (currentVideoUrl !== "/renditions/cyberpunk-city/1080p.mp4") {
                    setCurrentVideoUrl("/renditions/cyberpunk-city/1080p.mp4");
                  }
                }
              }}
              className="w-full h-full object-contain cursor-pointer"
              playsInline
            />

            {/* Central Play Overlay Button (Non-Autoplay default state) */}
            {!isPlaying && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-[2px] cursor-pointer transition-all duration-300"
              >
                <button 
                  type="button"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-purple-600/90 hover:bg-purple-500 border-2 border-purple-400/50 flex items-center justify-center text-white shadow-2xl shadow-purple-900/80 transform hover:scale-110 active:scale-95 transition-all duration-200 group/playbtn cursor-pointer"
                  title="Putar Video"
                >
                  <Play className="w-10 h-10 sm:w-12 sm:h-12 fill-current ml-1 text-white drop-shadow-md group-hover/playbtn:scale-110 transition-transform" />
                </button>
              </motion.div>
            )}

            {/* Mobile Top Controls Bar */}
            {isMobile && (
              <div className="absolute top-4 left-4 z-40 pointer-events-auto flex items-center gap-2">
                <button 
                  onClick={() => setFocusedContent(null)} 
                  className="p-2.5 bg-slate-900/70 hover:bg-slate-800 backdrop-blur-md rounded-full text-white border border-white/10 shadow-lg active:scale-95 transition-all"
                  title="Tutup"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Settings Popover System (Positioned above Gear Icon) */}
            <AnimatePresence>
              {showSettingsMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-20 right-4 sm:right-6 z-50 w-72 bg-slate-900/95 border border-purple-500/30 rounded-2xl shadow-2xl backdrop-blur-xl p-3 text-white font-sans text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  {settingsSubmenu === "main" && (
                    <div className="space-y-1">
                      <div className="px-3 py-2 border-b border-slate-800 text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400 flex items-center justify-between">
                        <span>Pengaturan Pemutaran</span>
                        <Settings className="w-3.5 h-3.5 text-purple-400" />
                      </div>
                      <button
                        onClick={() => setSettingsSubmenu("speed")}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-purple-600/20 text-slate-200 hover:text-white transition-colors text-left"
                      >
                        <span className="font-semibold">Kecepatan Pemutaran</span>
                        <span className="text-[10px] font-mono text-purple-400 flex items-center gap-1">
                          {playbackSpeed === 1 ? "Normal" : `${playbackSpeed}x`}
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                        </span>
                      </button>
                      <button
                        onClick={() => setSettingsSubmenu("quality")}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-purple-600/20 text-slate-200 hover:text-white transition-colors text-left"
                      >
                        <span className="font-semibold">Kualitas Video</span>
                        <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1">
                          {selectedQuality}
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          setShowStatsHud(!showStatsHud);
                          setShowSettingsMenu(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-purple-600/20 text-slate-200 hover:text-white transition-colors text-left"
                      >
                        <span className="font-semibold flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-cyan-400" />
                          Stats for Nerds (HUD)
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${showStatsHud ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "text-slate-500 bg-slate-800"}`}>
                          {showStatsHud ? "Aktif" : "Nonaktif"}
                        </span>
                      </button>
                    </div>
                  )}

                  {settingsSubmenu === "speed" && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 px-2 py-1.5 border-b border-slate-800">
                        <button
                          onClick={() => setSettingsSubmenu("main")}
                          className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-bold text-white font-space">Kecepatan Pemutaran</span>
                      </div>
                      <div className="max-h-48 overflow-y-auto custom-scrollbar pt-1 space-y-0.5">
                        {speedOptions.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => handleSelectSpeed(opt.value)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${
                              playbackSpeed === opt.value
                                ? "bg-purple-600/30 text-purple-300 font-bold border border-purple-500/30"
                                : "hover:bg-slate-800 text-slate-300"
                            }`}
                          >
                            <span>{opt.label}</span>
                            {playbackSpeed === opt.value && <Check className="w-4 h-4 text-purple-400" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {settingsSubmenu === "quality" && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 px-2 py-1.5 border-b border-slate-800">
                        <button
                          onClick={() => setSettingsSubmenu("main")}
                          className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-bold text-white font-space">Kualitas Video (H.264 / AVC)</span>
                      </div>
                      <div className="max-h-56 overflow-y-auto custom-scrollbar pt-1 space-y-0.5">
                        {availableQualities.map((q) => {
                          const isSelected = selectedQuality === q.label;
                          const rend = item.renditions?.find((r: any) => r.resolution === q.label);
                          const isOriginal = q.height !== 9999 && sourceVideoHeight && q.height === sourceVideoHeight;

                          return (
                            <button
                              key={q.label}
                              onClick={() => handleSelectQuality(q.label)}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${
                                isSelected
                                  ? "bg-cyan-600/30 text-cyan-300 font-bold border border-cyan-500/30"
                                  : "hover:bg-slate-800 text-slate-300"
                              }`}
                            >
                              <div className="flex flex-col">
                                <span className="flex items-center gap-1.5 text-xs font-semibold">
                                  {q.label}
                                  {isOriginal && (
                                    <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-purple-950 text-purple-400 border border-purple-800">
                                      Sumber Original
                                    </span>
                                  )}
                                </span>
                                <span className="text-[9px] font-mono text-slate-500">
                                  {rend ? `${rend.width}×${rend.height} • ${(rend.bitrate / 1000).toLocaleString()} kbps` : q.bitrateStr}
                                </span>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Video Controls Bar */}
            <AnimatePresence>
              {(showControls || !isPlaying) && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-0 left-0 right-0 p-3 sm:p-5 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent z-40 space-y-2 pointer-events-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Progress Scrubber Slider */}
                  <div className="relative flex items-center group/scrubber cursor-pointer py-1">
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      step="0.1"
                      value={progress}
                      onChange={handleSeek}
                      className="w-full h-1.5 hover:h-2 bg-slate-800/80 rounded-full appearance-none cursor-pointer accent-purple-500 transition-all z-10"
                    />
                    <div 
                      className="absolute left-0 h-1.5 rounded-full bg-gradient-to-r from-purple-600 to-cyan-400 pointer-events-none group-hover/scrubber:h-2 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {/* Main Control Buttons Row */}
                  <div className="flex items-center justify-between gap-2 sm:gap-4">
                    {/* Left Actions: Play/Pause, Skip -10s, Skip +10s, Volume, Time */}
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <button 
                        onClick={togglePlay} 
                        className="p-2 sm:p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-lg shadow-purple-950/40 active:scale-90 transition-all cursor-pointer shrink-0"
                        title={isPlaying ? "Jeda (Pause)" : "Putar (Play)"}
                      >
                        {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />}
                      </button>

                      <button 
                        onClick={skipBack10}
                        className="p-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 flex items-center gap-1 active:scale-95 transition-all cursor-pointer shrink-0"
                        title="Mundur 10 Detik"
                      >
                        <RotateCcw className="w-4 h-4 text-purple-400" />
                        <span className="text-[10px] font-mono font-bold hidden sm:inline">-10s</span>
                      </button>

                      <button 
                        onClick={skipForward10}
                        className="p-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 flex items-center gap-1 active:scale-95 transition-all cursor-pointer shrink-0"
                        title="Maju 10 Detik"
                      >
                        <RotateCw className="w-4 h-4 text-cyan-400" />
                        <span className="text-[10px] font-mono font-bold hidden sm:inline">+10s</span>
                      </button>

                      {/* Volume Slider & Toggle */}
                      <div className="hidden sm:flex items-center gap-2 group/vol bg-slate-900/60 border border-slate-800/80 rounded-xl px-2.5 py-1.5">
                        <button onClick={toggleMute} className="text-slate-400 hover:text-white transition-colors">
                          {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-purple-400" />}
                        </button>
                        <input 
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className="w-16 h-1 bg-slate-700 rounded-full appearance-none cursor-pointer accent-purple-400"
                        />
                      </div>

                      {/* Time Readout */}
                      <div className="text-[11px] font-mono font-bold text-slate-300 tracking-tight shrink-0 bg-slate-900/60 border border-slate-800/60 px-2.5 py-1 rounded-xl">
                        <span>{formatTime(currentTime)}</span>
                        <span className="text-slate-600 mx-1">/</span>
                        <span className="text-slate-400">{formatTime(duration)}</span>
                      </div>
                    </div>

                    {/* Right Actions: Settings, PiP, Fullscreen */}
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      <button 
                        onClick={() => {
                          setShowSettingsMenu(!showSettingsMenu);
                          setSettingsSubmenu("main");
                        }} 
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                          showSettingsMenu 
                            ? "bg-purple-600/30 border-purple-500 text-purple-300 shadow-md shadow-purple-950/40" 
                            : "bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                        title="Pengaturan Pemutaran & Kualitas"
                      >
                        <Settings className={`w-4 h-4 ${showSettingsMenu ? "rotate-90 transition-transform duration-300 text-purple-400" : ""}`} />
                      </button>

                      <button 
                        onClick={togglePiP} 
                        className="p-2 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 active:scale-95 transition-all cursor-pointer hidden sm:flex"
                        title="Picture in Picture"
                      >
                        <SquareStack className="w-4 h-4" />
                      </button>

                      <button 
                        onClick={toggleFullscreen} 
                        className="p-2 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 active:scale-95 transition-all cursor-pointer"
                        title="Fullscreen"
                      >
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      }
    }

    return null;
  };

  const renderRightPanelContent = () => {
    if (isReporting) {
      return (
        <div className="flex flex-col h-full bg-slate-900 p-6 overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-2 mb-6 text-rose-400 font-bold font-space text-base">
            <AlertTriangle className="w-5 h-5 animate-pulse" /> Report Content
          </div>
          <div className="space-y-4">
            <label className="block text-xs font-bold font-mono text-slate-400 uppercase tracking-widest pl-1">Select Violation:</label>
            <div className="flex flex-col gap-2">
              {[
                "Spam or commercially unauthorized distribution",
                "Intellectual property / Copyright / Trademark claims",
                "Explicit, unsafe, or highly inappropriate content",
                "Defamation, harassment, or offensive behavior",
                "Other system guideline violations"
              ].map((srv) => (
                <button
                  key={srv}
                  type="button"
                  onClick={() => setReportReason(srv)}
                  className={`w-full p-4 text-left rounded-2xl border text-xs transition-all cursor-pointer font-sans leading-tight shadow-sm ${
                    reportReason === srv 
                      ? "bg-rose-950 border-rose-600 text-white shadow-rose-900/20" 
                      : "bg-slate-800/30 hover:bg-slate-800/80 border-slate-700 text-slate-300"
                  }`}
                >
                  {srv}
                </button>
              ))}
            </div>

            <div className="pt-4 space-y-2">
              <label className="block text-xs font-bold font-mono text-slate-400 uppercase tracking-widest pl-1">Additional Notes:</label>
              <textarea
                placeholder="Provide any details to help moderators Review..."
                value={reportNotes}
                onChange={(e) => setReportNotes(e.target.value)}
                rows={3}
                className="w-full text-xs p-4 rounded-2xl bg-slate-800/30 border border-slate-700 focus:outline-none focus:border-rose-500 focus:bg-slate-800 text-slate-200 placeholder-slate-500 resize-none transition-colors"
              />
            </div>

            <p className="text-[10px] text-slate-500 leading-relaxed italic text-center py-2 px-4 bg-slate-950/30 rounded-xl border border-slate-800/40">
              "Use the options above to report content that violates the NightVerse Community Guidelines. Reports will be reviewed by the moderation team."
            </p>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setIsReporting(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitReport}
                disabled={isSubmittingReport || !reportReason}
                className="flex-[2] py-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-900/20"
              >
                {isSubmittingReport ? (
                  <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Submitting...</>
                ) : (
                  <>Submit Report</>
                )}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full bg-slate-900 overflow-hidden">
        {/* Shared Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 shrink-0">
          <button 
            onClick={() => setActiveTab('related')}
            className={`flex-1 py-3 text-[9px] font-bold uppercase tracking-widest border-b-2 transition-all ${activeTab === 'related' ? "border-purple-500 text-white bg-white/5" : "border-transparent text-slate-500 hover:text-slate-300"}`}
          >
            Related
          </button>
          <button 
            onClick={() => setActiveTab('write')}
            className={`flex-1 py-3 text-[9px] font-bold uppercase tracking-widest border-b-2 transition-all ${activeTab === 'write' ? "border-purple-500 text-white bg-white/5" : "border-transparent text-slate-500 hover:text-slate-300"}`}
          >
            {isCommentsMuted ? "Comments (Muted)" : "Comments"}
          </button>
          <button 
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-3 text-[9px] font-bold uppercase tracking-widest border-b-2 transition-all ${activeTab === 'list' ? "border-purple-500 text-white bg-white/5" : "border-transparent text-slate-500 hover:text-slate-300"}`}
          >
            Signals ({comments.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar relative min-h-0">
          <AnimatePresence mode="wait">
            {activeTab === 'write' && (
              <motion.div 
                key="write"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="absolute inset-0 flex flex-col"
              >
                <div className="p-5 flex-1 bg-slate-950/10 overflow-y-auto custom-scrollbar">
                  {isCommentsMuted ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 border border-dashed border-rose-900/50 rounded-2xl bg-rose-950/20 space-y-3">
                      <div className="p-3.5 bg-rose-950/50 rounded-2xl border border-rose-850 text-rose-400">
                        <MessageSquareOff className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-100 font-space">Comments Disabled</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-[280px] leading-relaxed">
                          Pemilik konten telah menonaktifkan fitur komentar untuk postingan ini. Diskusi tidak dapat dilakukan.
                        </p>
                      </div>
                      <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                        <span className="text-[9px] font-mono font-bold px-2.5 py-1 rounded bg-rose-950/60 text-rose-400 border border-rose-900/60 uppercase tracking-widest">
                          Engagement: MUTED
                        </span>
                        {comments.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setActiveTab('list')}
                            className="text-[10px] font-bold text-purple-400 hover:text-purple-300 underline font-mono cursor-pointer"
                          >
                            Lihat {comments.length} komentar lama
                          </button>
                        )}
                      </div>
                    </div>
                  ) : token ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-2">
                        <img 
                          src={user?.profile?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username}`} 
                          className="w-8 h-8 rounded-lg border border-slate-700 object-cover bg-slate-800 shadow-sm" 
                          alt="Me" 
                        />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-white">@{user?.username}</span>
                          <span className="text-[8px] text-slate-500 uppercase tracking-widest">Authorized Identity</span>
                        </div>
                      </div>
                      <textarea 
                        placeholder="Write your comment..." 
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:border-purple-500/50 outline-none transition-all resize-none min-h-[120px] custom-scrollbar font-sans leading-relaxed"
                      />
                      <div className="flex justify-end">
                        <button 
                          onClick={submitComment}
                          disabled={!commentText.trim()}
                          className="px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-purple-900/20 active:scale-95 cursor-pointer"
                        >
                          Post Transmission
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
                      <Globe className="w-8 h-8 text-slate-700 mb-3" />
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Neural Link Required</p>
                      <p className="text-[9px] text-slate-600 mt-1">Connect your identity to interact with this transmission.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'list' && (
              <motion.div 
                key="list"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="absolute inset-0 flex flex-col"
              >
                <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-slate-900/20">
                  {isCommentsMuted && (
                    <div className="p-3 bg-rose-950/30 border border-rose-900/50 rounded-xl flex items-center gap-2.5 text-rose-300 text-xs font-mono">
                      <MessageSquareOff className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>Komentar dinonaktifkan oleh pemilik konten. Arsip riwayat komentar sebelumnya tetap tersimpan.</span>
                    </div>
                  )}
                  {comments.length === 0 ? (
                    <div className="text-center py-20 px-6">
                      <div className="p-4 bg-slate-800/30 rounded-full w-fit mx-auto mb-4 border border-slate-800">
                        <MessageSquare className="w-8 h-8 text-slate-700" />
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-space">No Signals Yet</p>
                    </div>
                  ) : (
                    [...comments].reverse().map((cm) => {
                      const commentUser = db.users.getById(cm.userId);
                      const displayUsername = commentUser?.username || cm.username;
                      const displayAvatar = commentUser?.profile?.avatarUrl || cm.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${displayUsername}`;

                      return (
                        <motion.div 
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={cm.id} 
                          className="flex flex-col bg-slate-800/20 p-5 rounded-2xl border border-slate-800/50 hover:border-slate-700 transition-colors shadow-sm"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <img 
                                src={displayAvatar} 
                                className="w-10 h-10 rounded-xl border border-slate-800 object-cover shrink-0 bg-slate-800 cursor-pointer hover:border-purple-500 transition-all shadow-md"
                                alt={displayUsername}
                                onClick={() => {
                                  setFocusedContent(null);
                                  viewProfile(cm.userId);
                                }}
                              />
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span 
                                    className="text-xs font-bold text-slate-100 hover:text-purple-400 transition-colors cursor-pointer truncate font-space"
                                    onClick={() => {
                                      setFocusedContent(null);
                                      viewProfile(cm.userId);
                                    }}
                                  >
                                    @{displayUsername}
                                  </span>
                                  <RoleBadge role={commentUser?.profile?.activeBadge || commentUser?.role || "USER"} size="xs" />
                                </div>
                                <span className="text-[9px] font-mono text-slate-600 uppercase tracking-[0.2em] mt-0.5">
                                  Neural Signal
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500 shrink-0 bg-slate-950/40 px-2.5 py-1 rounded-full border border-slate-800">
                              {new Date(cm.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-[13px] leading-relaxed text-slate-300 break-words font-sans selection:bg-purple-500/30">
                            {cm.content}
                          </p>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'related' && (
              <motion.div 
                key="related"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="absolute inset-0 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-slate-950/10"
              >
                <div className="grid grid-cols-1 gap-4">
                  {relatedItems.length === 0 ? (
                    <div className="text-center py-20 px-6">
                      <Clock className="w-8 h-8 text-slate-700 mx-auto mb-4" />
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">No Related Items</p>
                    </div>
                  ) : (
                    relatedItems.slice(0, 12).map((ri) => (
                      <div 
                        key={ri.id}
                        onClick={() => setFocusedContent({ type, item: ri })}
                        className="group flex gap-4 p-3 rounded-2xl hover:bg-slate-800/40 transition-all cursor-pointer border border-transparent hover:border-slate-700/50"
                      >
                        <div className="w-28 h-18 rounded-xl overflow-hidden shrink-0 border border-slate-800 bg-slate-950">
                          <img 
                            src={ri.thumbnailUrl || ri.url} 
                            className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                            alt={ri.title} 
                          />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h5 className="text-xs font-bold text-slate-200 truncate group-hover:text-purple-400">{ri.title}</h5>
                          <p className="text-[10px] text-slate-500 truncate font-mono">@{ri.authorName}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  const renderMediaOverlays = (showCloseButton = false) => {
    return (
      <>
        {/* Close Button if requested */}
        {showCloseButton && (
          <button 
            onClick={() => setFocusedContent(null)}
            className="absolute top-4 right-4 z-40 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md border border-white/10 transition-colors shadow-lg cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Fullscreen Toggle */}
        <button 
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="absolute top-4 left-4 z-40 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md border border-white/10 transition-colors shadow-lg cursor-pointer"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>

        {/* Previous / Next Side Controls */}
        <div className="absolute inset-y-0 left-0 flex items-center px-4 z-30 pointer-events-none">
          <button 
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            className="p-3 bg-black/30 hover:bg-black/60 text-white rounded-full backdrop-blur-md border border-white/10 transition-all opacity-0 group-hover:opacity-100 hover:scale-110 pointer-events-auto cursor-pointer shadow-2xl"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center px-4 z-30 pointer-events-none">
          <button 
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="p-3 bg-black/30 hover:bg-black/60 text-white rounded-full backdrop-blur-md border border-white/10 transition-all opacity-0 group-hover:opacity-100 hover:scale-110 pointer-events-auto cursor-pointer shadow-2xl"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </>
    );
  };

  const renderDesktopRightPanel = (heightStyle?: React.CSSProperties) => {
    return (
      <div 
        style={heightStyle || { height: "85vh" }} 
        className="w-[440px] border-l border-slate-800 flex flex-col bg-slate-900 overflow-hidden shrink-0"
      >
        {/* Header Title & Creator Bar */}
        <div className="p-5 border-b border-slate-800/60 shrink-0 bg-slate-950/40">
          <div className="flex items-center gap-3 mb-3 pr-8 min-w-0">
            <img 
              src={db.users.getById(item.userId)?.profile?.avatarUrl || item.authorAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.authorName}`} 
              alt={item.authorName} 
              className="w-9 h-9 rounded-full border border-slate-700 object-cover shadow-lg hover:border-purple-500 transition-colors cursor-pointer shrink-0"
              onClick={() => { setFocusedContent(null); viewProfile(item.userId); }}
            />
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span 
                  className="font-bold text-slate-50 text-xs hover:text-purple-400 transition-colors cursor-pointer truncate max-w-[150px]"
                  title={`@${item.authorName}`}
                  onClick={() => { setFocusedContent(null); viewProfile(item.userId); }}
                >
                  @{item.authorName}
                </span>

                {user?.id !== item.userId && (
                  <button 
                    onClick={handleFollow}
                    className={`text-[9px] font-bold py-0.5 px-2.5 rounded-full transition-all border shrink-0 cursor-pointer active:scale-95 ${
                      isFollowing 
                        ? "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750"
                        : "bg-purple-600 text-white border-purple-500 hover:bg-purple-500 shadow-sm"
                    }`}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                )}
              </div>
              <span className="text-[9px] text-slate-500 font-mono mt-0.5">
                {new Date(item.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <h3 className="font-extrabold text-slate-100 text-base font-space leading-tight tracking-tight line-clamp-2">
            {item.title}
          </h3>
        </div>

        {/* 2. Tab Navigation */}
        <div className="px-4 pt-4 shrink-0 bg-slate-950/20">
          {renderTabNavigation(desktopTab, setDesktopTab)}
        </div>

        {/* 3. Tab Content & 4. Multi-Video Embed Section */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {desktopTab === 'info' && (
                <motion.div key="info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  {item.description && (
                    <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60">
                      {item.description}
                    </p>
                  )}

                  {/* Video Technical Dossier (New) */}
                  {isDocVideo && (
                    <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-3 shadow-inner">
                      <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Signal Telemetry & Renditions</span>
                        <span className="flex items-center gap-1 text-[8px] font-black text-cyan-400 uppercase bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-900">
                           <Zap className="w-2.5 h-2.5 fill-current" /> H.264 High Profile
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                        <div>
                           <span className="text-[8px] text-slate-600 font-mono block uppercase">Native Resolution</span>
                           <span className="text-[11px] font-bold text-slate-200">{item.resolution || "1920x1080"}</span>
                        </div>
                        <div>
                           <span className="text-[8px] text-slate-600 font-mono block uppercase">Active Decoded Res</span>
                           <span className="text-[11px] font-bold text-emerald-400 font-mono">{liveVideoWidth} × {liveVideoHeight} ({selectedQuality})</span>
                        </div>
                        <div>
                           <span className="text-[8px] text-slate-600 font-mono block uppercase">Aspect Ratio</span>
                           <span className="text-[11px] font-bold text-slate-200">{item.aspectRatio || "16:9"}</span>
                        </div>
                        <div>
                           <span className="text-[8px] text-slate-600 font-mono block uppercase">Current Bitrate</span>
                           <span className="text-[11px] font-bold text-cyan-300 font-mono">
                             {activeRendition?.bitrate 
                               ? `${(activeRendition.bitrate / 1000).toLocaleString()} kbps` 
                               : selectedQuality === "1080p" ? "4,488 kbps"
                               : selectedQuality === "720p" ? "2,176 kbps"
                               : selectedQuality === "480p" ? "978 kbps"
                               : selectedQuality === "360p" ? "578 kbps"
                               : selectedQuality === "240p" ? "331 kbps"
                               : selectedQuality === "144p" ? "168 kbps"
                               : "Adaptif"}
                           </span>
                        </div>
                        <div>
                           <span className="text-[8px] text-slate-600 font-mono block uppercase">Buffer Health</span>
                           <span className="text-[11px] font-bold text-slate-300 font-mono">{bufferHealthSecs.toFixed(2)}s</span>
                        </div>
                        <div>
                           <span className="text-[8px] text-slate-600 font-mono block uppercase">Active Rendition File</span>
                           <span className="text-[10px] font-mono text-purple-300 truncate block" title={currentVideoUrl || item.url}>
                             {(currentVideoUrl || item.url || "").split("/").pop() || "source.mp4"}
                           </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stats Bar */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { icon: Eye, label: item.views || 0, color: "text-purple-400" },
                      { icon: Heart, label: likesCount, color: hasLiked ? "text-rose-500" : "text-slate-500", active: hasLiked, onClick: handleLike },
                      { icon: MessageSquare, label: comments.length, color: "text-slate-500" },
                      { icon: Share2, label: sharesCount, color: "text-slate-500", onClick: handleShare }
                    ].map((stat, i) => (
                      <div 
                        key={i} 
                        onClick={stat.onClick}
                        className={`flex flex-col items-center p-2 rounded-xl bg-slate-950/40 border border-slate-800 transition-colors ${stat.onClick ? "cursor-pointer hover:bg-slate-800/60" : ""}`}
                      >
                        <stat.icon className={`w-3.5 h-3.5 mb-1 ${stat.color} ${stat.active ? "fill-current" : ""}`} />
                        <span className="text-[10px] font-bold text-slate-200 font-mono">{stat.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {(isOwner || isAdmin) && (
                      <button 
                        onClick={() => {
                          setFocusedContent(null);
                          if (editUserContent) editUserContent({ ...item, type });
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-purple-500/60 bg-purple-600/30 text-purple-200 text-[10px] font-bold uppercase tracking-wider hover:bg-purple-600/50 transition-all cursor-pointer shadow-lg shadow-purple-950/20 active:scale-95"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-purple-300" />
                        Edit {isDocVideo ? "Video" : isDocPhoto ? "Photo" : "Blog"}
                      </button>
                    )}
                    <button 
                      onClick={handleFavorite}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        hasFavorited ? "bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-lg shadow-amber-900/10" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${hasFavorited ? "fill-current" : ""}`} />
                      Fav
                    </button>
                    <button 
                      onClick={handleBookmark}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        hasBookmarked ? "bg-sky-500/20 border-sky-500/50 text-sky-400 shadow-lg shadow-sky-900/10" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
                      }`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${hasBookmarked ? "fill-current" : ""}`} />
                      Save
                    </button>
                    {!isDocBlog && (
                      <button 
                        onClick={handleDownload}
                        className="p-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-750 transition-all cursor-pointer"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={handleMore}
                      className={`p-2 rounded-xl border transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
                        isReporting 
                          ? "bg-rose-500/20 border-rose-500 text-rose-400 shadow-lg shadow-rose-950/30" 
                          : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-rose-400 hover:border-slate-600"
                      }`}
                      title="Laporkan Konten (Report)"
                      aria-label="Laporkan Konten"
                    >
                      <Flag className={`w-4 h-4 text-rose-400 transition-transform ${isReporting ? "fill-current scale-110" : ""}`} />
                    </button>
                  </div>

                  {/* Grouped Tags System */}
                  {renderContentLightboxGroupedTags(item.tags || [])}
                </motion.div>
              )}

              {desktopTab === 'comments' && (
                <motion.div key="comments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  {/* Input or Muted */}
                  {isCommentsMuted ? (
                    <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-2xl text-rose-300 text-xs font-mono">
                      <MessageSquareOff className="w-4 h-4 inline mr-2 text-rose-400" />
                      Komentar dinonaktifkan untuk konten ini.
                    </div>
                  ) : (
                    <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                      {token ? (
                        <div className="space-y-2">
                          <textarea 
                            placeholder="Tambah komentar..." 
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-purple-500 outline-none resize-none min-h-[70px] font-sans"
                          />
                          <div className="flex justify-end">
                            <button 
                              onClick={() => submitComment()}
                              disabled={!commentText.trim()}
                              className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest disabled:opacity-50 cursor-pointer"
                            >
                              Kirim
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-500 text-center py-2 font-mono">Silakan login untuk berkomentar</p>
                      )}
                    </div>
                  )}

                  {/* Comments List */}
                  <div className="space-y-2.5">
                    {comments.length === 0 ? (
                      <div className="text-center py-10 bg-slate-950/20 rounded-2xl border border-dashed border-slate-800">
                        <MessageSquare className="w-6 h-6 text-slate-700 mx-auto mb-2" />
                        <p className="text-[10px] text-slate-500 font-mono uppercase">Belum ada komentar</p>
                      </div>
                    ) : (
                      [...comments].reverse().map((cm) => (
                        <div key={cm.id} className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
                          <div className="flex items-[#10141d] gap-2 mb-1.5">
                            <img src={cm.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${cm.username}`} className="w-6 h-6 rounded-full border border-slate-700" alt="" />
                            <span className="text-xs font-bold text-slate-200">@{cm.username}</span>
                            <span className="text-[8px] text-slate-500 font-mono ml-auto">{new Date(cm.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-slate-300 font-sans leading-relaxed">{cm.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {desktopTab === 'creator' && (
                <motion.div key="creator" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800 text-center flex flex-col items-center">
                    <img 
                      src={db.users.getById(item.userId)?.profile?.avatarUrl || item.authorAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.authorName}`} 
                      className="w-16 h-16 rounded-2xl border-2 border-purple-500 p-0.5 object-cover mb-3" 
                      alt="" 
                    />
                    <h4 className="text-sm font-black text-white font-space">@{db.users.getById(item.userId)?.username || item.authorName}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 mb-4 font-sans leading-relaxed">
                      {db.users.getById(item.userId)?.profile?.bio || "Digital artist & creator in NightVerse platform."}
                    </p>
                    <div className="grid grid-cols-2 gap-2 w-full mb-4">
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <span className="block text-sm font-black text-white font-mono">{db.follows.getFollowers(item.userId).length}</span>
                        <span className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">Followers</span>
                      </div>
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <span className="block text-sm font-black text-white font-mono">
                          {[...db.photos.getAll().filter(p => p.userId === item.userId), ...db.videos.getAll().filter(v => v.userId === item.userId)].length}
                        </span>
                        <span className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">Collections</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setFocusedContent(null); viewProfile(item.userId); }}
                      className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                    >
                      View Full Profile
                    </button>
                  </div>
                </motion.div>
              )}

              {desktopTab === 'related' && (
                <motion.div key="related" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                  {relatedItems.length === 0 ? (
                    <div className="text-center py-10 bg-slate-950/20 rounded-2xl border border-dashed border-slate-800">
                      <Clock className="w-6 h-6 text-slate-700 mx-auto mb-2" />
                      <p className="text-[10px] text-slate-500 font-mono uppercase">Tidak ada konten terkait</p>
                    </div>
                  ) : (
                    relatedItems.slice(0, 8).map((ri) => (
                      <div 
                        key={ri.id} 
                        onClick={() => setFocusedContent({ type, item: ri })}
                        className="flex gap-3 p-2 bg-slate-950/40 hover:bg-slate-800/60 rounded-xl border border-slate-800/60 transition-all cursor-pointer"
                      >
                        <img src={ri.thumbnailUrl || ri.url} className="w-20 h-14 rounded-lg object-cover shrink-0 border border-slate-800" alt="" />
                        <div className="min-w-0 flex-1 flex flex-col justify-center">
                          <h5 className="text-xs font-bold text-slate-100 truncate">{ri.title}</h5>
                          <p className="text-[9px] text-slate-400 font-mono">@{ri.authorName}</p>
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 4. Multi-Video Embed Section (placed BELOW tab content) */}
          {renderMultiVideoEmbedSection()}
        </div>
      </div>
    );
  };

  // Render full-bleed Mobile View
  if (isMobile) {
    if (isDocBlog) {
      return (
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950 overflow-hidden"
          >
            {/* Scrollable Blog Content */}
            <div className="w-full h-full overflow-y-auto p-4 pb-48 custom-scrollbar">
              <button 
                onClick={() => setFocusedContent(null)}
                className="absolute top-4 right-4 z-40 p-2 bg-slate-900/60 text-white rounded-full backdrop-blur-md border border-slate-800 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
              
              {item.thumbnailUrl && (
                <img 
                  src={item.thumbnailUrl} 
                  className="w-full h-48 object-cover rounded-2xl mb-4 border border-slate-800 shadow-lg"
                  alt="cover"
                />
              )}
              <span className="text-purple-400 font-bold text-xs mb-2 block uppercase tracking-widest font-space">✦ Article</span>
              <h1 className="text-xl font-extrabold text-slate-50 mb-4 font-space leading-tight">{item.title}</h1>
              
              {/* Creator Info */}
              <div className="flex items-center gap-3 mb-6 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                <img 
                  src={db.users.getById(item.userId)?.profile?.avatarUrl || item.authorAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.authorName}`} 
                  className="w-9 h-9 rounded-full border border-slate-700 object-cover shrink-0 cursor-pointer" 
                  alt={item.authorName} 
                  onClick={() => { setFocusedContent(null); viewProfile(item.userId); }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span 
                      className="text-xs font-bold text-slate-200 hover:text-purple-400 transition-colors cursor-pointer truncate max-w-[140px]"
                      onClick={() => { setFocusedContent(null); viewProfile(item.userId); }}
                    >
                      @{item.authorName}
                    </span>
                    {user?.id !== item.userId && (
                      <button 
                        onClick={handleFollow}
                        className={`text-[9px] font-bold py-0.5 px-2.5 rounded-full transition-all border shrink-0 cursor-pointer active:scale-95 ${
                          isFollowing 
                            ? "bg-slate-800 text-slate-400 border-slate-700" 
                            : "bg-purple-600 text-white border-purple-500 hover:bg-purple-500"
                        }`}
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </button>
                    )}
                  </div>
                  <span className="block text-[10px] text-slate-500 font-mono mt-0.5">{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div 
                className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed font-sans"
                dangerouslySetInnerHTML={{ __html: item.content }}
              />
            </div>

            {/* Mobile Glassmorphism Compact Toolbar (Placed at the bottom, easily reachable with thumb) */}
            <div className="absolute bottom-6 left-4 right-4 z-30 p-3.5 bg-slate-950/75 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-2xl flex flex-col gap-2.5 md:hidden">
              {/* Creator, Title, and Views Line */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img 
                    src={db.users.getById(item.userId)?.profile?.avatarUrl || item.authorAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.authorName}`} 
                    className="w-7 h-7 rounded-full border border-slate-700/60 object-cover" 
                    alt="" 
                  />
                  <div className="flex flex-col min-w-0 max-w-[160px]">
                    <span className="text-[11px] font-bold text-slate-100 truncate">@{item.authorName}</span>
                    <span className="text-[9px] text-slate-400 font-medium truncate">{item.title}</span>
                  </div>
                </div>
                
                {/* Views Information */}
                <div className="flex items-center gap-1 bg-slate-900/60 border border-slate-800/40 px-2 py-1 rounded-lg shrink-0">
                  <Eye className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-[10px] font-mono font-bold text-slate-300">{item.views || 4} Views</span>
                </div>
              </div>

              {/* Compact Toolbar - placed exactly below the Views Info */}
              <div className="w-full border-t border-slate-800/40 pt-2">
                <div className="flex items-center gap-3 overflow-x-auto scrollbar-none pb-0.5 custom-scrollbar">
                  {/* ✏️ Edit (Owner / Admin) */}
                  {(isOwner || isAdmin) && (
                    <button 
                      onClick={() => {
                        setFocusedContent(null);
                        if (editUserContent) editUserContent({ ...item, type });
                      }}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-purple-600/30 border border-purple-500/60 text-purple-200 hover:bg-purple-600/50 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0 font-bold"
                    >
                      <Edit3 className="w-4 h-4 text-purple-300" />
                      <span className="text-[10px] font-bold">Edit {isDocVideo ? "Video" : isDocPhoto ? "Photo" : "Blog"}</span>
                    </button>
                  )}

                  {/* ❤️ Like */}
                  <button 
                    onClick={handleLike}
                    className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all active:scale-95 cursor-pointer shrink-0 ${
                      hasLiked 
                        ? "bg-rose-500/20 border-rose-500/50 text-rose-400" 
                        : "bg-slate-900/60 border-slate-800/60 text-slate-300 hover:bg-slate-800/60"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${hasLiked ? "fill-current" : ""}`} />
                    <span className="text-[10px] font-bold font-mono">{likesCount}</span>
                  </button>

                  {/* 💬 Comment */}
                  <button 
                    onClick={() => {
                      setIsCommentsOpen(true);
                      setIsReporting(false);
                      setActiveTab('list');
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900/60 border border-slate-800/60 text-slate-300 hover:bg-slate-800/60 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-[10px] font-bold font-mono">{comments.length}</span>
                  </button>

                  {/* ⭐ Favorite */}
                  <button 
                    onClick={handleFavorite}
                    className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all active:scale-95 cursor-pointer shrink-0 ${
                      hasFavorited 
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-400" 
                        : "bg-slate-900/60 border-slate-800/60 text-slate-300 hover:bg-slate-800/60"
                    }`}
                  >
                    <Star className={`w-4 h-4 ${hasFavorited ? "fill-current" : ""}`} />
                    <span className="text-[10px] font-bold font-mono">{favoritesCount}</span>
                  </button>

                  {/* 🔖 Bookmark */}
                  <button 
                    onClick={handleBookmark}
                    className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all active:scale-95 cursor-pointer shrink-0 ${
                      hasBookmarked 
                        ? "bg-sky-500/20 border-sky-500/50 text-sky-400" 
                        : "bg-slate-900/60 border-slate-800/60 text-slate-300 hover:bg-slate-800/60"
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${hasBookmarked ? "fill-current" : ""}`} />
                    <span className="text-[10px] font-bold font-mono">{bookmarksCount}</span>
                  </button>

                  {/* 📤 Share */}
                  <button 
                    onClick={handleShare}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900/60 border border-slate-800/60 text-slate-300 hover:bg-slate-800/60 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="text-[10px] font-bold font-mono">{sharesCount}</span>
                  </button>

                  {/* 🔗 Copy Link */}
                  <button 
                    onClick={handleCopyLink}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900/60 border border-slate-800/60 text-slate-300 hover:bg-slate-800/60 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    <Link className="w-4 h-4" />
                    <span className="text-[10px] font-bold">Copy</span>
                  </button>

                  {/* ⋮ More */}
                  <button 
                    onClick={handleMore}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900/60 border border-slate-800/60 text-slate-300 hover:bg-slate-800/60 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                    <span className="text-[10px] font-bold">More</span>
                  </button>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {isCommentsOpen && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsCommentsOpen(false)}
                    className="absolute inset-0 bg-black/60 z-40"
                  />
                  <motion.div 
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 220 }}
                    className="absolute bottom-0 left-0 right-0 h-[65vh] bg-slate-900 border-t border-slate-800 rounded-t-[24px] z-50 flex flex-col overflow-hidden"
                  >
                    {renderRightPanelContent()}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
            {renderMobileReportModal()}
          </motion.div>
        </AnimatePresence>
      );
    }

    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-y-auto custom-scrollbar"
        >
          {/* Top Section: Media Viewport */}
          <div className="relative w-full shrink-0 bg-black flex items-center justify-center overflow-hidden z-10 shadow-2xl">
            <div className="w-full" style={{ 
              height: ratioMode === 'portrait' ? '55vh' : 'auto', 
              aspectRatio: ratioMode !== 'portrait' ? aspectRatio : 'auto',
              maxHeight: isDocPhoto ? '65vh' : 'auto'
            }}>
              {renderMediaElement()}
            </div>
            
            {/* Overlay Close Button for Photo (Video has it built-in) */}
            {isDocPhoto && (
               <div className="absolute top-4 left-4 z-50">
                  <button onClick={() => setFocusedContent(null)} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10 shadow-xl active:scale-90 transition-transform">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
               </div>
            )}
          </div>

          {/* Bottom Section: Content & Tabs */}
          <div className="w-full bg-slate-950 px-4 pt-6 pb-20">
            <div className="max-w-xl mx-auto">
              {/* Tab Navigation */}
              {renderTabNavigation(mobileTab, setMobileTab)}

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {mobileTab === 'info' && (
                  <motion.div 
                    key="info"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {/* Information Card */}
                    <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 mb-4">
                      {/* Creator Row: [Avatar] @username [Follow] \n Date */}
                      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-800/40">
                        <img 
                          src={db.users.getById(item.userId)?.profile?.avatarUrl || item.authorAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.authorName}`} 
                          alt={item.authorName} 
                          className="w-9 h-9 rounded-full border border-slate-700 object-cover shrink-0 cursor-pointer"
                          onClick={() => { setFocusedContent(null); viewProfile(item.userId); }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span 
                              className="font-bold text-slate-100 text-xs hover:text-purple-400 transition-colors cursor-pointer truncate max-w-[140px]"
                              onClick={() => { setFocusedContent(null); viewProfile(item.userId); }}
                            >
                              @{item.authorName}
                            </span>
                            {user?.id !== item.userId && (
                              <button 
                                onClick={handleFollow}
                                className={`text-[9px] font-bold py-0.5 px-2.5 rounded-full transition-all border shrink-0 cursor-pointer active:scale-95 ${
                                  isFollowing 
                                    ? "bg-slate-800 text-slate-400 border-slate-700"
                                    : "bg-purple-600 text-white border-purple-500 hover:bg-purple-500"
                                }`}
                              >
                                {isFollowing ? "Following" : "Follow"}
                              </button>
                            )}
                          </div>
                          <span className="text-[9px] text-slate-500 font-mono block mt-0.5">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 mb-2.5">
                        <span className="text-purple-400 font-bold text-[8px] uppercase tracking-[0.2em] px-2 py-0.5 bg-purple-400/10 rounded-full border border-purple-500/20">{item.category || (isDocVideo ? "Video" : "Photo")}</span>
                        <span className="text-slate-500 text-[8px] font-mono tracking-tighter">ID: #{item.id?.slice(0, 8)}</span>
                      </div>
                      
                      <h1 className="text-lg font-black text-white mb-2.5 leading-tight tracking-tight font-space">{item.title}</h1>
                      
                      <div className="flex items-center gap-4 mb-3 py-2.5 border-y border-slate-800/40">
                         <div className="flex flex-col">
                            <span className="text-slate-500 text-[7px] uppercase font-bold tracking-[0.1em] mb-0.5">Tayangan</span>
                            <span className="text-white font-mono font-bold text-[10px]">{item.views || 0}</span>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-slate-500 text-[7px] uppercase font-bold tracking-[0.1em] mb-0.5">Disukai</span>
                            <span className="text-white font-mono font-bold text-[10px]">{likesCount}</span>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-slate-500 text-[7px] uppercase font-bold tracking-[0.1em] mb-0.5">Favorit</span>
                            <span className="text-white font-mono font-bold text-[10px]">{favoritesCount}</span>
                         </div>
                      </div>

                      {item.description && (
                        <p className="text-[11px] text-slate-400 leading-relaxed font-sans mb-3">
                          {item.description}
                        </p>
                      )}

                      {/* Visibility & Engagement Badges Mobile */}
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                          isPrivate ? "text-amber-400 bg-amber-950/30 border-amber-800/40" : "text-cyan-400 bg-cyan-950/30 border-cyan-800/40"
                        }`}>
                          {isPrivate ? <Lock className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
                          {isPrivate ? "Private" : "Public"}
                        </span>
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                          isCommentsMuted ? "text-rose-400 bg-rose-950/30 border-rose-800/40" : "text-purple-400 bg-purple-950/30 border-purple-800/40"
                        }`}>
                          {isCommentsMuted ? <MessageSquareOff className="w-2.5 h-2.5" /> : <MessageSquare className="w-2.5 h-2.5" />}
                          {isCommentsMuted ? "Comments Disabled" : "Comments Enabled"}
                        </span>
                      </div>

                      {/* Grouped Tags System */}
                      {renderContentLightboxGroupedTags(item.tags || [])}
                    </div>

                    {/* Action Buttons Card */}
                    {renderMobileActionButtons()}
                  </motion.div>
                )}

                {mobileTab === 'comments' && (
                  <motion.div 
                    key="comments"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {/* Comment Input or Disabled Notice */}
                    {isCommentsMuted ? (
                      <div className="bg-rose-950/20 border border-rose-900/40 rounded-3xl p-5 mb-4 shadow-xl flex items-center gap-3.5">
                        <div className="p-3 bg-rose-950/50 border border-rose-850 rounded-2xl text-rose-400 shrink-0">
                          <MessageSquareOff className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-xs font-bold text-slate-100 font-space">Comments Disabled</h4>
                            <span className="text-[8px] font-mono font-bold text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-900/60 uppercase">Muted</span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                            Pemilik konten telah menonaktifkan fitur komentar. Arsip diskusi sebelumnya tetap dapat dilihat di bawah.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-4 mb-4 shadow-xl">
                        {token ? (
                          <div className="flex gap-3">
                             <img 
                                src={user?.profile?.avatarUrl || user?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username}`} 
                                className="w-9 h-9 rounded-xl border border-slate-800 object-cover shrink-0" 
                                alt="Me" 
                             />
                             <div className="flex-1 flex flex-col gap-3">
                                <textarea 
                                  placeholder="Tambah komentar publik..." 
                                  value={commentText}
                                  onChange={(e) => setCommentText(e.target.value)}
                                  className="w-full bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 text-xs text-white focus:border-purple-500 outline-none transition-all resize-none min-h-[80px] font-sans"
                                />
                                <div className="flex justify-end">
                                  <button 
                                    onClick={() => submitComment()}
                                    disabled={!commentText.trim()}
                                    className="px-6 py-2 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] disabled:opacity-50 shadow-lg shadow-purple-900/30 active:scale-95 transition-transform"
                                  >
                                    Kirim
                                  </button>
                                </div>
                             </div>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                             <Globe className="w-6 h-6 text-slate-700 mx-auto mb-2" />
                             <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Login untuk berinteraksi</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Comments List */}
                    <div className="space-y-3 pb-12">
                      {comments.length === 0 ? (
                        <div className="text-center py-16 bg-slate-900/20 border border-dashed border-slate-800/60 rounded-[32px]">
                          <MessageSquare className="w-10 h-10 text-slate-800 mx-auto mb-4" />
                          <p className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">Belum ada diskusi</p>
                        </div>
                      ) : (
                        [...comments].reverse().map((cm) => {
                          const commentUser = db.users.getById(cm.userId);
                          const displayUsername = commentUser?.username || cm.username;
                          const displayAvatar = commentUser?.profile?.avatarUrl || cm.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${displayUsername}`;

                          return (
                            <div key={cm.id} className="bg-slate-900/40 border border-slate-800/60 rounded-[24px] p-4 shadow-sm">
                              <div className="flex items-center gap-3 mb-3">
                                <img 
                                  src={displayAvatar} 
                                  className="w-8 h-8 rounded-xl border border-slate-800 object-cover" 
                                  alt="" 
                                  onClick={() => { setFocusedContent(null); viewProfile(cm.userId); }}
                                />
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-bold text-slate-100 hover:text-purple-400 transition-colors" onClick={() => { setFocusedContent(null); viewProfile(cm.userId); }}>@{displayUsername}</span>
                                    <RoleBadge role={commentUser?.profile?.activeBadge || commentUser?.role || "USER"} size="xs" />
                                  </div>
                                  <span className="text-[9px] text-slate-600 font-mono">{new Date(cm.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed pl-1 font-sans">{cm.content}</p>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                )}

                {mobileTab === 'creator' && (
                  <motion.div 
                    key="creator"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="bg-slate-900/60 border border-slate-800/80 rounded-[40px] p-6 text-center flex flex-col items-center shadow-2xl">
                       <div className="relative mb-6">
                          <img 
                            src={db.users.getById(item.userId)?.profile?.avatarUrl || item.authorAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.authorName}`} 
                            className="w-24 h-24 rounded-[36px] border-2 border-purple-500 p-1 object-cover shadow-2xl" 
                            alt={item.authorName} 
                          />
                          <div className="absolute -bottom-1 -right-1 bg-purple-600 text-white p-2 rounded-xl border-4 border-slate-900 shadow-xl">
                             <Check className="w-3 h-3" />
                          </div>
                       </div>
                       <h2 className="text-xl font-black text-white mb-1 font-space tracking-tight flex items-center gap-2">
                          @{db.users.getById(item.userId)?.username || item.authorName}
                          <RoleBadge role={db.users.getById(item.userId)?.profile?.activeBadge || db.users.getById(item.userId)?.role || "USER"} size="sm" />
                       </h2>
                       <p className="text-[11px] text-slate-400 mb-6 font-sans leading-relaxed max-w-[240px]">
                          {db.users.getById(item.userId)?.profile?.bio || "Digital artist & content architect creating high-fidelity visual narratives for the NightVerse community."}
                       </p>
                       
                       <div className="grid grid-cols-2 gap-3 w-full mb-8">
                          <div className="bg-slate-950/60 p-4 rounded-[24px] border border-slate-800/60">
                             <span className="block text-xl font-black text-white mb-0.5 font-mono">
                               {db.follows.getFollowers(item.userId).length.toLocaleString()}
                             </span>
                             <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Pengikut</span>
                          </div>
                          <div className="bg-slate-950/60 p-4 rounded-[24px] border border-slate-800/60">
                             <span className="block text-xl font-black text-white mb-0.5 font-mono">
                               {[
                                 ...db.photos.getAll().filter(p => p.userId === item.userId),
                                 ...db.videos.getAll().filter(v => v.userId === item.userId),
                                 ...db.blogs.getAll().filter(b => b.userId === item.userId)
                               ].length}
                             </span>
                             <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Koleksi</span>
                          </div>
                       </div>

                       <div className="flex flex-col gap-2 w-full">
                          <button 
                            onClick={handleFollow}
                            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all active:scale-95 ${
                              isFollowing 
                                ? "bg-slate-800 text-slate-400 border border-slate-700" 
                                : "bg-purple-600 text-white shadow-xl shadow-purple-900/40"
                            }`}
                          >
                            {isFollowing ? "Mengikuti" : "Ikuti Kreator"}
                          </button>
                          <button 
                            onClick={() => { setFocusedContent(null); viewProfile(item.userId); }}
                            className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-white/10 active:scale-95 transition-all"
                          >
                            Lihat Profil
                          </button>
                       </div>
                    </div>
                  </motion.div>
                )}

                {mobileTab === 'related' && (
                  <motion.div 
                    key="related"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4 pb-20"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      {relatedItems.length === 0 ? (
                        <div className="col-span-2 text-center py-24 bg-slate-900/20 border border-dashed border-slate-800 rounded-[32px]">
                           <Clock className="w-10 h-10 text-slate-800 mx-auto mb-4" />
                           <p className="text-xs text-slate-600 font-mono uppercase tracking-widest">Tidak ada konten terkait</p>
                        </div>
                      ) : (
                        relatedItems.slice(0, 12).map((ri) => (
                          <div 
                            key={ri.id} 
                            onClick={() => setFocusedContent({ type, item: ri })}
                            className="group relative bg-slate-900 border border-slate-800 rounded-[32px] overflow-hidden active:scale-95 transition-all cursor-pointer shadow-xl h-[220px]"
                          >
                            <img src={ri.thumbnailUrl || ri.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80" alt="" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                            <div className="absolute bottom-5 left-5 right-5">
                              <h4 className="text-[12px] font-black text-white truncate mb-1 font-space tracking-tight">{ri.title}</h4>
                              <div className="flex items-center gap-2">
                                 <div className="w-4 h-4 rounded-full border border-white/20 bg-slate-800 overflow-hidden">
                                    <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${ri.authorName}`} className="w-full h-full object-cover" alt="" />
                                 </div>
                                 <span className="text-[9px] text-slate-400 font-bold tracking-wider">@{ri.authorName}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Multi-Video Embed Section (placed BELOW tab content) */}
              {renderMultiVideoEmbedSection()}
            </div>
          </div>
          {renderMobileReportModal()}
        </motion.div>
      </AnimatePresence>
    );
  }

  // Desktop Blog Layout
  if (isDocBlog && !isMobile) {
    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-6 overflow-hidden"
        >
          {/* Main Container */}
          <motion.div 
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="relative flex flex-row bg-slate-900 border border-slate-800/60 rounded-[32px] overflow-hidden shadow-2xl w-full max-w-6xl h-[85vh]"
          >
            {/* Desktop Close Button for Blog */}
            <button 
              onClick={() => setFocusedContent(null)}
              className="absolute top-6 right-6 z-50 p-3 text-slate-400 bg-slate-950/40 hover:bg-slate-950/80 hover:text-white rounded-full border border-white/5 transition-all cursor-pointer backdrop-blur-xl shadow-2xl group active:scale-95"
              title="Close (Esc)"
            >
              <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            </button>
            {/* Left side scrollable article */}
            <div className="flex-1 overflow-y-auto p-12 pb-24 custom-scrollbar bg-slate-950/30 selection:bg-purple-500/30">
              <div className="max-w-3xl mx-auto">
                {item.thumbnailUrl && (
                  <div className="relative group mb-10">
                    <img 
                      src={item.thumbnailUrl} 
                      className="w-full h-[400px] object-cover rounded-3xl border border-slate-800 shadow-2xl"
                      alt="cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
                  </div>
                )}
                
                <div className="flex items-center gap-2.5 mb-6 flex-wrap">
                  <span className="text-purple-400 font-bold text-[10px] uppercase tracking-[0.3em] font-space px-3 py-1 bg-purple-400/10 rounded-full border border-purple-500/20">✦ {item.category || "Article"}</span>
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                    isPrivate ? "text-amber-400 bg-amber-950/30 border-amber-800/40" : "text-cyan-400 bg-cyan-950/30 border-cyan-800/40"
                  }`}>
                    {isPrivate ? <Lock className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
                    {isPrivate ? "Private" : "Public"}
                  </span>
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                    isCommentsMuted ? "text-rose-400 bg-rose-950/30 border-rose-800/40" : "text-purple-400 bg-purple-950/30 border-purple-800/40"
                  }`}>
                    {isCommentsMuted ? <MessageSquareOff className="w-2.5 h-2.5" /> : <MessageSquare className="w-2.5 h-2.5" />}
                    {isCommentsMuted ? "Comments Disabled" : "Comments Enabled"}
                  </span>
                  <span className="text-slate-500 text-[10px] font-mono">• {new Date(item.createdAt).toLocaleDateString()}</span>
                  <span className="text-slate-500 text-[10px] font-mono">• {item.views || 0} Readers</span>
                </div>

                <h1 className="text-4xl md:text-5xl font-black text-slate-50 mb-8 font-space leading-tight tracking-tight">
                  {item.title}
                </h1>

                {/* Content */}
                <div 
                  className="prose prose-invert prose-slate prose-lg font-sans max-w-none text-slate-300 leading-relaxed mb-16"
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />

                {/* Article Footer Info */}
                <div className="pt-12 border-t border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="flex items-center gap-4">
                    <img 
                      src={db.users.getById(item.userId)?.profile?.avatarUrl || item.authorAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.authorName}`} 
                      className="w-14 h-14 rounded-2xl border border-slate-700 object-cover shadow-xl"
                      alt={item.authorName}
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono mb-1">Written By</p>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-bold text-white hover:text-purple-400 transition-colors cursor-pointer" onClick={() => { setFocusedContent(null); viewProfile(item.userId); }}>@{item.authorName}</p>
                        <RoleBadge role={db.users.getById(item.userId)?.profile?.activeBadge || db.users.getById(item.userId)?.role || "USER"} size="sm" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button onClick={handlePrev} className="p-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl border border-slate-700 transition-all flex items-center gap-2 group cursor-pointer">
                      <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                      <span className="text-xs font-bold uppercase tracking-wider">Prev</span>
                    </button>
                    <button onClick={handleNext} className="p-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl border border-slate-700 transition-all flex items-center gap-2 group cursor-pointer">
                      <span className="text-xs font-bold uppercase tracking-wider">Next</span>
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side details panel */}
            {renderDesktopRightPanel({ height: "85vh" })}
          </motion.div>

          {renderMobileReportModal()}
        </motion.div>
      </AnimatePresence>
    );
  }

  // Desktop Media Layout
  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-6 overflow-hidden ${isFullscreen ? "p-0" : "p-6"}`}
      >
        <motion.div 
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          className={`relative flex flex-row bg-slate-900 border border-slate-800/60 rounded-[32px] overflow-hidden shadow-2xl transition-all duration-500 ease-out ${isFullscreen ? "w-full h-full rounded-none border-none" : "w-full max-w-7xl h-[85vh]"}`}
        >
          {/* Left Column: Media */}
          <div className="flex-1 bg-slate-950 relative group flex items-center justify-center overflow-hidden">
            {renderMediaElement()}
            {renderMediaOverlays(false)}
          </div>

          {/* Right Column: Metadata & Related */}
          {!isFullscreen && renderDesktopRightPanel({ height: "85vh" })}

          {/* Close Button for Media */}
          <button 
            onClick={() => setFocusedContent(null)}
            className="absolute top-6 right-6 z-50 p-3 text-slate-400 bg-slate-950/40 hover:bg-slate-950/80 hover:text-white rounded-full border border-white/5 transition-all cursor-pointer backdrop-blur-xl shadow-2xl group active:scale-95"
            title="Close (Esc)"
          >
            <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </motion.div>

        {renderMobileReportModal()}
      </motion.div>
    </AnimatePresence>
  );
};

