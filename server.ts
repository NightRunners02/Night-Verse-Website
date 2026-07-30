import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const PORT = 3000;
const isProd = process.env.NODE_ENV === "production";

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Minimal API health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", persistence: "localStorage" });
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
