import React, { useState, useEffect, useRef } from "react";
import { X, Heart, MessageSquare, CornerDownRight, Check, UserPlus, Eye, Clock, Monitor, AlertTriangle, RefreshCw, Globe, Plus, Star, Bookmark, Share2, Link, Download, MoreHorizontal, ChevronLeft, ChevronRight, Maximize2, Minimize2, Info, Users, Play, Pause, Volume2, VolumeX, Settings, SquareStack, SkipForward, SkipBack, Flag, Layers } from "lucide-react";
import { useAppState } from "../context/AppState.js";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../lib/db.js";
import { getAspectRatioClass } from "./ContentCreator.js";
import { RoleBadge, BadgeType } from "./RoleBadge.js";

export const ContentLightbox: React.FC = () => {
  const { focusedContent, setFocusedContent, token, user, triggerToast, createNotification, viewProfile, followActionCount, toggleFollow, triggerDBSync } = useAppState();
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

  // Mobile tab state
  type MobileTab = 'info' | 'comments' | 'creator' | 'related';
  const [mobileTab, setMobileTab] = useState<MobileTab>('info');

  // detect related items
  const [relatedItems, setRelatedItems] = useState<any[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Video control states
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Load related items
  useEffect(() => {
    if (!focusedContent) return;
    const { type, item } = focusedContent;
    let all: any[] = [];
    if (type === "blog") all = db.blogs.getAll().filter(b => b.status === "APPROVED");
    if (type === "photo") all = db.photos.getAll().filter(p => p.status === "APPROVED");
    if (type === "video") all = db.videos.getAll().filter(v => v.status === "APPROVED");
    
    // Sort or filter related (e.g. same category or just recent)
    setRelatedItems(all.filter(i => i.id !== item.id));
  }, [focusedContent]);

  const handleNext = () => {
    if (!focusedContent || relatedItems.length === 0) return;
    const { type, item } = focusedContent;
    let all: any[] = [];
    if (type === "blog") all = db.blogs.getAll().filter(b => b.status === "APPROVED");
    if (type === "photo") all = db.photos.getAll().filter(p => p.status === "APPROVED");
    if (type === "video") all = db.videos.getAll().filter(v => v.status === "APPROVED");
    
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
    let all: any[] = [];
    if (type === "blog") all = db.blogs.getAll().filter(b => b.status === "APPROVED");
    if (type === "photo") all = db.photos.getAll().filter(p => p.status === "APPROVED");
    if (type === "video") all = db.videos.getAll().filter(v => v.status === "APPROVED");
    
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
    
    // Reset report flows upon focus changes
    setIsReporting(false);
    setReportReason("");
    setReportNotes("");
    setShowAllTags(false);

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
    setIsReporting(true);
    setIsCommentsOpen(true);
    triggerToast(
      "Moderation Opened ⋮",
      "Use options to report or flag content guidelines breaches.",
      "info"
    );
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
        videoRef.current.play();
        setIsPlaying(true);
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
      setProgress((current / dur) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
    if (focusedContent?.type === "video") {
      handleVideoMetadata({ currentTarget: videoRef.current } as any);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const seekTime = (Number(e.target.value) / 100) * duration;
      videoRef.current.currentTime = seekTime;
      setProgress(Number(e.target.value));
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

  const changePlaybackSpeed = () => {
    const speeds = [0.5, 1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const nextSpeed = speeds[nextIndex];
    setPlaybackSpeed(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
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
    }, 3000);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleMediaTouch = () => {
    resetControlsTimer();
  };

  const renderMobileTabs = () => {
    const tabs = [
      { id: 'info', label: 'Info', icon: Info },
      { id: 'comments', label: 'Komentar', icon: MessageSquare },
      { id: 'creator', label: 'Kreator', icon: Users },
      { id: 'related', label: 'Terkait', icon: Layers },
    ];

    return (
      <div className="flex p-1 gap-1 bg-slate-900/60 rounded-xl border border-slate-800/80 mb-4 backdrop-blur-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMobileTab(tab.id as any)}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-lg transition-all active:scale-95 ${
              mobileTab === tab.id 
                ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30" 
                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
            }`}
          >
            <tab.icon className={`w-3 h-3 mb-0.5 ${mobileTab === tab.id ? "scale-110" : ""}`} />
            <span className="text-[8px] font-bold tracking-tight">{tab.label}</span>
          </button>
        ))}
      </div>
    );
  };

  const renderMobileActionButtons = () => {
    const actions = [
      { id: 'like', icon: Heart, label: likesCount, active: hasLiked, color: "text-rose-400", onClick: handleLike },
      { id: 'fav', icon: Star, label: favoritesCount, active: hasFavorited, color: "text-amber-400", onClick: handleFavorite },
      { id: 'share', icon: Share2, label: sharesCount, active: false, color: "text-indigo-400", onClick: handleShare },
      { id: 'download', icon: Download, label: 'Save', active: false, color: "text-emerald-400", onClick: handleDownload },
      { id: 'report', icon: Flag, label: 'Lapor', active: isReporting, color: "text-slate-400", onClick: handleMore },
      { id: 'bookmark', icon: Bookmark, label: bookmarksCount, active: hasBookmarked, color: "text-sky-400", onClick: handleBookmark },
    ];

    return (
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-2 grid grid-cols-3 gap-1.5 mb-4 backdrop-blur-sm">
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
      if (item.sourceType === "EMBED" || item.sourceType === "Real-time Embed") {
        return (
          <div className="relative w-full h-full bg-black">
            <iframe
              src={
                item.url?.includes("youtube.com/watch?v=") 
                  ? item.url.replace("watch?v=", "embed/") 
                  : item.url?.includes("youtu.be/")
                  ? item.url.replace("youtu.be/", "youtube.com/embed/")
                  : item.url?.includes("vimeo.com/")
                  ? item.url.replace("vimeo.com/", "player.vimeo.com/video/")
                  : (item.url || undefined)
              }
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Embed Player"
            ></iframe>
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
          <div className="relative w-full h-full bg-black flex items-center justify-center group" onClick={handleMediaTouch}>
            <video 
              ref={videoRef}
              src={item.url || undefined} 
              autoPlay 
              loop={!isMobile}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onClick={togglePlay}
              className="w-full h-full object-contain cursor-pointer"
              playsInline
            />

            {/* Custom Mobile Video Controls Overlay */}
            {isMobile && (
              <AnimatePresence>
                {showControls && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/40 flex flex-col justify-between p-4 z-40 pointer-events-none"
                  >
                    <div className="flex justify-between items-start pointer-events-auto">
                      <button onClick={() => setFocusedContent(null)} className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white border border-white/10">
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <div className="flex gap-2">
                        <button onClick={togglePiP} className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white border border-white/10">
                          <SquareStack className="w-5 h-5" />
                        </button>
                        <button onClick={changePlaybackSpeed} className="px-3 py-1 bg-black/20 backdrop-blur-md rounded-full text-white border border-white/10 text-[10px] font-bold">
                          {playbackSpeed}x
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-center pointer-events-auto">
                      <button 
                        onClick={(e) => { e.stopPropagation(); togglePlay(); }} 
                        className="w-16 h-16 bg-purple-600/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white shadow-2xl active:scale-90 transition-transform"
                      >
                        {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                      </button>
                    </div>

                    <div className="space-y-3 pointer-events-auto">
                      <div className="flex items-center justify-between text-[10px] text-white font-mono font-bold px-1">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                      <div className="relative group/progress">
                        <input 
                          type="range"
                          min="0"
                          max="100"
                          value={progress}
                          onChange={handleSeek}
                          className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-purple-500"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <button onClick={toggleMute} className="text-white">
                              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                            </button>
                            <input 
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={isMuted ? 0 : volume}
                              onChange={handleVolumeChange}
                              className="w-20 h-1 bg-white/20 rounded-full appearance-none accent-white"
                            />
                         </div>
                         <button onClick={() => setIsFullscreen(!isFullscreen)} className="text-white">
                            <Maximize2 className="w-5 h-5" />
                         </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
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
            Comments
          </button>
          <button 
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-3 text-[9px] font-bold uppercase tracking-widest border-b-2 transition-all ${activeTab === 'list' ? "border-purple-500 text-white bg-white/5" : "border-transparent text-slate-500 hover:text-slate-300"}`}
          >
            Signals ({comments.length})
          </button>
        </div>

        <div className="flex-1 overflow-hidden relative">
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
                  {token ? (
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

        {/* Action Sidebar Overlay (Floating right-aligned) - Only visible on desktop/tablet when not in landscape split view */}
        {!isMobile && ratioMode !== "landscape" && (
          <div className="absolute right-4 bottom-20 md:bottom-24 flex flex-col items-center gap-5 z-30">
            {/* Creator Profile / Follow link */}
            <div className="relative group">
              <img 
                src={db.users.getById(item.userId)?.profile?.avatarUrl || item.authorAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.authorName}`} 
                alt={item.authorName} 
                className="w-11 h-11 rounded-full border-2 border-purple-500 object-cover shadow-lg cursor-pointer transform hover:scale-105 transition-transform"
                onClick={() => {
                  setFocusedContent(null);
                  viewProfile(item.userId);
                }}
              />
              {user?.id !== item.userId && (
                <button 
                  onClick={handleFollow}
                  className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center border border-slate-900 shadow transition-all ${
                    isFollowing ? "bg-emerald-500 text-white" : "bg-purple-600 hover:bg-purple-500 text-white"
                  }`}
                >
                  {isFollowing ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                </button>
              )}
            </div>

            {/* Likes */}
            <div className="flex flex-col items-center">
              <button 
                onClick={handleLike}
                className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md border transition-all cursor-pointer shadow-lg ${
                  hasLiked 
                    ? "bg-rose-500/90 border-rose-400 text-white" 
                    : "bg-black/40 border-white/10 text-white hover:bg-black/60 hover:scale-105"
                }`}
              >
                <Heart className={`w-5 h-5 ${hasLiked ? "fill-current" : ""}`} />
              </button>
              <span className="text-[10px] font-bold font-mono text-white/90 drop-shadow mt-1">
                {likesCount}
              </span>
            </div>

            {/* Comments Trigger */}
            <div className="flex flex-col items-center">
              <button 
                onClick={() => {
                  setIsCommentsOpen(!isCommentsOpen);
                  setIsReporting(false);
                }}
                className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md border transition-all cursor-pointer shadow-lg ${
                  isCommentsOpen 
                    ? "bg-purple-600/95 border-purple-500 text-white" 
                    : "bg-black/40 border-white/10 text-white hover:bg-black/60 hover:scale-105"
                }`}
              >
                <MessageSquare className="w-5 h-5" />
              </button>
              <span className="text-[10px] font-bold font-mono text-white/90 drop-shadow mt-1">
                {comments.length}
              </span>
            </div>

            {/* Views Ticker */}
            <div className="flex flex-col items-center">
              <div className="w-11 h-11 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white backdrop-blur-md shadow-lg">
                <Eye className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-[10px] font-bold font-mono text-white/90 drop-shadow mt-1">
                {item.views || 4}
              </span>
            </div>

            {/* Report Ticker */}
            <button 
              onClick={() => {
                setIsReporting(true);
                setIsCommentsOpen(true);
                setActiveTab('list');
              }}
              className="w-11 h-11 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-slate-400 hover:text-rose-400 backdrop-blur-md shadow-lg transition-colors cursor-pointer"
              title="Report content"
            >
              <AlertTriangle className="w-4 h-4" />
            </button>
          </div>
        )}
      </>
    );
  };

  const renderDesktopRightPanel = (heightStyle?: React.CSSProperties) => {
    return (
      <div 
        style={heightStyle || { height: "80vh" }} 
        className="w-[420px] border-l border-slate-800 flex flex-col bg-slate-900 overflow-hidden shrink-0"
      >
        {/* Metadata & Actions */}
        <div className="p-6 border-b border-slate-800/60 shrink-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img 
                src={db.users.getById(item.userId)?.profile?.avatarUrl || item.authorAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.authorName}`} 
                alt={item.authorName} 
                className="w-10 h-10 rounded-full border border-slate-700 object-cover shadow-lg hover:border-purple-500 transition-colors cursor-pointer"
                onClick={() => { setFocusedContent(null); viewProfile(item.userId); }}
              />
              <div className="flex flex-col">
                <span 
                  className="font-bold text-slate-50 text-sm hover:text-purple-400 transition-colors cursor-pointer"
                  onClick={() => { setFocusedContent(null); viewProfile(item.userId); }}
                >
                  @{item.authorName}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {user?.id !== item.userId && (
              <button 
                onClick={handleFollow}
                className={`text-[10px] font-bold py-1.5 px-4 rounded-full transition-all border ${
                  isFollowing 
                    ? "bg-slate-800 text-slate-400 border-slate-700"
                    : "bg-purple-600 text-white border-purple-500 hover:bg-purple-500"
                }`}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
            )}
          </div>

          <h3 className="font-extrabold text-slate-100 text-lg font-space leading-tight tracking-tight mb-2">
            {item.title}
          </h3>
          {item.description && (
            <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-3 font-sans">
              {item.description}
            </p>
          )}
          
          <div className="flex flex-wrap gap-1.5 mb-6">
            {(item.tags || []).map((tag: string, idx: number) => (
              <span 
                key={`${tag}-${idx}`} 
                className="text-[9px] font-bold text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded border border-purple-500/20"
              >
                #{tag.toLowerCase()}
              </span>
            ))}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-2 mb-6">
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

          {/* Productivity Actions */}
          <div className="flex gap-2">
            <button 
              onClick={handleFavorite}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                hasFavorited ? "bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-lg shadow-amber-900/10" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${hasFavorited ? "fill-current" : ""}`} />
              Fav
            </button>
            <button 
              onClick={handleBookmark}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                hasBookmarked ? "bg-sky-500/20 border-sky-500/50 text-sky-400 shadow-lg shadow-sky-900/10" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${hasBookmarked ? "fill-current" : ""}`} />
              Save
            </button>
            {!isDocBlog && (
              <button 
                onClick={handleDownload}
                className="p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-750 transition-all cursor-pointer"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tabs / Content Section */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden relative">
            {renderRightPanelContent()}
          </div>
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
                  className="w-8 h-8 rounded-full border border-slate-700" 
                  alt="" 
                />
                <div className="flex-1">
                  <span className="text-xs font-bold text-slate-200">@{item.authorName}</span>
                  <span className="block text-[10px] text-slate-500 font-mono">{new Date(item.createdAt).toLocaleDateString()}</span>
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
              {renderMobileTabs()}

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
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <span className="text-purple-400 font-bold text-[8px] uppercase tracking-[0.2em] px-2 py-0.5 bg-purple-400/10 rounded-full border border-purple-500/20">{item.category || (isDocVideo ? "Video" : "Photo")}</span>
                        <span className="text-slate-500 text-[8px] font-mono tracking-tighter">Diunggah {new Date(item.createdAt).toLocaleDateString()}</span>
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

                      <div className="flex flex-wrap gap-1.5">
                        {(item.tags || []).map((tag: string, idx: number) => (
                          <span key={idx} className="text-[8px] font-bold text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded-md border border-slate-700/50">
                            #{tag.toLowerCase()}
                          </span>
                        ))}
                      </div>
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
                    {/* Comment Input */}
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
                
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-purple-400 font-bold text-[10px] uppercase tracking-[0.3em] font-space px-3 py-1 bg-purple-400/10 rounded-full border border-purple-500/20">✦ {item.category || "Article"}</span>
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
      </motion.div>
    </AnimatePresence>
  );
};

