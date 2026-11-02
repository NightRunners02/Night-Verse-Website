import React, { useState, useEffect, useMemo } from "react";
import { 
  Tags, TrendingUp, Search, Calendar, ChevronUp, User, Clock, RefreshCw, 
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Trash, Eye, Edit2, 
  Check, CheckSquare, Square, Library, Trash2, X, AlertTriangle, Ban, Plus,
  Layers, HelpCircle, CheckCircle2, XCircle, Sparkles, Filter, Info
} from "lucide-react";
import { useAppState } from "../context/AppState.js";
import { motion, AnimatePresence } from "motion/react";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal.js";
import { db } from "../lib/db.js";
import type { Tag, TagType, TagStatus } from "../types.js";

type SubMenuTab = "ALL" | TagType | "PENDING";

export const TagAnalytics: React.FC = () => {
  const { triggerToast, token, user, dbActionCount, triggerDBSync, triggerSearch, navigateTo } = useAppState();
  
  // Data states
  const [tagList, setTagList] = useState<Tag[]>([]);
  const [activeTab, setActiveTab] = useState<SubMenuTab>("ALL");
  const [filterSearch, setFilterSearch] = useState("");
  const [activeSortOrder, setActiveSortOrder] = useState<"usage" | "growth" | "name" | "recent">("usage");
  const [growthPeriod, setGrowthPeriod] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tagPage, setTagPage] = useState(1);
  const tagsPerPage = 10;

  // Selection states for bulk actions
  const [selectedTagsForBulk, setSelectedTagsForBulk] = useState<string[]>([]);
  
  // Add / Edit Tag Modal states
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<TagType>("General");
  const [formIsAmbiguous, setFormIsAmbiguous] = useState(false);

  // Preview Tag / Live Preview System states
  const [showLivePreviewModal, setShowLivePreviewModal] = useState(false);
  const [inspectedTag, setInspectedTag] = useState<Tag | null>(null);
  const [inspectedRelatedContent, setInspectedRelatedContent] = useState<any[]>([]);

  // Delete modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" || user?.role === "MODERATOR";

  const [isSaving, setIsSaving] = useState(false);

  const fetchTagsData = () => {
    setIsRefreshing(true);
    const data = db.tags.getAll();
    setTagList(data || []);
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchTagsData();
    const handleTagUpdate = () => {
      fetchTagsData();
    };
    window.addEventListener("nightverse_tags_updated", handleTagUpdate);
    return () => window.removeEventListener("nightverse_tags_updated", handleTagUpdate);
  }, [dbActionCount]);

  // Tab counters
  const categoryCounts = useMemo(() => {
    const counts = {
      ALL: 0,
      Copyright: 0,
      General: 0,
      Artist: 0,
      Character: 0,
      Metadata: 0,
      PENDING: 0
    };

    tagList.forEach(t => {
      if (t.status === "PENDING") {
        counts.PENDING++;
      } else {
        counts.ALL++;
        const typeKey = (t.type || "General") as TagType;
        if (counts[typeKey] !== undefined) {
          counts[typeKey]++;
        }
      }
    });

    return counts;
  }, [tagList]);

  // Filter and sort tags according to active submenu tab, search query, and sorting criteria
  const handledTags = useMemo(() => {
    return tagList
      .filter((t) => {
        // Tab filter
        if (activeTab === "PENDING") {
          if (t.status !== "PENDING") return false;
        } else if (activeTab !== "ALL") {
          if (t.status === "PENDING") return false;
          if ((t.type || "General") !== activeTab) return false;
        } else {
          // ALL tab only shows approved tags
          if (t.status === "PENDING") return false;
        }

        // Search query
        if (filterSearch.trim()) {
          const query = filterSearch.toLowerCase().trim().replace(/^#/, "");
          if (!t.name.toLowerCase().includes(query)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (activeSortOrder === "usage") {
          return b.usageCount - a.usageCount;
        } else if (activeSortOrder === "growth") {
          const aGrowth = (growthPeriod === "daily" ? a.growthDaily : growthPeriod === "weekly" ? a.growthWeekly : a.growthMonthly) ?? 0;
          const bGrowth = (growthPeriod === "daily" ? b.growthDaily : growthPeriod === "weekly" ? b.growthWeekly : b.growthMonthly) ?? 0;
          return bGrowth - aGrowth;
        } else if (activeSortOrder === "name") {
          return a.name.localeCompare(b.name);
        } else if (activeSortOrder === "recent") {
          return new Date(b.lastUsedAt || b.createdAt).getTime() - new Date(a.lastUsedAt || a.createdAt).getTime();
        }
        return 0;
      });
  }, [tagList, activeTab, filterSearch, activeSortOrder, growthPeriod]);

  // Pagination bounds
  const totalTagPages = Math.max(1, Math.ceil(handledTags.length / tagsPerPage));
  const tagStartIndex = (tagPage - 1) * tagsPerPage;
  const currentDisplayedTags = handledTags.slice(tagStartIndex, tagStartIndex + tagsPerPage);

  // Reset page on filter changes
  useEffect(() => {
    setTagPage(1);
  }, [filterSearch, activeSortOrder, activeTab]);

  const triggerManualRefresh = () => {
    fetchTagsData();
    triggerToast("System Synchronized 🔄", "Refreshed Tags Directory and content metrics.", "success");
  };

  // Open modal to Create new Tag or Edit existing Tag
  const handleOpenAddTagModal = () => {
    setEditingTag(null);
    setFormName("");
    setFormType(activeTab !== "ALL" && activeTab !== "PENDING" ? activeTab : "General");
    setFormIsAmbiguous(false);
    setShowAddEditModal(true);
  };

  const handleOpenEditTagModal = (tag: Tag) => {
    setEditingTag(tag);
    setFormName(tag.name);
    setFormType(tag.type || "General");
    setFormIsAmbiguous(!!tag.isAmbiguous);
    setShowAddEditModal(true);
  };

  // Save Tag Submission (Handles Admin direct approval & User proposal)
  const handleSaveTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      triggerToast("Input Error", "Please provide a valid tag name.", "error");
      return;
    }

    const cleanName = formName.trim().toLowerCase().replace(/^#/, "");
    setIsSaving(true);

    try {
      if (editingTag) {
        // Edit Tag
        const updated = db.tags.update(editingTag.id, {
          name: cleanName,
          type: formType,
          isAmbiguous: formIsAmbiguous,
          status: editingTag.status || "APPROVED"
        });
        if (updated) {
          triggerToast("Tag Updated ✅", `Hashtag #${cleanName} has been updated to [${formType}].`, "success");
        } else {
          triggerToast("Update Error ⚠️", `Could not find tag #${cleanName} to update.`, "error");
        }
      } else {
        // Create Tag
        const defaultStatus: TagStatus = isAdmin ? "APPROVED" : "PENDING";
        const created = db.tags.add({
          name: cleanName,
          type: formType,
          isAmbiguous: formIsAmbiguous,
          status: defaultStatus,
          createdBy: user?.username || "NightAdmin"
        });

        if (defaultStatus === "APPROVED") {
          triggerToast("Tag Added 🎉", `Hashtag #${cleanName} added as [${formType}].`, "success");
        } else {
          triggerToast("Proposal Submitted 📤", `Hashtag #${cleanName} submitted for Admin review.`, "info");
        }
      }

      setShowAddEditModal(false);
      fetchTagsData();
      triggerDBSync();
    } catch (err: any) {
      console.error(err);
      triggerToast("Save Error ❌", err?.message || "Failed to save tag to database.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Quick toggle ambiguous status from table
  const handleToggleAmbiguous = (tag: Tag) => {
    if (!isAdmin) return;
    const nextAmbiguous = !tag.isAmbiguous;
    db.tags.update(tag.id, { isAmbiguous: nextAmbiguous });
    triggerToast("Ambiguous Updated", `Hashtag #${tag.name} ambiguous status set to ${nextAmbiguous ? "YES" : "NO"}`, "info");
    fetchTagsData();
    triggerDBSync();
  };

  // Delete single tag
  const startDeleteTag = (tag: Tag) => {
    setTagToDelete(tag);
    setDeleteModalOpen(true);
  };

  const confirmDeleteTag = () => {
    if (!tagToDelete) return;
    db.tags.delete(tagToDelete.id);
    triggerToast("Tag Purged 🗑️", `Hashtag #${tagToDelete.name} deleted permanently.`, "success");
    fetchTagsData();
    setDeleteModalOpen(false);
    setTagToDelete(null);
    triggerDBSync();
  };

  // Bulk purge
  const confirmBulkPurge = () => {
    if (selectedTagsForBulk.length === 0) return;
    selectedTagsForBulk.forEach(id => db.tags.delete(id));
    triggerToast("Bulk Action Complete", `Purged ${selectedTagsForBulk.length} tags from directory.`, "success");
    setSelectedTagsForBulk([]);
    fetchTagsData();
    setBulkDeleteModalOpen(false);
    triggerDBSync();
  };

  // Approve / Reject Pending tag
  const handleApprovePending = (tag: Tag) => {
    db.tags.approve(tag.id);
    triggerToast("Tag Approved ✅", `Hashtag #${tag.name} is now active under ${tag.type}.`, "success");
    fetchTagsData();
    triggerDBSync();
  };

  const handleRejectPending = (tag: Tag) => {
    db.tags.reject(tag.id);
    triggerToast("Tag Rejected 🛑", `Hashtag #${tag.name} proposal declined.`, "info");
    fetchTagsData();
    triggerDBSync();
  };

  // Inspect Tag Details & Related Content
  const handleInspectTag = (tag: Tag) => {
    setInspectedTag(tag);
    
    const tagName = tag.name.toLowerCase();
    const blogs = db.blogs.getAll().filter(b => b.tags?.map((t: string) => t.toLowerCase()).includes(tagName) && b.status === "APPROVED");
    const photos = db.photos.getAll().filter(p => p.tags?.map((t: string) => t.toLowerCase()).includes(tagName) && p.status === "APPROVED");
    const videos = db.videos.getAll().filter(v => v.tags?.map((t: string) => t.toLowerCase()).includes(tagName) && v.status === "APPROVED");
    
    const combined = [
      ...blogs.map(item => ({ ...item, type: 'blog' })),
      ...photos.map(item => ({ ...item, type: 'photo' })),
      ...videos.map(item => ({ ...item, type: 'video' }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    setInspectedRelatedContent(combined.slice(0, 6));
  };

  // Helper for Category Badge Styling
  const getTypeBadgeStyle = (type: TagType) => {
    switch (type) {
      case "Artist":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      case "Copyright":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      case "Character":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
      case "Metadata":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "General":
      default:
        return "bg-slate-800/80 text-slate-300 border-slate-700/80";
    }
  };

  // Group active approved tags for Live Content Lightbox Preview
  const approvedTagsForPreview = useMemo(() => {
    return tagList.filter(t => t.status !== "PENDING" && !t.isBanned);
  }, [tagList]);

  const previewGroupedTags = useMemo(() => {
    const groups = {
      Artists: approvedTagsForPreview.filter(t => t.type === "Artist"),
      Copyright: approvedTagsForPreview.filter(t => t.type === "Copyright"),
      Characters: approvedTagsForPreview.filter(t => t.type === "Character"),
      Regular: approvedTagsForPreview.filter(t => !t.type || t.type === "General"),
      Metadata: approvedTagsForPreview.filter(t => t.type === "Metadata")
    };
    return groups;
  }, [approvedTagsForPreview]);

  return (
    <div className="space-y-6" id="tag-analytics-shell">
      
      {/* Upper Header Banner */}
      <div className="p-5 md:p-6 bg-gradient-to-r from-purple-950/30 via-slate-900 to-slate-950 border-b md:border border-slate-900 md:rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[10px] md:text-xs text-purple-400 font-mono tracking-widest uppercase mb-1">
            <Tags className="w-4 h-4 text-purple-400 animate-pulse" /> Tags Directory & Taxonomy Engine
          </div>
          <h2 className="text-xl md:text-2xl font-black font-space tracking-tight text-white">Tags Directory Management</h2>
          <p className="text-[10px] md:text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            Kelola, kategorikan (Copyright, General, Artist, Character, Metadata), edit, dan tinjau live preview tag yang digunakan pada seluruh karya NightVerse.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button 
            onClick={() => setShowLivePreviewModal(true)}
            className="flex items-center gap-2 text-xs font-bold bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white py-2.5 px-4 rounded-xl border border-purple-500/30 transition-all cursor-pointer shadow-lg active:scale-95"
            id="btn-live-preview-tags"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            Live Preview Tags
          </button>

          <button 
            onClick={handleOpenAddTagModal}
            className="flex items-center gap-2 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white py-2.5 px-4 rounded-xl shadow-lg shadow-purple-900/30 transition-all cursor-pointer active:scale-95"
            id="btn-add-new-tag"
          >
            <Plus className="w-4 h-4" />
            Add New Tag
          </button>

          <button 
            onClick={triggerManualRefresh}
            className="p-2.5 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-all cursor-pointer active:scale-95"
            title="Sync Data"
            id="btn-tags-refresh"
          >
            <RefreshCw className={`w-4 h-4 text-purple-400 ${isRefreshing ? "animate-spin" : ""}`} /> 
          </button>
        </div>
      </div>

      {/* Submenu / Category Tabs Bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-2 flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
        {[
          { tab: "ALL" as const, label: "All Tags", count: categoryCounts.ALL },
          { tab: "Copyright" as const, label: "Copyright", count: categoryCounts.Copyright },
          { tab: "General" as const, label: "General", count: categoryCounts.General },
          { tab: "Artist" as const, label: "Artist", count: categoryCounts.Artist },
          { tab: "Character" as const, label: "Character", count: categoryCounts.Character },
          { tab: "Metadata" as const, label: "Metadata", count: categoryCounts.Metadata },
          ...(categoryCounts.PENDING > 0 || isAdmin ? [{ tab: "PENDING" as const, label: "Pending Proposals", count: categoryCounts.PENDING }] : [])
        ].map(({ tab, label, count }) => {
          const isSelected = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold font-space uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? tab === "PENDING"
                    ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                    : "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
              }`}
            >
              <span>{label}</span>
              <span className={`text-[10px] font-mono font-black py-0.5 px-2 rounded-full ${
                isSelected 
                  ? "bg-black/20 text-white" 
                  : "bg-slate-800 text-slate-400"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Directory Controls & Search */}
      <div className="bg-slate-900/40 border border-slate-850 rounded-3xl p-4 md:p-6 space-y-6">
        
        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-800/60" id="tags-analytics-query-bar">
          
          {/* Search bar */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder={`Search in ${activeTab === 'ALL' ? 'all' : activeTab} tags...`}
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="w-full text-xs py-2.5 pl-10 pr-4 bg-slate-950 rounded-xl border border-slate-800 focus:outline-none focus:border-purple-500 font-mono text-slate-100 placeholder:text-slate-600 transition-all"
              id="txt-tag-search-field"
            />
            {filterSearch && (
              <button 
                onClick={() => setFilterSearch("")} 
                className="absolute right-3 top-3 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sorting options */}
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
            <span className="text-[10px] uppercase font-mono text-slate-500 mr-1 select-none">Sort:</span>
            {[
              { label: "Usage", opt: "usage" as const },
              { label: "Growth", opt: "growth" as const },
              { label: "Name (A-Z)", opt: "name" as const },
              { label: "Recent", opt: "recent" as const },
            ].map((bt) => (
              <button
                key={bt.opt}
                onClick={() => setActiveSortOrder(bt.opt)}
                className={`text-[10px] font-bold font-space uppercase py-2 px-3 rounded-xl border transition-all cursor-pointer ${
                  activeSortOrder === bt.opt 
                    ? "bg-purple-950/40 text-purple-400 border-purple-500/40" 
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                }`}
              >
                {bt.label}
              </button>
            ))}
          </div>

        </div>

        {/* Tags Directory Table */}
        {handledTags.length === 0 ? (
          <div className="text-center py-16 bg-slate-950/30 rounded-2xl border border-dashed border-slate-800 select-none space-y-2">
            <Tags className="w-10 h-10 text-slate-700 mx-auto" />
            <p className="text-slate-400 text-xs font-bold font-space uppercase">Tidak Ada Tag Ditemukan</p>
            <p className="text-[10px] text-slate-500 font-mono">
              {filterSearch ? `Tidak ada hasil untuk "#${filterSearch}"` : `Belum ada tag pada kategori ${activeTab}.`}
            </p>
            <button
              onClick={handleOpenAddTagModal}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold uppercase transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Tag Baru
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-mono text-slate-500 uppercase tracking-widest select-none">
                  {isAdmin && (
                    <th className="py-3 px-3 w-10">
                      <div 
                        onClick={() => {
                          const allOnPageSelected = currentDisplayedTags.every(t => selectedTagsForBulk.includes(t.id));
                          if (allOnPageSelected) {
                            const pageIds = currentDisplayedTags.map(t => t.id);
                            setSelectedTagsForBulk(prev => prev.filter(id => !pageIds.includes(id)));
                          } else {
                            const newIds = currentDisplayedTags.map(t => t.id).filter(id => !selectedTagsForBulk.includes(id));
                            setSelectedTagsForBulk(prev => [...prev, ...newIds]);
                          }
                        }}
                        className="cursor-pointer p-1 hover:bg-slate-800 rounded transition-all"
                        title="Select page"
                      >
                        {currentDisplayedTags.length > 0 && currentDisplayedTags.every(t => selectedTagsForBulk.includes(t.id)) ? (
                          <CheckSquare className="w-4 h-4 text-purple-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                  )}
                  <th className="py-3 px-3">Name</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3 text-center">Ambiguous</th>
                  <th className="py-3 px-3 text-center">Total Uses</th>
                  <th className="py-3 px-3 text-center hidden md:table-cell">Usage Split (B / P / V)</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {currentDisplayedTags.map((tag) => {
                  const isSelected = selectedTagsForBulk.includes(tag.id);
                  const tagType = tag.type || "General";
                  
                  return (
                    <tr key={tag.id} className={`hover:bg-slate-900/60 transition-colors group ${isSelected ? 'bg-purple-950/20' : ''}`}>
                      
                      {/* Bulk check */}
                      {isAdmin && (
                        <td className="py-3 px-3">
                          <div 
                            onClick={() => {
                              if (isSelected) setSelectedTagsForBulk(prev => prev.filter(id => id !== tag.id));
                              else setSelectedTagsForBulk(prev => [...prev, tag.id]);
                            }}
                            className="cursor-pointer p-1 hover:bg-slate-800 rounded transition-all text-slate-500 hover:text-purple-400"
                          >
                            {isSelected ? <CheckSquare className="w-4 h-4 text-purple-400" /> : <Square className="w-4 h-4" />}
                          </div>
                        </td>
                      )}

                      {/* Tag Name */}
                      <td className="py-3 px-3 font-bold font-mono">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${
                            tag.isBanned
                              ? "bg-rose-950/40 text-rose-400 border-rose-800/40"
                              : "bg-slate-950 text-slate-100 border-slate-800 group-hover:border-purple-500/30"
                          }`}>
                            <span className="text-purple-400">#</span>
                            <span>{tag.name}</span>
                          </span>

                          {tag.isAmbiguous && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20" title="Ambiguous Tag">
                              ?
                            </span>
                          )}

                          {tag.isBanned && (
                            <span className="text-[8px] bg-rose-950 text-rose-400 border border-rose-800 px-1.5 py-0.5 rounded font-mono font-bold">
                              BANNED
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3 px-3">
                        <span className={`inline-block text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${getTypeBadgeStyle(tagType)}`}>
                          {tagType}
                        </span>
                      </td>

                      {/* Ambiguous Checkbox Status */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleToggleAmbiguous(tag)}
                          disabled={!isAdmin}
                          className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded border transition-all cursor-pointer ${
                            tag.isAmbiguous 
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30" 
                              : "bg-slate-950 text-slate-500 border-slate-850 hover:text-slate-300"
                          }`}
                          title={isAdmin ? "Toggle Ambiguous status" : "Ambiguous flag"}
                        >
                          <input 
                            type="checkbox" 
                            checked={!!tag.isAmbiguous} 
                            onChange={() => {}} 
                            className="w-3 h-3 accent-amber-500 rounded cursor-pointer" 
                          />
                          <span>{tag.isAmbiguous ? "Ambiguous" : "Clear"}</span>
                        </button>
                      </td>

                      {/* Total Uses */}
                      <td className="py-3 px-3 text-center font-bold font-mono text-slate-200">
                        {tag.usageCount || 0}
                      </td>

                      {/* Split Breakdown */}
                      <td className="py-3 px-3 text-center hidden md:table-cell">
                        <div className="flex justify-center items-center gap-2 text-[10px] font-mono">
                          <span className="text-indigo-400" title="Blogs">{tag.blogCount || 0}</span>
                          <span className="text-slate-700">/</span>
                          <span className="text-rose-400" title="Photos">{tag.photoCount || 0}</span>
                          <span className="text-slate-700">/</span>
                          <span className="text-purple-400" title="Videos">{tag.videoCount || 0}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                          tag.status === "PENDING"
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                            : tag.status === "REJECTED"
                            ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        }`}>
                          {tag.status || "APPROVED"}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Pending Approval Controls */}
                          {tag.status === "PENDING" && isAdmin && (
                            <>
                              <button
                                onClick={() => handleApprovePending(tag)}
                                className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg border border-emerald-500/30 transition-all cursor-pointer"
                                title="Approve Tag"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleRejectPending(tag)}
                                className="p-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg border border-rose-500/30 transition-all cursor-pointer"
                                title="Reject Tag"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {/* Inspect Tag */}
                          <button
                            onClick={() => handleInspectTag(tag)}
                            className="p-1.5 bg-slate-950 border border-slate-800 hover:border-purple-500 text-purple-400 hover:text-white rounded-lg transition-all cursor-pointer"
                            title="Inspect Tag"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Tag */}
                          {isAdmin && (
                            <button
                              onClick={() => handleOpenEditTagModal(tag)}
                              className="p-1.5 bg-slate-950 border border-slate-800 hover:border-cyan-500 text-cyan-400 hover:text-white rounded-lg transition-all cursor-pointer"
                              title="Edit Tag"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete Tag */}
                          {isAdmin && (
                            <button
                              onClick={() => startDeleteTag(tag)}
                              className="p-1.5 bg-slate-950 border border-slate-800 hover:border-rose-500 text-rose-400 hover:text-white rounded-lg transition-all cursor-pointer"
                              title="Delete Tag"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          )}

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination & Bulk actions bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/60">
          
          {/* Bulk Purge */}
          {selectedTagsForBulk.length > 0 ? (
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-purple-400">
                {selectedTagsForBulk.length} tags selected
              </span>
              <button
                onClick={() => setBulkDeleteModalOpen(true)}
                className="py-1.5 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold uppercase transition-all shadow-lg flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Purge Selection
              </button>
              <button
                onClick={() => setSelectedTagsForBulk([])}
                className="text-xs text-slate-500 hover:text-slate-300 font-mono"
              >
                [Cancel]
              </button>
            </div>
          ) : (
            <span className="text-xs font-mono text-slate-500">
              Showing {handledTags.length === 0 ? 0 : tagStartIndex + 1}-{Math.min(tagStartIndex + tagsPerPage, handledTags.length)} of {handledTags.length} tags
            </span>
          )}

          {/* Pagination Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setTagPage(1)}
              disabled={tagPage === 1}
              className="p-2 rounded-lg bg-slate-950 border border-slate-800 disabled:opacity-30 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTagPage(p => Math.max(1, p - 1))}
              disabled={tagPage === 1}
              className="p-2 rounded-lg bg-slate-950 border border-slate-800 disabled:opacity-30 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono font-bold text-slate-200">
              Page {tagPage} / {totalTagPages}
            </span>
            <button
              onClick={() => setTagPage(p => Math.min(totalTagPages, p + 1))}
              disabled={tagPage >= totalTagPages}
              className="p-2 rounded-lg bg-slate-950 border border-slate-800 disabled:opacity-30 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTagPage(totalTagPages)}
              disabled={tagPage >= totalTagPages}
              className="p-2 rounded-lg bg-slate-950 border border-slate-800 disabled:opacity-30 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* ------------------ ADD / EDIT TAG MODAL ------------------ */}
      <AnimatePresence>
        {showAddEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddEditModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl z-10 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Tags className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black font-space text-white">
                      {editingTag ? "Edit Tag Configuration" : "Add New Tag"}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Set single category Type and Ambiguous attribute status.
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setShowAddEditModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveTag} className="space-y-5">
                
                {/* Tag Name Input */}
                <div>
                  <label className="block text-xs font-bold font-mono text-slate-300 uppercase mb-2">
                    Tag Name
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-purple-400 font-mono font-bold text-sm">#</span>
                    <input 
                      type="text"
                      placeholder="e.g. minecraft, slippery, jenny_belle, 4k..."
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full text-sm pl-8 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-purple-500 text-white font-mono placeholder:text-slate-600"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">
                    Prefix "#" will be formatted automatically.
                  </p>
                </div>

                {/* Tag Type Selection (Single Type per Tag) */}
                <div>
                  <label className="block text-xs font-bold font-mono text-slate-300 uppercase mb-2">
                    Tag Category (Type)
                  </label>
                  <select 
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as TagType)}
                    className="w-full text-sm p-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-purple-500 text-white font-space font-semibold cursor-pointer"
                  >
                    <option value="Copyright">Copyright — Karya, franchise, atau hak cipta (mis. minecraft)</option>
                    <option value="General">General — Objek, karakteristik, atau konten umum (mis. cyan eyes)</option>
                    <option value="Artist">Artist — Nama kreator atau seniman (mis. slippery)</option>
                    <option value="Character">Character — Nama karakter (mis. jenny belle)</option>
                    <option value="Metadata">Metadata — Atribut teknis / info tambahan (mis. 4k, 2026)</option>
                  </select>
                </div>

                {/* Ambiguous Status Checkbox */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={formIsAmbiguous}
                      onChange={(e) => setFormIsAmbiguous(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-amber-300 font-space flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-amber-400" /> Mark as Ambiguous Tag
                      </span>
                      <span className="text-[10px] text-slate-400 font-sans leading-tight">
                        Aktifkan jika tag memiliki makna ganda atau memerlukan penanda khusus pada preview.
                      </span>
                    </div>
                  </label>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button 
                    type="button"
                    onClick={() => setShowAddEditModal(false)}
                    className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold uppercase transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="py-2.5 px-6 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-purple-900/30 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>{editingTag ? "Save Changes" : "Create Tag"}</>
                    )}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------ LIVE PREVIEW TAGS MODAL (Content Lightbox System) ------------------ */}
      <AnimatePresence>
        {showLivePreviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLivePreviewModal(false)}
              className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
            />

            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl z-10 space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black font-space text-white">
                      Content Lightbox — Live Tag Preview
                    </h3>
                    <p className="text-xs text-slate-400">
                      Tampilan live pengelompokan tag sesuai desain Content Lightbox NightVerse.
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setShowLivePreviewModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Lightbox Simulation Shell */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-inner">
                
                {/* Header title */}
                <div className="border-b border-slate-850 pb-3 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" /> NightVerse Content Lightbox Preview
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                    ● Real-time Synced
                  </span>
                </div>

                {/* Grouped Tags Sections */}
                <div className="space-y-5">
                  
                  {/* Artists */}
                  {previewGroupedTags.Artists.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-extrabold font-space text-rose-400 tracking-wider uppercase">
                        Artists
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {previewGroupedTags.Artists.map(t => (
                          <span 
                            key={t.id}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-300 bg-rose-500/10 px-3 py-1 rounded-lg border border-rose-500/30"
                          >
                            <span>#{t.name}</span>
                            {t.isAmbiguous && <span className="text-[9px] font-mono text-amber-400" title="Ambiguous">(?)</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Copyright */}
                  {previewGroupedTags.Copyright.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-extrabold font-space text-purple-400 tracking-wider uppercase">
                        Copyright
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {previewGroupedTags.Copyright.map(t => (
                          <span 
                            key={t.id}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-300 bg-purple-500/10 px-3 py-1 rounded-lg border border-purple-500/30"
                          >
                            <span>#{t.name}</span>
                            {t.isAmbiguous && <span className="text-[9px] font-mono text-amber-400" title="Ambiguous">(?)</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Characters */}
                  {previewGroupedTags.Characters.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-extrabold font-space text-cyan-400 tracking-wider uppercase">
                        Characters
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {previewGroupedTags.Characters.map(t => (
                          <span 
                            key={t.id}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300 bg-cyan-500/10 px-3 py-1 rounded-lg border border-cyan-500/30"
                          >
                            <span>#{t.name}</span>
                            {t.isAmbiguous && <span className="text-[9px] font-mono text-amber-400" title="Ambiguous">(?)</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Regular (General) */}
                  {previewGroupedTags.Regular.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-extrabold font-space text-slate-300 tracking-wider uppercase">
                        Regular
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {previewGroupedTags.Regular.map(t => (
                          <span 
                            key={t.id}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700/80"
                          >
                            <span>#{t.name}</span>
                            {t.isAmbiguous && <span className="text-[9px] font-mono text-amber-400" title="Ambiguous">(?)</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  {previewGroupedTags.Metadata.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-extrabold font-space text-emerald-400 tracking-wider uppercase">
                        Metadata
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {previewGroupedTags.Metadata.map(t => (
                          <span 
                            key={t.id}
                            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/30"
                          >
                            <span>#{t.name}</span>
                            {t.isAmbiguous && <span className="text-[9px] font-mono text-amber-400" title="Ambiguous">(?)</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

              </div>

              {/* Modal footer */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] text-slate-500 font-mono">
                  ● Total {approvedTagsForPreview.length} active tags rendered in preview.
                </span>
                <button 
                  onClick={() => setShowLivePreviewModal(false)}
                  className="py-2 px-5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold uppercase transition-all"
                >
                  Close Preview
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Inspect Tag Modal */}
      <AnimatePresence>
        {inspectedTag && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInspectedTag(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl z-10 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold font-mono">
                    #
                  </div>
                  <div>
                    <h3 className="text-lg font-black font-space text-white">
                      #{inspectedTag.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getTypeBadgeStyle(inspectedTag.type || "General")}`}>
                        {inspectedTag.type || "General"}
                      </span>
                      {inspectedTag.isAmbiguous && (
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                          Ambiguous
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setInspectedTag(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tag Stats Grid */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
                  <span className="text-[10px] font-mono text-slate-500 block">Total Uses</span>
                  <span className="text-xl font-black font-space text-white">{inspectedTag.usageCount || 0}</span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
                  <span className="text-[10px] font-mono text-slate-500 block">Status</span>
                  <span className="text-xs font-bold font-mono text-emerald-400 uppercase">{inspectedTag.status || "APPROVED"}</span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
                  <span className="text-[10px] font-mono text-slate-500 block">Created By</span>
                  <span className="text-xs font-bold font-mono text-purple-400 truncate block">@{inspectedTag.createdBy || "Admin"}</span>
                </div>
              </div>

              {/* Related Content list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold font-space text-slate-300 uppercase">
                  Approved Content Using #{inspectedTag.name}
                </h4>

                {inspectedRelatedContent.length === 0 ? (
                  <p className="text-xs text-slate-500 font-mono py-4 text-center bg-slate-950 rounded-xl border border-slate-850">
                    No approved content uses this tag yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                    {inspectedRelatedContent.map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => {
                          setInspectedTag(null);
                          triggerSearch(inspectedTag.name);
                          navigateTo("dashboard", "explore");
                        }}
                        className="p-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:border-purple-500/40 rounded-xl cursor-pointer transition-all flex items-center gap-2.5 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-800 overflow-hidden shrink-0">
                          <img src={item.thumbnailUrl || item.url} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="text-xs font-bold text-slate-200 truncate group-hover:text-purple-400">{item.title}</h5>
                          <span className="text-[9px] font-mono text-slate-500 block">@{item.authorName}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setInspectedTag(null);
                    triggerSearch(inspectedTag.name);
                    navigateTo("dashboard", "explore");
                  }}
                  className="py-2.5 px-5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold uppercase transition-all shadow-lg"
                >
                  Search Content with #{inspectedTag.name}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && tagToDelete && (
        <DeleteConfirmationModal
          isOpen={deleteModalOpen}
          title="Delete Tag"
          warningText={`Are you sure you want to delete #${tagToDelete.name}? It will be removed from directory taxonomy.`}
          itemDetails={
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-slate-200">Tag: #{tagToDelete.name}</span>
              <span className="text-xs font-mono text-cyan-400">Category: {tagToDelete.type || "General"}</span>
            </div>
          }
          onConfirm={confirmDeleteTag}
          onClose={() => {
            setDeleteModalOpen(false);
            setTagToDelete(null);
          }}
        />
      )}

      {/* Bulk Delete Modal */}
      {bulkDeleteModalOpen && (
        <DeleteConfirmationModal
          isOpen={bulkDeleteModalOpen}
          title="Bulk Delete Tags"
          warningText={`Are you sure you want to delete ${selectedTagsForBulk.length} selected tags?`}
          itemDetails={
            <div className="text-xs font-mono text-rose-400">
              {selectedTagsForBulk.length} hashtags selected for global purge
            </div>
          }
          onConfirm={confirmBulkPurge}
          onClose={() => setBulkDeleteModalOpen(false)}
        />
      )}

    </div>
  );
};
