import React, { useState, useEffect } from "react";
import { Tags, TrendingUp, Search, Calendar, ChevronUp, User, Clock, RefreshCw, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Trash, Eye, Edit2, Check, CheckSquare, Square, Library, Trash2, X, AlertTriangle, Ban } from "lucide-react";
import { useAppState } from "../context/AppState.js";
import { motion, AnimatePresence } from "motion/react";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal.js";
import { db } from "../lib/db.js";

export const TagAnalytics: React.FC = () => {
  const { triggerToast, token, user, dbActionCount, triggerDBSync } = useAppState();
  
  // States of lists tag elements
  const [tagList, setTagList] = useState<any[]>([]);
  const [filterSearch, setFilterSearch] = useState("");
  const [activeSortOrder, setActiveSortOrder] = useState<"usage" | "growth" | "name" | "recent">("usage");
  const [growthPeriod, setGrowthPeriod] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tagPage, setTagPage] = useState(1);
  const tagsPerPage = 10;

  // Selection states
  const [selectedTagsForBulk, setSelectedTagsForBulk] = useState<string[]>([]);
  
  // Edit/Rename states
  const [tagToEdit, setTagToEdit] = useState<any | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  // Preview state
  const [previewTag, setPreviewTag] = useState<any | null>(null);
  const [relatedContent, setRelatedContent] = useState<any[]>([]);

  // Delete modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<any>(null);

  const fetchTagsData = () => {
    setIsRefreshing(true);
    const data = db.tags.getAll();
    setTagList(data || []);
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchTagsData();
  }, [dbActionCount]);

  // Filter and sort the lists tags on client
  const handledTags = tagList
    .filter((x) => x.name.toLowerCase().includes(filterSearch.toLowerCase()))
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
        return new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime();
      }
      return 0;
    });

  // Calculate top indexes for the summary tags overview
  const totalTagsCount = tagList.length;
  const growthAverages = tagList.length > 0 
    ? (tagList.reduce((sum, t) => {
        const val = growthPeriod === "daily" ? t.growthDaily : growthPeriod === "weekly" ? t.growthWeekly : t.growthMonthly;
        return sum + (val || 0);
      }, 0) / tagList.length).toFixed(1)
    : "0.0";
  const supremeActive = [...tagList].sort((a, b) => b.usageCount - a.usageCount)[0]?.name || "N/A";

  const totalTagPages = Math.max(1, Math.ceil(handledTags.length / tagsPerPage));
  const tagStartIndex = (tagPage - 1) * tagsPerPage;
  const tagEndIndex = Math.min(tagStartIndex + tagsPerPage, handledTags.length);
  const currentDisplayedTags = handledTags.slice(tagStartIndex, tagEndIndex);

  // Reset page when filter changes
  useEffect(() => {
    setTagPage(1);
  }, [filterSearch, activeSortOrder]);

  const triggerManualRefresh = () => {
    fetchTagsData();
    triggerToast("Data Synchronized", "Refreshed the Tag Analytics directories", "success");
  };

  const startDeleteTag = (tag: any) => {
    setTagToDelete(tag);
    setDeleteModalOpen(true);
  };

  const handlePreviewTag = (tag: any) => {
    setPreviewTag(tag);
    
    // Fetch related content
    const tagName = tag.name.toLowerCase();
    const blogs = db.blogs.getAll().filter(b => b.tags?.map((t: string) => t.toLowerCase()).includes(tagName) && b.status === "APPROVED");
    const photos = db.photos.getAll().filter(p => p.tags?.map((t: string) => t.toLowerCase()).includes(tagName) && p.status === "APPROVED");
    const videos = db.videos.getAll().filter(v => v.tags?.map((t: string) => t.toLowerCase()).includes(tagName) && v.status === "APPROVED");
    
    const combined = [
      ...blogs.map(item => ({ ...item, type: 'blog' })),
      ...photos.map(item => ({ ...item, type: 'photo' })),
      ...videos.map(item => ({ ...item, type: 'video' }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    setRelatedContent(combined.slice(0, 5)); // Show last 5 pieces of content
  };

  const confirmDeleteTag = () => {
    if (!tagToDelete) return;
    db.tags.delete(tagToDelete.id);
    triggerToast("Tag Deleted", `The tag #${tagToDelete.name} has been removed globally`, "success");
    fetchTagsData();
    setDeleteModalOpen(false);
    setTagToDelete(null);
  };

  const handleBulkPurge = () => {
    if (selectedTagsForBulk.length === 0 || !token) return;
    setBulkDeleteModalOpen(true);
  };

  const confirmBulkPurge = () => {
    if (selectedTagsForBulk.length === 0) return;
    selectedTagsForBulk.forEach(id => db.tags.delete(id));
    triggerToast("Bulk Action Complete", `Successfully purged ${selectedTagsForBulk.length} tags`, "success");
    setSelectedTagsForBulk([]);
    fetchTagsData();
    setBulkDeleteModalOpen(false);
  };

  const handleRenameTag = () => {
    if (!tagToEdit || !newTagName.trim()) return;
    setIsRenaming(true);
    db.tags.update(tagToEdit.id, { name: newTagName.trim() });
    triggerToast("Tag Morphed", "Hashtag taxonomy successfully relabeled", "success");
    setTagToEdit(null);
    fetchTagsData();
    setIsRenaming(false);
  };

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" || user?.role === "MODERATOR";

  return (
    <div className="space-y-6" id="tag-analytics-shell">
      
      {/* Upper header section info banner */}
      <div className="p-5 md:p-6 bg-gradient-to-r from-purple-950/20 to-transparent border-b md:border border-slate-900 md:rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[10px] md:text-xs text-purple-400 font-mono tracking-widest mb-1">
            <Tags className="w-4 h-4 animate-bounce" /> Namespaces & Directory
          </div>
          <h2 className="text-xl md:text-2xl font-black font-space tracking-tight">Tag Analytics Center</h2>
          <p className="text-[10px] md:text-xs text-slate-400 mt-1 max-w-md">
            Review usage metrics, growth factors, and active creator handles mapped across user-submitted tags.
          </p>
        </div>

        <button 
          onClick={triggerManualRefresh}
          className="flex items-center gap-1.5 text-[11px] font-bold bg-slate-950 hover:bg-slate-900 py-2.5 px-5 rounded-xl border border-slate-800 transition-all cursor-pointer active:scale-95 text-slate-300"
          id="btn-tags-refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${isRefreshing ? "animate-spin" : ""}`} /> 
          Sync Realtime
        </button>
      </div>

      {/* Aggregate stats boxes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-4 px-4 md:px-0" id="tags-analytics-grid-metrics">
        
        <div className="p-3 md:p-4 bg-slate-900/30 border border-slate-900 rounded-2xl hover:border-slate-800 transition-all group">
          <span className="text-[8px] md:text-[10px] tracking-[0.1em] font-mono text-slate-500">Total active tags</span>
          <h4 className="text-lg md:text-3xl font-black text-slate-150 font-space mt-1 md:mt-2 group-hover:text-purple-400 transition-colors">{totalTagsCount}</h4>
          <p className="text-[8px] md:text-[9px] text-purple-450 font-mono mt-1 font-bold">★ Active registered indices</p>
        </div>

        <div className="p-3 md:p-4 bg-slate-900/30 border border-slate-900 rounded-2xl hover:border-slate-800 transition-all group">
          <span className="text-[8px] md:text-[10px] tracking-[0.1em] font-mono text-slate-500">Averages growth factor</span>
          <h4 className="text-lg md:text-3xl font-black text-slate-150 font-space mt-1 md:mt-2 group-hover:text-emerald-400 transition-colors">{growthAverages}%</h4>
          <p className="text-[8px] md:text-[9px] text-emerald-400 font-mono mt-1 font-bold">▲ Multi-tab tracking scale</p>
        </div>

        <div className="p-3 md:p-4 bg-slate-900/30 border border-slate-900 rounded-2xl hover:border-slate-800 transition-all group">
          <span className="text-[8px] md:text-[10px] tracking-[0.1em] font-mono text-slate-500">Most used keyword</span>
          <h4 className="text-lg md:text-2xl font-black text-slate-150 font-space mt-1 md:mt-2 truncate group-hover:text-indigo-400 transition-colors">#{supremeActive}</h4>
          <p className="text-[8px] md:text-[9px] text-indigo-400 font-mono mt-1 font-bold">★ Highest traffic rank</p>
        </div>

        <div className="p-3 md:p-4 bg-slate-900/30 border border-slate-900 rounded-2xl hover:border-slate-800 transition-all group">
          <span className="text-[8px] md:text-[10px] tracking-[0.1em] font-mono text-slate-500">Audits state</span>
          <h4 className="text-lg md:text-3xl font-black text-emerald-400 font-space mt-1 md:mt-2">ACTIVE</h4>
          <p className="text-[8px] md:text-[9px] text-slate-500 font-mono mt-1">Updates live automatically</p>
        </div>

      </div>

      {/* Directory controllers table and query triggers */}
      <div className="bg-slate-900/20 md:bg-slate-900/40 border-y md:border border-slate-900 md:rounded-3xl p-4 md:p-6 space-y-6">
        
        {/* Sorting options + fuzzy inputs */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-800/60 w-full" id="tags-analytics-query-bar">
          
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search directory..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="w-full text-[11px] py-2.5 pl-9 pr-4 bg-slate-950 rounded-xl border border-slate-850 focus:outline-none focus:border-purple-600 font-mono placeholder:text-slate-600 transition-all"
              id="txt-tag-search-field"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 justify-start md:justify-end w-full md:w-auto">
            <div className="flex items-center bg-slate-950 border border-slate-850 rounded-xl p-1 mr-2">
              {(["daily", "weekly", "monthly"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setGrowthPeriod(p)}
                  className={`text-[8px] font-bold uppercase px-2 py-1 rounded-lg transition-all ${
                    growthPeriod === p ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <span className="text-[9px] uppercase font-mono text-slate-500 mr-1 select-none self-center w-full md:w-auto mb-1 md:mb-0">Sort By:</span>
            {[
              { label: "Usage", opt: "usage" as const },
              { label: "Growth", opt: "growth" as const },
              { label: "A-Z", opt: "name" as const },
              { label: "Recent", opt: "recent" as const },
            ].map((bt) => (
              <button
                key={bt.opt}
                onClick={() => {
                  setActiveSortOrder(bt.opt);
                  triggerToast("Sorting Adjusted", `Filtered directory lists by ${bt.label}`, "success");
                }}
                className={`text-[9px] font-bold font-space uppercase py-2 px-3 rounded-xl border transition-all cursor-pointer grow md:grow-0 text-center ${
                  activeSortOrder === bt.opt 
                    ? "bg-purple-950/20 text-purple-400 border-purple-500/30" 
                    : "bg-slate-950 text-slate-450 border-slate-850 hover:border-slate-800"
                }`}
              >
                {bt.label}
              </button>
            ))}
          </div>

        </div>

        {/* Directory Output Data lists */}
        {handledTags.length === 0 ? (
          <div className="text-center py-16 bg-slate-950/20 rounded-2xl border border-slate-900/60 select-none">
            <p className="text-slate-550 text-xs">No tags correspond to your active queries directories.</p>
            <p className="text-[10px] text-slate-600 mt-1">Tags get created instantly upon publishing approvals.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
          <tr className="border-b border-slate-800 text-[10px] font-mono text-slate-500 select-none">
                  {isAdmin && (
                    <th className="py-2.1 pb-4 pr-3">
                      <div className="flex items-center">
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
                          className="cursor-pointer p-1.5 hover:bg-slate-800 rounded-lg transition-all"
                          title="Select / Deselect all on page"
                        >
                          {currentDisplayedTags.length > 0 && currentDisplayedTags.every(t => selectedTagsForBulk.includes(t.id)) ? (
                            <CheckSquare className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </th>
                  )}
                  <th className="py-2.1 pb-4">Tag Namespace</th>
                  <th className="py-2.1 pb-4 text-center">Total Uses</th>
                  <th className="py-2.1 pb-4 text-center hidden md:table-cell">Blog / Photo / Video</th>
                  <th className="py-2.1 pb-4 text-center hidden sm:table-cell">Growth ({growthPeriod})</th>
                  <th className="py-2.1 pb-4 hidden lg:table-cell">Most Active</th>
                  <th className="py-2.1 pb-4 text-right">Last Used</th>
                  <th className="py-2.1 pb-4 text-center">{isAdmin ? "Manage" : "Preview"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {currentDisplayedTags.map((tag) => {
                  const isSelected = selectedTagsForBulk.includes(tag.id);
                  const periodGrowth = (growthPeriod === "daily" ? tag.growthDaily : growthPeriod === "weekly" ? tag.growthWeekly : tag.growthMonthly) ?? 0;
                  return (
                    <tr key={tag.id} className={`hover:bg-slate-950/30 transition-colors group ${isSelected ? 'bg-cyan-950/10' : ''}`}>
                      {isAdmin && (
                        <td className="py-3.5 pr-3">
                          <div className="flex items-center">
                            <div 
                              onClick={() => {
                                if (isSelected) setSelectedTagsForBulk(prev => prev.filter(id => id !== tag.id));
                                else setSelectedTagsForBulk(prev => [...prev, tag.id]);
                              }}
                              className="cursor-pointer p-2 md:p-1.5 hover:bg-slate-800/50 rounded-lg transition-all text-slate-600 hover:text-cyan-400"
                              title="Flag for bulk action"
                            >
                              {isSelected ? <CheckSquare className="w-4 h-4 text-cyan-400" /> : <Square className="w-4 h-4" />}
                            </div>
                          </div>
                        </td>
                      )}
                      <td className="py-3.5 font-bold font-mono">
                        <span className={`p-1 px-1.5 md:px-2.5 bg-slate-950 border rounded-lg group-hover:border-purple-500/25 transition-colors text-[10px] md:text-xs ${
                          tag.isBanned 
                            ? "border-rose-900/50 text-rose-500" 
                            : "border-slate-850 text-purple-300"
                        }`}>
                           #{tag.name}
                        </span>
                        {tag.isBanned && (
                          <span className="ml-2 text-[9px] bg-rose-955/20 text-rose-400 border border-rose-900/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                            BANNED
                          </span>
                        )}
                      </td>
                    <td className="py-3.5 text-center font-bold text-slate-200">
                      {tag.usageCount}
                    </td>
                    <td className="py-3.5 text-center hidden md:table-cell">
                      <div className="flex justify-center gap-1.5 text-[10px] font-mono">
                        <span className="text-slate-400" title="Blogs">{tag.blogCount || 0}</span>
                        <span className="text-slate-700">/</span>
                        <span className="text-slate-400" title="Photos">{tag.photoCount || 0}</span>
                        <span className="text-slate-700">/</span>
                        <span className="text-slate-400" title="Videos">{tag.videoCount || 0}</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-center hidden sm:table-cell">
                      <span className={`inline-flex items-center gap-0.5 font-bold font-mono text-[10px] ${
                        periodGrowth >= 0 ? "text-emerald-400" : "text-rose-450"
                      }`}>
                        {periodGrowth >= 0 ? <ChevronUp className="w-3 h-3 text-emerald-400 inline" /> : "▼"} {periodGrowth ? periodGrowth.toFixed(0) : "0"}%
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-350 hidden lg:table-cell">
                      <span className={`flex items-center gap-1 font-mono text-[10px] ${tag.mostActiveUsername === "NightAdmin" ? "text-purple-400" : "text-slate-300"}`}>
                        <User className="w-3.5 h-3.5 opacity-50 inline" /> @{tag.mostActiveUsername || "System"}
                      </span>
                    </td>
                    <td className="py-3.5 text-right font-mono text-[10px] text-slate-505">
                      <span className="flex items-center justify-end gap-1 text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-600 inline" /> {new Date(tag.lastUsedAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1 md:gap-1.5">
                        <button
                          onClick={() => handlePreviewTag(tag)}
                          className="p-2 md:p-1.5 rounded-lg text-purple-400 hover:text-white hover:bg-purple-600 border border-purple-900/50 hover:border-transparent transition-all"
                          title="Preview Details"
                        >
                          <Eye className="w-4 h-4 md:w-3.5 h-3.5" />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => {
                                const nextState = !tag.isBanned;
                                db.tags.ban(tag.name, nextState);
                                if (nextState) {
                                  triggerToast("Keyword Blacklisted 🛑", `Hashtag #${tag.name} is now banned.`, "info");
                                } else {
                                  triggerToast("Keyword Unbanned ✅", `Hashtag #${tag.name} has been lifted from platform-wide blacklists.`, "success");
                                }
                                fetchTagsData();
                                triggerDBSync();
                              }}
                              className={`p-2 md:p-1.5 rounded-lg border transition-all ${
                                tag.isBanned
                                  ? "text-emerald-400 hover:text-white hover:bg-emerald-600 border-emerald-900/50"
                                  : "text-rose-400 hover:text-white hover:bg-rose-600 border-rose-900/50"
                              }`}
                              title={tag.isBanned ? "Unban Tag" : "Ban Tag"}
                            >
                              <Ban className="w-4 h-4 md:w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setTagToEdit(tag);
                                setNewTagName(tag.name);
                              }}
                              className="p-2 md:p-1.5 rounded-lg text-cyan-400 hover:text-white hover:bg-cyan-600 border border-cyan-900/50 hover:border-transparent transition-all"
                              title="Edit / Rename"
                            >
                              <Edit2 className="w-4 h-4 md:w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => startDeleteTag(tag)}
                              className="p-2 md:p-1.5 rounded-lg text-rose-500 hover:text-white hover:bg-rose-600 border border-rose-900/50 hover:border-transparent transition-all"
                              title="Purge Tag Globally"
                            >
                              <Trash className="w-4 h-4 md:w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>

            {/* Tags Pagination Controls */}
            <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4">
              {isAdmin && selectedTagsForBulk.length > 0 && (
                <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left duration-300">
                  <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase">
                    {selectedTagsForBulk.length} tags flagged for bulk action
                  </span>
                  <button
                    onClick={handleBulkPurge}
                    className="flex items-center gap-1.5 py-1.5 px-4 bg-rose-650 hover:bg-rose-600 text-white rounded-xl text-[10px] font-bold uppercase transition-all shadow-lg shadow-rose-900/20"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Purge Bulk Selection
                  </button>
                  <button
                    onClick={() => setSelectedTagsForBulk([])}
                    className="text-[10px] text-slate-500 hover:text-slate-300 font-mono transition-colors"
                  >
                    [CANCEL]
                  </button>
                </div>
              )}

              {handledTags.length > tagsPerPage && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                  <span className="text-xs font-mono text-slate-400">
                    Showing <strong className="text-cyan-400">{tagStartIndex + 1}-{tagEndIndex}</strong> of <strong className="text-purple-400">{handledTags.length}</strong> Tags
                  </span>
                  
                  <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 border border-slate-900 rounded-xl select-none">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => setTagPage(1)}
                      disabled={tagPage === 1}
                      className="p-2 bg-slate-900 hover:bg-purple-950 border border-slate-850 hover:border-purple-900 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer rounded-lg flex items-center justify-center transition-all duration-200"
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
                      className="p-2 bg-slate-900 hover:bg-purple-950 border border-slate-850 hover:border-purple-900 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer rounded-lg flex items-center justify-center transition-all duration-200"
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </motion.button>

                    <span className="text-[10px] font-mono px-3 py-1.5 bg-slate-900 text-slate-300 border border-slate-850 rounded-lg font-bold min-w-[60px] text-center">
                      {tagPage} / {totalTagPages}
                    </span>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => setTagPage(p => Math.min(totalTagPages, p + 1))}
                      disabled={tagPage === totalTagPages}
                      className="p-2 bg-slate-900 hover:bg-purple-950 border border-slate-850 hover:border-purple-900 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer rounded-lg flex items-center justify-center transition-all duration-200"
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
                      className="p-2 bg-slate-900 hover:bg-purple-950 border border-slate-850 hover:border-purple-900 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer rounded-lg flex items-center justify-center transition-all duration-200"
                      title="Last Page"
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <DeleteConfirmationModal 
        isOpen={bulkDeleteModalOpen}
        onClose={() => setBulkDeleteModalOpen(false)}
        onConfirm={confirmBulkPurge}
        title="Batch Terminate Tags"
        warningText={`CRITICAL ACTION: You are about to PERMANENTLY PURGE ${selectedTagsForBulk.length} tags from the platform. This will strip all metadata from thousands of associated content pieces and cannot be undone.`}
        itemDetails={
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Flagged for deletion:</span>
            <div className="max-h-[120px] overflow-y-auto custom-scrollbar p-3 bg-slate-950/50 rounded-xl border border-slate-800 flex flex-wrap gap-2">
               {selectedTagsForBulk.map(id => {
                  const tagItem = tagList.find(t => t.id === id);
                  return (
                    <span key={id} className="text-[10px] font-mono px-2 py-1 bg-rose-950/30 text-rose-400 border border-rose-900/40 rounded-md">
                      #{tagItem?.name || id}
                    </span>
                  );
               })}
            </div>
            <p className="text-[10px] text-rose-500 font-bold italic mt-2">All associated asset cross-references will be destroyed.</p>
          </div>
        }
      />

      <DeleteConfirmationModal 
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDeleteTag}
        title="Permanently Delete Tag"
        warningText={`You are about to globally terminate the tag "#${tagToDelete?.name}". This action cannot be reversed and will strip the tag from ${tagToDelete?.usageCount || 0} associated contents.`}
        itemDetails={
          <div className="flex flex-col gap-1">
            <span className="text-xl font-bold font-space text-purple-400">#{tagToDelete?.name}</span>
            <span className="text-xs text-slate-400">Total usages: {tagToDelete?.usageCount || 0} items</span>
            <span className="text-xs text-slate-400">Pioneer Creator: @{tagToDelete?.mostActiveUsername || "N/A"}</span>
          </div>
        }
      />

      {/* Rename Tag Modal */}
      <AnimatePresence>
        {tagToEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 xs:p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-[340px] xs:max-w-sm sm:max-w-md bg-slate-900 border border-slate-800 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 md:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/30">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-cyan-950/50 flex items-center justify-center text-cyan-400">
                    <Edit2 className="w-4 h-4 md:w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm md:text-base lg:text-lg font-bold font-space text-slate-100">Relabel Hashtag</h2>
                    <p className="text-[9px] md:text-[10px] font-mono text-slate-500 uppercase">#{tagToEdit.name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setTagToEdit(null)}
                  className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="p-4 md:p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] md:text-[10px] font-mono text-slate-500 uppercase tracking-widest block">New Name</label>
                  <div className="relative">
                    <span className="absolute left-4 top-2.5 md:top-3 text-cyan-500 font-mono font-bold text-sm md:text-base">#</span>
                    <input 
                      type="text"
                      autoFocus
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                      onKeyDown={(e) => e.key === "Enter" && handleRenameTag()}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 md:py-3 pl-8 pr-4 text-slate-100 font-mono text-sm md:text-base focus:outline-none focus:border-cyan-500 transition-all"
                      placeholder="label"
                    />
                  </div>
                </div>

                <div className="p-2.5 md:p-3 bg-amber-950/20 border border-amber-900/20 rounded-xl flex items-start gap-2">
                  <div className="shrink-0 mt-0.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /></div>
                  <p className="text-[9px] md:text-[10px] text-amber-200/70 leading-relaxed font-mono uppercase">
                    Affects all content using "#{tagToEdit.name}".
                  </p>
                </div>
              </div>

              <div className="p-3 md:p-4 bg-slate-950/50 border-t border-slate-800 flex justify-end gap-2">
                <button
                  onClick={() => setTagToEdit(null)}
                  className="px-4 py-2 text-[10px] md:text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRenameTag}
                  disabled={isRenaming || !newTagName.trim() || newTagName === tagToEdit.name}
                  className="px-4 md:px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 disabled:pointer-events-none text-white text-[10px] md:text-xs font-black rounded-lg md:rounded-xl transition-all shadow-lg shadow-cyan-900/20 flex items-center gap-1.5"
                >
                  {isRenaming ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Preview Tag Modal */}
      <AnimatePresence>
        {previewTag && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 md:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/30">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-purple-950/50 flex items-center justify-center text-purple-400">
                    <Eye className="w-4 h-4 md:w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base md:text-lg font-bold font-space text-slate-100">Tag Preview</h2>
                    <p className="text-[9px] md:text-[10px] font-mono text-slate-500 uppercase">#{previewTag.name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setPreviewTag(null)}
                  className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 md:p-8 overflow-y-auto max-h-[70vh]">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
                  <div className="p-3 md:p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                    <span className="text-[8px] md:text-[9px] font-mono text-slate-500">Total Uses</span>
                    <div className="text-xl md:text-2xl font-black font-space text-white mt-1">{previewTag.usageCount}</div>
                    <div className="text-[8px] md:text-[9px] text-purple-400 font-bold mt-1">Registry Pulse</div>
                  </div>
                  <div className="p-3 md:p-4 bg-slate-950 border border-slate-850 rounded-2xl">
                    <span className="text-[8px] md:text-[9px] font-mono text-slate-500">Growth ({growthPeriod})</span>
                    <div className={`text-xl md:text-2xl font-black font-space mt-1 ${
                      ((growthPeriod === "daily" ? previewTag.growthDaily : growthPeriod === "weekly" ? previewTag.growthWeekly : previewTag.growthMonthly) ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {((growthPeriod === "daily" ? previewTag.growthDaily : growthPeriod === "weekly" ? previewTag.growthWeekly : previewTag.growthMonthly) ?? 0) >= 0 ? '+' : ''}
                      {((growthPeriod === "daily" ? previewTag.growthDaily : growthPeriod === "weekly" ? previewTag.growthWeekly : previewTag.growthMonthly) ?? 0).toFixed(0)}%
                    </div>
                  </div>
                  <div className="p-3 md:p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                    <span className="text-[8px] md:text-[9px] font-mono text-slate-500">Active Handler</span>
                    <div className={`text-xs md:text-sm font-black mt-1 truncate ${previewTag.mostActiveUsername === "NightAdmin" ? "text-purple-400" : "text-white"}`}>
                      @{previewTag.mostActiveUsername || "System"}
                    </div>
                  </div>
                  <div className="p-3 md:p-4 bg-slate-950 border border-slate-850 rounded-2xl">
                    <span className="text-[8px] md:text-[9px] font-mono text-slate-500">Type Split</span>
                    <div className="text-[10px] space-y-0.5 mt-1 font-mono">
                       <div className="flex justify-between"><span>Blog:</span> <span className="text-white">{previewTag.blogCount || 0}</span></div>
                       <div className="flex justify-between"><span>Photo:</span> <span className="text-white">{previewTag.photoCount || 0}</span></div>
                       <div className="flex justify-between"><span>Video:</span> <span className="text-white">{previewTag.videoCount || 0}</span></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] md:text-xs font-bold font-mono text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">Recent Related Content</h3>
                  {relatedContent.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {relatedContent.map((item) => (
                        <div key={item.id} className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex items-center gap-3 group/item">
                          {(item.type === 'photo' || item.type === 'video') ? (
                            <img 
                              src={(item.type === 'photo' ? item.mediaUrl : (item.thumbnailUrl || item.mediaUrl)) || undefined} 
                              alt={item.title}
                              className="w-10 h-10 rounded-lg object-cover bg-slate-900"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-purple-400 uppercase font-black text-xs">
                              B
                            </div>
                          )}
                          <div className="overflow-hidden">
                            <p className="text-[11px] font-bold text-slate-200 truncate">{item.title}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[9px] font-mono text-slate-500 uppercase">{item.type}</span>
                              <span className="text-[9px] text-slate-700">•</span>
                              <span className="text-[9px] font-mono text-slate-600">@{item.authorName}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center bg-slate-950/30 rounded-2xl border border-dashed border-slate-800">
                      <p className="text-[10px] font-mono text-slate-600 lowercase tracking-widest uppercase mb-1">No Public Content Detected</p>
                      <p className="text-[9px] text-slate-700">Tags without approved content appear after processing.</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-4 mt-4 border-t border-slate-800/40">
                  <h3 className="text-[10px] md:text-xs font-bold font-mono text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">Technical Meta</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 md:gap-y-4 text-[11px] md:text-xs">
                    <div>
                      <span className="text-slate-500 font-mono text-[9px] md:text-[10px] block uppercase">Registry ID</span>
                      <span className="text-slate-300 font-mono break-all">{previewTag.id}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-mono text-[9px] md:text-[10px] block uppercase">Birth Date</span>
                      <span className="text-slate-300 font-mono">{new Date(previewTag.createdAt || previewTag.lastUsedAt).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-mono text-[9px] md:text-[10px] block uppercase">Last Pulse</span>
                      <span className="text-slate-300 font-mono">{new Date(previewTag.lastUsedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 md:p-4 bg-slate-950/50 border-t border-slate-800 flex justify-end gap-2 md:gap-3">
                <button
                  onClick={() => {
                    setPreviewTag(null);
                  }}
                  className="px-4 md:px-6 py-2 md:py-2.5 bg-slate-800 text-slate-200 rounded-xl text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
