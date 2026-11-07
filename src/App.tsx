import * as React from "react";
import { AppStateProvider, useAppState } from "./context/AppState.js";
import { LandingPage } from "./components/LandingPage.js";
import { AuthPage } from "./components/AuthPage.js";
import { DashboardLayout } from "./components/DashboardLayout.js";
import { DashboardHome } from "./components/DashboardHome.js";
import { ExploreFeed } from "./components/ExploreFeed.js";
import { ContentCreator } from "./components/ContentCreator.js";
import { TagAnalytics } from "./components/TagAnalytics.js";
import { ProfileWorkspace } from "./components/ProfileWorkspace.js";
import ProfileOverview from "./components/ProfileOverview.js";
import { ProfileSettings } from "./components/ProfileSettings.js";
import { NotificationCenter } from "./components/NotificationCenter.js";
import { UserDirectory } from "./components/UserDirectory.js";
import { AdminWorkspace } from "./components/AdminWorkspace.js";
import { ContentLightbox } from "./components/ContentLightbox.js";
import { X, Sparkles, CheckCircle, AlertTriangle, Info, BellRing } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Nested Core App router
const AppRouter: React.FC = () => {
  const { 
    activePath: activeView, activeTab, toastAlerts, dismissToast, theme,
    focusedContent, setFocusedContent, dbLoaded
  } = useAppState();

  // Route sub-views in dashboard
  const renderDashboardSubView = () => {
    if (!dbLoaded) return <div className="flex items-center justify-center h-full">Loading Storage...</div>;
    switch (activeTab) {
      case "explore":
        return <ExploreFeed />;
      case "analytics":
        return <DashboardHome />;
      case "creator":
        return <ContentCreator />;
      case "tags":
        return <TagAnalytics />;
      case "profile":
        return <ProfileWorkspace />;
      case "profile-overview":
        return <ProfileOverview />;
      case "profile-settings":
        return <ProfileSettings />;
      case "user-directory":
        return <UserDirectory />;
      case "notifications":
        return <NotificationCenter />;
      case "admin-dashboard":
      case "admin-directory":
      case "admin-content":
      case "admin-reports":
      case "admin-badges":
      case "admin-analytics":
      case "admin-settings":
      case "admin-audit":
      case "admin-super":
      case "admin-reviews":
      case "admin-users":
      case "admin-tags":
      case "admin-logs":
      case "admin-docs":
        return <AdminWorkspace />;
      default:
        return <ExploreFeed />;
    }
  };

  // Switch look modifiers on body according to Theme context
  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
  }, [theme]);

  // Main views routing
  const renderView = () => {
    if (!dbLoaded) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
            <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-purple-400 animate-pulse" />
          </div>
          <h2 className="mt-6 font-space font-bold text-xl tracking-tighter text-white">Initializing Storage</h2>
          <p className="mt-2 text-slate-400 text-sm font-sans">Preparing your 10GB sandbox workspace...</p>
        </div>
      );
    }

    switch (activeView) {
      case "landing":
        return <LandingPage />;
      
      case "auth":
        return <AuthPage initialIsAdmin={false} />;
      
      case "admin-login":
        return <AuthPage initialIsAdmin={true} />;
      
      case "dashboard":
        return (
          <DashboardLayout>
            {renderDashboardSubView()}
          </DashboardLayout>
        );
      
      default:
        return <LandingPage />;
    }
  };

  const getToastIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
      case "error": return <AlertTriangle className="w-4 h-4 text-rose-550 flex-shrink-0" />;
      case "info": return <Info className="w-4 h-4 text-purple-400 flex-shrink-0" />;
      default: return <BellRing className="w-4 h-4 text-blue-400 flex-shrink-0" />;
    }
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 selection:bg-purple-650/45 selection:text-white transition-colors duration-300 ${
      theme === "dark" ? "sky-dark-canvas" : "sky-light-canvas"
    }`} id="nightverse-main-containment-bounds">
      
      {/* Route Views render workspace */}
      {renderView()}

      {/* Unified focused publications modals lightbox */}
      {focusedContent && (
        <ContentLightbox 
          type={focusedContent.type}
          item={focusedContent.item}
          onClose={() => setFocusedContent(null)}
        />
      )}

      {/* Minimalist single toast notification system */}
      <div 
        id="global-floating-toaster"
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center pointer-events-none w-full px-4"
      >
        <AnimatePresence mode="wait">
          {toastAlerts.map((t) => (
            <motion.div 
              key={t.id}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
              transition={{ 
                type: "spring",
                stiffness: 500,
                damping: 40,
                duration: 0.3 
              }}
              className="pointer-events-auto min-w-[200px] max-w-sm py-2.5 px-4 rounded-2xl bg-slate-900/95 border border-slate-800 text-slate-200 shadow-2xl backdrop-blur-xl flex items-center gap-3 relative overflow-hidden"
              role="alert"
              id={`toast-${t.id}`}
            >
              <div className="flex-shrink-0">
                {getToastIcon(t.type)}
              </div>

              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <h5 className="font-bold text-[10px] sm:text-xs text-white uppercase font-space tracking-tight truncate">{t.title}</h5>
                  <div className="w-1 h-1 rounded-full bg-slate-700" />
                  <p className="text-[10px] sm:text-[11px] text-slate-400 leading-tight truncate">{t.message}</p>
                </div>
              </div>

              <button 
                onClick={() => dismissToast(t.id)}
                className="p-1 rounded-md text-slate-600 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
              
              {/* Subtle dynamic accent */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                t.type === 'success' ? 'bg-emerald-500' : 
                t.type === 'error' ? 'bg-rose-500' : 
                'bg-purple-500'
              }`} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare props: ErrorBoundaryProps;
  declare state: ErrorBoundaryState;
  declare setState: (state: Partial<ErrorBoundaryState> | ((prevState: ErrorBoundaryState) => Partial<ErrorBoundaryState>)) => void;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("NightVerse Error Boundary caught an exception:", error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center select-none font-sans">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-6 shadow-2xl shadow-rose-950/50">
            <AlertTriangle className="w-8 h-8 text-rose-400" />
          </div>
          <h1 className="text-2xl font-black font-space tracking-tight mb-2">
            NightVerse System Recovery
          </h1>
          <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
            Terjadi kesalahan tak terduga pada sesi browser Anda. Dapatkan kembali akses penuh ke NightVerse dengan memulihkan status aplikasi.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              Coba Lagi
            </button>
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-purple-900/40 cursor-pointer"
            >
              Reset App & Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppStateProvider>
        <AppRouter />
      </AppStateProvider>
    </ErrorBoundary>
  );
}
