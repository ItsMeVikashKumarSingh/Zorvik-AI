/**
 * Zorvik AI — Standalone Microservice Server Entrypoint
 */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const path = require("path");
const fs = require("fs");

const apiRoutes = require("./src/routes/api");

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Performance Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(cors({ origin: "*" }));
app.use(compression());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Mount API routes
app.use("/api/v1", apiRoutes);

// Path to frontend build directory if built
const frontendDistPath = path.join(__dirname, "../frontend/dist");

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
} else {
  // Fallback to local static assets if present
  app.use(express.static(path.join(__dirname)));
  app.get(["/app", "/chat", "/app.html"], (_req, res) => {
    const appHtml = path.join(__dirname, "app.html");
    if (fs.existsSync(appHtml)) {
      res.sendFile(appHtml);
    } else {
      res.status(200).json({ status: "Zorvik AI Microservice API Active", documentation: "/api/v1/health" });
    }
  });

  app.get(["/", "/landing", "/landing.html"], (_req, res) => {
    const indexHtml = path.join(__dirname, "index.html");
    if (fs.existsSync(indexHtml)) {
      res.sendFile(indexHtml);
    } else {
      res.status(200).json({ status: "Zorvik AI Microservice API Active", documentation: "/api/v1/health" });
    }
  });
}

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
