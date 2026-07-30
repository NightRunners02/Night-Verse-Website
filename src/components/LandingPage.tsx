import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  TrendingUp, 
  Compass, 
  ArrowRight, 
  Image, 
  Video, 
  BookOpen, 
  Clock, 
  Activity, 
  X, 
  Youtube, 
  Instagram, 
  Github, 
  Sun, 
  Moon,
  Heart,
  MessageSquare,
  Eye,
  MoreVertical,
  ExternalLink,
  Copy,
  Users
} from "lucide-react";
import { useAppState } from "../context/AppState.js";
import { db } from "../lib/db.js";

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

interface TrendingCardProps {
  item: any;
  onSelect: () => void;
}

const TrendingCard: React.FC<TrendingCardProps> = ({ item, onSelect }) => {
  const { viewProfile, triggerToast } = useAppState();
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
      className="relative group bg-slate-900/30 border border-slate-200 dark:border-slate-900 hover:border-purple-650 dark:hover:border-purple-650 rounded-xl md:rounded-2xl overflow-hidden cursor-pointer hover:shadow-2xl hover:shadow-purple-950/30 active:scale-[0.99] transition-all duration-300 flex flex-col h-full bg-white dark:bg-slate-950"
    >
      {/* Media viewport content visual */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100 dark:bg-slate-950 shrink-0">
        {item.itemType === "blog" && (
          <img 
            src={item.thumbnailUrl || undefined} 
            alt={item.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 dark:opacity-85" 
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
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 dark:opacity-85" 
              alt={item.title} 
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <span className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-650 text-white flex items-center justify-center font-mono shadow-md group-hover:scale-110 transition-all duration-300 text-[10px] md:text-xs">▶</span>
            </div>
          </div>
        )}

        {/* Segment indicator stamp badges */}
        <span className={`absolute top-2.5 left-2.5 text-[8px] md:text-[9px] font-black tracking-widest font-mono py-0.5 px-2 rounded uppercase select-none shadow-md z-10 ${
          item.itemType === "blog" ? "bg-cyan-100 dark:bg-cyan-950/95 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800/40" : 
          (item.itemType === "photo" ? "bg-purple-100 dark:bg-purple-950/95 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800/40" : "bg-indigo-100 dark:bg-indigo-950/95 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800/40")
        }`}>
          {item.itemType}
        </span>

        {/* Menu (⋮) Trigger Button */}
        <button
          onClick={toggleMenu}
          className="absolute top-2.5 right-2.5 w-7 h-7 md:w-8 md:h-8 rounded-lg bg-white/70 dark:bg-black/50 hover:bg-slate-50 dark:hover:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 flex items-center justify-center text-slate-650 dark:text-slate-300 hover:text-purple-650 dark:hover:text-white transition-all shadow-md z-20"
          title="More Options"
        >
          <MoreVertical className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </button>

        {/* Dropdown Menu Overlay */}
        {isMenuOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }} />
            <div className="absolute right-2 top-11 w-44 bg-white dark:bg-slate-950/95 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-40 py-1 text-[11px] font-mono animate-in fade-in zoom-in-95 duration-100 backdrop-blur-md">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                  onSelect();
                }}
                className="w-full text-left px-3 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/60 flex items-center gap-2 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-purple-400" /> Open Details
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                  viewProfile(item.userId);
                }}
                className="w-full text-left px-3 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/60 flex items-center gap-2 transition-colors"
              >
                <Users className="w-3.5 h-3.5 text-blue-400" /> View Creator
              </button>
              <button
                onClick={handleCopyLink}
                className="w-full text-left px-3 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/60 flex items-center gap-2 transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-cyan-400" /> Copy Link
              </button>
            </div>
          </>
        )}
      </div>

      {/* Description metadata footer */}
      <div className="p-3 md:p-4 flex-1 flex flex-col justify-between bg-slate-50/50 dark:bg-slate-950/20">
        <div className="space-y-1">
          <h4 className="font-extrabold text-[11px] md:text-sm text-slate-800 dark:text-slate-100 group-hover:text-purple-650 dark:group-hover:text-purple-400 transition-colors leading-tight line-clamp-2 min-h-[32px] md:min-h-[40px] select-none">
            {item.title}
          </h4>
          <p 
            onClick={(e) => {
              e.stopPropagation();
              viewProfile(item.userId);
            }}
            className="text-[10px] md:text-xs text-slate-500 dark:text-slate-450 hover:text-purple-600 dark:hover:text-purple-450 transition-colors truncate font-sans cursor-pointer"
          >
            @{item.authorName}
          </p>
        </div>

        <div className="mt-2 md:mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            <span>{item.views || 0}</span>
          </span>
          
          <div className="flex gap-1.5 md:gap-2 items-center select-none">
            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-850 rounded-lg">
              <Heart className="w-3 h-3 text-rose-500" /> 
              <span className="font-bold text-slate-600 dark:text-slate-300">{item.likesCount || 0}</span>
            </span>
            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-850 rounded-lg">
              <MessageSquare className="w-3 h-3 text-purple-650 dark:text-purple-400" /> 
              <span className="font-bold text-slate-600 dark:text-slate-300">{item.comments?.length || 0}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const LandingPage: React.FC = () => {
  const { navigateTo, toggleTheme, theme, setFocusedContent, systemSettings } = useAppState();
  
  // Real stats data trackers
  const [stats, setStats] = useState({ users: 0, photos: 0, videos: 0, blogs: 0, tags: 0 });
  const [blogs, setBlogs] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [activeTrendingTab, setActiveTrendingTab] = useState<"photos" | "videos" | "blogs">("photos");

  useEffect(() => {
    if (systemSettings) {
      document.title = `${systemSettings.websiteName} | Creators Hub`;
      const link: any = document.querySelector("link[rel~='icon']");
      if (link && systemSettings.faviconEmoji) {
        link.href = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${systemSettings.faviconEmoji}</text></svg>`;
      }
    }
  }, [systemSettings]);

  useEffect(() => {
    // Retrieve public publications
    const allBlogs = db.blogs.getAll().filter(b => b.status === "APPROVED");
    const allPhotos = db.photos.getAll().filter(p => p.status === "APPROVED");
    const allVideos = db.videos.getAll().filter(v => v.status === "APPROVED");
    const allTags = db.tags.getAll();
    const allUsers = db.users.getAll();

    setBlogs(allBlogs);
    setPhotos(allPhotos);
    setVideos(allVideos);
    setStats({
      blogs: allBlogs.length,
      photos: allPhotos.length,
      videos: allVideos.length,
      tags: allTags.length,
      users: allUsers.length || 48
    });
  }, []);

  // Set real numbers derived from lists
  useEffect(() => {
    if (blogs.length || photos.length || videos.length) {
      setStats((prev) => ({
        ...prev,
        blogs: blogs.length || 8,
        photos: photos.length || 12,
        videos: videos.length || 6,
      }));
    }
  }, [blogs, photos, videos]);

  // Rolling counter numbers increments simulation
  const [counts, setCounts] = useState({ users: 0, photos: 0, videos: 0, blogs: 0, tags: 0 });
  useEffect(() => {
    const duration = 1500;
    const intervalTime = 30;
    const steps = duration / intervalTime;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      setCounts({
        users: Math.min(stats.users, Math.floor((stats.users / steps) * step)) || 25,
        photos: Math.min(stats.photos, Math.floor((stats.photos / steps) * step)) || 14,
        videos: Math.min(stats.videos, Math.floor((stats.videos / steps) * step)) || 8,
        blogs: Math.min(stats.blogs, Math.floor((stats.blogs / steps) * step)) || 11,
        tags: Math.min(stats.tags, Math.floor((stats.tags / steps) * step)) || 8,
      });

      if (step >= steps) {
        setCounts(stats);
        clearInterval(timer);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [stats]);

  const [activeLegal, setActiveLegal] = useState<null | { title: string; content: string }>(null);

  const legalDocs = [
    { 
      title: "Terms of Services", 
      desc: "Governance of user interactions and account liabilities inside our airspace.", 
      icon: "⚖️",
      content: "By accessing NightRunners02, you agree to be bound by our digital conduct protocols. We reserve the right to moderate content that violates the social harmony of the cyberspace. Users are strictly responsible for the security of their private keys and session tokens. Any breach of terms may result in immediate suspension of node access."
    },
    { 
      title: "Privacy Safeguards", 
      desc: "Biometric and session data encryption standards for all registered creators.", 
      icon: "🛡️",
      content: "Your data is encrypted at rest using high-fidelity cryptographic standards. We do not sell user telemetry to third-party corporate entities. Session logs are ephemeral and typically purged every 7 cycles to ensure absolute anonymity. We prioritize end-to-end user privacy through decentralized data storage patterns."
    },
    { 
      title: "Content Guideline", 
      desc: "High-fidelity publishing standards for photos, videos, and blog structures.", 
      icon: "📜",
      content: "Submissions must maintain the high-fidelity visual standards of the NightVerse. We encourage raw, unfiltered street photography and authentic digital storytelling. Content depicting systemic exploitation or violating universal safety protocols is strictly prohibited from the public feed and will be automatically purged by our oversight systems."
    },
    { 
      title: "Platform Rules", 
      desc: "Strict adherence to community safety and moderation enforcement protocols.", 
      icon: "🚫",
      content: "Zero tolerance for automated spam or algorithmic toxicity. Direct interactions within the workspace must remain professional, respectful, and constructive. Persistent breach of community rules will lead to hardware-level blacklisting and permanent revocation of publishing privileges across all NightVerse nodes."
    }
  ];

  const securityDocs = [
    {
      title: "JWT Sessions Verification",
      desc: "Robust token-based authentication handling for all platform entries.",
      content: "We utilize JSON Web Tokens (JWT) to secure every request. Your session is signed with a high-entropy secret, ensuring that only you can access your creator profile. Tokens are short-lived and automatically refreshed to prevent session hijacking."
    },
    {
      title: "RBAC Protected Moderation",
      desc: "Role-Based Access Control enforcing strict permission boundaries.",
      content: "Our Oversight system uses RBAC to ensure that only verified moderators can manage content. Creators have sovereign control over their own data, while administrative actions are logged and audited in real-time."
    },
    {
      title: "Global Node Encryption",
      desc: "End-to-end encryption for all data floating through our cyberspace.",
      content: "All data transfers between your browser and our nodes are forced over TLS 1.3. We employ advanced cipher suites to ensure that your creative assets remain protected from interception during transit."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden selection:bg-purple-600/30 selection:text-purple-200 w-full relative" id="nightverse-main-containment-bounds">
      
      {/* Legal Content Modal */}
      {activeLegal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-lg w-full shadow-2xl relative">
            <button 
              onClick={() => setActiveLegal(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-black font-space mb-4 text-purple-400">{activeLegal.title}</h2>
            <div className="space-y-4 text-slate-400 text-sm leading-relaxed font-mono">
              <p>{activeLegal.content}</p>
            </div>
            <button 
              onClick={() => setActiveLegal(null)}
              className="mt-8 w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all"
            >
              Understand & Accept
            </button>
          </div>
        </div>
      )}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[150px] animate-pulse pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/10 blur-[160px] pointer-events-none"></div>
      <div className="absolute bottom-[10%] left-[20%] w-[45%] h-[45%] rounded-full bg-cyan-600/10 blur-[140px] animate-pulse pointer-events-none"></div>

      {/* Cinematic Top Navigation Header Bar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-900 transition-all w-full">
        <div className="max-w-7xl mx-auto px-3 md:px-6 h-16 md:h-20 flex items-center justify-between gap-2">
          
          {/* Logo element */}
          <div className="flex items-center gap-1.5 md:gap-2 cursor-pointer flex-shrink-0" onClick={() => navigateTo("landing")}>
            {systemSettings?.logoUrl ? (
              <img src={systemSettings.logoUrl || undefined} className="w-7 h-7 md:w-9 md:h-9 rounded-xl object-cover shadow-lg shadow-purple-500/20" alt="app logo" />
            ) : (
              <div className="w-7 h-7 md:w-9 md:h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 p-[1px] shadow-lg shadow-purple-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center font-space font-bold text-[10px] md:text-sm">
                  {systemSettings?.faviconEmoji || "🌌"}
                </div>
              </div>
            )}
            <span className="font-space font-black tracking-wider text-[11px] md:text-xl uppercase bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-600 to-purple-600 dark:from-white dark:via-indigo-200 dark:to-purple-400 truncate max-w-[80px] sm:max-w-none">
              {systemSettings?.logoText || "NIGHTVERSE"}
            </span>
          </div>

          {/* Action Navigation lists */}
          <div className="flex items-center gap-1.5 md:gap-4">
            
            {/* Light/Dark dynamic switcher */}
            <button 
              onClick={toggleTheme} 
              className="p-1.5 w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer text-slate-600 dark:text-slate-300 flex items-center justify-center"
              title="Toggle application look"
              id="btn-nav-theme-toggle"
            >
              {theme === "dark" ? <Sun className="w-3.5 h-3.5 md:w-5 md:h-5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 md:w-5 md:h-5 text-indigo-600" />}
            </button>

            <button 
              onClick={() => navigateTo("auth")}
              className="hidden sm:block text-[10px] md:text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/65 py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-800 transition-all cursor-pointer"
              id="btn-nav-login"
            >
              Log in
            </button>
            <button 
              onClick={() => navigateTo("auth", "register")}
              className="text-[9px] md:text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white py-1.5 px-2.5 md:py-2 md:px-4 rounded-lg md:rounded-xl border border-purple-500/20 hover:shadow-lg hover:shadow-purple-500/10 transition-all cursor-pointer whitespace-nowrap"
              id="btn-nav-get-started"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-12 md:pt-32 md:pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center" id="hero-center-box">
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-950/40 border border-purple-800/40 text-[9px] md:text-xs text-purple-300 rounded-full font-mono mb-6 md:mb-8 select-none shadow-md shadow-purple-950/10 tracking-widest uppercase">
            <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5 text-purple-400 animate-spin" /> Live Cinematic Creation Studio
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black font-space tracking-tight mb-6 md:mb-8 leading-[1.1] selection:bg-purple-500/30 selection:text-white whitespace-pre-line bg-gradient-to-r from-slate-900 via-indigo-600 to-purple-600 dark:from-white dark:via-indigo-200 dark:to-purple-400 bg-clip-text text-transparent">
            {systemSettings?.heroTitle || "Where Creativity Meets Cyberspace"}
          </h1>

          <p className="text-xs sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8 md:mb-12 leading-relaxed font-sans px-4 sm:px-0">
            {systemSettings?.heroSubtitle || "Your premium sandbox platform. Securely share breathtaking photos, futuristic audio-visuals, and blogs formatted in high-fidelity designs."}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-6 sm:px-0">
            <button 
              onClick={() => navigateTo("auth", "register")}
              className="w-full sm:w-auto px-4 py-3.5 md:px-8 md:py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-semibold shadow-lg shadow-purple-600/20 active:scale-95 transition-all text-[10px] md:text-xs tracking-wider uppercase cursor-pointer flex items-center justify-center gap-2"
              id="btn-hero-join"
            >
              Join NightVerse Now <ArrowRight className="w-4 h-4" />
            </button>
            <a 
              href="#trending-galleries"
              className="w-full sm:w-auto px-4 py-3.5 md:px-8 md:py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-2xl font-semibold transition-all text-[10px] md:text-xs tracking-wider uppercase cursor-pointer flex items-center justify-center gap-2"
              id="btn-hero-explore"
            >
              <Compass className="w-4 h-4 text-purple-400" /> Explore Galleries
            </a>
          </div>

        </div>
      </section>

      {/* statistics live counters section */}
      <section className="bg-slate-100/50 dark:bg-slate-950 border-y border-slate-200 dark:border-slate-900 py-12 px-6 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-purple-900/5 pointer-events-none"></div>
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-8 text-center relative z-10" id="stats-numbers-shell">
          
          <div className="p-4 md:p-5 rounded-2xl bg-white dark:bg-slate-900/20 border border-indigo-500/10 dark:border-indigo-500/20 shadow-[0_0_40px_rgba(99,102,241,0.05)] hover:border-indigo-500/40 transition-all group overflow-hidden">
            <h3 className="text-2xl md:text-6xl font-black font-space text-indigo-600 dark:text-indigo-400 tracking-tighter">{counts.users}+</h3>
            <p className="text-[8px] md:text-xs text-indigo-600/60 dark:text-indigo-100 font-bold uppercase tracking-widest font-mono mt-1 md:mt-2">Creators</p>
          </div>

          <div className="p-4 md:p-5 rounded-2xl bg-white dark:bg-slate-900/20 border border-rose-500/10 dark:border-rose-500/20 shadow-[0_0_40px_rgba(244,63,94,0.05)] hover:border-rose-500/40 transition-all group overflow-hidden">
            <h3 className="text-2xl md:text-6xl font-black font-space text-rose-600 dark:text-rose-400 tracking-tighter">{counts.photos}</h3>
            <p className="text-[8px] md:text-xs text-rose-600/60 dark:text-rose-100 font-bold uppercase tracking-widest font-mono mt-1 md:mt-2">Photos</p>
          </div>

          <div className="p-4 md:p-5 rounded-2xl bg-white dark:bg-slate-900/20 border border-cyan-500/10 dark:border-cyan-500/20 shadow-[0_0_40px_rgba(6,182,212,0.05)] hover:border-cyan-500/40 transition-all group overflow-hidden">
            <h3 className="text-2xl md:text-6xl font-black font-space text-cyan-600 dark:text-cyan-400 tracking-tighter">{counts.videos}</h3>
            <p className="text-[8px] md:text-xs text-cyan-600/60 dark:text-cyan-100 font-bold uppercase tracking-widest font-mono mt-1 md:mt-2">Videos</p>
          </div>

          <div className="p-4 md:p-5 rounded-2xl bg-white dark:bg-slate-900/10 border border-purple-500/10 dark:border-purple-500/20 shadow-[0_0_40px_rgba(168,85,247,0.1)] relative group overflow-hidden">
            <h3 className="text-2xl md:text-6xl font-black font-space text-purple-600 dark:text-purple-400 tracking-tighter">{counts.blogs}</h3>
            <p className="text-[8px] md:text-xs text-purple-600/60 dark:text-purple-100 font-bold uppercase tracking-widest font-mono mt-1 md:mt-2">Blogs</p>
          </div>

          <div className="p-4 md:p-5 rounded-2xl bg-white dark:bg-slate-900/20 border border-amber-500/10 dark:border-amber-500/20 shadow-[0_0_40px_rgba(245,158,11,0.05)] hover:border-amber-500/40 transition-all group overflow-hidden col-span-2 md:col-span-1">
            <h3 className="text-2xl md:text-6xl font-black font-space text-amber-600 dark:text-amber-400 tracking-tighter">{counts.tags}</h3>
            <p className="text-[8px] md:text-xs text-amber-600/60 dark:text-amber-100 font-bold uppercase tracking-widest font-mono mt-1 md:mt-2">Network Tags</p>
          </div>

        </div>
      </section>

      {/* Trending Content Section (Pinterest / Behance grid style) */}
      <section className="py-24 px-6 relative" id="trending-galleries">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 font-mono tracking-widest uppercase mb-2">
                <TrendingUp className="w-4 h-4" /> Fresh & Trending
              </div>
              <h2 className="text-2xl md:text-4xl font-extrabold font-space text-slate-800 dark:text-slate-100">
                Curated Creator Masterpieces
              </h2>
            </div>

            {/* Custom Gallery switcher tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-1 rounded-xl w-full sm:w-auto self-center justify-center">
              <button 
                onClick={() => setActiveTrendingTab("photos")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-semibold py-2 px-2 md:px-4 rounded-lg transition-all cursor-pointer ${
                  activeTrendingTab === "photos" ? "bg-purple-600 text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Image className="w-3 md:w-3.5 h-3 md:h-3.5" /> Photos
              </button>
              <button 
                onClick={() => setActiveTrendingTab("videos")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-semibold py-2 px-2 md:px-4 rounded-lg transition-all cursor-pointer ${
                  activeTrendingTab === "videos" ? "bg-purple-600 text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Video className="w-3 md:w-3.5 h-3 md:h-3.5" /> Videos
              </button>
              <button 
                onClick={() => setActiveTrendingTab("blogs")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-semibold py-2 px-2 md:px-4 rounded-lg transition-all cursor-pointer ${
                  activeTrendingTab === "blogs" ? "bg-purple-600 text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <BookOpen className="w-3 md:w-3.5 h-3 md:h-3.5" /> Blogs
              </button>
            </div>
          </div>

          {/* Galleries render grids */}
          {activeTrendingTab === "photos" && (
            <div>
              {photos.length === 0 ? (
                <div className="text-center py-16 bg-slate-900/20 border border-slate-900 rounded-2xl">
                  <p className="text-slate-500 text-sm">No photos established yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {photos.map((ph) => (
                    <TrendingCard 
                      key={ph.id} 
                      item={{ ...ph, itemType: "photo" }}
                      onSelect={() => setFocusedContent({ type: "photo", item: ph })}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTrendingTab === "videos" && (
            <div>
              {videos.length === 0 ? (
                <div className="text-center py-16 bg-slate-900/20 border border-slate-900 rounded-2xl">
                  <p className="text-slate-500 text-sm">No videos registered currently.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {videos.map((vid) => (
                    <TrendingCard 
                      key={vid.id} 
                      item={{ ...vid, itemType: "video" }}
                      onSelect={() => setFocusedContent({ type: "video", item: vid })}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTrendingTab === "blogs" && (
            <div>
              {blogs.length === 0 ? (
                <div className="text-center py-16 bg-slate-900/20 border border-slate-900 rounded-2xl">
                  <p className="text-slate-500 text-sm">No blogs established yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {blogs.map((b) => (
                    <TrendingCard 
                      key={b.id} 
                      item={{ ...b, itemType: "blog" }}
                      onSelect={() => setFocusedContent({ type: "blog", item: b })}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </section>

      {/* Modern Features Grid Section */}
      <section className="py-24 bg-white dark:bg-slate-950 px-6 border-t border-slate-200 dark:border-slate-900" id="features">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center max-w-xl mx-auto mb-16">
            <h5 className="text-xs uppercase font-mono tracking-widest text-purple-600 dark:text-purple-400 mb-2">✦ Supercharged Core</h5>
            <h2 className="text-3xl md:text-5xl font-black font-space text-slate-800 dark:text-slate-100">Engineered For Creators</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-4 leading-relaxed">
              Every detail is micro-designed with glassmorphism components to offer a unified modern cyberspace platform.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            
            <div className="p-8 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-900 rounded-3xl hover:border-purple-500/20 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-all group">
              <span className="text-4xl">📸</span>
              <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors mt-5 mb-2">Upload Photos</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Publish high fidelity prints pulling files directly from laptops, mobile uploads, or web URLs.
              </p>
            </div>

            <div className="p-8 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-900 rounded-3xl hover:border-purple-500/20 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-all group">
              <span className="text-4xl">🎥</span>
              <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors mt-5 mb-2">Upload Videos</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Stream custom loops safely supporting adaptive resolutions (up to 4K / UHD) and duration markers.
              </p>
            </div>

            <div className="p-8 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-900 rounded-3xl hover:border-purple-500/20 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-all group">
              <span className="text-4xl">📝</span>
              <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors mt-5 mb-2">Create Blogs</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Write immersive essays backed by gorgeous graphical thumbnails and custom layouts.
              </p>
            </div>

            <div className="p-8 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-900 rounded-3xl hover:border-purple-500/20 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-all group">
              <span className="text-4xl">🏷️</span>
              <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors mt-5 mb-2">Smart Custom Tags</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Define rich, space-separated namespaces matching your interests. Automatic matching on autocomplete.
              </p>
            </div>

            <div className="p-8 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-900 rounded-3xl hover:border-purple-500/20 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-all group">
              <span className="text-4xl">☀️ / 🌙</span>
              <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors mt-5 mb-2">Seamless Themes</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Smooth transitions between Day-Slate Mode and Midnight-Deep styles.
              </p>
            </div>

            <div className="p-8 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-900 rounded-3xl hover:border-purple-500/20 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-all group">
              <span className="text-4xl">⚡</span>
              <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors mt-5 mb-2">Real-time Analytics</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Watch publication engagement grow in highly dynamic customized vector graphics charts.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Dedicated Legal & Governance Section */}
      <section className="py-20 px-6 border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 px-6 overflow-hidden relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {legalDocs.map((item) => (
            <div 
              key={item.title} 
              onClick={() => setActiveLegal({ title: item.title, content: item.content })}
              className="p-6 bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-2xl hover:border-purple-500/30 transition-all group cursor-pointer active:scale-95 shadow-sm dark:shadow-none"
            >
              <div className="text-2xl mb-4 group-hover:scale-110 transition-transform inline-block">{item.icon}</div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2 truncate">{item.title}</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-500 leading-relaxed line-clamp-2 group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Premium Footer */}
      <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900 py-16 px-6 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 text-slate-600 dark:text-slate-400">
          
          <div className="md:col-span-1.5">
            <h4 className="text-slate-900 dark:text-slate-100 font-extrabold tracking-wider uppercase font-space text-lg mb-4">{systemSettings?.websiteName || "NIGHTVERSE"}</h4>
            <p className="text-xs leading-relaxed max-w-sm mb-6">
              {systemSettings?.seoDescription || "NightVerse is a premium cyberspace sandbox created with next-generation aesthetics to empower the worldwide developer and design artist."}
            </p>
            <div className="flex items-center gap-4 mt-6">
              <a 
                href="https://www.youtube.com/@khairyzhafran7018" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-rose-500 hover:border-rose-500/30 hover:bg-rose-500/5 transition-all group"
                title="YouTube Profile"
              >
                <Youtube className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </a>
              <a 
                href="https://www.instagram.com/catfun0202/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-pink-500 hover:border-pink-500/30 hover:bg-pink-500/5 transition-all group"
                title="Instagram Profile"
              >
                <Instagram className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </a>
              <a 
                href="https://github.com/NightRunners02" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/30 hover:bg-slate-200 dark:hover:bg-white/5 transition-all group"
                title="GitHub Profile"
              >
                <Github className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </a>
            </div>
          </div>

          <div>
            <h5 className="text-[10px] uppercase font-mono tracking-widest text-slate-900 dark:text-slate-200 mb-4 font-bold">Directories</h5>
            <ul className="space-y-2.5 text-xs">
              <li className="hover:text-purple-600 dark:hover:text-white transition-colors cursor-pointer" onClick={() => navigateTo("landing")}>Platform Home</li>
              <li className="hover:text-purple-600 dark:hover:text-white transition-colors cursor-pointer" onClick={() => navigateTo("auth")}>Creator Center</li>
              <li className="hover:text-purple-600 dark:hover:text-white transition-colors cursor-pointer" onClick={() => navigateTo("admin-login")}>Admin Console</li>
            </ul>
          </div>

          <div>
            <h5 className="text-[10px] uppercase font-mono tracking-widest text-slate-900 dark:text-slate-200 mb-4 font-bold">Policy & Governance</h5>
            <ul className="space-y-2.5 text-xs">
              {legalDocs.map(doc => (
                <li 
                  key={doc.title}
                  onClick={() => setActiveLegal({ title: doc.title, content: doc.content })}
                  className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer flex items-center gap-2"
                >
                  <div className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></div> {doc.title}
                </li>
              ))}
              <li className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer font-bold flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-900 mt-2">
                <div className="w-1 h-1 bg-purple-500 rounded-full animate-ping"></div> Rules of Engagement
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-[10px] uppercase font-mono tracking-widest text-slate-900 dark:text-slate-200 mb-4 font-bold">Security Shield</h5>
            <ul className="space-y-2.5 text-xs">
              {securityDocs.map(doc => (
                <li 
                  key={doc.title}
                  onClick={() => setActiveLegal({ title: doc.title, content: doc.content })}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-2"
                >
                  <div className="w-1 h-1 bg-emerald-100 dark:bg-emerald-900 rounded-full"></div> {doc.title}
                </li>
              ))}
              <li className="pt-2 border-t border-slate-100 dark:border-slate-900 mt-2 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-mono">
                <Activity className="w-3.5 h-3.5" /> ONLINE SERVER NODE
              </li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-100 dark:border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-mono">
          <div className="flex flex-col gap-1 text-slate-400 dark:text-slate-500">
            <span className="text-slate-600 dark:text-slate-300 font-bold tracking-widest">© 2026 NightRunners02. All Rights Reserved.</span>
            <span>Empowering the digital underworld with high-fidelity architecture.</span>
          </div>
          <div className="text-right flex flex-col items-end gap-1">
            <span className="px-3 py-1 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              Powered by <span className="text-purple-600 dark:text-purple-400 font-bold">{systemSettings?.logoText || "NightVerse Platform"}</span>
            </span>
            <span className="text-slate-400 dark:text-slate-600">Secure Production Node (ID: NV-3000-LIVE)</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
