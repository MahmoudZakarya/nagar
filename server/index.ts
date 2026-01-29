import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import cron from "node-cron";
import { initData } from "./db";
import { translateExistingData } from "./scripts/translate_data";
import { backupDatabase, isBackupConfigured } from "./services/backupService";
import path from "path";

import apiRoutes from "./routes";

const app = express();
// Allow specific port configuration or dynamic
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Initialize Database & Run Migrations
try {
  initData();
  translateExistingData();
} catch (error) {
  console.error("Failed to initialize database:", error);
}

// Initialize automated backup scheduler (daily at 3 AM)
const backupSchedule = process.env.BACKUP_SCHEDULE || "0 3 * * *";
if (isBackupConfigured()) {
  cron.schedule(backupSchedule, async () => {
    console.log("Running scheduled database backup...");
    try {
      const result = await backupDatabase();
      console.log("Scheduled backup completed:", result?.filename);
    } catch (error) {
      console.error("Scheduled backup failed:", error);
    }
  });
  console.log(`Automated backup scheduled: ${backupSchedule}`);
} else {
  console.warn("Backup system not configured. Automated backups disabled.");
}

app.use("/api", apiRoutes);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// app.get("/", (req, res) => {
//   res.send("Nagar ERP API is running");
// });

// 1. Serve the static files from the React build folder
// This assumes your React build goes into a folder named 'dist' or 'build'
const buildPath = path.join(__dirname, "../dist");
app.use(express.static(buildPath));

// 2. Handle any requests that don't match the ones above (Catch-all)
app.get("/*splat", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Server running on port ${PORT}`);
});
