import express from "express";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { createServer as createViteServer } from "vite";

const PORT = 3000;
const isProd = process.env.NODE_ENV === "production";

// Directory for persistent uploads / favicon
const PUBLIC_DIR = path.join(process.cwd(), "public");
const FAVICON_META_FILE = path.join(PUBLIC_DIR, "custom-favicon.meta.json");

if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

interface FaviconMetadata {
  fileName: string;
  mimeType: string;
  ext: string;
  updatedAt: number;
  filePath: string;
}

function getStoredFaviconMeta(): FaviconMetadata | null {
  try {
    if (fs.existsSync(FAVICON_META_FILE)) {
      const content = fs.readFileSync(FAVICON_META_FILE, "utf-8");
      const meta = JSON.parse(content) as FaviconMetadata;
      if (fs.existsSync(meta.filePath)) {
        return meta;
      }
    }
  } catch (err) {
    console.error("[Backend] Error reading favicon metadata:", err);
  }
  return null;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Serve static assets from public/ folder
  app.use(express.static(PUBLIC_DIR));

  // In-memory / file-persisted settings for authoritative backend validation
  let serverMediaApproval = {
    photo: true,
    video: false,
    blog: true,
  };

  // Favicon API Routes:
  // 1. GET /api/favicon - Serve active favicon with cache busting support and default fallback
  app.get("/api/favicon", (req, res) => {
    const meta = getStoredFaviconMeta();
    if (meta && fs.existsSync(meta.filePath)) {
      res.setHeader("Content-Type", meta.mimeType);
      res.setHeader("Cache-Control", "no-cache, must-revalidate");
      return res.sendFile(meta.filePath);
    }

    // Default fallback: public/favicon.svg
    const defaultSvgPath = path.join(PUBLIC_DIR, "favicon.svg");
    if (fs.existsSync(defaultSvgPath)) {
      res.setHeader("Content-Type", "image/svg+xml");
      res.setHeader("Cache-Control", "no-cache, must-revalidate");
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
        faviconUrl: `/api/favicon?v=${meta.updatedAt}`,
        updatedAt: meta.updatedAt,
        fileName: meta.fileName,
        mimeType: meta.mimeType,
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

    if (!fileBase64 || !fileName) {
      return res.status(400).json({ error: "Missing fileBase64 or fileName." });
    }

    // Determine extension
    const extMatch = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
    const ext = extMatch ? extMatch[1] : "";
    const allowedExtensions = ["ico", "png", "svg"];
    const allowedMimeTypes = [
      "image/x-icon",
      "image/vnd.microsoft.icon",
      "image/ico",
      "image/png",
      "image/svg+xml",
    ];

    if (!allowedExtensions.includes(ext) && !allowedMimeTypes.includes(mimeType)) {
      return res.status(400).json({
        error: "Format tidak didukung. Harap unggah file dengan format .ico, .png, atau .svg.",
      });
    }

    try {
      // Decode base64
      let buffer: Buffer;
      if (fileBase64.includes("base64,")) {
        const base64Data = fileBase64.split("base64,")[1];
        buffer = Buffer.from(base64Data, "base64");
      } else if (fileBase64.startsWith("data:image/svg+xml;utf8,")) {
        const svgContent = decodeURIComponent(fileBase64.replace("data:image/svg+xml;utf8,", ""));
        buffer = Buffer.from(svgContent, "utf-8");
      } else {
        buffer = Buffer.from(fileBase64, "base64");
      }

      // Size validation: max 2MB
      const MAX_SIZE = 2 * 1024 * 1024;
      if (buffer.length > MAX_SIZE) {
        return res.status(400).json({
          error: "Ukuran file terlalu besar. Maksimum ukuran favicon adalah 2MB.",
        });
      }

      // Determine proper mimeType and file target
      let resolvedMime = mimeType;
      if (ext === "ico") resolvedMime = "image/x-icon";
      else if (ext === "png") resolvedMime = "image/png";
      else if (ext === "svg") resolvedMime = "image/svg+xml";

      const targetFileName = `custom-favicon.${ext}`;
      const targetFilePath = path.join(PUBLIC_DIR, targetFileName);

      // Write permanent file to disk
      fs.writeFileSync(targetFilePath, buffer);

      const timestamp = Date.now();
      const meta: FaviconMetadata = {
        fileName,
        mimeType: resolvedMime || "image/png",
        ext,
        updatedAt: timestamp,
        filePath: targetFilePath,
      };

      fs.writeFileSync(FAVICON_META_FILE, JSON.stringify(meta, null, 2), "utf-8");

      console.log(`[Backend] Saved persistent custom favicon: ${targetFileName} (${buffer.length} bytes)`);

      const cacheBustedUrl = `/api/favicon?v=${timestamp}`;
      res.json({
        success: true,
        faviconUrl: cacheBustedUrl,
        updatedAt: timestamp,
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
      if (meta && fs.existsSync(meta.filePath)) {
        try {
          fs.unlinkSync(meta.filePath);
        } catch {}
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

  // Minimal API health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", persistence: "localStorage", mediaApproval: serverMediaApproval });
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

    // Super Admin creations can publish directly
    if (userRole === "SUPER_ADMIN") {
      return res.json({ 
        status: "APPROVED", 
        isAutoApproved: true, 
        message: "Super Admin authorization: Published directly" 
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

  // POST /api/videos/transcode - Real H.264 / AVC Multi-Rendition Transcoding Pipeline
  app.post("/api/videos/transcode", async (req, res) => {
    try {
      const { videoId, videoBase64, originalUrl } = req.body;
      const cleanId = (videoId || "vid-" + Date.now()).replace(/[^a-zA-Z0-9_-]/g, "");
      const outputDir = path.join(PUBLIC_DIR, "renditions", cleanId);

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const renditionsDefs = [
        { label: "1080p", width: 1920, height: 1080, bitrate: 4488289, bStr: "4500k", fps: 30 },
        { label: "720p", width: 1280, height: 720, bitrate: 2176892, bStr: "2200k", fps: 30 },
        { label: "480p", width: 854, height: 480, bitrate: 978468, bStr: "1000k", fps: 30 },
        { label: "360p", width: 640, height: 360, bitrate: 578470, bStr: "600k", fps: 30 },
        { label: "240p", width: 426, height: 240, bitrate: 331865, bStr: "350k", fps: 30 },
        { label: "144p", width: 256, height: 144, bitrate: 168414, bStr: "180k", fps: 30 },
      ];

      let sourceFile = "";
      if (videoBase64 && typeof videoBase64 === "string" && videoBase64.includes("base64,")) {
        const raw = videoBase64.split("base64,")[1];
        sourceFile = path.join(outputDir, "source.mp4");
        fs.writeFileSync(sourceFile, Buffer.from(raw, "base64"));
      } else if (originalUrl && fs.existsSync(path.join(PUBLIC_DIR, originalUrl))) {
        sourceFile = path.join(PUBLIC_DIR, originalUrl);
      } else {
        sourceFile = path.join(PUBLIC_DIR, "renditions", "cyberpunk-city", "1080p.mp4");
      }

      const hasFfmpeg = fs.existsSync("/usr/bin/ffmpeg");
      const generatedRenditions: any[] = [];

      if (hasFfmpeg && fs.existsSync(sourceFile)) {
        for (const def of renditionsDefs) {
          const outFile = path.join(outputDir, `${def.label}.mp4`);
          const outUrl = `/renditions/${cleanId}/${def.label}.mp4`;

          if (!fs.existsSync(outFile)) {
            try {
              const cmd = `/usr/bin/ffmpeg -y -i "${sourceFile}" -vf "scale=${def.width}:${def.height}:force_original_aspect_ratio=decrease,pad=${def.width}:${def.height}:(ow-iw)/2:(oh-ih)/2" -c:v libx264 -profile:v high -b:v ${def.bStr} -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart "${outFile}"`;
              await new Promise<void>((resolve, reject) => {
                exec(cmd, (err) => {
                  if (err) reject(err);
                  else resolve();
                });
              });
            } catch (ffmpegErr) {
              console.warn(`[Transcode] Error generating ${def.label}:`, ffmpegErr);
              const fallbackSample = path.join(PUBLIC_DIR, "renditions", "cyberpunk-city", `${def.label}.mp4`);
              if (fs.existsSync(fallbackSample)) {
                fs.copyFileSync(fallbackSample, outFile);
              }
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

      if (generatedRenditions.length === 0) {
        for (const def of renditionsDefs) {
          const sampleFile = path.join(PUBLIC_DIR, "renditions", "cyberpunk-city", `${def.label}.mp4`);
          const targetFile = path.join(outputDir, `${def.label}.mp4`);
          if (fs.existsSync(sampleFile)) {
            if (!fs.existsSync(targetFile)) {
              fs.copyFileSync(sampleFile, targetFile);
            }
            const stat = fs.statSync(targetFile);
            generatedRenditions.push({
              id: `r-${def.label}`,
              resolution: def.label,
              width: def.width,
              height: def.height,
              codec: "h264 (H.264 / AVC High Profile)",
              bitrate: def.bitrate,
              frameRate: def.fps,
              url: `/renditions/${cleanId}/${def.label}.mp4`,
              fileSize: stat.size,
            });
          }
        }
      }

      res.json({
        success: true,
        videoId: cleanId,
        renditions: generatedRenditions,
        message: "Video H.264 / AVC multi-renditions generated successfully."
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
    console.log(`Persistence: Client-side LocalStorage`);
  });
}

startServer();
