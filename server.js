/**
 * Zorvik AI — Standalone Microservice Server Entrypoint
 */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const path = require("path");

const apiRoutes = require("./src/routes/api");

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Performance Middlewares
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com",
          "https://unpkg.com",
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com",
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "https://cdn.jsdelivr.net",
        ],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: [
          "'self'",
          "https://*.supabase.co",
          "https://*.upstash.io",
          "https://generativelanguage.googleapis.com",
          "https://api.groq.com",
          "https://openrouter.ai",
        ],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(cors({ origin: "*" }));
app.use(compression());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

const fs = require("fs");
const distPath = path.join(__dirname, "frontend", "dist");

// Serve static frontend assets (built React app has precedence)
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}
app.use(express.static(path.join(__dirname)));

// Mount API routes
app.use("/api/v1", apiRoutes);

// SPA client routing for React 19 Frontend
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  const indexDist = path.join(distPath, "index.html");
  if (fs.existsSync(indexDist)) {
    return res.sendFile(indexDist);
  }
  return res.sendFile(path.join(__dirname, "index.html"));
});

// Centralized error handler
app.use((err, _req, res, _next) => {
  console.error("[Fatal Error]:", err);
  res.status(err.status || 500).json({
    error: "Internal Server Error",
    message: err.message || "An unexpected error occurred on the microservice.",
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`⚡ Zorvik AI Microservice running on port ${PORT}`);
    console.log(`🌐 Web UI: http://localhost:${PORT}`);
    console.log(`📡 API Base: http://localhost:${PORT}/api/v1`);
    console.log(`====================================================`);
  });
}

module.exports = app;
