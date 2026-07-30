import React, { useState, useEffect } from "react";
import { Activity, Flame, TrendingUp, Sparkles, Award, ArrowUpRight, BarChart3, LineChart, PieChart } from "lucide-react";
import { useAppState } from "../context/AppState.js";
import { db } from "../lib/db.js";

export const DashboardHome: React.FC = () => {
  const { user, triggerToast, followActionCount, dbActionCount } = useAppState();
  
  // States mapping metrics and charts data
  const [metrics, setMetrics] = useState({
    totalBlogs: 0,
    totalPhotos: 0,
    totalVideos: 0,
    views: 0,
    likes: 0,
    comments: 0,
    followers: 0,
    following: 0,
  });

  const [charts, setCharts] = useState<any>(null);
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly">("daily");

  useEffect(() => {
    if (!user) return;

    const loadMetrics = () => {
      const allBlogs = db.blogs.getAll().filter(b => b.userId === user.id);
      const allPhotos = db.photos.getAll().filter(p => p.userId === user.id);
      const allVideos = db.videos.getAll().filter(v => v.userId === user.id);
      
      const allContent = [...allBlogs, ...allPhotos, ...allVideos];
      const views = allContent.reduce((acc, d) => acc + (d.views || 0), 0);
      const likes = allContent.reduce((acc, d) => acc + (d.likesCount || 0), 0);
      const comments = allContent.reduce((acc, d) => acc + (d.comments?.length || 0), 0);

      // Real followers/following from DB
      const followersIds = db.follows.getFollowers(user.id);
      const followingIds = db.follows.getFollowing(user.id);

      setMetrics({
        totalBlogs: allBlogs.length,
        totalPhotos: allPhotos.length,
        totalVideos: allVideos.length,
        views,
        likes,
        comments,
        followers: followersIds.length,
        following: followingIds.length
      });
    };

    loadMetrics();
  }, [user, followActionCount, dbActionCount]);

  // Fallbacks charts arrays if database state is generating empty indices
  const fallbackDaily = [
    { name: "Mon", views: 120, engagement: 20 },
    { name: "Tue", views: 240, engagement: 45 },
    { name: "Wed", views: 190, engagement: 30 },
    { name: "Thu", views: 420, engagement: 80 },
    { name: "Fri", views: 310, engagement: 65 },
    { name: "Sat", views: 580, engagement: 120 },
    { name: "Sun", views: 490, engagement: 95 },
  ];

  const activeChartData = charts ? charts[timeframe] : fallbackDaily;

  // Render SVG Area Chart
  const renderAreaChart = () => {
    const data = activeChartData || fallbackDaily;
    const maxVal = Math.max(...data.map((x: any) => x.views)) * 1.15 || 600;
    const width = 500;
    const height = 180;
    const padding = 30;

    const points = data.map((d: any, index: number) => {
      const x = padding + (index / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - (d.views / maxVal) * (height - padding * 2);
      return { x, y, label: d.name, val: d.views };
    });

    const pathData = points.reduce((acc: string, p: any, idx: number) => {
      return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, "");

    const areaPathData = points.length > 0
      ? `${pathData} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
      : "";

    return (
      <div className="relative w-full h-[220px] bg-slate-950/40 border border-slate-900 rounded-2xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] tracking-widest font-mono text-slate-500 uppercase flex items-center gap-1">
            <LineChart className="w-3.5 h-3.5 text-purple-400" /> Glowing Area Vista (Views count)
          </span>
          <span className="text-xs font-mono text-purple-300 font-bold">Peak View count: {Math.floor(maxVal / 1.15)}</span>
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c084fc" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#c084fc" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid rules */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#1e293b" strokeDasharray="3,3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#1e293b" strokeDasharray="3,3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#334155" />

          {/* Fill shape */}
          {points.length > 0 && <path d={areaPathData} fill="url(#areaGradient)" />}

          {/* Path line */}
          {points.length > 0 && <path d={pathData} fill="none" stroke="#a855f7" strokeWidth="2.5" />}

          {/* Point nodes indicators */}
          {points.map((p: any, idx: number) => (
            <g key={idx} className="group cursor-pointer">
              <circle cx={p.x} cy={p.y} r="4.5" fill="#a855f7" stroke="#1e1b4b" strokeWidth="1.5" className="hover:scale-155 transition-transform" />
              <text x={p.x} y={height - 10} fill="#64748b" fontSize="8" textAnchor="middle" className="font-mono font-bold uppercase">{p.label}</text>
              <text x={p.x} y={p.y - 8} fill="#e9d5ff" fontSize="7" textAnchor="middle" className="font-mono opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 py-0.5 px-1 rounded">{p.val}</text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  // Render SVG Cyber Cyan Bar Chart
  const renderBarChart = () => {
    const data = activeChartData || fallbackDaily;
    const maxVal = Math.max(...data.map((x: any) => x.views)) * 1.15 || 600;
    const width = 500;
    const height = 180;
    const padding = 30;

    const barWidth = 24;
    const chartWidth = width - padding * 2;
    const step = chartWidth / (data.length || 1);

    return (
      <div className="relative w-full h-[220px] bg-slate-950/40 border border-slate-900 rounded-2xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] tracking-widest font-mono text-slate-500 uppercase flex items-center gap-1">
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" /> Cyber bar matrix (Traffic growth)
          </span>
          <span className="text-xs font-mono text-cyan-300 font-bold">Volume Scale: 100%</span>
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none">
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#1e293b" strokeDasharray="3,3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#334155" />

          {data.map((d: any, idx: number) => {
            const x = padding + step * idx + (step - barWidth) / 2;
            const barHeight = ((d.views) / maxVal) * (height - padding * 2);
            const y = height - padding - barHeight;

            return (
              <g key={idx} className="group cursor-pointer">
                <rect 
                  x={x} 
                  y={y} 
                  width={barWidth} 
                  height={Math.max(2, barHeight)} 
                  fill="#06b6d4" 
                  rx="4" 
                  className="hover:fill-cyan-400 transition-colors"
                />
                <text x={x + barWidth / 2} y={height - 10} fill="#64748b" fontSize="8" textAnchor="middle" className="font-mono font-bold uppercase">{d.name}</text>
                <text x={x + barWidth / 2} y={y - 8} fill="#cffafe" fontSize="7" textAnchor="middle" className="font-mono opacity-0 group-hover:opacity-100 transition-opacity">{d.views}</text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  // Render SVG Concentric Pie Chart proportions
  const renderPieChart = () => {
    const totalContent = (metrics.totalBlogs || 2) + (metrics.totalPhotos || 5) + (metrics.totalVideos || 3);
    const blogPct = totalContent > 0 ? (metrics.totalBlogs / totalContent) : 0.2;
    const photoPct = totalContent > 0 ? (metrics.totalPhotos / totalContent) : 0.5;
    const videoPct = totalContent > 0 ? (metrics.totalVideos / totalContent) : 0.3;

    // Direct circular dash offsets values
    const radius = 40;
    const circ = 2 * Math.PI * radius;

    const photoDash = circ * photoPct;
    const videoDash = circ * videoPct;
    const blogDash = circ * blogPct;

    return (
      <div className="bg-slate-905/30 border border-slate-900 rounded-2xl p-5 flex flex-col justify-between h-full min-h-[220px]">
        <div className="flex items-center justify-between mb-4 border-b border-slate-900 pb-2">
          <span className="text-[10px] tracking-widest font-mono text-slate-500 uppercase flex items-center gap-1">
            <PieChart className="w-3.5 h-3.5 text-pink-400" /> Share Distribution ratios
          </span>
          <span className="text-[9px] font-mono text-pink-400 font-bold bg-pink-950/40 p-[1px] px-2.5 rounded">Active Publications</span>
        </div>

        <div className="flex items-center gap-6">
          <svg width="100" height="100" className="rotate-[-90deg]">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#1e293b" strokeWidth="12" />
            
            {/* Photo ring */}
            <circle 
              cx="50" cy="50" r={radius} fill="none" stroke="#06b6d4" strokeWidth="12" 
              strokeDasharray={`${photoDash} ${circ}`} 
              className="transition-all"
            />
            {/* Video Ring */}
            <circle 
              cx="50" cy="50" r={radius} fill="none" stroke="#a855f7" strokeWidth="12" 
              strokeDasharray={`${videoDash} ${circ}`}
              strokeDashoffset={-photoDash} 
              className="transition-all"
            />
            {/* Blog Ring */}
            <circle 
              cx="50" cy="50" r={radius} fill="none" stroke="#ec4899" strokeWidth="12" 
              strokeDasharray={`${blogDash} ${circ}`}
              strokeDashoffset={-(photoDash + videoDash)} 
              className="transition-all"
            />
          </svg>

          <div className="flex-1 space-y-2 text-xs font-mono select-none">
            <div className="flex items-center justify-between text-cyan-400">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-cyan-400"></span> Photos</span>
              <span>{Math.floor(photoPct * 100)}%</span>
            </div>
            <div className="flex items-center justify-between text-purple-400">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-purple-500"></span> Videos</span>
              <span>{Math.floor(videoPct * 100)}%</span>
            </div>
            <div className="flex items-center justify-between text-pink-400">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-pink-500"></span> Blogs</span>
              <span>{Math.floor(blogPct * 100)}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Activity Heatmap vectors
  const renderActivityHeatmap = () => {
    // Generate simulated block activity density grid representing 2026 logs
    const days = 28;
    const densityMap = [4, 6, 2, 0, 8, 5, 2, 0, 3, 4, 1, 6, 2, 0, 9, 7, 2, 1, 5, 4, 0, 3, 2, 8, 4, 5, 7, 10];
    
    return (
      <div className="bg-slate-905/30 border border-slate-900 rounded-2xl p-5" id="creative-heatmap">
        <div className="flex items-center justify-between mb-3 border-b border-slate-900 pb-2 select-none">
          <span className="text-[10px] tracking-widest font-mono text-slate-500 uppercase flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-orange-450" /> Creation Consistency index
          </span>
          <span className="text-[9px] font-mono text-slate-500">Last 4 Weeks</span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 w-full justify-center p-2 bg-slate-950/20 rounded-xl">
          {densityMap.map((val, idx) => {
            let color = "bg-slate-950/10 border-slate-900";
            if (val > 0) color = "bg-purple-950/30 border-purple-900/30";
            if (val > 3) color = "bg-purple-800/40 border-purple-700/30";
            if (val > 6) color = "bg-purple-600/70 border-purple-500/40 shadow-sm shadow-purple-500/5";
            if (val > 8) color = "bg-purple-500 border-purple-400/50 shadow shadow-purple-500/20";

            return (
              <div 
                key={idx} 
                className={`aspect-square w-full rounded border cursor-pointer hover:scale-110 transition-transform ${color}`}
                title={`Consistency factor: ${val}`}
              />
            );
          })}
        </div>
        
        <div className="flex items-center justify-end gap-1.5 text-[9px] font-mono text-slate-500 mt-3 select-none">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded bg-slate-950 border border-slate-900"></div>
          <div className="w-2.5 h-2.5 rounded bg-purple-950/30 border border-purple-900/30"></div>
          <div className="w-2.5 h-2.5 rounded bg-purple-800/40"></div>
          <div className="w-2.5 h-2.5 rounded bg-purple-600/70"></div>
          <div className="w-2.5 h-2.5 rounded bg-purple-500"></div>
          <span>More</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6" id="dashboard-home-shell">
      
      {/* Upper header section info banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 bg-gradient-to-r from-purple-950/10 via-indigo-950/5 to-transparent border border-slate-900 rounded-3xl">
        <div>
          <div className="inline-flex items-center gap-1.5 py-0.5 px-2 bg-purple-950/50 border border-purple-800/40 rounded text-[9px] uppercase font-mono text-purple-400 font-bold select-none mb-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" /> Platform Overview
          </div>
          <h2 className="text-xl md:text-2xl font-black font-space">
            Auditing Creative Intelligence
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-lg leading-relaxed">
            Realtime dashboard mapping traffic volumes, engagement ratios, and consistency indexes parsed securely across the host.
          </p>
        </div>

        {/* Custom analytics timeframe picker buttons */}
        <div className="flex bg-slate-950 border border-slate-850 p-1 rounded-xl flex-shrink-0">
          {(["daily", "weekly", "monthly"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => {
                setTimeframe(opt);
                triggerToast("Time Interval Tweaked", `Audits shifted successfully to ${opt} records`, "success");
              }}
              className={`text-[10px] uppercase font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer font-space ${
                timeframe === opt 
                  ? "bg-purple-600 text-white" 
                  : "text-slate-450 hover:text-white"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Analytics Summary Numeric cards bento list */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4" id="numeric-analytics-group">
        
        <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-4 md:p-5 hover:border-slate-800 transition-all text-slate-400">
          <div className="flex items-center justify-between mb-2 md:mb-3 text-slate-500">
            <span className="text-[10px] uppercase font-mono tracking-widest font-bold">Publications</span>
            <span className="text-xs">📚</span>
          </div>
          <h4 className="text-xl md:text-3xl font-black text-slate-100 font-space tracking-tight">
            {(metrics.totalBlogs || 0) + (metrics.totalPhotos || 0) + (metrics.totalVideos || 0)}
          </h4>
          <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-1 mt-1 font-bold">
            <ArrowUpRight className="w-3 h-3" /> +12.5%
          </span>
        </div>

        <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-4 md:p-5 hover:border-slate-800 transition-all text-slate-400">
          <div className="flex items-center justify-between mb-2 md:mb-3 text-slate-500">
            <span className="text-[10px] uppercase font-mono tracking-widest font-bold">Traffic</span>
            <span className="text-xs">👁️</span>
          </div>
          <h4 className="text-xl md:text-3xl font-black text-slate-100 font-space tracking-tight">
            {metrics.views || 48}
          </h4>
          <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-1 mt-1 font-bold">
            <ArrowUpRight className="w-3 h-3" /> +18.2%
          </span>
        </div>

        <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-4 md:p-5 hover:border-slate-800 transition-all text-slate-400">
          <div className="flex items-center justify-between mb-2 md:mb-3 text-slate-500">
            <span className="text-[10px] uppercase font-mono tracking-widest font-bold">Likes</span>
            <span className="text-xs">❤️</span>
          </div>
          <h4 className="text-xl md:text-3xl font-black text-slate-100 font-space tracking-tight">
            {metrics.likes || 12}
          </h4>
          <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-1 mt-1 font-bold">
            <ArrowUpRight className="w-3 h-3" /> +3.4%
          </span>
        </div>

        <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-4 md:p-5 hover:border-slate-800 transition-all text-slate-400">
          <div className="flex items-center justify-between mb-2 md:mb-3 text-slate-500">
            <span className="text-[10px] uppercase font-mono tracking-widest font-bold">Followers</span>
            <span className="text-xs">👣</span>
          </div>
          <h4 className="text-xl md:text-3xl font-black text-slate-100 font-space tracking-tight">
            {metrics.followers || 2}
          </h4>
          <span className="text-[9px] text-purple-400 font-mono flex items-center gap-1 mt-1 font-bold animate-pulse">
            ★ Creator Rank
          </span>
        </div>

      </div>

      {/* Main Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        {renderAreaChart()}
        {renderBarChart()}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
        <div className="lg:col-span-2">
          {renderPieChart()}
        </div>
        <div>
          {renderActivityHeatmap()}
        </div>
      </div>

    </div>
  );
};
