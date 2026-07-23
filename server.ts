import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { analyzeClutterFrame } from "./src/server/geminiService";
import { createProjectZip } from "./src/server/zipExport";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "25mb" }));

  // API Routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "Warmer AI Computer Vision Engine", timestamp: new Date().toISOString() });
  });

  app.post("/api/analyze-frame", async (req, res) => {
    try {
      const { imageBase64, query, negativeExemplars, confidenceThreshold } = req.body;
      if (!imageBase64 || !query) {
        return res.status(400).json({ error: "Missing imageBase64 or query in request body." });
      }

      const result = await analyzeClutterFrame(
        imageBase64,
        query,
        negativeExemplars || "",
        typeof confidenceThreshold === "number" ? confidenceThreshold : 0.5
      );

      return res.json(result);
    } catch (err: any) {
      console.error("Error analyzing clutter frame:", err);
      return res.status(500).json({ error: err.message || "Failed to analyze frame." });
    }
  });

  app.get("/api/export-zip", async (req, res) => {
    try {
      const zipBuffer = await createProjectZip();
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", 'attachment; filename="warmer-cv-project.zip"');
      return res.send(zipBuffer);
    } catch (err: any) {
      console.error("Error exporting project zip:", err);
      return res.status(500).json({ error: "Failed to generate zip file." });
    }
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== "production") {
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
    console.log(`[Warmer CV App] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
