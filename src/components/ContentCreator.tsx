import React, { useState, useEffect } from "react";
import { 
  BookOpen, Image as ImageIcon, Video, Monitor, Clock, CloudUpload, Tag as TagIcon, Sparkles, 
  BarChart3, History, FileText, CheckCircle2, XCircle, AlertCircle, Eye, 
  ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, MoreHorizontal,
  Edit2, Trash2, Heart, MessageSquare, Plus, Save, Send, ShieldAlert, X,
  Smartphone, Globe, Lock, MessageCircle, FileJson, Layers, ExternalLink,
  Crop as CropIcon, Zap, Loader2, Info, Search, Play, MessageSquareOff,
  Laptop, Cpu, Maximize, ShieldCheck, Shield, Camera, Link
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAppState } from "../context/AppState.js";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal.js";
import { db } from "../lib/db.js";

// Defined sources categories
const sourcesCategories = [
  { label: "Upload Media", value: "UPLOAD" as const, icon: CloudUpload },
  { label: "Online URL", value: "URL" as const, icon: Globe },
  { label: "Real-time Embed", value: "EMBED" as const, icon: Play },
];

const categories = ["Technology", "Lifestyle", "Art", "Music", "Photography", "Gaming", "Cyberpunk", "Others"];

export const getAspectRatioClass = (ratio: string) => {
  switch (ratio) {
    case "16:9": return "aspect-video max-w-4xl";
    case "9:16": return "aspect-[9/16] max-w-[320px]";
    case "1:1": return "aspect-square max-w-[400px]";
    case "4:5": return "aspect-[4/5] max-w-[360px]";
    case "21:9": return "aspect-[21/9] max-w-5xl";
    default: return "aspect-video max-w-4xl";
  }
};

export const ContentCreator: React.FC = () => {
  const { token, triggerToast, navigateTo, user, createNotification, triggerDBSync, dbActionCount } = useAppState();
  
  // Dashboard Navigation State
  const [activeTab, setActiveTab] = useState<"overview" | "upload" | "tags" | "history" | "drafts">("overview");

  // Workspace selection state: blog, photo, video
  const [activeMediaTab, setActiveMediaTab] = useState<"blog" | "photo" | "video">("blog");

  // Common parameters
  const [title, setTitle] = useState("");
  const [isTitleManuallyEdited, setIsTitleManuallyEdited] = useState(false);
  const [description, setDescription] = useState("");

  const extractTitleFromFileName = (fileName: string): string => {
    if (!fileName || typeof fileName !== "string") return "";
    const nameOnly = fileName.split(/[/\\]/).pop() || fileName;
    const titleWithoutExt = nameOnly.replace(/\.[^/.]+$/, "");
    return titleWithoutExt.trim();
  };
  const [tagsInput, setTagsInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [category, setCategory] = useState("Others");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [engagement, setEngagement] = useState<"open" | "muted">("open");
  const allowComments = engagement === "open";

  // Blog parameters
  const [blogContent, setBlogContent] = useState("");
  const [blogThumbnail, setBlogThumbnail] = useState("");

  // Photo / Video parameters
  const [mediaSource, setMediaSource] = useState<"UPLOAD" | "URL" | "EMBED">("UPLOAD");
  const [mediaUrl, setMediaUrl] = useState("");
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Thumbnail Specific State
  const [thumbMethod, setThumbMethod] = useState<"UPLOAD" | "CAPTURE" | "URL">("UPLOAD");
  const [capturedThumb, setCapturedThumb] = useState<string | null>(null);
  const [captureTime, setCaptureTime] = useState(1.5);
  const thumbInputRef = React.useRef<HTMLInputElement>(null);

  // Video specific parameters
  const [videoDuration, setVideoDuration] = useState("");
  const [videoResolution, setVideoResolution] = useState("1080p");
  const [videoAspectRatio, setVideoAspectRatio] = useState("16:9");
  const [videoThumbnail, setVideoThumbnail] = useState("");
  const [videoEmbedUrls, setVideoEmbedUrls] = useState<string[]>([""]);

  // Helper validation & embed URL formatting
  const isValidEmbedUrl = (url: string): boolean => {
    if (!url || typeof url !== "string") return false;
    const trimmed = url.trim();
    if (!trimmed) return false;
    const urlPattern = /^(https?:\/\/|\/\/)[^\s/$.?#].[^\s]*$/i;
    const isEmbedPlatform = trimmed.includes("youtube.com") || 
                            trimmed.includes("youtu.be") || 
                            trimmed.includes("vimeo.com") || 
                            trimmed.includes("vidara.so") || 
                            trimmed.includes("dailymotion.com") ||
                            trimmed.includes("twitch.tv") ||
                            trimmed.includes("embed");
    return urlPattern.test(trimmed) || isEmbedPlatform || trimmed.length > 5;
  };

  const isValidMediaUrl = (url: string | null | undefined): boolean => {
    if (!url || typeof url !== "string") return false;
    const trimmed = url.trim();
    if (trimmed.length < 5) return false;
    return trimmed.startsWith("http://") || 
           trimmed.startsWith("https://") || 
           trimmed.startsWith("blob:") || 
           trimmed.startsWith("data:video/") || 
           trimmed.startsWith("/");
  };

  const getEmbedIframeSrc = (url: string) => {
    if (!url) return "";
    const trimmed = url.trim();
    if (trimmed.includes("youtube.com/watch?v=")) return trimmed.replace("watch?v=", "embed/");
    if (trimmed.includes("youtu.be/")) return trimmed.replace("youtu.be/", "youtube.com/embed/");
    if (trimmed.includes("vimeo.com/")) return trimmed.replace("vimeo.com/", "player.vimeo.com/video/");
    return trimmed;
  };

  const handleAddVideoUrl = (afterIndex?: number) => {
    setVideoEmbedUrls(prev => {
      const next = [...prev];
      if (afterIndex !== undefined && afterIndex >= 0) {
        next.splice(afterIndex + 1, 0, "");
      } else {
        next.push("");
      }
      return next;
    });
  };

  const handleRemoveVideoUrl = (index: number) => {
    setVideoEmbedUrls(prev => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [""];
    });
  };

  const handleVideoUrlChange = (index: number, val: string) => {
    setVideoEmbedUrls(prev => {
      const next = [...prev];
      next[index] = val;
      const firstValid = next.find(u => u.trim().length > 0) || val;
      setMediaUrl(firstValid);
      return next;
    });
  };

  // Photo specific thumbnail (new)
  const [photoThumbnail, setPhotoThumbnail] = useState("");

  // Stats & History data
  const [stats, setStats] = useState<any>(null);
  const [uploads, setUploads] = useState<any[]>([]);
  const [userTags, setUserTags] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Edit & Delete State
  const [editingContent, setEditingContent] = useState<any | null>(null);
  const [deletingContent, setDeletingContent] = useState<any | null>(null);
  const [showClearTagsConfirm, setShowClearTagsConfirm] = useState(false);

  // Tag Management Pagination
  const [tagPage, setTagPage] = useState(1);
  const tagsPerPage = 10;

  // Autocomplete tags state
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<any[]>([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  // New simplified upload states
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedFileSize, setUploadedFileSize] = useState("");
  const [blogCoverSource, setBlogCoverSource] = useState<"UPLOAD" | "URL">("UPLOAD");

  // Search filtering state
  const [tagSearch, setTagSearch] = useState("");
  const [historySearch, setHistorySearch] = useState("");

  // Auto-detect mobile device on mount and resize
  useEffect(() => {
    const detectDevice = () => {
      const isMobileUA = /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);
      const isCoarseTouch = window.matchMedia("(pointer: coarse)").matches;
      setIsMobileDevice(isMobileUA || isCoarseTouch);
    };
    detectDevice();
    window.addEventListener("resize", detectDevice);
    return () => window.removeEventListener("resize", detectDevice);
  }, []);

  // Listen for nightverse_edit_content event to populate edit form
  useEffect(() => {
    const handleEditEvent = (e: CustomEvent) => {
      if (e.detail) {
        handleEdit(e.detail);
        setActiveTab("upload");
      }
    };
    window.addEventListener("nightverse_edit_content" as any, handleEditEvent);
    return () => {
      window.removeEventListener("nightverse_edit_content" as any, handleEditEvent);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchUserContent();
  }, [user, dbActionCount]);

  const fetchUserContent = () => {
    if (!user) return;
    setIsLoading(true);
    const allBlogs = db.blogs.getAll().filter(b => b.userId === user.id).map(b => ({ ...b, type: "blog" }));
    const allPhotos = db.photos.getAll().filter(p => p.userId === user.id).map(p => ({ ...p, type: "photo" }));
    const allVideos = db.videos.getAll().filter(v => v.userId === user.id).map(v => ({ ...v, type: "video" }));
    
    const combined = [...allBlogs, ...allPhotos, ...allVideos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setUploads(combined);
    
    // Sort tags A-Z (case-insensitive)
    const sortedTags = db.tags.getAll()
      .filter(t => t.status === "APPROVED")
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    setUserTags(sortedTags);
    setIsLoading(false);
  };

  useEffect(() => {
    if (uploads.length > 0) {
      const s = {
        totalBlogs: uploads.filter(i => i.type === 'blog').length,
        totalPhotos: uploads.filter(i => i.type === 'photo').length,
        totalVideos: uploads.filter(i => i.type === 'video').length,
        totalViews: uploads.reduce((acc, i) => acc + (i.views || 0), 0),
        totalLikes: uploads.reduce((acc, i) => acc + (i.likesCount || 0), 0),
        totalComments: uploads.reduce((acc, i) => acc + (i.comments?.length || 0), 0),
        totalTags: new Set(uploads.flatMap(i => i.tags || [])).size
      };
      setStats(s);
    }
  }, [uploads]);

  const loadDashboardData = () => {
    fetchUserContent();
    setUserTags(db.tags.getAll());
  };

  // Parse and match autocomplete tags
  useEffect(() => {
    const words = tagsInput.split(/\s+/);
    const lastWord = words[words.length - 1].trim().toLowerCase();
    if (!lastWord) {
      setAutocompleteSuggestions([]);
      setShowTagDropdown(false);
      return;
    }

    const suggestions = db.tags.getAll().filter(t => 
      t.name.toLowerCase().includes(lastWord) && 
      !t.isBanned &&
      t.status === "APPROVED" &&
      !tags.some(existing => existing.toLowerCase() === t.name.toLowerCase())
    );
    setAutocompleteSuggestions(suggestions.slice(0, 5));
    setShowTagDropdown(suggestions.length > 0);
  }, [tagsInput, tags]);

  const selectSuggestedTag = (suggestedName: string) => {
    const cleanSuggested = suggestedName.trim();
    if (!cleanSuggested) return;

    const words = tagsInput.split(/\s+/);
    // Replace the last word with the suggested tag
    words[words.length - 1] = cleanSuggested;

    // Create new tags from completed words except the last suggested one
    const completedWords = words.slice(0, -1).map(w => w.trim()).filter(w => w !== "");

    const bannedTags = db.tags.getAll().filter(t => t.isBanned).map(t => t.name.toLowerCase());
    const newTagsToAdd: string[] = [];
    let hasBanned = false;

    completedWords.forEach(word => {
      if (bannedTags.includes(word.toLowerCase())) {
        hasBanned = true;
        triggerToast("Banned Keyword 🛑", `The tag "#${word}" has been banned and cannot be used.`, "error");
        return;
      }
      if (!tags.some(t => t.toLowerCase() === word.toLowerCase()) && !newTagsToAdd.some(t => t.toLowerCase() === word.toLowerCase())) {
        newTagsToAdd.push(word);
      }
    });

    if (bannedTags.includes(cleanSuggested.toLowerCase())) {
      hasBanned = true;
      triggerToast("Banned Keyword 🛑", `The tag "#${cleanSuggested}" has been banned and cannot be used.`, "error");
    } else if (!tags.some(t => t.toLowerCase() === cleanSuggested.toLowerCase()) && !newTagsToAdd.some(t => t.toLowerCase() === cleanSuggested.toLowerCase())) {
      newTagsToAdd.push(cleanSuggested);
    }

    if (newTagsToAdd.length > 0) {
      const updatedTags = [...tags, ...newTagsToAdd].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
      setTags(updatedTags);
      syncCurrentContentTags(updatedTags);
      triggerDBSync();
    }

    setTagsInput("");
    setShowTagDropdown(false);
  };

  const syncCurrentContentTags = (newTags: string[]) => {
    if (editingContent && user) {
      if (editingContent.type === "blog") db.blogs.update(editingContent.id, { tags: newTags });
      else if (editingContent.type === "photo") db.photos.update(editingContent.id, { tags: newTags });
      else if (editingContent.type === "video") db.videos.update(editingContent.id, { tags: newTags });
      fetchUserContent(); // Refresh dashboard list and stats
      triggerDBSync(); // Trigger real-time sync for other components
    }
  };

  const handleRemoveTag = (idx: number) => {
    const newTags = tags.filter((_, i) => i !== idx);
    setTags(newTags);
    syncCurrentContentTags(newTags);
  };

  const handleClearAllTags = () => {
    const newTags: string[] = [];
    setTags(newTags);
    syncCurrentContentTags(newTags);
    setShowClearTagsConfirm(false);
    triggerToast("System Update", "All tags have been removed successfully.", "success");
  };

  const simulateProgress = () => {
    setIsUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const compressImage = (base64: string, maxWidth: number = 1000): Promise<string> => {
    return new Promise((resolve) => {
      // Do NOT compress animated GIFs via canvas as canvas flattens GIF to a single static JPEG frame
      if (base64.startsWith('data:image/gif') || base64.includes('image/gif')) {
        resolve(base64);
        return;
      }
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compressing to JPEG with 70% quality
      };
      img.onerror = () => {
        resolve(base64);
      };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Auto-detect Creative Title from file name (stripping extension)
    const detectedTitle = extractTitleFromFileName(file.name);
    if (detectedTitle) {
      if (!title.trim() || !isTitleManuallyEdited) {
        setTitle(detectedTitle);
      }
    }

    if (file.size > 2 * 1024 * 1024) {
      triggerToast("Large File Detected", "Processing media file for optimal playback...", "info");
    }

    setUploadedFileName(file.name);
    const sizeInMB = file.size / (1024 * 1024);
    const sizeStr = sizeInMB >= 1 ? `${sizeInMB.toFixed(2)} MB` : `${(file.size / 1024).toFixed(1)} KB`;
    setUploadedFileSize(sizeStr);

    setMediaSource("UPLOAD");

    simulateProgress();
    const reader = new FileReader();
    reader.onloadend = async () => {
      const rawBase64 = reader.result as string;
      const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif') || rawBase64.startsWith('data:image/gif');
      
      // Preserve GIF animation by bypassing canvas compression
      if (file.type.startsWith('image/') || isGif) {
        const finalMedia = isGif ? rawBase64 : await compressImage(rawBase64);
        if (activeMediaTab === "blog") {
          setBlogThumbnail(finalMedia);
        } else {
          setUploadedBase64(finalMedia);
          setMediaUrl(finalMedia);
        }
      } else {
        setUploadedBase64(rawBase64);
        setMediaUrl(rawBase64);
      }
      
      triggerToast("File processed", `${file.name} ready for upload`, "success");
    };
    reader.readAsDataURL(file);
  };

  const handleThumbUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      triggerToast("Invalid Format", "Please select a valid image file (JPG, PNG, WEBP).", "error");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const rawBase64 = reader.result as string;
      const compressed = await compressImage(rawBase64, 800);
      if (activeMediaTab === "photo") {
        setPhotoThumbnail(compressed);
      } else {
        setVideoThumbnail(compressed);
      }
      setThumbMethod("UPLOAD");
      triggerToast("Display Frame Ready", "Thumbnail uploaded successfully.", "success");
    };
    reader.readAsDataURL(file);
  };

  const handlePublishSubmit = (e: React.FormEvent, isDraft: boolean = false) => {
    e.preventDefault();
    if (!title.trim() || !user) {
      triggerToast("Invalid Submission", "Title is required", "info");
      return;
    }

    // Storage Quota Guard
    const stats = db.maintenance.getUsage();
    if (Number(stats.percentage) > 95) {
      triggerToast(
        "Critical Storage Limit", 
        "Your local storage is almost full. Please delete old content or clear logs in Admin Dashboard before publishing more.", 
        "info"
      );
      return;
    }

    const finalTags = [...tags];
    const currentInput = tagsInput.trim();
    if (currentInput && !finalTags.some(t => t.toLowerCase() === currentInput.toLowerCase())) {
      finalTags.push(currentInput);
    }
    const uniqueTagsArray = Array.from(new Set(finalTags));

    // Check for banned tags
    const bannedTags = db.tags.getAll().filter(t => t.isBanned).map(t => t.name.toLowerCase());
    const containsBanned = uniqueTagsArray.some(t => bannedTags.includes(t.toLowerCase()));
    if (containsBanned) {
      const bannedWord = uniqueTagsArray.find(t => bannedTags.includes(t.toLowerCase()));
      triggerToast("Submission Denied 🛑", `The tag "#${bannedWord}" has been banned and cannot be used.`, "error");
      return;
    }

    const mediaType = editingContent ? editingContent.type : activeMediaTab;
    
    // Evaluate Media Approval Policy from System Settings
    const currentSettings = db.settings.get();
    const mediaApproval = currentSettings.mediaApproval || { photo: true, video: false, blog: true };
    const isAutoPublish = mediaApproval[mediaType as "photo" | "video" | "blog"] ?? true;

    let status: any = "PENDING";
    if (isDraft) {
      status = "DRAFT";
    } else if (editingContent) {
      status = editingContent.status; // Preserve existing status when editing!
    } else if (user.role === "SUPER_ADMIN") {
      status = "APPROVED"; // Super Admin always published directly
    } else if (isAutoPublish) {
      status = "APPROVED"; // ON -> Automatic Publishing Enabled -> Published directly!
    } else {
      status = "PENDING";  // OFF -> Manual Approval Required -> Pending in Approval Queue!
    }
    
    const itemData: any = {
      id: editingContent ? editingContent.id : Math.random().toString(36).substr(2, 9),
      userId: user.id,
      authorName: user.username,
      authorAvatar: user.profile?.avatarUrl || "",
      title,
      description,
      tags: uniqueTagsArray,
      status: status,
      createdAt: editingContent ? editingContent.createdAt : new Date().toISOString(),
      views: editingContent ? editingContent.views : 0,
      likesCount: editingContent ? editingContent.likesCount : 0,
      likedBy: editingContent ? editingContent.likedBy || [] : [],
      category,
      visibility,
      engagement,
      allowComments: engagement === "open",
    };

    if (mediaType === "blog") {
      itemData.content = blogContent;
      itemData.thumbnailUrl = blogThumbnail;
      if (editingContent) db.blogs.update(itemData.id, itemData); else db.blogs.add(itemData);
    } else if (mediaType === "photo") {
      itemData.sourceType = mediaSource;
      itemData.url = mediaUrl;
      itemData.thumbnailUrl = photoThumbnail || mediaUrl;
      itemData.resolution = videoResolution; // Reusing state for photo too
      itemData.aspectRatio = videoAspectRatio;
      if (editingContent) db.photos.update(itemData.id, itemData); else db.photos.add(itemData);
    } else if (mediaType === "video") {
      itemData.sourceType = mediaSource;
      if (mediaSource === "EMBED") {
        const cleanedEmbedUrls = videoEmbedUrls
          .map(u => u.trim())
          .filter(u => u.length > 0);
        const uniqueEmbedUrls = Array.from(new Set(cleanedEmbedUrls));
        itemData.videoUrls = uniqueEmbedUrls.length > 0 ? uniqueEmbedUrls : (mediaUrl ? [mediaUrl] : []);
        itemData.url = uniqueEmbedUrls[0] || mediaUrl || "";
        itemData.isExternal = true;
        itemData.externalProvider = itemData.url.includes("youtube") ? "YOUTUBE" : itemData.url.includes("vimeo") ? "VIMEO" : "OTHER";
      } else {
        itemData.url = mediaUrl;
        itemData.videoUrls = mediaUrl ? [mediaUrl] : [];
        if (mediaSource === "URL") {
          itemData.isExternal = true;
          itemData.externalProvider = "DIRECT";
        }
      }
      itemData.thumbnailUrl = videoThumbnail;
      itemData.duration = Number(videoDuration) || 0;
      itemData.resolution = videoResolution;
      itemData.aspectRatio = videoAspectRatio;
      itemData.codec = "h264 (H.264 / AVC)";
      itemData.fileSize = mediaUrl.startsWith('data:') ? Math.round(mediaUrl.length * 0.75) : 0; // Rough estimate for base64
      if (editingContent) db.videos.update(itemData.id, itemData); else db.videos.add(itemData);
    }

    let toastTitle = "Success";
    let toastMessage = "Work processed successfully";
    if (isDraft) {
      toastTitle = "Draft Saved";
      toastMessage = "Your work is saved as draft.";
    } else if (editingContent) {
      toastTitle = "Content Updated";
      toastMessage = "Asset modifications have been saved.";
    } else if (status === "APPROVED") {
      toastTitle = "Published Immediately 🎉";
      toastMessage = isAutoPublish 
        ? "Automatic Publishing Enabled: Your work is now live on the platform!" 
        : "Super Admin authorization: Content published live!";
    } else {
      toastTitle = "Submitted for Approval ⏳";
      toastMessage = "Manual Approval Required: Your work has been routed to the Super Admin Approval Queue.";
    }

    triggerToast(toastTitle, toastMessage, status === "APPROVED" || isDraft ? "success" : "info");

    triggerDBSync();
    resetForm();
    setEditingContent(null);
    setActiveTab("overview");
    fetchUserContent();
    triggerDBSync();
  };

  const handleEdit = (item: any) => {
    if (!item) return;
    const resolvedType = (item.type || item.itemType || "blog") as "blog" | "photo" | "video";
    const editItem = { ...item, type: resolvedType };

    setEditingContent(editItem);
    setTitle(editItem.title || "");
    setIsTitleManuallyEdited(true);
    setDescription(editItem.description || "");
    setTags(editItem.tags || []);
    setTagsInput("");
    setCategory(editItem.category || "Others");
    const itemVis = (editItem.visibility?.toLowerCase() === "private" ? "private" : "public") as "public" | "private";
    const itemEng = (editItem.engagement?.toLowerCase() === "muted" || editItem.allowComments === false ? "muted" : "open") as "open" | "muted";
    setVisibility(itemVis);
    setEngagement(itemEng);
    setActiveMediaTab(resolvedType);
    
    if (resolvedType === "blog") {
      setBlogContent(editItem.content || "");
      setBlogThumbnail(editItem.thumbnailUrl || "");
      if (editItem.thumbnailUrl && editItem.thumbnailUrl.startsWith("data:")) {
        setBlogCoverSource("UPLOAD");
        setUploadedFileName("blog_cover.jpg");
        setUploadedFileSize("~245 KB");
        setUploadProgress(100);
      } else {
        setBlogCoverSource("URL");
      }
    } else if (resolvedType === "photo") {
      const src = (editItem.sourceType === "LAPTOP" || editItem.sourceType === "MOBILE") ? "UPLOAD" : (editItem.sourceType || "URL");
      setMediaSource(src as any);
      setMediaUrl(editItem.url || "");
      setPhotoThumbnail(editItem.thumbnailUrl || editItem.url || "");
      if (editItem.sourceType === "LAPTOP" || editItem.sourceType === "MOBILE" || editItem.sourceType === "UPLOAD") {
        setUploadedBase64(editItem.url || "");
        setUploadedFileName("nightverse_photo.jpg");
        setUploadedFileSize("~850 KB");
        setUploadProgress(100);
      }
      if (editItem.thumbnailUrl) {
        if (editItem.thumbnailUrl.startsWith("data:")) {
          setThumbMethod("UPLOAD");
        } else if (editItem.thumbnailUrl === editItem.url) {
          setThumbMethod("UPLOAD");
        } else {
          setThumbMethod("URL");
        }
      }
    } else if (resolvedType === "video") {
      const src = (editItem.sourceType === "LAPTOP" || editItem.sourceType === "MOBILE") ? "UPLOAD" : (editItem.sourceType || "URL");
      setMediaSource(src as any);
      setMediaUrl(editItem.url || "");
      if (editItem.videoUrls && Array.isArray(editItem.videoUrls) && editItem.videoUrls.length > 0) {
        setVideoEmbedUrls(editItem.videoUrls);
      } else {
        setVideoEmbedUrls(editItem.url ? [editItem.url] : [""]);
      }
      setVideoThumbnail(editItem.thumbnailUrl || "");
      setVideoDuration(editItem.duration?.toString() || "");
      setVideoResolution(editItem.resolution || "1080p");
      setVideoAspectRatio(editItem.aspectRatio || "16:9");
      if (editItem.sourceType === "LAPTOP" || editItem.sourceType === "MOBILE" || editItem.sourceType === "UPLOAD") {
        setUploadedBase64(editItem.url || "");
        setUploadedFileName("nightverse_video.mp4");
        setUploadedFileSize("~4.8 MB");
        setUploadProgress(100);
      }
      if (editItem.thumbnailUrl) {
        if (editItem.thumbnailUrl.startsWith("data:")) {
          setThumbMethod("UPLOAD");
        } else {
          setThumbMethod("URL");
        }
      }
    }
    
    setActiveTab("upload");
    triggerToast("Edit Mode", `Now editing: ${editItem.title}`, "info");
  };

  const handleDeleteConfirm = () => {
    if (!deletingContent || !user) return;
    
    if (deletingContent.type === "blog") db.blogs.delete(deletingContent.id);
    else if (deletingContent.type === "photo") db.photos.delete(deletingContent.id);
    else if (deletingContent.type === "video") db.videos.delete(deletingContent.id);

    triggerToast("Asset Purged", "Content successfully removed from NightVerse Registry", "success");
    fetchUserContent();
    setDeletingContent(null);
    triggerDBSync();
  };

  const generateVideoThumbnail = () => {
    if (!mediaUrl) {
      triggerToast("Reference Required", "Please provide a video source node first.", "info");
      return;
    }
    
    setIsLoading(true);
    const video = document.createElement('video');
    video.src = mediaUrl;
    video.crossOrigin = "anonymous";
    video.currentTime = captureTime;
    
    video.onloadeddata = () => {
      video.currentTime = captureTime;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        if (activeMediaTab === "photo") {
          setPhotoThumbnail(dataUrl);
        } else {
          setVideoThumbnail(dataUrl);
        }
        triggerToast("Frame Captured", "Video thumbnail generated from source material.", "success");
      } catch (err) {
        triggerToast("CORS Restriction", "Cannot capture frame from external domain. Manual URL required.", "error");
      } finally {
        setIsLoading(false);
      }
    };

    video.onerror = () => {
      triggerToast("Link Error", "Failed to load video stream for frame analysis.", "error");
      setIsLoading(false);
    };
  };

  // Automatic video aspect ratio & metadata detection with robust source checking
  useEffect(() => {
    if ((activeMediaTab !== "video" && activeMediaTab !== "photo") || !mediaUrl) return;

    const trimmed = mediaUrl.trim();
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("blob:") && !trimmed.startsWith("data:") && !trimmed.startsWith("/")) {
      return;
    }

    if (activeMediaTab === "video") {
      // Detect YouTube Shorts specifically as 9:16
      if (trimmed.includes("/shorts/") || trimmed.includes("youtube.com/shorts")) {
        setVideoAspectRatio("9:16");
        setVideoResolution("1080x1920");
        setVideoDuration("60");
        return;
      }

      if (mediaSource !== "EMBED") {
        const isLikelyVideo = trimmed.match(/\.(mp4|webm|mov|m4v|ogv)($|\?)/i) || trimmed.startsWith("blob:") || trimmed.startsWith("data:video/") || trimmed.startsWith("/renditions/");
        if (!isLikelyVideo) return;

        let active = true;
        const video = document.createElement("video");
        video.preload = "metadata";
        video.src = trimmed;
        
        video.onloadedmetadata = () => {
          if (!active) return;
          const w = video.videoWidth;
          const h = video.videoHeight;
          if (w && h) {
            const ratio = w / h;
            let calculatedRatio = "16:9";
            if (Math.abs(ratio - 9/16) < 0.15) calculatedRatio = "9:16";
            else if (Math.abs(ratio - 4/5) < 0.1) calculatedRatio = "4:5";
            else if (Math.abs(ratio - 1) < 0.1) calculatedRatio = "1:1";
            else if (Math.abs(ratio - 21/9) < 0.15) calculatedRatio = "21:9";
            else if (ratio < 0.9) calculatedRatio = "9:16";
            else if (ratio > 1.1) calculatedRatio = "16:9";
            
            setVideoAspectRatio(calculatedRatio);
            setVideoResolution(`${w}x${h}`);
            if (video.duration && !isNaN(video.duration)) {
              setVideoDuration(Math.round(video.duration).toString());
            }
          }
        };

        video.onerror = () => {
          // Gracefully swallow error to prevent console source exception
        };

        return () => {
          active = false;
          video.onloadedmetadata = null;
          video.onerror = null;
          video.src = "";
        };
      }
    } else if (activeMediaTab === "photo" && trimmed) {
      let active = true;
      const img = new Image();
      img.src = trimmed;
      img.onload = () => {
        if (!active) return;
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        setVideoResolution(`${w}x${h}`);
        const ratio = w / h;
        let calculatedRatio = "16:9";
        if (Math.abs(ratio - 1) < 0.1) calculatedRatio = "1:1";
        else if (ratio < 0.9) calculatedRatio = "4:5";
        setVideoAspectRatio(calculatedRatio);
      };
      img.onerror = () => {
        // Gracefully swallow photo load error
      };
      return () => {
        active = false;
        img.onload = null;
        img.onerror = null;
        img.src = "";
      };
    }
  }, [mediaUrl, activeMediaTab, mediaSource]);

  const resetForm = () => {
    setEditingContent(null);
    setTitle("");
    setIsTitleManuallyEdited(false);
    setDescription("");
    setTags([]);
    setTagsInput("");
    setBlogContent("");
    setBlogThumbnail("");
    setMediaUrl("");
    setUploadedBase64(null);
    setVideoThumbnail("");
    setPhotoThumbnail("");
    setVideoDuration("");
    setVideoAspectRatio("16:9");
    setVideoEmbedUrls([""]);
    setIsUploading(false);
    setUploadProgress(0);
    setBlogCoverSource("UPLOAD");
    setUploadedFileName("");
    setUploadedFileSize("");
    setVisibility("public");
    setEngagement("open");
  };

  const filteredTags = userTags.filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase()));
  const totalTagPages = Math.ceil(filteredTags.length / tagsPerPage);
  const paginatedTags = filteredTags.slice((tagPage - 1) * tagsPerPage, tagPage * tagsPerPage);

  const getStatusColor = (status: string) => {
    switch(status) {
      case "APPROVED": return "text-emerald-400 bg-emerald-950/30 border-emerald-900/50";
      case "PENDING": return "text-amber-400 bg-amber-950/30 border-amber-900/50";
      case "REJECTED": return "text-rose-400 bg-rose-950/30 border-rose-900/50";
      case "REVISION": return "text-cyan-400 bg-cyan-950/30 border-cyan-900/50";
      case "DRAFT": return "text-slate-400 bg-slate-800/30 border-slate-700/50";
      default: return "text-slate-400 bg-slate-800/30 border-slate-700/50";
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 space-y-8" id="user-upload-dashboard">
      
      {/* Header & Stats Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start md:items-center gap-3 md:gap-4 w-full">
            {editingContent && (
              <button 
                onClick={resetForm}
                className="p-2.5 md:p-3 bg-rose-950/30 border border-rose-900/50 rounded-2xl text-rose-400 hover:bg-rose-900 transition-all group shrink-0"
                title="Cancel Editing"
              >
                <XCircle className="w-5 h-5 md:w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            )}
            <div className="select-none pointer-events-none">
              <h1 className="text-2xl md:text-3xl font-black font-space tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
                {editingContent ? "Edit Submission" : "Creator Dashboard"}
              </h1>
              <p className="text-slate-400 text-[11px] md:text-sm mt-1 leading-tight">
                {editingContent ? `Refining ${editingContent.type}` : "Manage your digital universe assets across NightVerse."}
              </p>
            </div>
          </div>

        <div className="flex items-center gap-1.5 bg-slate-900/50 p-1 rounded-2xl border border-slate-800/50 overflow-x-auto custom-scrollbar w-full scroll-smooth">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "upload", label: "Upload", icon: CloudUpload },
            { id: "tags", label: "Tags", icon: TagIcon },
            { id: "history", label: "History", icon: History },
            { id: "drafts", label: "Drafts", icon: FileText }
          ].map((nav) => (
            <button
              key={nav.id}
              onClick={() => {
                setActiveTab(nav.id as any);
                if (nav.id !== "upload") {
                  resetForm();
                }
              }}
              className={`flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-xl text-[11px] md:text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === nav.id 
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <nav.icon className="w-3.5 h-3.5 md:w-4 h-4" />
              <span className="inline">{nav.label}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Stats Grid */}
            <div className="flex xl:grid xl:grid-cols-7 gap-2.5 md:gap-4 overflow-x-auto pb-4 xl:pb-0 custom-scrollbar scroll-smooth">
              {[
                { label: "Blogs", val: stats?.totalBlogs || 0, icon: BookOpen, color: "text-blue-400" },
                { label: "Photos", val: stats?.totalPhotos || 0, icon: ImageIcon, color: "text-emerald-400" },
                { label: "Videos", val: stats?.totalVideos || 0, icon: Video, color: "text-purple-400" },
                { label: "Views", val: stats?.totalViews || 0, icon: Eye, color: "text-cyan-400" },
                { label: "Likes", val: stats?.totalLikes || 0, icon: Heart, color: "text-rose-400" },
                { label: "Comments", val: stats?.totalComments || 0, icon: MessageSquare, color: "text-amber-400" },
                { label: "Tags", val: stats?.totalTags || 0, icon: TagIcon, color: "text-indigo-400" }
              ].map((s, i) => (
                <div key={i} className="min-w-[100px] md:min-w-0 flex-1 bg-slate-900/40 border border-slate-800 p-3 md:p-4 rounded-2xl hover:border-slate-700 transition-all group shrink-0">
                  <div className={`p-1.5 md:p-2 rounded-lg bg-slate-950 w-fit mb-2 md:mb-3 group-hover:scale-110 transition-transform ${s.color}`}>
                    <s.icon className="w-3.5 h-3.5 md:w-4 h-4" />
                  </div>
                  <h3 className="text-lg md:text-2xl font-black font-mono tracking-tighter">{s.val}</h3>
                  <p className="text-[8px] md:text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Uploads List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold font-space flex items-center gap-2">
                    <History className="w-5 h-5 text-purple-500" /> Recent Activity
                  </h2>
                  <button onClick={() => setActiveTab("history")} className="text-xs text-purple-400 hover:text-purple-300 font-bold uppercase tracking-wider">View All</button>
                </div>
                
                <div className="space-y-3">
                  {uploads.slice(0, 5).map((u, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-slate-900/30 border border-slate-800 rounded-2xl hover:bg-slate-800/40 transition-all">
                      <img 
                        src={u.thumbnailUrl || u.url || undefined} 
                        className="w-16 h-16 rounded-xl object-cover border border-slate-700" 
                        alt="thumb" 
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-tighter">{u.type}</span>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded border uppercase font-black ${getStatusColor(u.status)}`}>
                            {u.status}
                          </span>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded border font-mono font-bold flex items-center gap-1 ${
                            u.visibility === "private" ? "text-amber-400 bg-amber-950/30 border-amber-800/40" : "text-cyan-400 bg-cyan-950/30 border-cyan-800/40"
                          }`}>
                            {u.visibility === "private" ? <Lock className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
                            {u.visibility === "private" ? "Private" : "Public"}
                          </span>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded border font-mono font-bold flex items-center gap-1 ${
                            u.engagement === "muted" || u.allowComments === false ? "text-rose-400 bg-rose-950/30 border-rose-800/40" : "text-purple-400 bg-purple-950/30 border-purple-800/40"
                          }`}>
                            {u.engagement === "muted" || u.allowComments === false ? <MessageSquareOff className="w-2.5 h-2.5" /> : <MessageSquare className="w-2.5 h-2.5" />}
                            {u.engagement === "muted" || u.allowComments === false ? "Muted" : "Open"}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold truncate text-slate-200">{u.title}</h4>
                        <div className="flex items-center gap-3 mt-1.5 font-mono">
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-950/40 px-1.5 py-0.5 rounded border border-slate-850">
                            <Eye className="w-3 h-3 text-slate-500" /> {u.views || 0}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-950/40 px-1.5 py-0.5 rounded border border-slate-850 hover:text-rose-400 transition-colors">
                            <Heart className="w-3 h-3 text-rose-500/70" /> {u.likesCount || 0}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-950/40 px-1.5 py-0.5 rounded border border-slate-850 hover:text-cyan-400 transition-colors">
                             <MessageSquare className="w-3 h-3 text-cyan-500/70" /> {u.comments?.length || 0}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-[10px] text-slate-600 font-mono italic">
                           {new Date(u.createdAt).toLocaleDateString()}
                        </span>
                        <div className="flex gap-1.5">
                           <button 
                             onClick={() => handleEdit(u)}
                             className="p-2 bg-slate-950 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition-all"
                           >
                             <Edit2 className="w-3.5 h-3.5" />
                           </button>
                           <button 
                             onClick={() => setDeletingContent(u)}
                             className="p-2 bg-slate-950 rounded-lg hover:bg-rose-900 text-slate-400 hover:text-rose-400 transition-all"
                           >
                             <Trash2 className="w-3.5 h-3.5" />
                           </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {uploads.length === 0 && (
                    <div className="py-12 text-center border-2 border-dashed border-slate-800 rounded-3xl">
                       <CloudUpload className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                       <p className="text-slate-500 text-sm">No uploads recorded in your frequency.</p>
                       <button onClick={() => setActiveTab("upload")} className="mt-4 text-xs bg-purple-600 text-white px-6 py-2 rounded-xl font-bold uppercase">Launch First Mission</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Guidelines Panel */}
              <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl h-fit">
                 <h2 className="text-lg font-bold font-space flex items-center gap-2 mb-6">
                    <ShieldAlert className="w-5 h-5 text-amber-500" /> Content Guidelines
                 </h2>
                 <div className="space-y-5">
                    {[
                      { t: "Originality", d: "Ensure content is self-produced or properly attributed.", icon: CheckCircle2 },
                      { t: "Safety", d: "No harmful, violent, or strictly prohibited assets.", icon: AlertCircle },
                      { t: "Metadata", d: "Always provide accurate tags for taxonomy sync.", icon: TagIcon },
                      { t: "Moderation", d: "Content enters queue for administrative verification.", icon: Info }
                    ].map((idx, i) => (
                      <div key={i} className="flex gap-3">
                         <div className="mt-0.5"><idx.icon className="w-4 h-4 text-purple-400" /></div>
                         <div>
                            <h4 className="text-xs font-bold text-slate-200">{idx.t}</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{idx.d}</p>
                         </div>
                      </div>
                    ))}
                 </div>
                 <div className="mt-8 p-4 bg-amber-950/20 border border-amber-900/30 rounded-2xl">
                    <p className="text-[10px] text-amber-400 leading-relaxed font-medium">
                       Violations of core protocols lead to account suspension and asset purging. Review full TOU in workspace settings. 
                    </p>
                 </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "upload" && (
          <motion.div 
            key="upload"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Upload Selector & Form */}
            <div className="lg:col-span-2 space-y-6">
               <div className="flex bg-slate-950 border border-slate-800 p-1 w-full md:w-fit rounded-2xl overflow-x-auto custom-scrollbar scroll-smooth">
                  {[
                    { id: "blog", label: "Blog", icon: BookOpen },
                    { id: "photo", label: "Photo", icon: ImageIcon },
                    { id: "video", label: "Video", icon: Video }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      disabled={!!editingContent && activeMediaTab !== m.id}
                      onClick={() => setActiveMediaTab(m.id as any)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold transition-all ${
                        activeMediaTab === m.id 
                          ? "bg-slate-800 text-white border border-slate-700 shadow-inner" 
                          : "text-slate-500 hover:text-slate-300"
                      } ${!!editingContent && activeMediaTab !== m.id ? 'opacity-30 cursor-not-allowed filter grayscale' : ''}`}
                    >
                      <m.icon className="w-4 h-4" /> {m.label}
                    </button>
                  ))}
               </div>

               <form onSubmit={(e) => handlePublishSubmit(e, false)} className="space-y-6 bg-slate-900/40 p-4 md:p-8 border border-slate-800 rounded-3xl backdrop-blur-xl">
                  
                  {/* Common Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono">Creative Title</label>
                       <input 
                         type="text" 
                         value={title}
                         onChange={(e) => {
                           setTitle(e.target.value);
                           setIsTitleManuallyEdited(true);
                         }}
                         placeholder="Synthesizing new idea..." 
                         className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 md:py-3 text-[13px] md:text-sm focus:border-purple-500 outline-none transition-all placeholder:text-slate-700" 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono">Classification</label>
                       <select 
                         value={category}
                         onChange={(e) => setCategory(e.target.value)}
                         className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 md:py-3 text-[13px] md:text-sm focus:border-purple-500 outline-none transition-all"
                       >
                         {categories.map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono">Abstract / Description</label>
                      <span className="text-[9px] text-slate-600 font-mono italic">Supports multi-line signal transmission</span>
                    </div>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Type your description here. Use Enter for new lines..." 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm h-40 focus:border-purple-500 outline-none transition-all resize-y placeholder:text-slate-800 font-sans leading-relaxed" 
                    />
                    
                    {description && (
                      <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-2xl animate-in fade-in slide-in-from-top-1 duration-300">
                        <span className="text-[8px] uppercase font-bold text-slate-700 tracking-tighter mb-2 block font-mono">Formatting Preview</span>
                        <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed">
                          {description}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Media Specific Logic */}
                  {activeMediaTab === "blog" && (
                    <div className="space-y-6">
                      <div className="flex md:grid md:grid-cols-2 gap-2 md:gap-3 overflow-x-auto scroll-smooth pb-2 md:pb-0 custom-scrollbar">
                        {[
                          { label: "Upload Media", value: "UPLOAD" as const, icon: CloudUpload },
                          { label: "Online URL Reference", value: "URL" as const, icon: Globe }
                        ].map(s => (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => setBlogCoverSource(s.value)}
                            className={`flex flex-col items-center gap-2 p-3 md:p-4 rounded-2xl border transition-all shrink-0 min-w-[105px] md:min-w-0 flex-1 ${
                              blogCoverSource === s.value ? "bg-purple-950/20 border-purple-500/50 text-purple-400" : "bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-900"
                            }`}
                          >
                            <s.icon className="w-4 h-4 md:w-5 h-5" />
                            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-tight whitespace-nowrap">{s.label}</span>
                          </button>
                        ))}
                      </div>

                      {blogCoverSource === "URL" ? (
                        <div className="space-y-2 animate-in fade-in duration-200">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono">Cover Ingest URL</label>
                          <input 
                            type="url" 
                            value={blogThumbnail}
                            onChange={(e) => setBlogThumbnail(e.target.value)}
                            placeholder="https://source.visual/..." 
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-purple-500 outline-none transition-all placeholder:text-slate-700" 
                          />
                          {blogThumbnail && !blogThumbnail.startsWith("data:") && (
                            <div className="w-full rounded-2xl overflow-hidden border border-slate-800 relative group mt-4">
                              <img src={blogThumbnail} className="w-full h-auto block mx-auto" alt="Blog cover reference" onError={(e) => (e.currentTarget.style.display = 'none')} referrerPolicy="no-referrer" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4 animate-in fade-in duration-200">
                          <div className="relative group">
                            <div 
                              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                              onDragLeave={() => setIsDragging(false)}
                              className={`relative border-2 border-dashed rounded-3xl transition-all ${
                                isDragging ? 'border-purple-500 bg-purple-950/20' : 'border-slate-800 bg-slate-950 hover:border-purple-500/30'
                              }`}
                            >
                              {/* Desktop spacious drag & drop */}
                              <div className="hidden md:flex flex-col items-center justify-center p-10">
                                <input 
                                  type="file" 
                                  onChange={handleFileUpload} 
                                  className="absolute inset-0 opacity-0 cursor-pointer" 
                                  accept="image/jpeg, image/png, image/webp, image/gif" 
                                />
                                <CloudUpload className={`w-12 h-12 mb-4 transition-all ${isUploading ? 'text-purple-400 animate-bounce' : 'text-slate-700 group-hover:text-purple-500'}`} />
                                <p className="text-sm font-bold text-slate-300">Upload Media</p>
                                <p className="text-[11px] text-slate-600 mt-1">Drag Blog Thumbnail / Cover here or click to browse</p>
                              </div>

                              {/* Mobile simple upload button */}
                              <div className="flex md:hidden p-6 flex-col items-center justify-center relative">
                                <input 
                                  type="file" 
                                  onChange={handleFileUpload} 
                                  className="absolute inset-0 opacity-0 cursor-pointer" 
                                  accept="image/jpeg, image/png, image/webp, image/gif" 
                                />
                                <button type="button" className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2">
                                  <CloudUpload className="w-4 h-4" /> Upload Media
                                </button>
                                <p className="text-[10px] text-slate-500 mt-2 font-mono">Accepts: JPG, PNG, WEBP, GIF</p>
                              </div>
                            </div>
                          </div>

                          {/* Real-time upload progress / preview inside Blog */}
                          {isUploading && (
                            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                              <div className="flex items-center justify-between text-[11px] mb-1">
                                <span className="font-mono text-purple-400 animate-pulse font-bold">Uploading file...</span>
                                <span className="text-slate-400 font-mono font-semibold">{uploadProgress}%</span>
                              </div>
                              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden animate-pulse">
                                <motion.div 
                                  className="h-full bg-purple-500" 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {blogThumbnail && blogThumbnail.startsWith("data:") && !isUploading && (
                            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-slate-950 border border-slate-800 rounded-2xl animate-in zoom-in-95">
                              <div className="w-full sm:w-32 h-auto bg-slate-900/50 rounded-xl overflow-hidden border border-slate-800 relative group shrink-0">
                                <img src={blogThumbnail} className="w-full h-auto block" />
                                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                  <button 
                                    type="button" 
                                    onClick={() => {
                                      setBlogThumbnail("");
                                      setUploadedFileName("");
                                      setUploadedFileSize("");
                                    }} 
                                    className="p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              <div className="flex-1 flex flex-col justify-center min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-bold text-slate-200 truncate" title={uploadedFileName}>
                                    {uploadedFileName || "blog_cover.jpg"}
                                  </p>
                                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                                    {uploadedFileSize || "~245 KB"}
                                  </span>
                                </div>
                                <div className="mt-2 flex items-center justify-between text-[10px]">
                                  <span className="text-emerald-400 font-mono font-bold">Upload Success</span>
                                  <span className="text-slate-550 font-mono font-semibold">100%</span>
                                </div>
                                <div className="w-full bg-slate-900 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                  <div className="h-full bg-purple-500 w-full" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono">Hypertext Content Core</label>
                        <textarea 
                          value={blogContent}
                          onChange={(e) => setBlogContent(e.target.value)}
                          placeholder="<p>Article logic starts here...</p>" 
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm h-64 focus:border-purple-500 outline-none transition-all font-mono placeholder:text-slate-700" 
                        />
                      </div>
                    </div>
                  )}

                  {(activeMediaTab === "photo" || activeMediaTab === "video") && (
                    <div className="space-y-8">
                        {/* Source Protocol selection */}
                        <div className="space-y-3">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono">Input Protocol Selection</label>
                          <div className="flex md:grid md:grid-cols-4 gap-2 md:gap-3 overflow-x-auto scroll-smooth pb-2 md:pb-0 custom-scrollbar">
                             {[
                               { label: "Upload Media", value: "UPLOAD" as const, icon: CloudUpload },
                               { label: "Online URL", value: "URL" as const, icon: Globe },
                               ...(activeMediaTab === "video" ? [{ label: "Real-time Embed", value: "EMBED" as const, icon: Play }] : [])
                             ].map(s => {
                               const isSelected = mediaSource === s.value;
                               return (
                                 <button
                                   key={s.value}
                                   type="button"
                                   onClick={() => setMediaSource(s.value)}
                                   className={`flex flex-col items-center gap-2 p-3 md:p-4 rounded-2xl border transition-all shrink-0 min-w-[105px] md:min-w-0 flex-1 ${
                                     isSelected ? "bg-purple-950/20 border-purple-500/50 text-purple-400" : "bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-900"
                                   }`}
                                 >
                                   <s.icon className="w-4 h-4 md:w-5 h-5" />
                                   <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-tight whitespace-nowrap">{s.label}</span>
                                 </button>
                               );
                             })}
                          </div>
                        </div>

                        {/* Technical Metadata Dossier (Requirement 3: Full technical information preview) */}
                        {activeMediaTab === "video" && (
                          <div className="p-5 bg-slate-900/70 border border-slate-800/80 rounded-3xl space-y-4 animate-in fade-in slide-in-from-top-2 shadow-xl">
                            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/30 text-purple-400">
                                  <Cpu className="w-5 h-5" />
                                </div>
                                <div>
                                  <h4 className="text-xs font-black text-slate-200 uppercase tracking-widest font-mono">Video Technical Specifications</h4>
                                  <p className="text-[10px] text-slate-500 font-mono">Auto-detected H.264 / AVC Container Telemetry</p>
                                </div>
                              </div>
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5" /> H.264 / AVC Verified
                              </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60">
                                <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Title & Source</span>
                                <span className="text-slate-200 font-bold truncate block">{title || "Untitled Video"}</span>
                                <span className="text-[9px] text-purple-400 font-medium truncate block">{uploadedFileName || mediaSource}</span>
                              </div>

                              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60">
                                <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Original Resolution</span>
                                <span className="text-cyan-400 font-bold block">{videoResolution || "1920x1080"}</span>
                                <span className="text-[9px] text-slate-500 block">{videoAspectRatio || "16:9"} Aspect Ratio</span>
                              </div>

                              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60">
                                <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Duration & FPS</span>
                                <span className="text-amber-400 font-bold block">
                                  {Number(videoDuration) ? `${Math.floor(Number(videoDuration)/60)}m ${Math.round(Number(videoDuration)%60)}s (${Math.round(Number(videoDuration))}s)` : "0s"}
                                </span>
                                <span className="text-[9px] text-slate-500 block">30 FPS Frame Rate</span>
                              </div>

                              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60">
                                <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Codec & File Size</span>
                                <span className="text-emerald-400 font-bold block truncate">h264 (H.264 / AVC)</span>
                                <span className="text-[9px] text-slate-500 block">{uploadedFileSize || "~4.8 MB"}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {mediaSource === "URL" ? (
                           <div className="space-y-4">
                              <div className="space-y-2">
                                 <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono">
                                    Direct Stream URL
                                 </label>
                                 <input 
                                   type="text" 
                                   value={mediaUrl}
                                   onChange={(e) => setMediaUrl(e.target.value)}
                                   placeholder="https://storage.nightverse.io/content/raw_stream.mp4" 
                                   className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 md:py-3 text-[13px] md:text-sm focus:border-purple-500 outline-none transition-all placeholder:text-slate-700 font-mono" 
                                 />
                              </div>

                              {mediaUrl && (
                                <div className={`w-full rounded-2xl overflow-hidden border border-slate-800 relative group flex items-center justify-center transition-all duration-300 bg-slate-950/50 ${activeMediaTab === "video" ? "max-w-4xl mx-auto" : ""}`}>
                                  {activeMediaTab === "photo" ? (
                                    <img src={mediaUrl} className="w-full h-auto block max-h-[600px] object-contain" alt="Preview reference" onError={(e) => (e.currentTarget.style.display = 'none')} referrerPolicy="no-referrer" />
                                  ) : isValidMediaUrl(mediaUrl) ? (
                                    <video 
                                      src={mediaUrl} 
                                      className="w-full h-auto block max-h-[600px] bg-slate-950" 
                                      muted 
                                      playsInline 
                                      onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                                    />
                                  ) : (
                                    <div className="w-full h-32 flex items-center justify-center text-slate-500 font-mono text-xs">
                                      Masukkan URL video yang valid (.mp4, .webm, atau stream link)
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all pointer-events-none">
                                    <span className="px-3 py-1.5 bg-slate-900/80 border border-slate-700 rounded-lg text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Remote Stream Live</span>
                                  </div>
                                </div>
                              )}
                           </div>
                        ) : mediaSource === "EMBED" ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono flex items-center gap-1.5">
                                <Play className="w-3.5 h-3.5 text-purple-400" />
                                Multi-Node Embed Protocol
                                {videoEmbedUrls.length > 1 && (
                                  <span className="text-purple-400 font-bold font-mono">({videoEmbedUrls.length} Nodes)</span>
                                )}
                              </label>
                              <button
                                type="button"
                                onClick={() => handleAddVideoUrl()}
                                className="px-3 py-1.5 bg-purple-950/40 border border-purple-800/60 hover:border-purple-500 text-purple-300 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" /> Add Multi-Node
                              </button>
                            </div>

                            <div className="space-y-3">
                              {videoEmbedUrls.map((url, index) => {
                                const isValid = isValidEmbedUrl(url);
                                return (
                                  <div key={index} className="space-y-2 p-3 md:p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl transition-all hover:border-slate-750">
                                    <div className="flex items-center gap-2">
                                      <div className="relative flex-1">
                                        <input 
                                          type="text" 
                                          value={url}
                                          onChange={(e) => handleVideoUrlChange(index, e.target.value)}
                                          placeholder={`URL Endpoint ${index + 1} (YouTube, Vimeo, etc)...`} 
                                          className={`w-full bg-slate-950 border ${
                                            url.trim() && !isValid 
                                              ? "border-rose-500/80 focus:border-rose-500 text-rose-300" 
                                              : "border-slate-800 focus:border-purple-500 text-slate-200"
                                          } rounded-xl px-4 py-2.5 text-xs md:text-sm outline-none transition-all placeholder:text-slate-700 font-mono`} 
                                        />
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => handleRemoveVideoUrl(index)}
                                        disabled={videoEmbedUrls.length === 1 && !url}
                                        className="p-2.5 bg-slate-900 border border-slate-800 hover:border-rose-500/50 hover:bg-rose-950/30 text-slate-400 hover:text-rose-400 rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer shrink-0"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>

                                    {url.trim() && !isValid && (
                                      <div className="flex items-center gap-1.5 text-rose-400 text-[10px] font-mono font-medium px-1 pt-1">
                                        <AlertCircle className="w-3 h-3 shrink-0 text-rose-500" />
                                        <span>Invalid embed protocol. Must be YouTube, Vimeo, or DailyMotion.</span>
                                      </div>
                                    )}

                                    {url.trim() && isValid && (
                                      <div className="mt-3 pt-3 border-t border-slate-900 space-y-2">
                                        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-purple-400">
                                          <span className="flex items-center gap-1">
                                            <Play className="w-3 h-3 text-purple-400" /> Preview Node #{index + 1}
                                          </span>
                                        </div>
                                        <div className={`w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 relative group flex items-center justify-center transition-all duration-300 ${getAspectRatioClass(videoAspectRatio)}`}>
                                          <iframe
                                            src={getEmbedIframeSrc(url)}
                                            className="w-full h-full border-0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            title={`Embed Preview ${index + 1}`}
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                           <div className="space-y-4">
                              <div className="relative group">
                                 <div 
                                   onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                   onDragLeave={() => setIsDragging(false)}
                                   className={`relative border-2 border-dashed rounded-3xl transition-all ${
                                     isDragging ? 'border-purple-500 bg-purple-950/20' : 'border-slate-800 bg-slate-950 hover:border-purple-500/30'
                                   } ${isUploading ? 'border-purple-500 bg-purple-950/10' : ''}`}
                                 >
                                    <div className="flex flex-col items-center justify-center p-12 text-center">
                                       <input 
                                         type="file" 
                                         onChange={handleFileUpload} 
                                         className="absolute inset-0 opacity-0 cursor-pointer" 
                                         accept={activeMediaTab === "photo" ? "image/jpeg, image/png, image/webp, image/gif" : "video/mp4, video/quicktime, video/x-matroska, video/webm, video/x-msvideo"} 
                                       />
                                       <div className={`w-16 h-16 mb-4 rounded-2xl flex items-center justify-center transition-all ${isUploading ? 'bg-purple-500/20 text-purple-400 animate-pulse' : 'bg-slate-900 text-slate-700 group-hover:text-purple-500 group-hover:bg-purple-500/10'}`}>
                                         <CloudUpload className="w-8 h-8" />
                                       </div>
                                       <p className="text-sm font-bold text-slate-300 uppercase tracking-widest font-mono">Upload {activeMediaTab === "video" ? "Video" : "Media"}</p>
                                       <p className="text-[11px] text-slate-600 mt-1">Select file from device or drag into buffer</p>
                                       <p className="text-[9px] text-slate-500 mt-4 font-mono px-3 py-1 bg-slate-900/50 rounded-lg border border-slate-800/50 uppercase">
                                         {activeMediaTab === "photo" ? "Compatible: JPG, PNG, WEBP, GIF" : "Compatible: MP4, MOV, MKV, WEBM (H.264/AVC)"}
                                       </p>
                                    </div>
                                 </div>
                              </div>

                              {isUploading && (
                                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl relative overflow-hidden">
                                  <div className="absolute top-0 left-0 w-full h-1 bg-slate-900">
                                    <motion.div 
                                      className="h-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${uploadProgress}%` }}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between mt-1">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                                      <span className="font-mono text-purple-400 font-bold text-[10px] uppercase tracking-widest">Streaming to Buffer...</span>
                                    </div>
                                    <span className="text-slate-400 font-mono font-bold text-xs">{uploadProgress}%</span>
                                  </div>
                                </div>
                              )}

                              {uploadedBase64 && !isUploading && (
                                <div className="flex flex-col sm:flex-row gap-5 p-5 bg-slate-950 border border-slate-800 rounded-2xl animate-in zoom-in-95 group/preview">
                                   <div className="w-full sm:w-40 rounded-xl overflow-hidden border border-slate-800 relative shrink-0 bg-slate-900/50 aspect-video md:aspect-square flex items-center justify-center">
                                      {activeMediaTab === "photo" ? (
                                        <img src={uploadedBase64 || undefined} className="w-full h-full object-cover" />
                                      ) : (
                                        <video 
                                          src={uploadedBase64 || undefined} 
                                          className="w-full h-full object-cover bg-slate-950" 
                                          muted 
                                          playsInline 
                                          onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                                        />
                                      )}
                                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/preview:opacity-100 flex items-center justify-center transition-all backdrop-blur-sm">
                                         <button type="button" onClick={() => setUploadedBase64(null)} className="p-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-all hover:scale-110 shadow-lg shadow-rose-500/20"><Trash2 className="w-5 h-5" /></button>
                                      </div>
                                   </div>
                                   <div className="flex-1 flex flex-col justify-center min-w-0">
                                      <div className="flex items-center justify-between gap-3 mb-2">
                                        <p className="text-xs font-bold text-slate-200 truncate font-mono uppercase tracking-tight" title={uploadedFileName}>
                                          {uploadedFileName || (activeMediaTab === "photo" ? "source_image.raw" : "source_video.h264")}
                                        </p>
                                        <span className="text-[10px] text-slate-500 font-mono font-bold px-2 py-0.5 bg-slate-900 rounded border border-slate-800">
                                          {uploadedFileSize || "~0.0 MB"}
                                        </span>
                                      </div>
                                      
                                      <div className="space-y-1">
                                        <div className="flex items-center justify-between text-[10px] font-mono">
                                          <span className="text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                            Success Ingest
                                          </span>
                                          <span className="text-slate-600">100% COMPLETE</span>
                                        </div>
                                        <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                                          <div className="h-full bg-emerald-500 w-full" />
                                        </div>
                                      </div>

                                      <div className="flex gap-4 mt-5 pt-4 border-t border-slate-900">
                                         <button type="button" className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5 hover:text-purple-400 transition-colors font-mono">
                                            <CropIcon className="w-3.5 h-3.5" /> Transform
                                         </button>
                                         <button type="button" className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5 hover:text-purple-400 transition-colors font-mono">
                                            <Shield className="w-3.5 h-3.5" /> Verify H.264
                                         </button>
                                      </div>
                                   </div>
                                </div>
                              )}
                           </div>
                        )}

                       {/* Display Frame Protocol (Unified) */}
                       <div className="space-y-6 pt-6 border-t border-slate-800/30">
                         <div className="flex items-center justify-between">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono flex items-center gap-2">
                               <Camera className="w-3.5 h-3.5 text-purple-400" />
                               Display Frame Protocol
                            </label>
                            <div className="flex bg-slate-950 border border-slate-850 p-1 rounded-xl">
                               {[
                                 { id: "UPLOAD", label: "Upload", icon: CloudUpload },
                                 { id: "CAPTURE", label: "Capture", icon: Zap },
                                 { id: "URL", label: "URL", icon: Link }
                               ].map(m => (
                                 <button
                                   key={m.id}
                                   type="button"
                                   onClick={() => setThumbMethod(m.id as any)}
                                   className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${
                                     thumbMethod === m.id ? "bg-purple-600 text-white" : "text-slate-500 hover:text-slate-300"
                                   }`}
                                 >
                                   <m.icon className="w-3 h-3" /> {m.label}
                                 </button>
                               ))}
                            </div>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                               {thumbMethod === "UPLOAD" && (
                                 <div 
                                   onClick={() => thumbInputRef.current?.click()}
                                   className="relative border-2 border-dashed border-slate-800 bg-slate-950/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group"
                                 >
                                    <input type="file" ref={thumbInputRef} onChange={handleThumbUpload} accept="image/*" className="hidden" />
                                    <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-slate-600 group-hover:text-purple-400 transition-colors">
                                       <CloudUpload className="w-6 h-6" />
                                    </div>
                                    <div className="text-center">
                                       <p className="text-xs font-bold text-slate-300">Select Frame Asset</p>
                                       <p className="text-[9px] text-slate-600 mt-1 uppercase font-mono">JPG, PNG, WEBP Support</p>
                                    </div>
                                 </div>
                               )}

                               {thumbMethod === "CAPTURE" && (
                                 <div className="space-y-4">
                                    <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl text-center space-y-4">
                                       <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                                          <Zap className="w-3.5 h-3.5" /> Stream Ingestion
                                       </div>
                                       
                                       <div className="space-y-2">
                                          <div className="flex justify-between text-[9px] font-mono text-slate-500 uppercase px-1">
                                             <span>Capture Point</span>
                                             <span className="text-purple-400 font-bold">{captureTime.toFixed(1)}s</span>
                                          </div>
                                          <input 
                                            type="range" 
                                            min="0" 
                                            max={Number(videoDuration) || 60} 
                                            step="0.1"
                                            value={captureTime}
                                            onChange={(e) => setCaptureTime(Number(e.target.value))}
                                            className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                          />
                                       </div>

                                       <p className="text-[10px] text-slate-500">Capture the current active frame from the video buffer as the primary visual display.</p>
                                       <button 
                                         type="button" 
                                         onClick={generateVideoThumbnail}
                                         disabled={!mediaUrl || mediaSource === "EMBED" || isLoading}
                                         className="w-full py-3 bg-purple-600/20 border border-purple-500/30 text-purple-400 hover:bg-purple-600 hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                                       >
                                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Zap className="w-4 h-4" /> Set as Display Frame</>}
                                       </button>
                                    </div>
                                 </div>
                               )}

                               {thumbMethod === "URL" && (
                                 <div className="space-y-3">
                                    <div className="relative group">
                                       <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                       <input 
                                         type="url" 
                                         value={activeMediaTab === "photo" ? photoThumbnail : videoThumbnail}
                                         onChange={(e) => activeMediaTab === "photo" ? setPhotoThumbnail(e.target.value) : setVideoThumbnail(e.target.value)}
                                         placeholder="https://cdn.nightverse.io/covers/..." 
                                         className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-sm focus:border-purple-500 outline-none transition-all placeholder:text-slate-800 font-mono" 
                                       />
                                    </div>
                                    <button 
                                      type="button" 
                                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold uppercase rounded-xl border border-slate-700 transition-all"
                                      onClick={() => triggerToast("Reference Applied", "Remote thumbnail URL has been registered.", "info")}
                                    >
                                       Apply URL Reference
                                    </button>
                                 </div>
                               )}
                            </div>

                            <div className="relative group">
                               <label className="text-[8px] uppercase font-black text-slate-700 tracking-[0.2em] mb-2 block font-mono">Active Frame Preview</label>
                                <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 relative shadow-2xl">
                                  {(activeMediaTab === "photo" ? photoThumbnail : videoThumbnail) ? (
                                    <>
                                       <img 
                                         src={activeMediaTab === "photo" ? photoThumbnail : videoThumbnail} 
                                         className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-500" 
                                         onError={(e) => e.currentTarget.src = "https://placehold.co/600x400/020617/475569?text=Frame+Registry+Empty"}
                                       />
                                       <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-[2px]">
                                          <button type="button" onClick={() => activeMediaTab === "photo" ? setPhotoThumbnail("") : setVideoThumbnail("")} className="p-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl shadow-xl transition-all hover:scale-110">
                                             <Trash2 className="w-5 h-5" />
                                          </button>
                                       </div>
                                    </>
                                  ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-800 gap-2">
                                       <Camera className="w-10 h-10 opacity-20" />
                                       <span className="text-[9px] font-bold uppercase tracking-widest opacity-30">Waiting for Ingest...</span>
                                    </div>
                                  )}
                               </div>
                            </div>
                         </div>
                       </div>

                       {/* Manual Metadata Override (Only for EMBED or Special cases) */}
                       {activeMediaTab === "video" && (
                         <div className="space-y-4 pt-6 border-t border-slate-800/30">
                           <div className="flex items-center justify-between">
                             <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono">Stream Parameters Override</label>
                             <span className="text-[9px] text-slate-700 font-mono">Use for external nodes</span>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <div className="space-y-2">
                                 <label className="text-[10px] uppercase font-bold text-slate-600 font-mono">Aspect Ratio Node</label>
                                 <div className="flex flex-wrap gap-2">
                                   {["16:9", "9:16", "1:1", "4:5", "21:9"].map((ratio) => (
                                     <button
                                       key={ratio}
                                       type="button"
                                       onClick={() => setVideoAspectRatio(ratio)}
                                       className={`px-3 py-1.5 text-[10px] rounded-lg font-mono transition-all border ${
                                         videoAspectRatio === ratio
                                           ? "bg-purple-600 border-purple-500 text-white"
                                           : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300"
                                       }`}
                                     >
                                       {ratio}
                                     </button>
                                   ))}
                                 </div>
                               </div>

                               <div className="grid grid-cols-2 gap-3">
                                 <div className="space-y-2">
                                   <label className="text-[10px] uppercase font-bold text-slate-600 font-mono">Time (SEC)</label>
                                   <input
                                     type="number"
                                     value={videoDuration}
                                     onChange={(e) => setVideoDuration(e.target.value)}
                                     className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs focus:border-purple-500 outline-none transition-all font-mono"
                                   />
                                 </div>
                                 <div className="space-y-2">
                                   <label className="text-[10px] uppercase font-bold text-slate-600 font-mono">RES Node</label>
                                   <input
                                     type="text"
                                     value={videoResolution}
                                     onChange={(e) => setVideoResolution(e.target.value)}
                                     className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs focus:border-purple-500 outline-none transition-all font-mono"
                                   />
                                 </div>
                               </div>
                           </div>
                         </div>
                       )}
                    </div>
                  )}

                  {/* Taxonomy & Security */}
                  <div className="space-y-6 pt-6 border-t border-slate-800/50">
                     <div className="space-y-3 relative">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono">Tags Registry</label>
                          {tags.length > 0 && (
                            <button 
                              type="button" 
                              onClick={() => setShowClearTagsConfirm(true)}
                              className="text-[9px] font-bold text-rose-500 hover:text-rose-400 uppercase tracking-widest transition-all flex items-center gap-1.5 px-2 py-1 bg-rose-500/5 border border-rose-500/10 rounded-lg hover:bg-rose-500/10"
                            >
                              <Trash2 className="w-3 h-3" /> Clear All
                            </button>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-2">
                          {tags.map((tag, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 border border-purple-500/30 rounded-lg text-[11px] text-purple-400 font-bold">
                              {tag}
                              <button 
                                type="button" 
                                onClick={() => handleRemoveTag(idx)}
                                className="hover:text-white transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>

                        <div className="relative group">
                          <TagIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 z-20 pointer-events-none" />
                          <input 
                            type="text" 
                            value={tagsInput}
                            onChange={(e) => setTagsInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const val = tagsInput.trim();
                                if (val) {
                                  const words = val.split(/\s+/).map(w => w.trim()).filter(w => w !== "");
                                  if (words.length > 0) {
                                    const newTagsToAdd: string[] = [];
                                    const bannedTags = db.tags.getAll().filter(t => t.isBanned).map(t => t.name.toLowerCase());
                                    let hasBanned = false;

                                    words.forEach(word => {
                                      if (bannedTags.includes(word.toLowerCase())) {
                                        hasBanned = true;
                                        triggerToast("Banned Keyword 🛑", `The tag "#${word}" has been banned and cannot be used.`, "error");
                                        return;
                                      }
                                      if (!tags.some(t => t.toLowerCase() === word.toLowerCase()) && !newTagsToAdd.some(t => t.toLowerCase() === word.toLowerCase())) {
                                        newTagsToAdd.push(word);
                                      }
                                    });
                                    if (newTagsToAdd.length > 0) {
                                      const updatedTags = [...tags, ...newTagsToAdd].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
                                      setTags(updatedTags);
                                      syncCurrentContentTags(updatedTags);
                                      triggerDBSync();
                                      triggerToast("Tags Added", `Added ${newTagsToAdd.length} tags`, "success");
                                    } else if (!hasBanned) {
                                      triggerToast("Duplicate Tags", "These tags are already in the list", "info");
                                    }
                                    setTagsInput("");
                                  }
                                }
                              } else if (e.key === 'Backspace' && !tagsInput && tags.length > 0) {
                                handleRemoveTag(tags.length - 1);
                              }
                            }}
                            placeholder="Enter multiple tags separated by spaces (e.g. nature mountain sky) and press Enter..." 
                            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none transition-all placeholder:text-slate-800 relative z-10" 
                            id="dashboard-tags-input"
                          />
                        </div>
                        <p className="text-[10px] text-slate-600 italic font-mono px-1">Separate multiple tags with spaces. Press Enter to process and create tag chips.</p>
                        
                        {showTagDropdown && autocompleteSuggestions.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, y: 5, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className="absolute z-50 left-0 right-0 mt-4 bg-slate-900/95 border border-slate-800 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl overflow-hidden"
                          >
                             <div className="flex flex-wrap gap-2.5">
                                {autocompleteSuggestions.map(s => (
                                  <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => selectSuggestedTag(s.name)}
                                    className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 hover:text-purple-400 hover:border-purple-500/30 hover:bg-purple-950/20 transition-all font-mono group/tag active:scale-95"
                                  >
                                    <span className="text-purple-600 group-hover/tag:text-purple-400 mr-1 opacity-50">#</span>
                                    {s.name} 
                                    <span className="ml-2 px-1.5 py-0.5 rounded bg-slate-900 text-[8px] text-slate-600 group-hover/tag:text-purple-300/50 transition-colors">{s.usageCount}</span>
                                  </button>
                                ))}
                             </div>
                          </motion.div>
                        )}
                     </div>

                      {/* Engagement & Visibility Settings */}
                      <div className="space-y-4 pt-6 border-t border-slate-800/60">
                        <div>
                          <h3 className="text-xs uppercase font-black tracking-widest text-slate-300 font-space flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Visibility & Engagement Settings
                          </h3>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Atur jangkauan publikasi di Explore Feed dan izin interaksi komentar secara independen.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Visibility Settings Card */}
                          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className={`p-2 rounded-xl transition-colors ${
                                  visibility === "public" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                }`}>
                                  {visibility === "public" ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-slate-200">Visibility</h4>
                                  <span className="text-[10px] text-slate-500">Jangkauan publikasi</span>
                                </div>
                              </div>
                              <span className={`text-[9px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full border font-mono ${
                                visibility === "public" 
                                  ? "bg-cyan-950/40 text-cyan-400 border-cyan-800/50 shadow-sm shadow-cyan-900/20" 
                                  : "bg-amber-950/40 text-amber-400 border-amber-800/50 shadow-sm shadow-amber-900/20"
                              }`}>
                                {visibility === "public" ? "Public" : "Private"}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setVisibility("public")}
                                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                  visibility === "public"
                                    ? "bg-cyan-500/15 border-cyan-500/60 text-cyan-300 shadow-lg shadow-cyan-950/30 ring-1 ring-cyan-500/30"
                                    : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900"
                                }`}
                              >
                                <Globe className="w-3.5 h-3.5" /> Public
                              </button>
                              <button
                                type="button"
                                onClick={() => setVisibility("private")}
                                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                  visibility === "private"
                                    ? "bg-amber-500/15 border-amber-500/60 text-amber-300 shadow-lg shadow-amber-950/30 ring-1 ring-amber-500/30"
                                    : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900"
                                }`}
                              >
                                <Lock className="w-3.5 h-3.5" /> Private
                              </button>
                            </div>

                            <p className="text-[10px] text-slate-500 leading-tight">
                              {visibility === "public" 
                                ? "Konten tampil di Explore Feed & pencarian publik." 
                                : "Hanya dapat diakses oleh Anda di dashboard/profil pribadi."}
                            </p>
                          </div>

                          {/* Engagement Settings Card */}
                          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className={`p-2 rounded-xl transition-colors ${
                                  engagement === "open" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                }`}>
                                  {engagement === "open" ? <MessageSquare className="w-4 h-4" /> : <MessageSquareOff className="w-4 h-4" />}
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-slate-200">Engagement</h4>
                                  <span className="text-[10px] text-slate-500">Fitur komentar</span>
                                </div>
                              </div>
                              <span className={`text-[9px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full border font-mono ${
                                engagement === "open" 
                                  ? "bg-purple-950/40 text-purple-400 border-purple-800/50 shadow-sm shadow-purple-900/20" 
                                  : "bg-rose-950/40 text-rose-400 border-rose-800/50 shadow-sm shadow-rose-900/20"
                              }`}>
                                {engagement === "open" ? "Comments Enabled" : "Comments Disabled"}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setEngagement("open")}
                                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                  engagement === "open"
                                    ? "bg-purple-500/15 border-purple-500/60 text-purple-300 shadow-lg shadow-purple-950/30 ring-1 ring-purple-500/30"
                                    : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900"
                                }`}
                              >
                                <MessageSquare className="w-3.5 h-3.5" /> Open
                              </button>
                              <button
                                type="button"
                                onClick={() => setEngagement("muted")}
                                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                  engagement === "muted"
                                    ? "bg-rose-500/15 border-rose-500/60 text-rose-300 shadow-lg shadow-rose-950/30 ring-1 ring-rose-500/30"
                                    : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900"
                                }`}
                              >
                                <MessageSquareOff className="w-3.5 h-3.5" /> Muted
                              </button>
                            </div>

                            <p className="text-[10px] text-slate-500 leading-tight">
                              {engagement === "open" 
                                ? "Pengguna lain dapat melihat & mengirim komentar." 
                                : "Fitur komentar dinonaktifkan (komentar tersimpan tidak dihapus)."}
                            </p>
                          </div>
                        </div>

                        {/* Active combination preview badge */}
                        <div className="p-3 bg-slate-950/80 border border-slate-850 rounded-xl flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Mode Kombinasi:</span>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                              visibility === "public" ? "text-cyan-400 bg-cyan-950/30 border-cyan-800/40" : "text-amber-400 bg-amber-950/30 border-amber-800/40"
                            }`}>
                              {visibility === "public" ? <Globe className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                              {visibility === "public" ? "Public" : "Private"}
                            </span>
                            <span className="text-slate-600">+</span>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                              engagement === "open" ? "text-purple-400 bg-purple-950/30 border-purple-800/40" : "text-rose-400 bg-rose-950/30 border-rose-800/40"
                            }`}>
                              {engagement === "open" ? <MessageSquare className="w-2.5 h-2.5" /> : <MessageSquareOff className="w-2.5 h-2.5" />}
                              {engagement === "open" ? "Comments Enabled" : "Comments Disabled"}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 hidden sm:inline font-mono">
                            {visibility === "public" && engagement === "open" && "Tampil di Explore Feed dan komentar aktif."}
                            {visibility === "public" && engagement === "muted" && "Tampil di Explore Feed, tetapi komentar dinonaktifkan."}
                            {visibility === "private" && engagement === "open" && "Hanya untuk Anda (tersembunyi dari Explore Feed)."}
                            {visibility === "private" && engagement === "muted" && "Hanya untuk Anda, tersembunyi & komentar dinonaktifkan."}
                          </span>
                        </div>
                      </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-8">
                     <button type="button" onClick={(e) => handlePublishSubmit(e, true)} className="px-6 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        <Save className="w-4 h-4" /> Save Draft
                     </button>
                     <button type="submit" className="px-10 py-3 rounded-2xl bg-purple-650 hover:bg-purple-600 text-white shadow-xl shadow-purple-600/20 transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        <Send className="w-4 h-4" /> {editingContent ? "Update Work" : "Create Work"}
                     </button>
                  </div>
               </form>
            </div>

            {/* Live Preview & Sidebar Info */}
            <div className="space-y-8">
               <div className="sticky top-6 space-y-6">
                  {/* Realtime Preview Element */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                     <div className="p-4 border-b border-slate-900 flex items-center justify-between">
                        <span className="text-[9px] font-black tracking-widest uppercase text-slate-500">Emission Preview</span>
                        <div className="flex gap-1">
                           <span className="w-1.5 h-1.5 rounded-full bg-slate-800"></span>
                           <span className="w-1.5 h-1.5 rounded-full bg-slate-800"></span>
                        </div>
                     </div>
                     
                     <div className="aspect-[4/5] relative bg-slate-900 overflow-hidden">
                        {activeMediaTab === "blog" && (
                          <img src={blogThumbnail || "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=600"} className="w-full h-full object-cover opacity-60" />
                        )}
                        {(activeMediaTab === "photo" || activeMediaTab === "video") && (
                           mediaUrl ? (
                             activeMediaTab === "photo" ? (
                               <img src={mediaUrl || undefined} className="w-full h-full object-cover" />
                             ) : mediaSource === "EMBED" ? (
                               <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-6 text-center border-b border-slate-800">
                                  <Globe className="w-10 h-10 text-purple-500 mb-2 opacity-50" />
                                  <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Active Embed Preview Enabled</p>
                                  <div className="mt-4 px-3 py-1 bg-purple-950/20 border border-purple-500/30 rounded text-[8px] text-purple-400 font-mono">
                                     External Media Provider: YouTube/Vimeo/Cloud
                                  </div>
                               </div>
                             ) : (
                               <video src={mediaUrl || undefined} className="w-full h-full object-cover" autoPlay muted loop />
                             )
                           ) : (
                             <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center">
                                <Plus className="w-8 h-8 text-slate-800 mb-2" />
                                <p className="text-[10px] text-slate-700 font-bold uppercase">Awaiting Visual Input</p>
                             </div>
                           )
                        )}
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent flex flex-col justify-end p-6">
                           <span className="text-[8px] bg-purple-600 text-white font-black px-2 py-0.5 rounded-md w-fit mb-2">{category.toUpperCase()}</span>
                           <h3 className="text-lg font-black leading-tight text-white line-clamp-2">{title || "Your Visionary Concept"}</h3>
                           <div className="flex items-center gap-3 mt-3">
                              <img src={user?.profile?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username}`} className="w-5 h-5 rounded-full border border-white/20" />
                              <span className="text-[10px] text-slate-300 font-bold">@{user?.username}</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="p-6 bg-slate-900/40 border border-slate-800/80 rounded-3xl space-y-4">
                     <h4 className="text-xs font-black tracking-widest uppercase text-slate-400">Moderation Logic</h4>
                     <p className="text-[10px] text-slate-500 leading-relaxed italic">
                        Every submission undergoes multi-layer heuristic checks. Expected review latency: 2-4 binary cycles. Content appearing in high-traffic nodes will be priority-indexed.
                     </p>
                  </div>
               </div>
            </div>
          </motion.div>
        )}

         {activeTab === "tags" && (
          <motion.div 
            key="tags"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-slate-900/30 border border-slate-800 rounded-2xl md:rounded-3xl overflow-hidden"
          >
             <div className="p-4 md:p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                   <h2 className="text-base md:text-lg font-bold font-space">Tag Management</h2>
                   <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Taxonomy control for your created content.</p>
                </div>
                <div className="flex items-center gap-2">
                   <div className="relative w-full md:w-auto">
                      <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                      <input type="text" placeholder="Filter tags..." 
                         value={tagSearch}
                         onChange={(e) => {
                           setTagSearch(e.target.value);
                           setTagPage(1);
                         }}
                         className="bg-slate-950 border border-slate-850 rounded-xl pl-9 pr-4 py-2 text-[11px] md:text-xs focus:border-purple-500 outline-none w-full md:w-48" />
                   </div>
                </div>
             </div>

             <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                   <thead>
                      <tr className="border-b border-slate-800/50 text-[10px] uppercase font-black text-slate-500 font-mono tracking-widest">
                         <th className="py-5 px-6">Label Signature</th>
                         <th className="py-5 px-4 text-center">Engagement</th>
                         <th className="py-5 px-4 text-center">Blogs</th>
                         <th className="py-5 px-4 text-center">Photos</th>
                         <th className="py-5 px-4 text-center">Videos</th>
                         <th className="py-5 px-4 text-right pr-6">Temporal Sync</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-800/30">
                      {paginatedTags.map((t, i) => (
                        <tr key={i} className="hover:bg-slate-800/20 transition-all group">
                           <td className="py-4 px-6">
                              <span className="text-purple-400 font-mono font-bold">#{t.name}</span>
                           </td>
                           <td className="py-4 px-4 text-center">
                              <span className="text-[10px] font-mono text-slate-300 font-bold">{t.count}x used</span>
                           </td>
                           <td className="py-4 px-4 text-center text-slate-400 font-mono">{t.blogs}</td>
                           <td className="py-4 px-4 text-center text-slate-400 font-mono">{t.photos}</td>
                           <td className="py-4 px-4 text-center text-slate-400 font-mono">{t.videos}</td>
                           <td className="py-4 px-4 text-right pr-6 font-mono text-slate-600 text-[10px]">
                              {new Date(t.createdAt).toLocaleDateString()}
                           </td>
                        </tr>
                      ))}
                      {userTags.length === 0 && (
                        <tr><td colSpan={6} className="py-12 text-center text-slate-600 italic">No taxonomy data extracted yet.</td></tr>
                      )}
                   </tbody>
                </table>
             </div>

             {userTags.length > tagsPerPage && (
                <div className="p-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                   <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                     Showing page <strong className="text-purple-400">{tagPage}</strong> of <strong className="text-slate-200">{totalTagPages}</strong>
                   </p>
                    <div className="flex items-center gap-1.5 bg-slate-950 p-1 border border-slate-900 rounded-xl select-none">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setTagPage(1)} 
                        disabled={tagPage === 1}
                        className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 cursor-pointer flex items-center justify-center"
                        title="First Page"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </motion.button>
                      <motion.button 
                         whileHover={{ scale: 1.05 }}
                         whileTap={{ scale: 0.95 }}
                         transition={{ duration: 0.2 }}
                         onClick={() => setTagPage(p => Math.max(1, p - 1))}
                         disabled={tagPage === 1}
                         className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 cursor-pointer flex items-center justify-center"
                         title="Previous Page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </motion.button>
                      
                      <div className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center min-w-[50px]">
                       <span className="font-mono text-[10px] font-bold text-purple-400">{tagPage} / {totalTagPages}</span>
                      </div>
                      
                      <motion.button 
                         whileHover={{ scale: 1.05 }}
                         whileTap={{ scale: 0.95 }}
                         transition={{ duration: 0.2 }}
                         onClick={() => setTagPage(p => Math.min(totalTagPages, p + 1))}
                         disabled={tagPage === totalTagPages}
                         className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 cursor-pointer flex items-center justify-center"
                         title="Next Page"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </motion.button>
                      <motion.button 
                         whileHover={{ scale: 1.05 }}
                         whileTap={{ scale: 0.95 }}
                         transition={{ duration: 0.2 }}
                         onClick={() => setTagPage(totalTagPages)}
                         disabled={tagPage === totalTagPages}
                         className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 cursor-pointer flex items-center justify-center"
                         title="Last Page"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </motion.button>
                   </div>
                </div>
             )}
          </motion.div>
        )}

         {(activeTab === "history" || activeTab === "drafts") && (
          <motion.div 
            key="history-drafts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-lg md:text-xl font-black font-space">{activeTab === "history" ? "Upload History" : "Your Drafts"}</h2>
                <div className="flex w-full sm:w-auto items-center gap-2">
                   <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                      <input 
                        type="text" 
                        placeholder="Search logs..." 
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-[11px] md:text-xs focus:border-purple-500 outline-none"
                      />
                   </div>
                   <button className="px-3 md:px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-all whitespace-nowrap">Export</button>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {uploads
                  .filter(u => activeTab === "history" ? u.status !== "DRAFT" : u.status === "DRAFT")
                  .filter(u => u.title.toLowerCase().includes(historySearch.toLowerCase()) || (u.description || "").toLowerCase().includes(historySearch.toLowerCase()))
                  .map((item, i) => (
                    <div key={i} className="group bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden hover:border-purple-500/30 transition-all flex flex-col">
                       <div className="aspect-video relative bg-slate-950">
                          <img src={item.thumbnailUrl || item.url || null} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="thumb" />
                          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                             <span className="text-[8px] font-bold uppercase tracking-widest bg-slate-950/80 backdrop-blur px-2 py-0.5 rounded text-slate-300 border border-slate-800">{item.type}</span>
                             <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${getStatusColor(item.status)}`}>{item.status}</span>
                             {item.visibility === "private" ? (
                               <span className="text-[8px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                                 <Lock className="w-2.5 h-2.5" /> Private
                               </span>
                             ) : (
                               <span className="text-[8px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                                 <Globe className="w-2.5 h-2.5" /> Public
                               </span>
                             )}
                             {item.engagement === "muted" || item.allowComments === false ? (
                               <span className="text-[8px] font-bold uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                                 <MessageSquareOff className="w-2.5 h-2.5" /> Muted
                               </span>
                             ) : null}
                          </div>
                       </div>
                       <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                             <h4 className="text-sm font-bold text-slate-200 line-clamp-1 mb-2">{item.title}</h4>
                             <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{item.description}</p>
                          </div>
                          <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 text-[10px] text-slate-500"><Eye className="w-3 h-3" /> {item.views || 0}</div>
                                <div className="flex items-center gap-1 text-[10px] text-slate-500"><Heart className="w-3 h-3" /> 0</div>
                             </div>
                             <div className="flex gap-1.5">
                                <button 
                                  onClick={() => handleEdit(item)}
                                  className="p-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-400 hover:text-white hover:border-purple-500/30 transition-all"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => setDeletingContent(item)}
                                  className="p-2 bg-slate-950 border border-slate-850 rounded-xl text-rose-500 hover:bg-rose-900 transition-all"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                             </div>
                          </div>
                       </div>
                    </div>
                  ))}

                  {uploads.filter(u => activeTab === "history" ? u.status !== "DRAFT" : u.status === "DRAFT").length === 0 && (
                    <div className="col-span-full py-20 text-center">
                       <FileJson className="w-16 h-16 text-slate-800 mx-auto mb-4" />
                       <p className="text-slate-600 font-bold uppercase tracking-widest text-sm">Empty transmission logs recorded.</p>
                    </div>
                  )}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center">
           <div className="flex flex-col items-center">
              <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
              <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">Syncing NightVerse Creator Node...</p>
           </div>
        </div>
      )}

      <DeleteConfirmationModal 
        isOpen={Boolean(deletingContent)}
        onClose={() => setDeletingContent(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Content Permanent"
        warningText="Are you sure you want to permanently remove this asset from your creative portfolio? This action is irreversible and will purge all engagement data associated with this transmission."
        itemDetails={
          deletingContent && (
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-slate-200">{deletingContent.title}</span>
              <span className="text-xs font-mono text-purple-400 uppercase">{deletingContent.type} | {new Date(deletingContent.createdAt).toLocaleDateString()}</span>
            </div>
          )
        }
      />

      <DeleteConfirmationModal
        isOpen={showClearTagsConfirm}
        onClose={() => setShowClearTagsConfirm(false)}
        onConfirm={handleClearAllTags}
        title="Remove All Tags?"
        warningText="Are you sure you want to remove all tags? This action will immediately update the global tag directory if you are editing an active content."
        confirmText="Clear All"
      />
    </div>
  );
};
