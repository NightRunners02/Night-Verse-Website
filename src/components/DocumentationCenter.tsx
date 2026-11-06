import React, { useState, useMemo, useEffect } from "react";
import { 
  BookOpen, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  User as UserIcon, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Layers, 
  Tag, 
  FileText, 
  ExternalLink, 
  History, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Lightbulb, 
  Copy, 
  Check, 
  Menu, 
  X, 
  ShieldCheck, 
  Compass, 
  PlusSquare, 
  Sliders, 
  Users, 
  Video, 
  Image as ImageIcon, 
  Trophy, 
  Heart, 
  Bell, 
  Shield, 
  Maximize2, 
  UserCheck, 
  UserCog, 
  LayoutDashboard,
  Tags,
  Download,
  Share2
} from "lucide-react";
import { useAppState } from "../context/AppState.js";
import { db } from "../lib/db.js";
import { DocumentationArticle, DocumentationCategory, ChangelogRelease, DocumentationRevision } from "../types.js";
import { motion, AnimatePresence } from "motion/react";

// Icon mapping helper
const getCategoryIcon = (iconName: string) => {
  switch (iconName) {
    case "Compass": return Compass;
    case "UserCheck": return UserCheck;
    case "UserCog": return UserCog;
    case "Users": return Users;
    case "LayoutDashboard": return LayoutDashboard;
    case "PlusSquare": return PlusSquare;
    case "Image": return ImageIcon;
    case "Video": return Video;
    case "FileText": return FileText;
    case "Sparkles": return Sparkles;
    case "Maximize2": return Maximize2;
    case "Tags": return Tags;
    case "ShieldCheck": return ShieldCheck;
    case "Trophy": return Trophy;
    case "Heart": return Heart;
    case "Bell": return Bell;
    case "Sliders": return Sliders;
    case "Shield": return Shield;
    case "History": return History;
    default: return BookOpen;
  }
};

interface DocumentationCenterProps {
  onBack?: () => void;
  initialArticleSlug?: string;
  initialCategoryId?: string;
}

export const DocumentationCenter: React.FC<DocumentationCenterProps> = ({
  onBack,
  initialArticleSlug,
  initialCategoryId
}) => {
  const { user, triggerToast, navigateTo, dbActionCount } = useAppState();

  const [categories, setCategories] = useState<DocumentationCategory[]>([]);
  const [articles, setArticles] = useState<DocumentationArticle[]>([]);
  const [changelogs, setChangelogs] = useState<ChangelogRelease[]>([]);
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(initialCategoryId || "all");
  const [selectedArticle, setSelectedArticle] = useState<DocumentationArticle | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"updated" | "published" | "alphabetical">("updated");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<"docs" | "changelog">("docs");

  // Revisions modal
  const [showRevisionModal, setShowRevisionModal] = useState<boolean>(false);
  const [articleRevisions, setArticleRevisions] = useState<DocumentationRevision[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Sync data from database
  useEffect(() => {
    const cats = db.docCategories.getAll().sort((a, b) => a.displayOrder - b.displayOrder);
    const docs = db.documentations.getPublished();
    const logs = db.changelogs.getAll().sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
    
    setCategories(cats);
    setArticles(docs);
    setChangelogs(logs);

    if (initialArticleSlug) {
      const match = docs.find(d => d.slug === initialArticleSlug);
      if (match) setSelectedArticle(match);
    } else if (docs.length > 0 && !selectedArticle) {
      // Default to first article if none selected
      setSelectedArticle(docs[0]);
    }
  }, [dbActionCount, initialArticleSlug]);

  // Load article revisions when opening history
  const handleOpenRevisions = (docId: string) => {
    const revs = db.docRevisions.getByDocId(docId);
    setArticleRevisions(revs);
    setShowRevisionModal(true);
  };

  // Filtered & sorted articles
  const filteredArticles = useMemo(() => {
    return articles
      .filter((article) => {
        const matchesCategory = selectedCategoryId === "all" || article.categoryId === selectedCategoryId;
        const query = searchQuery.toLowerCase().trim();
        if (!query) return matchesCategory;

        const matchesQuery = 
          article.title.toLowerCase().includes(query) ||
          article.summary.toLowerCase().includes(query) ||
          article.content.toLowerCase().includes(query) ||
          (article.tags && article.tags.some(t => t.toLowerCase().includes(query)));

        return matchesCategory && matchesQuery;
      })
      .sort((a, b) => {
        if (sortBy === "alphabetical") return a.title.localeCompare(b.title);
        if (sortBy === "published") {
          return new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime();
        }
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [articles, selectedCategoryId, searchQuery, sortBy]);

  // Copy code helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
    triggerToast("Disalin ke Papan Klip", "Kode telah berhasil disalin.", "info");
  };

  // Article Table of Contents headings detector
  const tableOfContents = useMemo(() => {
    if (!selectedArticle) return [];
    const lines = selectedArticle.content.split("\n");
    const headings: { id: string; text: string; level: number }[] = [];
    
    lines.forEach((line) => {
      if (line.startsWith("### ")) {
        const text = line.replace("### ", "").trim();
        headings.push({ id: text.toLowerCase().replace(/[^a-z0-9]+/g, "-"), text, level: 3 });
      } else if (line.startsWith("## ")) {
        const text = line.replace("## ", "").trim();
        headings.push({ id: text.toLowerCase().replace(/[^a-z0-9]+/g, "-"), text, level: 2 });
      }
    });

    return headings;
  }, [selectedArticle]);

  // Latest doc version
  const latestVersion = changelogs[0]?.versionNumber || "v2.5.0";

  return (
    <div className="space-y-6 text-slate-100 font-sans max-w-7xl mx-auto pb-16">
      {/* -------------------- Top Hero & Search Header -------------------- */}
      <div className="relative rounded-3xl bg-slate-900/80 border border-slate-800 p-6 md:p-8 backdrop-blur-2xl overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-48 bg-purple-600/10 blur-[90px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-36 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest bg-purple-950/80 text-purple-300 border border-purple-800/80 flex items-center gap-1.5 shadow-sm">
                <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                NightVerse Documentation Hub
              </span>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
                Official {latestVersion}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black font-space text-white tracking-tight">
              Pusat Dokumentasi Resmi NightVerse
            </h1>
            <p className="text-xs md:text-sm text-slate-400 max-w-2xl leading-relaxed font-sans">
              Panduan penggunaan menyeluruh, spesifikasi sistem taksonomi, kebijakan privasi, serta riwayat evolusi platform dari versi awal hingga rilis terbaru.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* View Switcher: Docs vs Changelog */}
            <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-space">
              <button
                onClick={() => { setActiveView("docs"); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  activeView === "docs"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Dokumentasi</span>
              </button>
              <button
                onClick={() => { setActiveView("changelog"); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  activeView === "changelog"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Changelog ({changelogs.length})</span>
              </button>
            </div>

            {/* Admin shortcut if user is Super Admin or Admin */}
            {(user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") && (
              <button
                onClick={() => navigateTo("dashboard", "admin-docs")}
                className="hidden lg:flex items-center gap-1.5 px-3.5 py-2 bg-slate-850 hover:bg-slate-800 text-purple-300 hover:text-white rounded-2xl border border-purple-500/30 text-xs font-bold font-space transition-all cursor-pointer"
                title="Kelola Dokumentasi di Admin Workspace"
              >
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                <span>Admin Editor</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Search & Filter Bar */}
        <div className="relative mt-6 flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari dokumentasi berdasarkan judul, fitur, kata kunci, atau topik..."
              className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors font-sans shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-800 rounded-lg text-slate-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-mono text-slate-300 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="updated">Recently Updated</option>
              <option value="published">Recently Published</option>
              <option value="alphabetical">Alphabetical (A-Z)</option>
            </select>

            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden flex items-center justify-center p-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-300 hover:text-white"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* -------------------- Main Content Body -------------------- */}
      {activeView === "changelog" ? (
        /* ================== CHANGELOG & VERSION HISTORY VIEW ================== */
        <div className="space-y-6">
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
              <div>
                <h2 className="text-xl font-black font-space text-white tracking-tight flex items-center gap-2.5">
                  <History className="w-5 h-5 text-purple-400" />
                  Evolusi & Catatan Rilis NightVerse
                </h2>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  Rekam jejak komprehensif seluruh pembaruan sistem dari versi fondasi v1.0.0 hingga versi terbaru.
                </p>
              </div>
              <span className="text-[11px] font-mono text-purple-400 bg-purple-950/60 px-3 py-1 rounded-full border border-purple-900/80">
                {changelogs.length} Versi Dirilis
              </span>
            </div>

            {/* Changelog Timeline */}
            <div className="relative pt-6 space-y-8 before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-gradient-to-b before:from-purple-500 before:via-slate-800 before:to-transparent">
              {changelogs.map((release, idx) => {
                const isLatest = idx === 0;
                return (
                  <div key={release.id} className="relative flex items-start gap-5 pl-2 sm:pl-3">
                    {/* Timeline Node Dot */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 z-10 ${
                      isLatest ? "bg-purple-600 border-purple-300 shadow-lg shadow-purple-900/50" : "bg-slate-900 border-slate-700"
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${isLatest ? "bg-white" : "bg-slate-500"}`} />
                    </div>

                    {/* Changelog Card */}
                    <div className="flex-1 bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-purple-500/40 transition-all shadow-xl">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className={`px-2.5 py-0.5 rounded-xl font-mono text-xs font-black border ${
                            isLatest 
                              ? "bg-purple-600/30 text-purple-300 border-purple-500/50 shadow-sm" 
                              : "bg-slate-900 text-slate-300 border-slate-700"
                          }`}>
                            {release.versionNumber}
                          </span>
                          <h3 className="text-base font-black font-space text-white">
                            {release.releaseTitle}
                          </h3>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(release.releaseDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                          </span>
                          <span>•</span>
                          <span className="text-slate-400">Oleh: {release.createdBy}</span>
                        </div>
                      </div>

                      {release.summary && (
                        <p className="text-xs text-slate-300 font-sans leading-relaxed">
                          {release.summary}
                        </p>
                      )}

                      {/* Categorized Changes */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        {/* New Features */}
                        {release.newFeatures && release.newFeatures.length > 0 && (
                          <div className="space-y-2 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/80">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Fitur Baru ({release.newFeatures.length})
                            </span>
                            <ul className="space-y-1.5 text-xs text-slate-300 font-sans list-disc list-inside">
                              {release.newFeatures.map((feat, fidx) => (
                                <li key={fidx} className="leading-snug">{feat}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Improvements */}
                        {release.improvements && release.improvements.length > 0 && (
                          <div className="space-y-2 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/80">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              Peningkatan & Optimalisasi ({release.improvements.length})
                            </span>
                            <ul className="space-y-1.5 text-xs text-slate-300 font-sans list-disc list-inside">
                              {release.improvements.map((imp, iidx) => (
                                <li key={iidx} className="leading-snug">{imp}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Bug Fixes */}
                        {release.bugFixes && release.bugFixes.length > 0 && (
                          <div className="space-y-2 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/80">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Perbaikan Bug ({release.bugFixes.length})
                            </span>
                            <ul className="space-y-1.5 text-xs text-slate-300 font-sans list-disc list-inside">
                              {release.bugFixes.map((bug, bidx) => (
                                <li key={bidx} className="leading-snug">{bug}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Breaking Changes */}
                        {release.breakingChanges && release.breakingChanges.length > 0 && (
                          <div className="space-y-2 bg-rose-950/20 p-3.5 rounded-xl border border-rose-900/50">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Perubahan Signifikan / Breaking ({release.breakingChanges.length})
                            </span>
                            <ul className="space-y-1.5 text-xs text-rose-200 font-sans list-disc list-inside">
                              {release.breakingChanges.map((brk, brkIdx) => (
                                <li key={brkIdx} className="leading-snug">{brk}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* ================== STANDARD DOCUMENTATION ARTICLES VIEW ================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 1. Category & Navigation Sidebar (Desktop Left) */}
          <div className="hidden lg:block lg:col-span-3 space-y-4 sticky top-6 max-h-[85vh] overflow-y-auto custom-scrollbar pr-1">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3 backdrop-blur-xl">
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/80 mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400">
                  Kategori Dokumentasi
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {categories.length} Topik
                </span>
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategoryId("all")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-space font-bold transition-all cursor-pointer ${
                    selectedCategoryId === "all"
                      ? "bg-purple-600 text-white shadow-md shadow-purple-900/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Semua Topik</span>
                  </span>
                  <span className="text-[10px] font-mono opacity-80">{articles.length}</span>
                </button>

                {categories.map((cat) => {
                  const Icon = getCategoryIcon(cat.icon);
                  const isSelected = selectedCategoryId === cat.id;
                  const catCount = articles.filter(a => a.categoryId === cat.id).length;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-space font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-purple-600/30 text-purple-300 border border-purple-500/40 shadow-sm"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate pr-2">
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-purple-400" : "text-slate-500"}`} />
                        <span className="truncate">{cat.name}</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">{catCount}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Articles in selected category */}
            {selectedCategoryId !== "all" && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3">
                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block px-2 mb-2">
                  Artikel di Topik Ini
                </span>
                <div className="space-y-1">
                  {articles.filter(a => a.categoryId === selectedCategoryId).map((art) => (
                    <button
                      key={art.id}
                      onClick={() => setSelectedArticle(art)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-sans truncate transition-colors cursor-pointer ${
                        selectedArticle?.id === art.id
                          ? "text-purple-300 font-bold bg-purple-950/40 border border-purple-900/50"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                      }`}
                    >
                      {art.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Main Article Viewer (Center) */}
          <div className="lg:col-span-6 space-y-6">
            {selectedArticle ? (
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-6">
                {/* Breadcrumbs */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-500">
                  <span className="hover:text-purple-400 cursor-pointer" onClick={() => setSelectedCategoryId("all")}>
                    Dokumentasi
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span 
                    className="hover:text-purple-400 cursor-pointer text-slate-400" 
                    onClick={() => setSelectedCategoryId(selectedArticle.categoryId)}
                  >
                    {categories.find(c => c.id === selectedArticle.categoryId)?.name || selectedArticle.categoryId}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span className="text-purple-300 font-bold truncate max-w-[200px]">
                    {selectedArticle.title}
                  </span>
                </div>

                {/* Article Header */}
                <div className="space-y-3 pb-4 border-b border-slate-800/80">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-purple-950/60 text-purple-300 border border-purple-800/60">
                      {selectedArticle.version || "v2.5.0"}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 uppercase">
                      Published
                    </span>
                    <button
                      onClick={() => handleOpenRevisions(selectedArticle.id)}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <History className="w-3 h-3" />
                      <span>Riwayat Revisi</span>
                    </button>
                  </div>

                  <h1 className="text-2xl md:text-3xl font-black font-space text-white tracking-tight leading-tight">
                    {selectedArticle.title}
                  </h1>

                  <p className="text-xs md:text-sm text-slate-300 font-sans leading-relaxed">
                    {selectedArticle.summary}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-500 pt-2">
                    <span className="flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                      {selectedArticle.authorName} ({selectedArticle.authorRole || "Admin"})
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Terakhir diperbarui: {new Date(selectedArticle.updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>

                {/* Cover / Screenshot Image if available */}
                {selectedArticle.coverImage && (
                  <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-slate-950 max-h-72">
                    <img 
                      src={selectedArticle.coverImage} 
                      alt={selectedArticle.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Main Article Content Body */}
                <div className="prose prose-invert max-w-none text-xs md:text-sm text-slate-300 font-sans leading-relaxed space-y-4">
                  {selectedArticle.content.split("\n\n").map((block, idx) => {
                    if (block.startsWith("### ")) {
                      const headingText = block.replace("### ", "").trim();
                      const headingId = headingText.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                      return (
                        <h3 key={idx} id={headingId} className="text-base font-black font-space text-white pt-4 pb-1 border-b border-slate-800/60">
                          {headingText}
                        </h3>
                      );
                    }
                    if (block.startsWith("## ")) {
                      const headingText = block.replace("## ", "").trim();
                      const headingId = headingText.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                      return (
                        <h2 key={idx} id={headingId} className="text-lg font-black font-space text-purple-300 pt-5 pb-1 border-b border-purple-900/40">
                          {headingText}
                        </h2>
                      );
                    }
                    if (block.startsWith("```")) {
                      const code = block.replace(/```[a-z]*\n?/g, "").trim();
                      return (
                        <div key={idx} className="relative bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-purple-300 overflow-x-auto my-3">
                          <button
                            onClick={() => handleCopy(code, `code-${idx}`)}
                            className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Salin kode"
                          >
                            {copiedCode === `code-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <pre>{code}</pre>
                        </div>
                      );
                    }
                    if (block.startsWith("- ") || block.startsWith("1. ")) {
                      const items = block.split("\n");
                      return (
                        <ul key={idx} className="space-y-1.5 list-disc list-inside bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60">
                          {items.map((it, itemIdx) => (
                            <li key={itemIdx} className="text-xs leading-relaxed text-slate-300">
                              {it.replace(/^[-0-9.]+\s*/, "")}
                            </li>
                          ))}
                        </ul>
                      );
                    }
                    return (
                      <p key={idx} className="leading-relaxed whitespace-pre-line">
                        {block}
                      </p>
                    );
                  })}
                </div>

                {/* Step-by-Step Guides Section */}
                {selectedArticle.steps && selectedArticle.steps.length > 0 && (
                  <div className="space-y-3 pt-6 border-t border-slate-800/80">
                    <h3 className="text-sm font-black font-space text-white uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      Langkah demi Langkah Panduan
                    </h3>
                    <div className="space-y-2.5">
                      {selectedArticle.steps.map((st) => (
                        <div key={st.stepNumber} className="flex items-start gap-3.5 p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                          <div className="w-6 h-6 rounded-lg bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-purple-300 font-mono font-bold text-xs shrink-0 mt-0.5">
                            {st.stepNumber}
                          </div>
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-bold font-space text-white">{st.title}</h4>
                            <p className="text-xs text-slate-400 font-sans leading-relaxed">{st.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Callout Information Boxes */}
                {selectedArticle.callouts && selectedArticle.callouts.length > 0 && (
                  <div className="space-y-3 pt-2">
                    {selectedArticle.callouts.map((call, cidx) => {
                      const isWarning = call.type === "warning";
                      const isTip = call.type === "tip";
                      return (
                        <div
                          key={cidx}
                          className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                            isWarning
                              ? "bg-amber-950/20 border-amber-500/40 text-amber-200"
                              : isTip
                              ? "bg-cyan-950/20 border-cyan-500/40 text-cyan-200"
                              : "bg-purple-950/20 border-purple-500/40 text-purple-200"
                          }`}
                        >
                          {isWarning ? (
                            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                          ) : isTip ? (
                            <Lightbulb className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                          ) : (
                            <Info className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <h4 className="text-xs font-bold font-space uppercase tracking-wider">{call.title}</h4>
                            <p className="text-xs font-sans mt-0.5 leading-relaxed opacity-90">{call.text}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Article Footer & Tags */}
                {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                  <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-mono text-slate-500 mr-2">Topik Terkait:</span>
                    {selectedArticle.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 bg-slate-950 text-slate-400 border border-slate-800 rounded-lg text-[10px] font-mono"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-16 text-center space-y-3">
                <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold font-space text-white">Pilih Artikel Dokumentasi</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto font-sans">
                  Gunakan sidebar di sebelah kiri atau kotak pencarian untuk memilih artikel dokumentasi.
                </p>
              </div>
            )}
          </div>

          {/* 3. On this Page Table of Contents & Quick Meta (Desktop Right) */}
          <div className="hidden lg:block lg:col-span-3 space-y-4 sticky top-6">
            {/* Table of Contents */}
            {tableOfContents.length > 0 && (
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl space-y-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400 block border-b border-slate-800/80 pb-2">
                  Daftar Isi Halaman
                </span>
                <nav className="space-y-1.5">
                  {tableOfContents.map((head, hidx) => (
                    <a
                      key={hidx}
                      href={`#${head.id}`}
                      className={`block text-xs font-sans transition-colors hover:text-purple-300 truncate ${
                        head.level === 3 ? "pl-3 text-slate-400" : "text-slate-300 font-bold"
                      }`}
                    >
                      {head.text}
                    </a>
                  ))}
                </nav>
              </div>
            )}

            {/* Quick Meta Card */}
            {selectedArticle && (
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl space-y-3 text-xs font-sans">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block border-b border-slate-800/80 pb-2">
                  Informasi Dokumen
                </span>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Versi:</span>
                    <span className="font-mono text-purple-400 font-bold">{selectedArticle.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kategori:</span>
                    <span className="text-slate-300">
                      {categories.find(c => c.id === selectedArticle.categoryId)?.name || selectedArticle.categoryId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Penulis:</span>
                    <span className="text-slate-300">{selectedArticle.authorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span className="text-emerald-400 font-mono font-bold">Resmi</span>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenRevisions(selectedArticle.id)}
                  className="w-full mt-2 py-2 bg-slate-950 hover:bg-slate-850 text-slate-300 hover:text-white rounded-xl border border-slate-800 text-[11px] font-mono font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <History className="w-3.5 h-3.5 text-purple-400" />
                  <span>Lihat Riwayat Versi</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------------------- Mobile Drawer for Categories -------------------- */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md lg:hidden">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[80vh] flex flex-col p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-black font-space text-white uppercase tracking-wider">
                  Kategori Dokumentasi
                </span>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                <button
                  onClick={() => {
                    setSelectedCategoryId("all");
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-space font-bold ${
                    selectedCategoryId === "all" ? "bg-purple-600 text-white" : "text-slate-300 bg-slate-950"
                  }`}
                >
                  <span>Semua Topik</span>
                  <span className="text-[10px] font-mono">{articles.length}</span>
                </button>

                {categories.map((cat) => {
                  const Icon = getCategoryIcon(cat.icon);
                  const isSelected = selectedCategoryId === cat.id;
                  const catCount = articles.filter(a => a.categoryId === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategoryId(cat.id);
                        setMobileDrawerOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-space font-semibold ${
                        isSelected ? "bg-purple-600/30 text-purple-300 border border-purple-500/40" : "text-slate-300 bg-slate-950"
                      }`}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        <Icon className="w-4 h-4 text-purple-400 shrink-0" />
                        <span className="truncate">{cat.name}</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{catCount}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* -------------------- Revisions History Modal -------------------- */}
      <AnimatePresence>
        {showRevisionModal && (
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
                  <h3 className="text-base font-black font-space text-white">
                    Riwayat Revisi Dokumen
                  </h3>
                </div>
                <button
                  onClick={() => setShowRevisionModal(false)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {articleRevisions.length > 0 ? (
                  articleRevisions.map((rev) => (
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

                      {/* Super Admin Restore Button */}
                      {user?.role === "SUPER_ADMIN" && selectedArticle && (
                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => {
                              const res = db.documentations.restoreRevision(selectedArticle.id, rev.id, user.role, user.username);
                              if (res.success) {
                                triggerToast("Versi Dipulihkan 🎉", res.message, "success");
                                const updated = db.documentations.getById(selectedArticle.id);
                                if (updated) setSelectedArticle(updated);
                                setShowRevisionModal(false);
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
                onClick={() => setShowRevisionModal(false)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-bold font-space uppercase transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DocumentationCenter;
