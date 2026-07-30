import React, { useState, useEffect, useMemo } from "react";
import { 
  Compass, 
  Filter, 
  Sparkles, 
  MessageSquare, 
  Heart, 
  RefreshCw, 
  ArrowUpRight, 
  Search, 
  ChevronsLeft, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsRight, 
  Eye, 
  Tag, 
  Clock, 
  SlidersHorizontal,
  TrendingUp,
  Grid,
  Trash,
  Users,
  MoreVertical,
  ExternalLink,
  Copy,
  X,
  Video,
  Camera,
  FileText
} from "lucide-react";
import { useAppState } from "../context/AppState.js";
import { motion, AnimatePresence } from "motion/react";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal.js";
import { db } from "../lib/db.js";
import { RoleBadge } from "./RoleBadge.js";

type SortOption = "VIEWS" | "LIKES" | "COMMENTS" | "NEWEST" | "OLDEST" | "UPDATED";

const ExpandableDescription: React.FC<{ text: string }> = ({ text }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!text) return null;
  
  return (
    <div className="space-y-1.5">
      <p className={`text-xs text-slate-450 leading-relaxed font-sans whitespace-pre-wrap ${!isExpanded ? 'line-clamp-3 md:line-clamp-3' : ''}`}>
        {text}
      </p>
      {text.length > 100 && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="text-[10px] font-bold text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-widest cursor-pointer"
        >
          {isExpanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
};

const getAspectRatioClass = (ratio?: string) => {
  switch (ratio) {
    case "16:9": return "aspect-video";
    case "9:16": return "aspect-[9/16]";
    case "1:1": return "aspect-square";
    case "4:5": return "aspect-[4/5]";
    case "21:9": return "aspect-[21/9]";
    default: return "aspect-video";
  }
};

interface ExploreCardProps {
  item: any;
  onSelect: () => void;
  onAdminDelete: (e: React.MouseEvent, item: any) => void;
}

const ExploreCard: React.FC<ExploreCardProps> = ({ item, onSelect, onAdminDelete }) => {
  const { user, viewProfile, triggerToast } = useAppState();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    
    const assetUrl = `${window.location.origin}/?asset=${item.id}`;
    navigator.clipboard.writeText(assetUrl)
      .then(() => {
        triggerToast("Link Copied", "Link to this creation has been copied to clipboard", "success");
      })
      .catch(() => {
        triggerToast("Failed to Copy", "Could not copy link", "error");
      });
  };

  return (
    <div 
      onClick={onSelect}
      className="relative group bg-slate-900/30 border border-slate-900 hover:border-purple-650 rounded-xl md:rounded-2xl overflow-hidden cursor-pointer hover:shadow-2xl hover:shadow-purple-950/30 active:scale-[0.99] transition-all duration-300 flex flex-col h-full"
    >
      {/* Media viewport content visual */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-950 shrink-0">
        {item.itemType === "blog" && (
          <img 
            src={item.thumbnailUrl || undefined} 
            alt={item.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85" 
          />
        )}
        {item.itemType === "photo" && (
          <img 
            src={item.url || undefined} 
            alt={item.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
        )}
        {item.itemType === "video" && (
          <div className="relative w-full h-full">
            <img 
              src={item.thumbnailUrl || undefined} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85" 
              alt={item.title} 
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <span className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-650 text-white flex items-center justify-center font-mono shadow-md group-hover:scale-110 transition-all duration-300 text-[10px] md:text-xs">▶</span>
            </div>
          </div>
        )}

        {/* Segment indicator stamp badges */}
        <span className={`absolute top-2.5 left-2.5 text-[8px] md:text-[9px] font-black tracking-widest font-mono py-0.5 px-2 rounded uppercase select-none shadow-md z-10 ${
          item.itemType === "blog" ? "bg-cyan-950/95 text-cyan-300 border border-cyan-800/40" : 
          (item.itemType === "photo" ? "bg-purple-950/95 text-purple-300 border border-purple-800/40" : "bg-indigo-950/95 text-indigo-300 border border-indigo-800/40")
        }`}>
          {item.itemType}
        </span>

        {/* Menu (⋮) Trigger Button */}
        <button
          onClick={toggleMenu}
          className="absolute top-2.5 right-2.5 w-7 h-7 md:w-8 md:h-8 rounded-lg bg-black/50 hover:bg-slate-950 border border-slate-800 hover:border-purple-500/50 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-md z-20"
          title="More Options"
        >
          <MoreVertical className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </button>

        {/* Dropdown Menu Overlay */}
        {isMenuOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }} />
            <div className="absolute right-2 top-11 w-44 bg-slate-950/95 border border-slate-800 rounded-xl shadow-2xl z-40 py-1 text-[11px] font-mono animate-in fade-in zoom-in-95 duration-100 backdrop-blur-md">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                  onSelect();
                }}
                className="w-full text-left px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-900/60 flex items-center gap-2 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-purple-400" /> Open Details
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                  viewProfile(item.userId);
                }}
                className="w-full text-left px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-900/60 flex items-center gap-2 transition-colors"
              >
                <Users className="w-3.5 h-3.5 text-blue-400" /> View Creator
              </button>
              <button
                onClick={handleCopyLink}
                className="w-full text-left px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-900/60 flex items-center gap-2 transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-cyan-400" /> Copy Link
              </button>
              {user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN" || user.role === "MODERATOR") && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    onAdminDelete(e, item);
                  }}
                  className="w-full text-left px-3 py-2 text-rose-400 hover:text-white hover:bg-rose-950/60 border-t border-slate-900 flex items-center gap-2 transition-colors mt-1"
                >
                  <Trash className="w-3.5 h-3.5 text-rose-500" /> Direct Purge
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Description metadata footer */}
      <div className="p-3 md:p-4 flex-1 flex flex-col justify-between bg-slate-950/20">
        <div className="space-y-1">
          <h4 className="font-extrabold text-[11px] md:text-sm text-slate-100 group-hover:text-purple-400 transition-colors leading-tight line-clamp-2 min-h-[32px] md:min-h-[40px] select-none">
            {item.title}
          </h4>
          <p 
            onClick={(e) => {
              e.stopPropagation();
              viewProfile(item.userId);
            }}
            className="text-[10px] md:text-xs text-slate-450 hover:text-purple-450 transition-colors truncate font-sans cursor-pointer"
          >
            @{item.authorName}
          </p>
        </div>

        <div className="mt-2 md:mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3 text-purple-400" />
            <span>{item.views || 0}</span>
          </span>
          
          <div className="flex gap-1.5 md:gap-2 items-center select-none">
            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-950/50 border border-slate-850 rounded-lg">
              <Heart className="w-3 h-3 text-rose-500" /> 
              <span className="font-bold text-slate-300">{item.likesCount || 0}</span>
            </span>
            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-950/50 border border-slate-850 rounded-lg">
              <MessageSquare className="w-3 h-3 text-purple-400" /> 
              <span className="font-bold text-slate-300">{item.comments?.length || 0}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ExploreFeed: React.FC = () => {
  const { user, triggerToast, setFocusedContent, viewProfile, followActionCount, toggleFollow, dbActionCount } = useAppState();

  const [activeSegment, setActiveSegment] = useState<"ALL" | "BLOG" | "PHOTO" | "VIDEO">("ALL");
  const [filterQuery, setFilterQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Smart tag search states
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  
  // Click outside dropdown handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [followedUserIds, setFollowedUserIds] = useState<Set<string>>(new Set());

  // Sorting state fields
  const [sortBy, setSortBy] = useState<SortOption>("NEWEST");

  const [blogs, setBlogs] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [matchedUsers, setMatchedUsers] = useState<any[]>([]);

  // Update followed tracking
  useEffect(() => {
    if (user) {
      const following = db.follows.getFollowing(user.id);
      setFollowedUserIds(new Set(following));
    }
  }, [user, followActionCount]);

  const handleFollowClick = async (e: React.MouseEvent, targetId: string) => {
    e.stopPropagation();
    await toggleFollow(targetId);
  };

  // Modal deletion override scopes
  const [contentToDelete, setContentToDelete] = useState<any>(null);

  const startAdminDelete = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    setContentToDelete(item);
  };

  const confirmAdminDelete = () => {
    if (!contentToDelete) return;
    
    // Perform local database deletion
    if (contentToDelete.itemType === "blog") db.blogs.delete(contentToDelete.id);
    if (contentToDelete.itemType === "photo") db.photos.delete(contentToDelete.id);
    if (contentToDelete.itemType === "video") db.videos.delete(contentToDelete.id);
    
    if (user) db.logs.add("DELETE_CONTENT", `Admin purged asset ${contentToDelete.id}`, user.username);
    
    triggerToast("Content Deleted", "Asset purged via override and saved to local registry.", "success");
    loadExplorePayload();
    setContentToDelete(null);
  };

  const loadExplorePayload = () => {
    setIsSyncing(true);
    // Directly pull from local db state
    const allBlogs = db.blogs.getAll().filter(b => b.status === "APPROVED").map(b => ({ ...b, itemType: "blog" as const, type: "blog" as const }));
    const allPhotos = db.photos.getAll().filter(p => p.status === "APPROVED").map(p => ({ ...p, itemType: "photo" as const, type: "photo" as const }));
    const allVideos = db.videos.getAll().filter(v => v.status === "APPROVED").map(v => ({ ...v, itemType: "video" as const, type: "video" as const }));
    const allTags = db.tags.getAll();

    setBlogs(allBlogs);
    setPhotos(allPhotos);
    setVideos(allVideos);
    setAvailableTags(allTags);
    setIsSyncing(false);
  };

  useEffect(() => {
    loadExplorePayload();
  }, [dbActionCount]);

  // Update matched users when filter query or tags change
  useEffect(() => {
    const hasQuery = filterQuery.trim().length > 0;
    const hasTags = selectedTags.length > 0;

    if (hasQuery || hasTags) {
      const users = db.users.getAll().filter(u => {
        const matchesQuery = !hasQuery || (
          u.username.toLowerCase().includes(filterQuery.toLowerCase()) ||
          u.profile?.fullName?.toLowerCase().includes(filterQuery.toLowerCase())
        );

        const matchesTags = !hasTags || (
          u.profile?.interests?.some(interest => selectedTags.includes(interest))
        );

        return matchesQuery && matchesTags;
      });
      setMatchedUsers(users);
    } else {
      setMatchedUsers([]);
    }
  }, [filterQuery, selectedTags]);

  // Open/Close dropdown based on search query content
  useEffect(() => {
    if (tagSearchQuery.trim().length > 0) {
      setIsDropdownOpen(true);
    } else {
      setIsDropdownOpen(false);
    }
  }, [tagSearchQuery]);

  const triggerFeedRefresh = () => {
    loadExplorePayload();
    triggerToast("Feed Synchronized", "Pulled dynamic assets catalog from metadata logs", "success");
  };

  // Compile publication items
  let collectiveItems: any[] = [];
  
  if (activeSegment === "ALL" || activeSegment === "BLOG") {
    blogs.forEach((b) => collectiveItems.push({ ...b, itemType: "blog" as const }));
  }
  if (activeSegment === "ALL" || activeSegment === "PHOTO") {
    photos.forEach((p) => collectiveItems.push({ ...p, itemType: "photo" as const }));
  }
  if (activeSegment === "ALL" || activeSegment === "VIDEO") {
    videos.forEach((v) => collectiveItems.push({ ...v, itemType: "video" as const }));
  }

  // Unified Sorting Engine
  collectiveItems.sort((a, b) => {
    switch (sortBy) {
      case "VIEWS":
        return (b.views || 0) - (a.views || 0);
      case "LIKES":
        return (b.likesCount || 0) - (a.likesCount || 0);
      case "COMMENTS":
        return (b.comments?.length || 0) - (a.comments?.length || 0);
      case "OLDEST":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "UPDATED":
        return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
      case "NEWEST":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  // Filter items matching query search and tags selectors
  const processedItems = collectiveItems.filter((item) => {
    const matchFuzzy = 
      item.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(filterQuery.toLowerCase()) ||
      item.authorName.toLowerCase().includes(filterQuery.toLowerCase());
    
    if (selectedTags.length > 0) {
      return matchFuzzy && selectedTags.every(tag => item.tags?.includes(tag));
    }
    return matchFuzzy;
  });

  // Smart Tag Search - Filter available tags matching tagSearchQuery
  const matchedTags = availableTags.filter(t => 
    t.name.toLowerCase().includes(tagSearchQuery.toLowerCase())
  );

  // Total accumulative tag footprint
  const totalUniqueTags = availableTags.length;
  const totalTagUsages = availableTags.reduce((sum, current) => sum + (current.usageCount || 0), 0);

  // Content Statistics calculation
  const contentStats = useMemo(() => {
    return {
      blogs: db.blogs.getAll().length,
      videos: db.videos.getAll().length,
      photos: db.photos.getAll().length
    };
  }, [blogs, photos, videos]); // Re-calculate when content state changes

  return (
    <div className="space-y-6 text-slate-100 font-sans" id="explore-feed-shell">
      
      {/* Dynamic Aurora Header Banner */}
      <div className="relative overflow-hidden p-6 rounded-3xl bg-slate-900/40 border border-slate-900 shadow-xl backdrop-blur-md">
        <div className="absolute top-0 right-0 w-72 h-32 bg-purple-600/10 blur-[90px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-48 h-20 bg-cyan-500/10 blur-[75px] rounded-full pointer-events-none"></div>
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono text-[9px] md:text-[10px] uppercase font-semibold rounded-full tracking-wider">
              <Sparkles className="w-2.5 h-2.5 md:w-3 h-3 text-purple-400" /> Platform Feed Curator
            </div>
            <h2 className="text-xl md:text-3xl font-black font-space bg-gradient-to-r from-white via-slate-100 to-purple-300 bg-clip-text text-transparent">
              Explore Creations.
            </h2>
            <p className="text-[10px] md:text-xs text-slate-400 max-w-xl leading-relaxed">
              Immerse yourself in high-resolution photography print grids, custom-crafted text articles, and cinematic AV reels shared by creators from across the globe.
            </p>
          </div>

          {/* Real-time Dynamic Total Tags Stats Card */}
          <div className="flex-shrink-0 min-w-0 md:min-w-[200px] p-3 md:p-4 bg-slate-950/60 border border-slate-850 rounded-xl md:rounded-2xl flex items-center gap-3 md:gap-4 hover:border-purple-500/20 transition-all shadow-md group">
            <div className="p-2 md:p-3 bg-purple-500/10 rounded-lg md:rounded-xl border border-purple-500/20 text-purple-400 group-hover:scale-105 transition-transform duration-300">
              <Tag className="w-4 h-4 md:w-5 h-5" />
            </div>
            <div>
              <span className="text-[8px] md:text-[10px] text-slate-500 uppercase tracking-wider font-mono block">Total Tags Active</span>
              <span className="text-base md:text-xl font-black font-space text-slate-100 block">{totalUniqueTags}</span>
              <span className="text-[8px] md:text-[9px] text-purple-400 font-mono">{totalTagUsages} Uses Recorded</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Statistics Section */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-slate-900/40 border border-slate-900/60 p-3 md:p-5 rounded-xl md:rounded-2xl flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-4 hover:bg-slate-800/40 hover:border-purple-500/30 transition-all shadow-sm group text-center md:text-left"
        >
          <div className="p-2 md:p-3 bg-purple-500/10 rounded-lg md:rounded-xl border border-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
            <FileText className="w-4 h-4 md:w-5 h-5" />
          </div>
          <div>
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-0.5 md:mb-1">Blogs</span>
            <span className="text-sm md:text-2xl font-black font-space text-white block leading-none">{contentStats.blogs}</span>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-slate-900/40 border border-slate-900/60 p-3 md:p-5 rounded-xl md:rounded-2xl flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-4 hover:bg-slate-800/40 hover:border-blue-500/30 transition-all shadow-sm group text-center md:text-left"
        >
          <div className="p-2 md:p-3 bg-blue-500/10 rounded-lg md:rounded-xl border border-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform">
            <Video className="w-4 h-4 md:w-5 h-5" />
          </div>
          <div>
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-0.5 md:mb-1">Videos</span>
            <span className="text-sm md:text-2xl font-black font-space text-white block leading-none">{contentStats.videos}</span>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-slate-900/40 border border-slate-900/60 p-3 md:p-5 rounded-xl md:rounded-2xl flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-4 hover:bg-slate-800/40 hover:border-rose-500/30 transition-all shadow-sm group text-center md:text-left"
        >
          <div className="p-2 md:p-3 bg-rose-500/10 rounded-lg md:rounded-xl border border-rose-500/20 text-rose-400 group-hover:scale-110 transition-transform">
            <Camera className="w-4 h-4 md:w-5 h-5" />
          </div>
          <div>
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-0.5 md:mb-1">Photos</span>
            <span className="text-sm md:text-2xl font-black font-space text-white block leading-none">{contentStats.photos}</span>
          </div>
        </motion.div>
      </div>

      {/* Modern Filter Shell with Fuzzy Unified Search and Smart Tag search */}
      <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-5 md:p-6 space-y-5">
        
        {/* Row 1: Unified Query Search, Segment Filters, and Soft Reload */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search feed by titles, descriptions or creators handle..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full text-xs py-3.5 pl-10 pr-4 bg-slate-950/65 rounded-xl border border-slate-850 focus:outline-none focus:border-purple-600 text-slate-200 placeholder-slate-700 font-mono transition-all"
              id="feed-fuzzy-search"
            />
          </div>

          <div className="flex items-center justify-start md:justify-end gap-2 w-full lg:w-auto overflow-x-auto custom-scrollbar pb-1.5 lg:pb-0 scroll-smooth">
            <div className="flex bg-slate-950 p-1 border border-slate-850 rounded-xl flex-shrink-0 gap-0.5 md:ml-auto">
              {([
                { label: "All Items", key: "ALL" as const },
                { label: "Blogs", key: "BLOG" as const },
                { label: "Photos", key: "PHOTO" as const },
                { label: "Videos", key: "VIDEO" as const },
              ]).map((seg) => (
                <button
                  key={seg.key}
                  onClick={() => {
                    setActiveSegment(seg.key);
                    setSelectedTags([]);
                  }}
                  className={`text-[10px] uppercase font-bold font-space px-4 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
                    activeSegment === seg.key 
                      ? "bg-purple-650 text-white shadow-md shadow-purple-900/20" 
                      : "text-slate-400 hover:text-white hover:bg-slate-900/40"
                  }`}
                >
                  {seg.label}
                </button>
              ))}
            </div>

            <button 
              onClick={triggerFeedRefresh}
              className="p-3 w-11 h-11 bg-slate-950 hover:bg-slate-900 border border-slate-855 rounded-xl cursor-pointer flex items-center justify-center text-slate-400 hover:text-white transition-all flex-shrink-0"
              title="Reload content feed"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
            </button>
          </div>

        </div>

        {/* Matched Creators Section */}
        {matchedUsers.length > 0 && (
          <div className="border-t border-slate-850/30 pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span className="text-[11px] uppercase tracking-wide font-mono text-slate-400 font-bold">Creators Matching Query:</span>
            </div>
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scroll-smooth custom-scrollbar">
              {matchedUsers.map(u => {
                const isFollowed = followedUserIds.has(u.id);
                return (
                  <div 
                    key={u.id}
                    onClick={() => viewProfile(u.id)}
                    className="flex items-center gap-3 p-2 pr-4 bg-slate-950 border border-slate-850 rounded-2xl cursor-pointer hover:border-purple-500/40 transition-all shrink-0 group"
                  >
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-800 shrink-0 group-hover:scale-105 transition-transform">
                      <img src={u.profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} className="w-full h-full object-cover" alt="avatar" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-200 group-hover:text-purple-400 transition-colors flex items-center gap-1.5">
                        @{u.username}
                        <RoleBadge role={u.profile?.activeBadge || u.role} size="xs" />
                      </span>
                      <span className="block text-[9px] text-slate-500 truncate max-w-[80px]">{u.profile?.fullName || "Active Creator"}</span>
                    </div>
                    {user && user.id !== u.id && (
                      <button 
                        onClick={(e) => handleFollowClick(e, u.id)}
                        className={`ml-2 px-2.5 py-1 rounded-lg text-[8px] font-black font-space uppercase transition-all ${
                          isFollowed 
                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                            : 'bg-white text-slate-950 hover:bg-slate-200'
                        }`}
                      >
                        {isFollowed ? 'Unfollow' : 'Follow'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Row 2: Premium Unified Sorting Options */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-850/30 pt-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-semibold text-slate-400">Sort Unified Feed:</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2 md:pb-0 w-full md:w-auto scroll-smooth">
            {[
              { label: "Newest First", value: "NEWEST" as const },
              { label: "Oldest First", value: "OLDEST" as const },
              { label: "Most Viewed", value: "VIEWS" as const },
              { label: "Most Liked", value: "LIKES" as const },
              { label: "Most Commented", value: "COMMENTS" as const },
              { label: "Recently Updated", value: "UPDATED" as const },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setSortBy(opt.value);
                  triggerToast("Sorted Feed", `Re-indexed media gallery based on ${opt.label}`, "info");
                }}
                className={`text-[10px] font-mono py-1.5 px-3 rounded-lg border transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
                  sortBy === opt.value
                    ? "bg-purple-950 text-purple-300 border-purple-500/40"
                    : "bg-slate-950 hover:bg-slate-900 border-slate-850 text-slate-450 hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Smart Tag Search Box with dynamic dropdown */}
        <div className="border-t border-slate-850/30 pt-4 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-cyan-405" />
              <span className="text-[11px] uppercase tracking-wide font-mono text-slate-400 font-bold">Smart Tag Search:</span>
            </div>

            {/* Smart Tag search input with dynamic dropdown */}
            <div className="relative w-full sm:w-80" ref={dropdownRef}>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                <input 
                  type="text"
                  placeholder="Fuzzy filter tags directory..."
                  value={tagSearchQuery}
                  onChange={(e) => {
                    setTagSearchQuery(e.target.value);
                  }}
                  className="w-full text-[10px] pl-8 pr-3 py-2 bg-slate-950/80 border border-slate-850 rounded-lg focus:outline-none focus:border-purple-600 text-slate-300 font-mono transition-all"
                  id="explore-tag-search-input"
                />
              </div>

              {/* Autocomplete Dropdown Panel with AnimatePresence */}
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute left-0 right-0 mt-2 max-h-60 overflow-y-auto bg-slate-950 border border-slate-850 rounded-xl shadow-2xl backdrop-blur-md z-50 p-2 custom-scrollbar space-y-1" 
                    id="explore-tag-dropdown"
                  >
                    <div className="flex items-center justify-between px-2 py-1 border-b border-slate-900/50 pb-1.5">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Matching Tags ({matchedTags.length})</span>
                      <button 
                        type="button"
                        onClick={() => setIsDropdownOpen(false)}
                        className="p-1 hover:bg-slate-900 rounded-md text-slate-500 hover:text-white transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    
                    {matchedTags.length === 0 ? (
                      <div className="text-[10px] text-slate-500 py-4 text-center italic font-mono flex flex-col items-center gap-2">
                        <span className="text-slate-600 font-bold">No matching tags found.</span>
                        <span className="text-[8px] uppercase tracking-widest opacity-50">Try a different keyword</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-1 pt-1.5">
                        {matchedTags.map((tag) => {
                          const isTagSelected = selectedTags.includes(tag.name);
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => {
                                if (isTagSelected) {
                                  setSelectedTags(prev => prev.filter(t => t !== tag.name));
                                } else {
                                  setSelectedTags(prev => [...prev, tag.name]);
                                }
                                triggerToast("Collection Updated", `${isTagSelected ? "Removed" : "Added"} #${tag.name} to filters`, "info");
                              }}
                              className={`w-full text-left text-[10px] font-mono py-1.5 px-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                                isTagSelected 
                                  ? "bg-purple-950/45 text-purple-300 border-purple-500/50" 
                                  : "bg-slate-900/30 hover:bg-slate-900 border-slate-950 hover:border-slate-850 text-slate-400 hover:text-slate-200"
                              }`}
                              id={`tag-option-${tag.name}`}
                            >
                              <span className="flex items-center gap-1.5 truncate">
                                <span className={isTagSelected ? "text-purple-400" : "text-slate-550"}>#</span>
                                <span className="truncate">{tag.name}</span>
                                {isTagSelected && (
                                  <span className="text-[8px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded font-bold uppercase">
                                    Selected
                                  </span>
                                )}
                              </span>
                              <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${
                                isTagSelected ? "bg-purple-900/50 text-purple-300" : "bg-slate-950 text-slate-550"
                              }`}>
                                {tag.usageCount || 0}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Active selection tag ribbon override */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pb-1">
              <span className="text-[10px] text-slate-500">Active Tag Scope:</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedTags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-cyan-950 border border-cyan-800 text-cyan-405 rounded font-mono text-[10px] flex items-center gap-1.5">
                    #{tag}
                    <button 
                      onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))} 
                      className="font-sans font-bold hover:text-white ml-1 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button 
                  onClick={() => setSelectedTags([])}
                  className="text-[9px] text-rose-400 hover:text-rose-300 font-mono ml-1 underline underline-offset-2 cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>
        </div>

      {/* Grid rendering layouts using Pinterest Columns and elegant Hover visuals */}
      {processedItems.length === 0 ? (
        <div className="text-center py-24 bg-slate-900/10 border border-slate-900 border-dashed rounded-3xl select-none">
          <Sparkles className="w-12 h-12 text-purple-500 mx-auto mb-3.5 animate-pulse" />
          <h4 className="font-extrabold text-sm text-slate-205">No published masterpieces matching filter query.</h4>
          <p className="text-[11px] text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed font-sans">
            Clear your current tag selection scope filter or try typing a different search phrase in the main search bar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6" id="explore-uniform-grid">
          {processedItems.map((item) => (
            <ExploreCard 
              key={`${item.itemType}-${item.id}`}
              item={item}
              onSelect={() => setFocusedContent({ type: item.itemType, item })}
              onAdminDelete={(e) => startAdminDelete(e, item)}
            />
          ))}
        </div>
      )}

      {/* Unified Deletion Content Modal */}
      <DeleteConfirmationModal 
        isOpen={Boolean(contentToDelete)}
        onClose={() => setContentToDelete(null)}
        onConfirm={confirmAdminDelete}
        title="Permanently Delete Media Asset"
        warningText="You are about to irreversibly purge this user asset from the metadata index. This action is permanently destructive and cannot be undone."
        itemDetails={
          contentToDelete ? (
            <div className="flex gap-4 items-center w-full">
              <div className="w-16 h-16 bg-slate-900 rounded-lg overflow-hidden border border-slate-850 shrink-0">
                <img 
                  src={contentToDelete.thumbnailUrl || contentToDelete.url || undefined} 
                  alt="thumbnail" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col gap-1 overflow-hidden">
                <span className="text-sm font-bold text-slate-200 truncate">{contentToDelete.title || "Untitled Asset"}</span>
                <span className="text-xs font-mono text-purple-400">@{contentToDelete.authorName}</span>
                <div className="flex gap-3 text-[10px] text-slate-500 mt-1">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(contentToDelete.createdAt).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {contentToDelete.views || 0}</span>
                </div>
              </div>
            </div>
          ) : null
        }
      />
    </div>
  );
};

