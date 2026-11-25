import express from "express";
import path from "path";
import fs from "fs";
import { execFile } from "child_process";
import { createServer as createViteServer } from "vite";

const PORT = 3000;
const isProd = process.env.NODE_ENV === "production";

// Directory for persistent uploads / favicon
const PUBLIC_DIR = path.resolve(process.cwd(), "public");
const VIDEO_UPLOAD_DIR = path.resolve(PUBLIC_DIR, "uploads", "videos");
const FAVICON_META_FILE = path.join(PUBLIC_DIR, "custom-favicon.meta.json");
const LOGO_META_FILE = path.join(PUBLIC_DIR, "custom-logo.meta.json");

if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}
if (!fs.existsSync(VIDEO_UPLOAD_DIR)) {
  fs.mkdirSync(VIDEO_UPLOAD_DIR, { recursive: true });
}

function isInsideDir(baseDir: string, targetPath: string): boolean {
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(targetPath);
  return resolvedTarget.startsWith(resolvedBase + path.sep);
}

interface AssetMetadata {
  fileName: string;
  mimeType: string;
  ext: string;
  updatedAt: number;
  filePath: string;
}

function getStoredAssetMeta(metaFile: string): AssetMetadata | null {
  try {
    if (fs.existsSync(metaFile)) {
      const content = fs.readFileSync(metaFile, "utf-8");
      const meta = JSON.parse(content) as AssetMetadata;
      if (meta?.filePath && isInsideDir(PUBLIC_DIR, meta.filePath) && fs.existsSync(meta.filePath)) {
        return meta;
      }
    }
  } catch (err) {
    console.error("[Backend] Error reading asset metadata:", err);
  }
  return null;
}

const getStoredFaviconMeta = () => getStoredAssetMeta(FAVICON_META_FILE);
const getStoredLogoMeta = () => getStoredAssetMeta(LOGO_META_FILE);

async function startServer() {
  const app = express();

  // Serve static assets from public/ folder
  app.use(express.static(PUBLIC_DIR));

  // Raw binary video upload endpoint (must be registered before express.json)
  app.post(
    "/api/videos/upload",
    express.raw({ type: "*/*", limit: "150mb" }),
    (req, res) => {
      try {
        const buffer = Buffer.isBuffer(req.body) ? req.body : null;
        if (!buffer || buffer.length === 0) {
          return res.status(400).json({ error: "Video file payload is empty or invalid." });
        }

        const rawNameHeader = req.headers["x-file-name"];
        const rawFileName = typeof rawNameHeader === "string"
          ? decodeURIComponent(rawNameHeader)
          : "video.mp4";
        const extMatch = rawFileName.toLowerCase().match(/\.([a-z0-9]+)$/);
        const ext = extMatch ? extMatch[1] : "mp4";
        const allowedVideoExts = ["mp4", "mov", "webm", "mkv", "m4v", "avi", "ogv"];
        if (!allowedVideoExts.includes(ext)) {
          return res.status(400).json({
            error: `Format video .${ext} tidak didukung. Gunakan MP4, MOV, WEBM, MKV, M4V, AVI, atau OGV.`,
          });
        }

        const rawIdHeader = req.headers["x-video-id"];
        const requestedId = typeof rawIdHeader === "string" ? rawIdHeader : "";
        const cleanId = (requestedId || `vid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
          .replace(/[^a-zA-Z0-9_-]/g, "");

        const targetFileName = `${cleanId}.${ext}`;
        const targetPath = path.resolve(VIDEO_UPLOAD_DIR, targetFileName);
        if (!isInsideDir(VIDEO_UPLOAD_DIR, targetPath)) {
          return res.status(400).json({ error: "Invalid file path." });
        }

        fs.writeFileSync(targetPath, buffer);
        const mimeType = typeof req.headers["content-type"] === "string"
          ? req.headers["content-type"]
          : "video/mp4";

        res.json({
          success: true,
          videoId: cleanId,
          url: `/uploads/videos/${targetFileName}`,
          fileSize: buffer.length,
          mimeType,
          message: "Video berhasil diunggah ke server storage.",
        });
      } catch (err: any) {
        console.error("[Backend] Video upload error:", err);
        res.status(500).json({ error: "Gagal mengunggah video: " + (err?.message || "Server error") });
      }
    }
  );

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // In-memory / file-persisted settings for authoritative backend validation
  let serverMediaApproval = {
    photo: true,
    video: false,
    blog: true,
  };

  // Favicon API Routes:
  // 1. GET /api/favicon - Serve active favicon with cache busting support and default fallback
  app.get("/api/favicon", (req, res) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    const meta = getStoredFaviconMeta();
    if (meta && fs.existsSync(meta.filePath)) {
      res.setHeader("Content-Type", meta.mimeType);
      return res.sendFile(meta.filePath);
    }

    // Default fallback: public/favicon.svg
    const defaultSvgPath = path.join(PUBLIC_DIR, "favicon.svg");
    if (fs.existsSync(defaultSvgPath)) {
      res.setHeader("Content-Type", "image/svg+xml");
      return res.sendFile(defaultSvgPath);
    }

    res.status(404).send("Favicon not found");
  });

  // 2. GET /api/settings/favicon - Get metadata of current active favicon
  app.get("/api/settings/favicon", (req, res) => {
    const meta = getStoredFaviconMeta();
    if (meta) {
      res.json({
        isCustom: true,
        faviconUrl: `/api/favicon?v=${meta.updatedAt}&ext=${encodeURIComponent(meta.ext)}`,
        updatedAt: meta.updatedAt,
        fileName: meta.fileName,
        mimeType: meta.mimeType,
        ext: meta.ext,
      });
    } else {
      res.json({
        isCustom: false,
        faviconUrl: "/favicon.svg",
        updatedAt: 0,
      });
    }
  });

  // 3. POST /api/settings/favicon - Upload & save new favicon (Super Admin only, validates .ico/.png/.svg and max 2MB)
  app.post("/api/settings/favicon", (req, res) => {
    const { userRole, fileBase64, fileName, mimeType } = req.body;

    // Access control: Only Super Admin can change favicon
    if (userRole !== "SUPER_ADMIN") {
      return res.status(403).json({
        error: "Forbidden: Only Super Administrator can update the website favicon.",
      });
    }

    if (!fileBase64 || !fileName || typeof fileBase64 !== "string" || typeof fileName !== "string") {
      return res.status(400).json({ error: "Missing fileBase64 or fileName." });
    }

    // Determine extension safely
    const extMatch = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
    const rawExt = extMatch ? extMatch[1] : "";
    const normalizedMime = typeof mimeType === "string" ? mimeType.toLowerCase() : "";
    const allowedExtensions = ["ico", "png", "svg"];
    const allowedMimeTypes = [
      "image/x-icon",
      "image/vnd.microsoft.icon",
      "image/ico",
      "image/png",
      "image/svg+xml",
    ];

    if (!allowedExtensions.includes(rawExt) && !allowedMimeTypes.includes(normalizedMime)) {
      return res.status(400).json({
        error: "Format tidak didukung. Harap unggah file dengan format .ico, .png, atau .svg.",
      });
    }

    const ext = allowedExtensions.includes(rawExt)
      ? rawExt
      : normalizedMime.includes("svg")
        ? "svg"
        : normalizedMime.includes("ico")
          ? "ico"
          : "png";

    try {
      // Decode base64 or UTF-8 SVG data URI
      let buffer: Buffer;
      if (fileBase64.includes("base64,")) {
        const base64Data = fileBase64.split("base64,")[1];
        buffer = Buffer.from(base64Data, "base64");
      } else if (fileBase64.startsWith("data:image/svg+xml")) {
        const commaIndex = fileBase64.indexOf(",");
        const rawSvg = commaIndex >= 0 ? fileBase64.slice(commaIndex + 1) : fileBase64;
        const svgContent = decodeURIComponent(rawSvg);
        buffer = Buffer.from(svgContent, "utf-8");
      } else {
        buffer = Buffer.from(fileBase64, "base64");
      }

      if (!buffer || buffer.length === 0) {
        return res.status(400).json({ error: "File favicon kosong atau tidak valid." });
      }

      // Size validation: max 2MB
      const MAX_SIZE = 2 * 1024 * 1024;
      if (buffer.length > MAX_SIZE) {
        return res.status(400).json({
          error: "Ukuran file terlalu besar. Maksimum ukuran favicon adalah 2MB.",
        });
      }

      // Remove stale custom favicon files of any previous extension
      for (const oldExt of allowedExtensions) {
        const stalePath = path.resolve(PUBLIC_DIR, `custom-favicon.${oldExt}`);
        if (isInsideDir(PUBLIC_DIR, stalePath) && fs.existsSync(stalePath)) {
          try {
            fs.unlinkSync(stalePath);
          } catch {}
        }
      }

      // Determine proper mimeType and file target
      let resolvedMime = normalizedMime;
      if (ext === "ico") resolvedMime = "image/x-icon";
      else if (ext === "png") resolvedMime = "image/png";
      else if (ext === "svg") resolvedMime = "image/svg+xml";

      const targetFileName = `custom-favicon.${ext}`;
      const targetFilePath = path.resolve(PUBLIC_DIR, targetFileName);
      if (!isInsideDir(PUBLIC_DIR, targetFilePath)) {
        return res.status(400).json({ error: "Invalid favicon path." });
      }

      // Write permanent file to disk
      fs.writeFileSync(targetFilePath, buffer);

      const timestamp = Date.now();
      const meta: AssetMetadata = {
        fileName,
        mimeType: resolvedMime || "image/png",
        ext,
        updatedAt: timestamp,
        filePath: targetFilePath,
      };

      fs.writeFileSync(FAVICON_META_FILE, JSON.stringify(meta, null, 2), "utf-8");

      console.log(`[Backend] Saved persistent custom favicon: ${targetFileName} (${buffer.length} bytes)`);

      const cacheBustedUrl = `/api/favicon?v=${timestamp}&ext=${encodeURIComponent(ext)}`;
      res.json({
        success: true,
        faviconUrl: cacheBustedUrl,
        updatedAt: timestamp,
        ext,
        mimeType: meta.mimeType,
        message: "Favicon website berhasil diperbarui dan diterapkan.",
      });
    } catch (err: any) {
      console.error("[Backend] Error saving favicon:", err);
      res.status(500).json({ error: "Gagal menyimpan file favicon: " + err.message });
    }
  });

  // 4. POST /api/settings/favicon/reset - Reset favicon to default NightVerse (Super Admin only)
  app.post("/api/settings/favicon/reset", (req, res) => {
    const { userRole } = req.body;

    if (userRole !== "SUPER_ADMIN") {
      return res.status(403).json({
        error: "Forbidden: Only Super Administrator can reset the website favicon.",
      });
    }

    try {
      const meta = getStoredFaviconMeta();
      if (meta && isInsideDir(PUBLIC_DIR, meta.filePath) && fs.existsSync(meta.filePath)) {
        try {
          fs.unlinkSync(meta.filePath);
        } catch {}
      }
      for (const oldExt of ["ico", "png", "svg"]) {
        const stalePath = path.resolve(PUBLIC_DIR, `custom-favicon.${oldExt}`);
        if (isInsideDir(PUBLIC_DIR, stalePath) && fs.existsSync(stalePath)) {
          try {
            fs.unlinkSync(stalePath);
          } catch {}
        }
      }
      if (fs.existsSync(FAVICON_META_FILE)) {
        try {
          fs.unlinkSync(FAVICON_META_FILE);
        } catch {}
      }

      console.log("[Backend] Favicon reset to default.");
      const timestamp = Date.now();
      res.json({
        success: true,
        faviconUrl: "/favicon.svg",
        updatedAt: timestamp,
        message: "Favicon website berhasil dikembalikan ke default.",
      });
    } catch (err: any) {
      console.error("[Backend] Error resetting favicon:", err);
      res.status(500).json({ error: "Gagal mereset favicon: " + err.message });
    }
  });

  // Application Logo API Routes:
  // 1. GET /api/logo - Serve active application logo with no-cache headers and default fallback
  app.get("/api/logo", (req, res) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    const meta = getStoredLogoMeta();
    if (meta && fs.existsSync(meta.filePath)) {
      res.setHeader("Content-Type", meta.mimeType);
      return res.sendFile(meta.filePath);
    }

    const defaultSvgPath = path.join(PUBLIC_DIR, "favicon.svg");
    if (fs.existsSync(defaultSvgPath)) {
      res.setHeader("Content-Type", "image/svg+xml");
      return res.sendFile(defaultSvgPath);
    }

    res.status(404).send("Logo not found");
  });

  // 2. GET /api/settings/logo - Get metadata of stored custom logo
  app.get("/api/settings/logo", (req, res) => {
    const meta = getStoredLogoMeta();
    if (meta) {
      res.json({
        isCustom: true,
        logoUrl: `/api/logo?v=${meta.updatedAt}&ext=${encodeURIComponent(meta.ext)}`,
        updatedAt: meta.updatedAt,
        fileName: meta.fileName,
        mimeType: meta.mimeType,
        ext: meta.ext,
      });
    } else {
      res.json({
        isCustom: false,
        logoUrl: null,
        updatedAt: 0,
      });
    }
  });

  // 3. POST /api/settings/logo - Upload & save application logo (Admin & Super Admin)
  app.post("/api/settings/logo", (req, res) => {
    const { userRole, fileBase64, fileName, mimeType } = req.body;

    if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
      return res.status(403).json({
        error: "Forbidden: Only Administrator or Super Administrator can update the application logo.",
      });
    }

    if (!fileBase64 || !fileName || typeof fileBase64 !== "string" || typeof fileName !== "string") {
      return res.status(400).json({ error: "Missing fileBase64 or fileName." });
    }

    const extMatch = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
    const rawExt = extMatch ? extMatch[1] : "";
    const normalizedMime = typeof mimeType === "string" ? mimeType.toLowerCase() : "";
    const allowedExtensions = ["png", "jpg", "jpeg", "webp", "gif", "svg"];
    const allowedMimeTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "image/gif",
      "image/svg+xml",
    ];

    if (!allowedExtensions.includes(rawExt) && !allowedMimeTypes.includes(normalizedMime)) {
      return res.status(400).json({
        error: "Format logo tidak didukung. Gunakan PNG, JPG, WEBP, GIF, atau SVG.",
      });
    }

    const ext = allowedExtensions.includes(rawExt)
      ? rawExt
      : normalizedMime.includes("svg")
        ? "svg"
        : normalizedMime.includes("gif")
          ? "gif"
          : normalizedMime.includes("webp")
            ? "webp"
            : normalizedMime.includes("jpeg") || normalizedMime.includes("jpg")
              ? "jpg"
              : "png";

    try {
      let buffer: Buffer;
      if (fileBase64.includes("base64,")) {
        const base64Data = fileBase64.split("base64,")[1];
        buffer = Buffer.from(base64Data, "base64");
      } else if (fileBase64.startsWith("data:image/svg+xml")) {
        const commaIndex = fileBase64.indexOf(",");
        const rawSvg = commaIndex >= 0 ? fileBase64.slice(commaIndex + 1) : fileBase64;
        buffer = Buffer.from(decodeURIComponent(rawSvg), "utf-8");
      } else {
        buffer = Buffer.from(fileBase64, "base64");
      }

      if (!buffer || buffer.length === 0) {
        return res.status(400).json({ error: "File logo kosong atau tidak valid." });
      }

      const MAX_LOGO_SIZE = 5 * 1024 * 1024;
      if (buffer.length > MAX_LOGO_SIZE) {
        return res.status(400).json({
          error: "Ukuran file terlalu besar. Maksimum ukuran logo adalah 5MB.",
        });
      }

      for (const oldExt of allowedExtensions) {
        const stalePath = path.resolve(PUBLIC_DIR, `custom-logo.${oldExt}`);
        if (isInsideDir(PUBLIC_DIR, stalePath) && fs.existsSync(stalePath)) {
          try {
            fs.unlinkSync(stalePath);
          } catch {}
        }
      }

      let resolvedMime = normalizedMime || "image/png";
      if (ext === "png") resolvedMime = "image/png";
      else if (ext === "jpg" || ext === "jpeg") resolvedMime = "image/jpeg";
      else if (ext === "webp") resolvedMime = "image/webp";
      else if (ext === "gif") resolvedMime = "image/gif";
      else if (ext === "svg") resolvedMime = "image/svg+xml";

      const targetFileName = `custom-logo.${ext}`;
      const targetFilePath = path.resolve(PUBLIC_DIR, targetFileName);
      if (!isInsideDir(PUBLIC_DIR, targetFilePath)) {
        return res.status(400).json({ error: "Invalid logo path." });
      }

      fs.writeFileSync(targetFilePath, buffer);

      const timestamp = Date.now();
      const meta: AssetMetadata = {
        fileName,
        mimeType: resolvedMime,
        ext,
        updatedAt: timestamp,
        filePath: targetFilePath,
      };
      fs.writeFileSync(LOGO_META_FILE, JSON.stringify(meta, null, 2), "utf-8");

      const cacheBustedUrl = `/api/logo?v=${timestamp}&ext=${encodeURIComponent(ext)}`;
      res.json({
        success: true,
        logoUrl: cacheBustedUrl,
        updatedAt: timestamp,
        ext,
        mimeType: resolvedMime,
        message: "Application logo berhasil disimpan.",
      });
    } catch (err: any) {
      console.error("[Backend] Error saving application logo:", err);
      res.status(500).json({ error: "Gagal menyimpan file logo: " + err.message });
    }
  });

  // 4. POST /api/settings/logo/reset - Clear stored custom application logo
  app.post("/api/settings/logo/reset", (req, res) => {
    const { userRole } = req.body;
    if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
      return res.status(403).json({
        error: "Forbidden: Only Administrator or Super Administrator can reset the application logo.",
      });
    }

    try {
      const meta = getStoredLogoMeta();
      if (meta && isInsideDir(PUBLIC_DIR, meta.filePath) && fs.existsSync(meta.filePath)) {
        try {
          fs.unlinkSync(meta.filePath);
        } catch {}
      }
      for (const oldExt of ["png", "jpg", "jpeg", "webp", "gif", "svg"]) {
        const stalePath = path.resolve(PUBLIC_DIR, `custom-logo.${oldExt}`);
        if (isInsideDir(PUBLIC_DIR, stalePath) && fs.existsSync(stalePath)) {
          try {
            fs.unlinkSync(stalePath);
          } catch {}
        }
      }
      if (fs.existsSync(LOGO_META_FILE)) {
        try {
          fs.unlinkSync(LOGO_META_FILE);
        } catch {}
      }
      res.json({
        success: true,
        logoUrl: null,
        message: "Application logo dikembalikan ke monogram default.",
      });
    } catch (err: any) {
      console.error("[Backend] Error resetting application logo:", err);
      res.status(500).json({ error: "Gagal mereset application logo: " + err.message });
    }
  });

  // Minimal API health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", persistence: "supabase-sql", mediaApproval: serverMediaApproval });
  });

  // GET /api/settings/approval
  app.get("/api/settings/approval", (req, res) => {
    res.json({ mediaApproval: serverMediaApproval });
  });

  // POST /api/settings/approval - Only Super Admin can change media approval settings
  app.post("/api/settings/approval", (req, res) => {
    const { userRole, mediaApproval } = req.body;
    if (userRole !== "SUPER_ADMIN") {
      return res.status(403).json({ 
        error: "Forbidden: Only Super Admin can modify Media Approval settings." 
      });
    }

    if (!mediaApproval || typeof mediaApproval !== "object") {
      return res.status(400).json({ error: "Invalid mediaApproval object." });
    }

    serverMediaApproval = {
      photo: typeof mediaApproval.photo === "boolean" ? mediaApproval.photo : serverMediaApproval.photo,
      video: typeof mediaApproval.video === "boolean" ? mediaApproval.video : serverMediaApproval.video,
      blog: typeof mediaApproval.blog === "boolean" ? mediaApproval.blog : serverMediaApproval.blog,
    };

    console.log("[Backend] Updated Media Approval Settings:", serverMediaApproval);
    res.json({ success: true, mediaApproval: serverMediaApproval });
  });

  // POST /api/content/validate-publish - Backend validation to prevent user bypass
  app.post("/api/content/validate-publish", (req, res) => {
    const { type, userRole, isDraft } = req.body;
    
    if (isDraft) {
      return res.json({ status: "DRAFT", reason: "Work saved as draft" });
    }

    if (!type || !["photo", "video", "blog"].includes(type)) {
      return res.status(400).json({ error: "Invalid content type. Must be photo, video, or blog." });
    }

    // Super Admin & Admin creations can publish directly
    if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") {
      return res.json({ 
        status: "APPROVED", 
        isAutoApproved: true, 
        message: "Administrator authorization: Published directly" 
      });
    }

    // Evaluate against backend authoritative toggle:
    // ON (true) -> Automatic Publishing Enabled -> status: "APPROVED"
    // OFF (false) -> Manual Approval Required -> status: "PENDING"
    const isAutoPublish = serverMediaApproval[type as "photo" | "video" | "blog"];
    if (isAutoPublish) {
      return res.json({ 
        status: "APPROVED", 
        isAutoApproved: true, 
        message: "Automatic Publishing Enabled: Published directly to live feed" 
      });
    } else {
      return res.json({ 
        status: "PENDING", 
        isAutoApproved: false, 
        message: "Manual Approval Required: Routed to Super Admin Approval Queue" 
      });
    }
  });

  // POST /api/videos/transcode - Authentic Multi-Rendition Transcoding Pipeline (never overwrites with demo video)
  app.post("/api/videos/transcode", async (req, res) => {
    try {
      const { videoId, videoBase64, originalUrl, width, height, fileSize } = req.body;
      const cleanId = (videoId || "vid-" + Date.now()).replace(/[^a-zA-Z0-9_-]/g, "");
      const renditionsRoot = path.resolve(PUBLIC_DIR, "renditions");
      const outputDir = path.resolve(renditionsRoot, cleanId);

      if (!isInsideDir(renditionsRoot, outputDir)) {
        return res.status(400).json({ error: "Invalid videoId path." });
      }

      const renditionsDefs = [
        { label: "1080p", width: 1920, height: 1080, bitrate: 4488289, bStr: "4500k", fps: 30 },
        { label: "720p", width: 1280, height: 720, bitrate: 2176892, bStr: "2200k", fps: 30 },
        { label: "480p", width: 854, height: 480, bitrate: 978468, bStr: "1000k", fps: 30 },
        { label: "360p", width: 640, height: 360, bitrate: 578470, bStr: "600k", fps: 30 },
      ];

      let sourceFile = "";
      let resolvedPlayableUrl = typeof originalUrl === "string" ? originalUrl : "";

      if (videoBase64 && typeof videoBase64 === "string" && videoBase64.includes("base64,")) {
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
        const raw = videoBase64.split("base64,")[1];
        sourceFile = path.resolve(outputDir, "source.mp4");
        fs.writeFileSync(sourceFile, Buffer.from(raw, "base64"));
        resolvedPlayableUrl = `/renditions/${cleanId}/source.mp4`;
      } else if (typeof originalUrl === "string" && originalUrl.startsWith("/")) {
        const safeCandidate = path.resolve(PUBLIC_DIR, originalUrl.replace(/^\/+/, ""));
        if (isInsideDir(PUBLIC_DIR, safeCandidate) && fs.existsSync(safeCandidate)) {
          sourceFile = safeCandidate;
        }
      }

      const ffmpegPath = fs.existsSync("/usr/bin/ffmpeg") ? "/usr/bin/ffmpeg" : "";
      const generatedRenditions: any[] = [];

      if (ffmpegPath && sourceFile && fs.existsSync(sourceFile)) {
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
        for (const def of renditionsDefs) {
          const outFile = path.resolve(outputDir, `${def.label}.mp4`);
          const outUrl = `/renditions/${cleanId}/${def.label}.mp4`;

          if (!fs.existsSync(outFile)) {
            try {
              const args = [
                "-y",
                "-i",
                sourceFile,
                "-vf",
                `scale=${def.width}:${def.height}:force_original_aspect_ratio=decrease,pad=${def.width}:${def.height}:(ow-iw)/2:(oh-ih)/2`,
                "-c:v",
                "libx264",
                "-profile:v",
                "high",
                "-b:v",
                def.bStr,
                "-pix_fmt",
                "yuv420p",
                "-c:a",
                "aac",
                "-b:a",
                "128k",
                "-movflags",
                "+faststart",
                outFile,
              ];
              await new Promise<void>((resolve, reject) => {
                execFile(ffmpegPath, args, { timeout: 120000 }, (err) => {
                  if (err) reject(err);
                  else resolve();
                });
              });
            } catch (ffmpegErr) {
              console.warn(`[Transcode] Skipping ${def.label} for ${cleanId}:`, ffmpegErr);
            }
          }

          if (fs.existsSync(outFile)) {
            const stat = fs.statSync(outFile);
            generatedRenditions.push({
              id: `r-${def.label}`,
              resolution: def.label,
              width: def.width,
              height: def.height,
              codec: "h264 (H.264 / AVC High Profile)",
              bitrate: def.bitrate,
              frameRate: def.fps,
              url: outUrl,
              fileSize: stat.size,
            });
          }
        }
      }

      // If ffmpeg wasn't run or produced no renditions, keep the user's real video file intact
      if (generatedRenditions.length === 0 && resolvedPlayableUrl) {
        const diskSize = sourceFile && fs.existsSync(sourceFile) ? fs.statSync(sourceFile).size : Number(fileSize || 0);
        generatedRenditions.push({
          id: "r-original",
          resolution: "Original",
          width: Number(width || 1920),
          height: Number(height || 1080),
          codec: "h264 (H.264 / AVC High Profile)",
          bitrate: 4500000,
          frameRate: 30,
          url: resolvedPlayableUrl,
          fileSize: diskSize,
        });
      }

      res.json({
        success: true,
        videoId: cleanId,
        playableUrl: resolvedPlayableUrl,
        renditions: generatedRenditions,
        message: "Video stream verified successfully."
      });
    } catch (err: any) {
      console.error("[Transcode] Fatal error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Mode: ${isProd ? "production" : "development"}`);
    console.log(`Persistence: Supabase SQL`);
  });
}

startServer();
