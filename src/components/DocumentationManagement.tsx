import React, { useState, useEffect, useMemo } from "react";
import { 
  BookOpen, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Save, 
  X, 
  Check, 
  History, 
  AlertTriangle, 
  ShieldCheck, 
  Sliders, 
  Search, 
  Filter, 
  Layers, 
  Sparkles, 
  ArrowLeft, 
  Heading1, 
  Heading2, 
  Heading3, 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Table, 
  Code, 
  Link as LinkIcon, 
  Info, 
  Lightbulb, 
  Image as ImageIcon, 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  Calendar,
  User as UserIcon,
  HelpCircle,
  FileText
} from "lucide-react";
import { useAppState } from "../context/AppState.js";
import { db } from "../lib/db.js";
import { 
  DocumentationArticle, 
  DocumentationCategory, 
  DocumentationRevision, 
  DocumentationStep, 
  DocumentationCallout,
  ChangelogRelease 
} from "../types.js";
import { motion, AnimatePresence } from "motion/react";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal.js";

export const DocumentationManagement: React.FC = () => {
  const { user, triggerToast, triggerDBSync, dbActionCount } = useAppState();

  const [articles, setArticles] = useState<DocumentationArticle[]>([]);
  const [categories, setCategories] = useState<DocumentationCategory[]>([]);
  const [changelogs, setChangelogs] = useState<ChangelogRelease[]>([]);

  // Navigation tab inside Documentation Management
  const [activeAdminTab, setActiveAdminTab] = useState<"articles" | "categories" | "changelogs">("articles");

  // Filtering & search states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");

  // Editor states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<"edit" | "preview">("edit");
  const [changeNote, setChangeNote] = useState("");

  // Article Form State
  const [formTitle, setFormTitle] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("getting-started");
  const [formSummary, setFormSummary] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCoverImage, setFormCoverImage] = useState("");
  const [formVersion, setFormVersion] = useState("v2.4.0");
  const [formDisplayOrder, setFormDisplayOrder] = useState<number>(1);
  const [formTags, setFormTags] = useState("");
  const [formSteps, setFormSteps] = useState<DocumentationStep[]>([]);
  const [formCallouts, setFormCallouts] = useState<DocumentationCallout[]>([]);

  // Category Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDescription, setNewCatDescription] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("BookOpen");
  const [newCatOrder, setNewCatOrder] = useState(1);

  // Changelog Modal
  const [isChangelogModalOpen, setIsChangelogModalOpen] = useState(false);
  const [clVersion, setClVersion] = useState("v2.5.0");
  const [clTitle, setClTitle] = useState("");
  const [clDate, setClDate] = useState(new Date().toISOString().split("T")[0]);
  const [clSummary, setClSummary] = useState("");
  const [clNewFeatures, setClNewFeatures] = useState("");
  const [clImprovements, setClImprovements] = useState("");
  const [clBugFixes, setClBugFixes] = useState("");
  const [clBreaking, setClBreaking] = useState("");

  // Revisions Modal
  const [selectedDocForRevisions, setSelectedDocForRevisions] = useState<DocumentationArticle | null>(null);
  const [revisionsList, setRevisionsList] = useState<DocumentationRevision[]>([]);

  // Delete Confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<DocumentationArticle | null>(null);

  // Sync data from DB
  const loadData = () => {
    setArticles(db.documentations.getAll());
    setCategories(db.docCategories.getAll().sort((a, b) => a.displayOrder - b.displayOrder));
    setChangelogs(db.changelogs.getAll().sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()));
  };

  useEffect(() => {
    loadData();
  }, [dbActionCount]);

  // Permission check
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isAdmin = user?.role === "ADMIN";
  const hasAccess = isSuperAdmin || isAdmin;

  if (!hasAccess) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4 max-w-lg mx-auto mt-12">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-black font-space text-white">Akses Dibatasi</h3>
        <p className="text-xs text-slate-400 font-sans leading-relaxed">
          Menu Documentation Management hanya dapat diakses oleh Super Administrator dan Administrator NightVerse.
        </p>
      </div>
    );
  }

  // Filtered articles
  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      const matchCat = categoryFilter === "all" || a.categoryId === categoryFilter;
      const matchStatus = statusFilter === "ALL" || a.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q) || a.slug.toLowerCase().includes(q);
      return matchCat && matchStatus && matchSearch;
    });
  }, [articles, categoryFilter, statusFilter, searchQuery]);

  // Reset form
  const resetForm = () => {
    setEditingArticleId(null);
    setFormTitle("");
    setFormSlug("");
    setFormCategoryId(categories[0]?.id || "getting-started");
    setFormSummary("");
    setFormContent("");
    setFormCoverImage("");
    setFormVersion("v2.4.0");
    setFormDisplayOrder(articles.length + 1);
    setFormTags("");
    setFormSteps([]);
    setFormCallouts([]);
    setChangeNote("");
    setEditorMode("edit");
  };

  // Open editor for new article
  const handleOpenCreate = () => {
    resetForm();
    setIsEditorOpen(true);
  };

  // Open editor for editing
  const handleOpenEdit = (art: DocumentationArticle) => {
    setEditingArticleId(art.id);
    setFormTitle(art.title);
    setFormSlug(art.slug);
    setFormCategoryId(art.categoryId);
    setFormSummary(art.summary);
    setFormContent(art.content);
    setFormCoverImage(art.coverImage || "");
    setFormVersion(art.version || "v2.4.0");
    setFormDisplayOrder(art.displayOrder || 1);
    setFormTags(art.tags ? art.tags.join(", ") : "");
    setFormSteps(art.steps || []);
    setFormCallouts(art.callouts || []);
    setChangeNote("");
    setEditorMode("edit");
    setIsEditorOpen(true);
  };

  // Title to slug automatic generator
  const handleTitleChange = (val: string) => {
    setFormTitle(val);
    if (!editingArticleId) {
      const genSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      setFormSlug(genSlug);
    }
  };

  // Insert markdown snippet into content
  const insertSnippet = (snippet: string) => {
    setFormContent((prev) => prev + (prev.endsWith("\n") ? "" : "\n\n") + snippet);
  };

  // Add Step
  const handleAddStep = () => {
    const nextNum = formSteps.length + 1;
    setFormSteps([...formSteps, { stepNumber: nextNum, title: `Langkah ${nextNum}`, description: "" }]);
  };

  // Add Callout
  const handleAddCallout = (type: "info" | "warning" | "tip") => {
    setFormCallouts([...formCallouts, { type, title: type.toUpperCase(), text: "" }]);
  };

  // Save Article (Draft or Published)
  const handleSaveArticle = (statusToSet: "DRAFT" | "PUBLISHED") => {
    if (!user) return;
    if (!formTitle.trim()) {
      triggerToast("Validasi Gagal", "Judul artikel wajib diisi.", "error");
      return;
    }
    if (!formContent.trim()) {
      triggerToast("Validasi Gagal", "Isi konten dokumentasi tidak boleh kosong.", "error");
      return;
    }

    const cleanSlug = (formSlug.trim() || formTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")).replace(/^-|-$/g, "");
    const parsedTags = formTags.split(",").map(t => t.trim().toLowerCase()).filter(Boolean);

    const articlePayload = {
      title: formTitle.trim(),
      slug: cleanSlug,
      categoryId: formCategoryId,
      summary: formSummary.trim(),
      content: formContent.trim(),
      coverImage: formCoverImage.trim() || undefined,
      status: statusToSet,
      version: formVersion.trim() || "v2.4.0",
      authorId: user.id,
      authorName: user.username,
      authorRole: user.role,
      displayOrder: formDisplayOrder || 1,
      steps: formSteps,
      callouts: formCallouts,
      tags: parsedTags
    };

    if (editingArticleId) {
      const res = db.documentations.update(
        editingArticleId,
        articlePayload,
        { id: user.id, username: user.username, role: user.role },
        changeNote || "Updated via Documentation Management"
      );
      if (res.success) {
        triggerToast("Berhasil Disimpan ✨", res.message, "success");
        triggerDBSync();
        loadData();
        setIsEditorOpen(false);
      } else {
        triggerToast("Gagal", res.message, "error");
      }
    } else {
      const res = db.documentations.add(
        articlePayload,
        { id: user.id, username: user.username, role: user.role }
      );
      if (res.success) {
        triggerToast("Dokumentasi Dibuat 🎉", res.message, "success");
        triggerDBSync();
        loadData();
        setIsEditorOpen(false);
      } else {
        triggerToast("Gagal", res.message, "error");
      }
    }
  };

  // Publish / Unpublish Toggle
  const handleTogglePublish = (art: DocumentationArticle) => {
    if (!user) return;
    if (art.status === "PUBLISHED") {
      const res = db.documentations.unpublish(art.id, user.role);
      triggerToast("Ditarik", res.message, "info");
    } else {
      const res = db.documentations.publish(art.id, user.role);
      triggerToast("Diterbitkan 🎉", res.message, "success");
    }
    triggerDBSync();
    loadData();
  };

  // Open Revisions Modal
  const handleViewRevisions = (art: DocumentationArticle) => {
    setSelectedDocForRevisions(art);
    const revs = db.docRevisions.getByDocId(art.id);
    setRevisionsList(revs);
  };

  // Add Category Handler
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const catId = newCatName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const res = db.docCategories.add({
      id: catId,
      name: newCatName.trim(),
      slug: catId,
      description: newCatDescription.trim(),
      icon: newCatIcon || "BookOpen",
      displayOrder: Number(newCatOrder) || categories.length + 1
    });

    if (res.success) {
      triggerToast("Kategori Ditambahkan ✨", res.message, "success");
      triggerDBSync();
      loadData();
      setIsCategoryModalOpen(false);
      setNewCatName("");
      setNewCatDescription("");
    } else {
      triggerToast("Gagal", res.message, "error");
    }
  };

  // Add Changelog Handler
  const handleCreateChangelog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clVersion.trim() || !clTitle.trim()) {
      triggerToast("Validasi Gagal", "Versi dan judul rilis wajib diisi.", "error");
      return;
    }

    const payload: ChangelogRelease = {
      id: "cl-" + Date.now(),
      versionNumber: clVersion.trim(),
      releaseTitle: clTitle.trim(),
      releaseDate: clDate || new Date().toISOString().split("T")[0],
      summary: clSummary.trim(),
      newFeatures: clNewFeatures.split("\n").map(l => l.trim()).filter(Boolean),
      improvements: clImprovements.split("\n").map(l => l.trim()).filter(Boolean),
      bugFixes: clBugFixes.split("\n").map(l => l.trim()).filter(Boolean),
      breakingChanges: clBreaking.split("\n").map(l => l.trim()).filter(Boolean),
      createdBy: user ? `@${user.username} (${user.role})` : "NightVerse Admin",
      createdAt: new Date().toISOString()
    };

    const res = db.changelogs.add(payload);
    if (res.success) {
      triggerToast("Changelog Diterbitkan 🚀", res.message, "success");
      triggerDBSync();
      loadData();
      setIsChangelogModalOpen(false);
      setClTitle("");
      setClSummary("");
      setClNewFeatures("");
      setClImprovements("");
      setClBugFixes("");
      setClBreaking("");
    } else {
      triggerToast("Gagal", res.message, "error");
    }
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans pb-16">
      {/* Header Banner */}
      <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-32 bg-purple-600/10 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-950/80 border border-purple-800 text-purple-300 font-mono text-[10px] uppercase font-bold rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Documentation Operations Deck
            </div>
            <h2 className="text-2xl md:text-3xl font-black font-space text-white tracking-tight">
              Documentation Management
            </h2>
            <p className="text-xs text-slate-400 max-w-xl font-sans leading-relaxed">
              Pusat penerbitan dan penyuntingan materi dokumentasi NightVerse, manajemen taksonomi kategori panduan, riwayat revisi artikel, serta pengelolaan catatan rilis changelog.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-xs font-bold font-space uppercase tracking-wider transition-all shadow-lg shadow-purple-950/40 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Artikel Baru</span>
            </button>
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-950 hover:bg-slate-850 text-slate-300 hover:text-white rounded-2xl border border-slate-800 text-xs font-bold font-space transition-colors cursor-pointer"
            >
              <Layers className="w-4 h-4 text-purple-400" />
              <span>+ Kategori</span>
            </button>
            <button
              onClick={() => setIsChangelogModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-950 hover:bg-slate-850 text-slate-300 hover:text-white rounded-2xl border border-slate-800 text-xs font-bold font-space transition-colors cursor-pointer"
            >
              <History className="w-4 h-4 text-cyan-400" />
              <span>+ Changelog</span>
            </button>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800/80">
          <button
            onClick={() => setActiveAdminTab("articles")}
            className={`px-4 py-2 rounded-xl text-xs font-space font-bold transition-all cursor-pointer ${
              activeAdminTab === "articles"
                ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            Artikel Dokumentasi ({articles.length})
          </button>
          <button
            onClick={() => setActiveAdminTab("categories")}
            className={`px-4 py-2 rounded-xl text-xs font-space font-bold transition-all cursor-pointer ${
              activeAdminTab === "categories"
                ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            Kategori Topik ({categories.length})
          </button>
          <button
            onClick={() => setActiveAdminTab("changelogs")}
            className={`px-4 py-2 rounded-xl text-xs font-space font-bold transition-all cursor-pointer ${
              activeAdminTab === "changelogs"
                ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            Riwayat Changelog ({changelogs.length})
          </button>
        </div>
      </div>

      {/* ======================= TAB 1: ARTICLES LIST ======================= */}
      {activeAdminTab === "articles" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan judul atau slug..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-sans"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
          </div>

          {/* Articles Table */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="bg-slate-950/70 text-slate-400 font-mono text-[10px] uppercase tracking-wider border-b border-slate-800">
                    <th className="py-3.5 px-4 font-bold">Judul Artikel</th>
                    <th className="py-3.5 px-4 font-bold">Kategori</th>
                    <th className="py-3.5 px-4 font-bold">Versi</th>
                    <th className="py-3.5 px-4 font-bold">Status</th>
                    <th className="py-3.5 px-4 font-bold">Penulis</th>
                    <th className="py-3.5 px-4 font-bold">Terakhir Diperbarui</th>
                    <th className="py-3.5 px-4 font-bold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredArticles.length > 0 ? (
                    filteredArticles.map((art) => {
                      const catName = categories.find(c => c.id === art.categoryId)?.name || art.categoryId;
                      return (
                        <tr key={art.id} className="hover:bg-slate-850/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <span className="font-bold font-space text-white block text-xs">
                                {art.title}
                              </span>
                              <span className="text-[10px] font-mono text-purple-400">
                                /{art.slug}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                            {catName}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[10px] font-bold text-cyan-400">
                            {art.version || "v2.4.0"}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                              art.status === "PUBLISHED"
                                ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800"
                                : "bg-amber-950/80 text-amber-300 border border-amber-800"
                            }`}>
                              {art.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-300 text-[11px]">
                            {art.authorName}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 text-[11px] font-mono">
                            {new Date(art.updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleTogglePublish(art)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                                  art.status === "PUBLISHED"
                                    ? "bg-slate-800 hover:bg-slate-700 text-amber-300"
                                    : "bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40"
                                }`}
                                title={art.status === "PUBLISHED" ? "Tarik ke draf" : "Terbitkan ke publik"}
                              >
                                {art.status === "PUBLISHED" ? "Tarik Draf" : "Terbitkan"}
                              </button>
                              <button
                                onClick={() => handleViewRevisions(art)}
                                className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800"
                                title="Lihat riwayat revisi"
                              >
                                <History className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenEdit(art)}
                                className="p-1.5 bg-slate-950 hover:bg-slate-800 text-purple-400 hover:text-purple-300 rounded-lg border border-slate-800"
                                title="Edit artikel"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setArticleToDelete(art);
                                  setDeleteModalOpen(true);
                                }}
                                className="p-1.5 bg-slate-950 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-800"
                                title="Hapus artikel"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500 font-sans">
                        Tidak ada artikel dokumentasi yang sesuai dengan kriteria filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 2: CATEGORIES LIST ======================= */}
      {activeAdminTab === "categories" && (
        <div className="space-y-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-black font-space text-white uppercase tracking-wider">
                Daftar Kategori Dokumentasi
              </span>
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold font-space transition-colors"
              >
                + Tambah Kategori
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map((c) => {
                const count = articles.filter(a => a.categoryId === c.id).length;
                return (
                  <div key={c.id} className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-space font-bold text-white text-xs">{c.name}</span>
                      <span className="px-2 py-0.5 rounded bg-purple-950/60 text-purple-400 text-[10px] font-mono">
                        Urutan #{c.displayOrder}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans leading-relaxed line-clamp-2">
                      {c.description || "Tidak ada deskripsi."}
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px] font-mono text-slate-500">
                      <span>{count} Artikel Aktif</span>
                      <span>Icon: {c.icon}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 3: CHANGELOGS LIST ======================= */}
      {activeAdminTab === "changelogs" && (
        <div className="space-y-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-black font-space text-white uppercase tracking-wider">
                Manajemen Versi & Catatan Rilis
              </span>
              <button
                onClick={() => setIsChangelogModalOpen(true)}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold font-space transition-colors"
              >
                + Tambah Rilis Changelog
              </button>
            </div>

            <div className="space-y-3">
              {changelogs.map((cl) => (
                <div key={cl.id} className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-purple-600/30 text-purple-300 font-mono font-black text-xs border border-purple-500/40">
                        {cl.versionNumber}
                      </span>
                      <h4 className="font-space font-bold text-white text-sm">{cl.releaseTitle}</h4>
                    </div>
                    <p className="text-xs text-slate-400 font-sans">{cl.summary || "Tidak ada ringkasan."}</p>
                    <span className="text-[10px] font-mono text-slate-500 block">
                      Rilis: {new Date(cl.releaseDate).toLocaleDateString("id-ID")} • Pencatat: {cl.createdBy}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        db.changelogs.delete(cl.id);
                        triggerToast("Changelog Dihapus", `Rilis ${cl.versionNumber} berhasil dihapus.`, "info");
                        triggerDBSync();
                        loadData();
                      }}
                      className="p-2 bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded-xl border border-slate-800 transition-colors"
                      title="Hapus rilis"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================= DOCUMENTATION EDITOR MODAL ======================= */}
      <AnimatePresence>
        {isEditorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Top Bar */}
              <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-5 h-5 text-purple-400" />
                  <h3 className="text-base font-black font-space text-white">
                    {editingArticleId ? "Edit Dokumentasi" : "Tulis Dokumentasi Baru"}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
                    <button
                      onClick={() => setEditorMode("edit")}
                      className={`px-3 py-1 rounded-lg transition-colors ${editorMode === "edit" ? "bg-purple-600 text-white font-bold" : "text-slate-400"}`}
                    >
                      Editor
                    </button>
                    <button
                      onClick={() => setEditorMode("preview")}
                      className={`px-3 py-1 rounded-lg transition-colors ${editorMode === "preview" ? "bg-purple-600 text-white font-bold" : "text-slate-400"}`}
                    >
                      Preview Mode
                    </button>
                  </div>

                  <button
                    onClick={() => setIsEditorOpen(false)}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Editor Content Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                {editorMode === "edit" ? (
                  <>
                    {/* Metadata fields */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                          Judul Artikel *
                        </label>
                        <input
                          type="text"
                          value={formTitle}
                          onChange={(e) => handleTitleChange(e.target.value)}
                          placeholder="cth: Panduan Lengkap Content Lightbox"
                          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-sans"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                          Kategori *
                        </label>
                        <select
                          value={formCategoryId}
                          onChange={(e) => setFormCategoryId(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                          Slug URL
                        </label>
                        <input
                          type="text"
                          value={formSlug}
                          onChange={(e) => setFormSlug(e.target.value)}
                          placeholder="panduan-content-lightbox"
                          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-purple-300 font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                          Versi Dokumentasi
                        </label>
                        <input
                          type="text"
                          value={formVersion}
                          onChange={(e) => setFormVersion(e.target.value)}
                          placeholder="v2.4.0"
                          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-cyan-400 font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                          Urutan Tampilan (Order)
                        </label>
                        <input
                          type="number"
                          value={formDisplayOrder}
                          onChange={(e) => setFormDisplayOrder(Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                        Ringkasan / Summary Singkat
                      </label>
                      <input
                        type="text"
                        value={formSummary}
                        onChange={(e) => setFormSummary(e.target.value)}
                        placeholder="Penjelasan 1-2 kalimat mengenai tujuan artikel dokumentasi ini..."
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 font-sans"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                        URL Gambar Sampul / Screenshot Tutorial
                      </label>
                      <input
                        type="text"
                        value={formCoverImage}
                        onChange={(e) => setFormCoverImage(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 font-mono"
                      />
                    </div>

                    {/* Rich Formatting Toolbar */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-950 rounded-xl border border-slate-800">
                        <button
                          type="button"
                          onClick={() => insertSnippet("## Judul Bagian Utama (H2)\n")}
                          className="p-1.5 hover:bg-slate-800 rounded text-slate-300 text-xs font-mono flex items-center gap-1"
                          title="Heading 2"
                        >
                          <Heading2 className="w-3.5 h-3.5" /> H2
                        </button>
                        <button
                          type="button"
                          onClick={() => insertSnippet("### Sub-judul Rincian (H3)\n")}
                          className="p-1.5 hover:bg-slate-800 rounded text-slate-300 text-xs font-mono flex items-center gap-1"
                          title="Heading 3"
                        >
                          <Heading3 className="w-3.5 h-3.5" /> H3
                        </button>
                        <div className="w-[1px] h-4 bg-slate-800 mx-1" />
                        <button
                          type="button"
                          onClick={() => insertSnippet("**Teks Tebal**")}
                          className="p-1.5 hover:bg-slate-800 rounded text-slate-300"
                          title="Bold"
                        >
                          <Bold className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertSnippet("*Teks Miring*")}
                          className="p-1.5 hover:bg-slate-800 rounded text-slate-300"
                          title="Italic"
                        >
                          <Italic className="w-3.5 h-3.5" />
                        </button>
                        <div className="w-[1px] h-4 bg-slate-800 mx-1" />
                        <button
                          type="button"
                          onClick={() => insertSnippet("- Poin pertama\n- Poin kedua\n- Poin ketiga")}
                          className="p-1.5 hover:bg-slate-800 rounded text-slate-300"
                          title="Bullet List"
                        >
                          <List className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertSnippet("1. Langkah pertama\n2. Langkah kedua\n3. Langkah ketiga")}
                          className="p-1.5 hover:bg-slate-800 rounded text-slate-300"
                          title="Numbered List"
                        >
                          <ListOrdered className="w-3.5 h-3.5" />
                        </button>
                        <div className="w-[1px] h-4 bg-slate-800 mx-1" />
                        <button
                          type="button"
                          onClick={() => insertSnippet("| Kolom 1 | Kolom 2 |\n| --- | --- |\n| Data A | Data B |")}
                          className="p-1.5 hover:bg-slate-800 rounded text-slate-300"
                          title="Tabel"
                        >
                          <Table className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertSnippet("```javascript\n// Kode snippet di sini\nconsole.log('NightVerse');\n```")}
                          className="p-1.5 hover:bg-slate-800 rounded text-slate-300"
                          title="Code Block"
                        >
                          <Code className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertSnippet("[Judul Tautan](https://nightverse.app)")}
                          className="p-1.5 hover:bg-slate-800 rounded text-slate-300"
                          title="Link"
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                        </button>
                        <div className="w-[1px] h-4 bg-slate-800 mx-1" />
                        <button
                          type="button"
                          onClick={() => handleAddCallout("info")}
                          className="px-2 py-1 bg-purple-950 text-purple-300 rounded text-[10px] font-mono font-bold"
                        >
                          + Callout Info
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddCallout("warning")}
                          className="px-2 py-1 bg-amber-950 text-amber-300 rounded text-[10px] font-mono font-bold"
                        >
                          + Callout Warning
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddStep()}
                          className="px-2 py-1 bg-cyan-950 text-cyan-300 rounded text-[10px] font-mono font-bold"
                        >
                          + Langkah Panduan
                        </button>
                      </div>

                      {/* Main Editor Textarea */}
                      <textarea
                        rows={12}
                        value={formContent}
                        onChange={(e) => setFormContent(e.target.value)}
                        placeholder="Tuliskan dokumentasi lengkap di sini. Mendukung pemisahan paragraf ganda, heading ## dan ###, list, dan kode..."
                        className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs md:text-sm text-slate-200 font-mono focus:outline-none focus:border-purple-500 transition-colors leading-relaxed"
                      />
                    </div>

                    {/* Step-by-Step guides builder */}
                    {formSteps.length > 0 && (
                      <div className="space-y-3 p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold font-space text-white">
                            Langkah demi Langkah Panduan ({formSteps.length})
                          </span>
                          <button
                            type="button"
                            onClick={handleAddStep}
                            className="text-[10px] font-mono text-purple-400 hover:underline"
                          >
                            + Tambah Langkah
                          </button>
                        </div>
                        <div className="space-y-2">
                          {formSteps.map((st, sidx) => (
                            <div key={sidx} className="flex items-start gap-2 p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                              <span className="w-5 h-5 rounded bg-purple-600/40 text-purple-300 font-mono text-xs flex items-center justify-center shrink-0 mt-1">
                                {st.stepNumber}
                              </span>
                              <div className="flex-1 space-y-1">
                                <input
                                  type="text"
                                  value={st.title}
                                  onChange={(e) => {
                                    const next = [...formSteps];
                                    next[sidx].title = e.target.value;
                                    setFormSteps(next);
                                  }}
                                  placeholder="Judul langkah"
                                  className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                                />
                                <input
                                  type="text"
                                  value={st.description}
                                  onChange={(e) => {
                                    const next = [...formSteps];
                                    next[sidx].description = e.target.value;
                                    setFormSteps(next);
                                  }}
                                  placeholder="Deskripsi langkah..."
                                  className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-slate-300"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => setFormSteps(formSteps.filter((_, idx) => idx !== sidx))}
                                className="p-1 text-slate-500 hover:text-rose-400"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Change Note */}
                    {editingArticleId && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                          Catatan Perubahan Revisi (Change Note)
                        </label>
                        <input
                          type="text"
                          value={changeNote}
                          onChange={(e) => setChangeNote(e.target.value)}
                          placeholder="cth: Memperbarui panduan kontrol video player dan popover kualitas"
                          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 font-sans"
                        />
                      </div>
                    )}
                  </>
                ) : (
                  /* Live Preview Mode */
                  <div className="space-y-4 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                    <span className="text-[10px] font-mono font-bold uppercase text-purple-400 block pb-2 border-b border-slate-800">
                      Pratinjau Hasil Publikasi
                    </span>
                    <h1 className="text-2xl font-black font-space text-white">{formTitle || "Judul Dokumentasi"}</h1>
                    <p className="text-xs text-slate-300 font-sans">{formSummary}</p>
                    <div className="text-xs text-slate-300 font-sans space-y-3 whitespace-pre-wrap leading-relaxed pt-2">
                      {formContent}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Controls */}
              <div className="px-6 py-4 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold font-space transition-colors"
                >
                  Batal
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveArticle("DRAFT")}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold font-space transition-colors"
                  >
                    Simpan sebagai Draf
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveArticle("PUBLISHED")}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold font-space uppercase tracking-wider transition-colors shadow-lg shadow-purple-950/40"
                  >
                    Terbitkan Dokumentasi
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================= ADD CATEGORY MODAL ======================= */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-black font-space text-white">Tambah Kategori Baru</h3>
                <button onClick={() => setIsCategoryModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCategory} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Nama Kategori *</label>
                  <input
                    type="text"
                    required
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="cth: Security Architecture"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Deskripsi</label>
                  <textarea
                    rows={2}
                    value={newCatDescription}
                    onChange={(e) => setNewCatDescription(e.target.value)}
                    placeholder="Deskripsi singkat topik ini..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-sans"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Nama Ikon</label>
                    <input
                      type="text"
                      value={newCatIcon}
                      onChange={(e) => setNewCatIcon(e.target.value)}
                      placeholder="BookOpen, Shield, etc."
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Urutan Tampilan</label>
                    <input
                      type="number"
                      value={newCatOrder}
                      onChange={(e) => setNewCatOrder(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold font-space uppercase"
                  >
                    Simpan Kategori
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================= ADD CHANGELOG MODAL ======================= */}
      <AnimatePresence>
        {isChangelogModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-black font-space text-white">Catat Rilis Versi Baru (Changelog)</h3>
                <button onClick={() => setIsChangelogModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateChangelog} className="flex-1 overflow-y-auto space-y-3.5 pr-1 custom-scrollbar">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Version Number *</label>
                    <input
                      type="text"
                      required
                      value={clVersion}
                      onChange={(e) => setClVersion(e.target.value)}
                      placeholder="v2.5.0"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-purple-300 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Release Date</label>
                    <input
                      type="date"
                      value={clDate}
                      onChange={(e) => setClDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Release Title *</label>
                  <input
                    type="text"
                    required
                    value={clTitle}
                    onChange={(e) => setClTitle(e.target.value)}
                    placeholder="cth: Performance Engine & Knowledge Hub"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Ringkasan Rilis</label>
                  <textarea
                    rows={2}
                    value={clSummary}
                    onChange={(e) => setClSummary(e.target.value)}
                    placeholder="Ringkasan pembaruan ini..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-emerald-400 uppercase">Fitur Baru (1 per baris)</label>
                  <textarea
                    rows={3}
                    value={clNewFeatures}
                    onChange={(e) => setClNewFeatures(e.target.value)}
                    placeholder="Pusat Dokumentasi Resmi&#10;Dukungan format audio baru"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-cyan-400 uppercase">Peningkatan (1 per baris)</label>
                  <textarea
                    rows={2}
                    value={clImprovements}
                    onChange={(e) => setClImprovements(e.target.value)}
                    placeholder="Peningkatan responsivitas video player"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-amber-400 uppercase">Perbaikan Bug (1 per baris)</label>
                  <textarea
                    rows={2}
                    value={clBugFixes}
                    onChange={(e) => setClBugFixes(e.target.value)}
                    placeholder="Perbaikan scrolling pada modal"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-sans"
                  />
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsChangelogModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold font-space uppercase"
                  >
                    Simpan Changelog
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================= REVISIONS HISTORY MODAL ======================= */}
      <AnimatePresence>
        {selectedDocForRevisions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-purple-400" />
                  <h3 className="text-base font-black font-space text-white truncate max-w-xs">
                    Revisi: {selectedDocForRevisions.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedDocForRevisions(null)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {revisionsList.length > 0 ? (
                  revisionsList.map((rev) => (
                    <div key={rev.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-purple-950 text-purple-300 font-mono text-[10px] font-bold rounded border border-purple-800">
                            Revisi #{rev.revisionNumber} ({rev.version})
                          </span>
                          <span className="text-xs font-bold text-slate-200">
                            @{rev.editorName} ({rev.editorRole})
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(rev.createdAt).toLocaleString("id-ID")}
                        </span>
                      </div>

                      {rev.changeNote && (
                        <p className="text-xs text-slate-400 font-sans italic">
                          Catatan: "{rev.changeNote}"
                        </p>
                      )}

                      {/* Super Admin Restore Clearance */}
                      {isSuperAdmin && (
                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => {
                              const res = db.documentations.restoreRevision(selectedDocForRevisions.id, rev.id, user.role, user.username);
                              if (res.success) {
                                triggerToast("Versi Dipulihkan 🎉", res.message, "success");
                                triggerDBSync();
                                loadData();
                                setSelectedDocForRevisions(null);
                              } else {
                                triggerToast("Gagal", res.message, "error");
                              }
                            }}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[10px] font-mono font-bold transition-colors cursor-pointer"
                          >
                            Pulihkan Versi Ini (Super Admin)
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-8 font-sans">
                    Belum ada riwayat revisi tambahan untuk artikel ini.
                  </p>
                )}
              </div>

              <button
                onClick={() => setSelectedDocForRevisions(null)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-bold font-space uppercase transition-colors"
              >
                Tutup
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && articleToDelete && (
        <DeleteConfirmationModal
          isOpen={deleteModalOpen}
          title="Konfirmasi Hapus Dokumentasi"
          message={`Apakah Anda yakin ingin menghapus artikel dokumentasi "${articleToDelete.title}"?`}
          warningText="Tindakan ini akan menghapus artikel dari publikasi dan arsip."
          confirmText="Hapus Dokumentasi"
          onClose={() => setDeleteModalOpen(false)}
          onCancel={() => setDeleteModalOpen(false)}
          onConfirm={() => {
            if (user) {
              const res = db.documentations.delete(articleToDelete.id, user.role);
              triggerToast("Artikel Dihapus", res.message, "info");
              triggerDBSync();
              loadData();
            }
            setDeleteModalOpen(false);
            setArticleToDelete(null);
          }}
        />
      )}
    </div>
  );
};

export default DocumentationManagement;
