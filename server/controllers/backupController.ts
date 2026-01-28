import { Request, Response } from "express";
import {
  backupDatabase,
  listBackups,
  downloadBackup,
  getLastBackupInfo,
  isBackupConfigured,
} from "../services/backupService";
import fs from "fs";
import path from "path";
import os from "os";

/**
 * Trigger a manual backup
 * POST /api/admin/backup
 */
export const triggerBackup = async (req: Request, res: Response) => {
  try {
    if (!isBackupConfigured()) {
      return res.status(503).json({
        error:
          "نظام النسخ الاحتياطي غير مُعد. يرجى التحقق من إعدادات Google Cloud Storage.",
      });
    }

    const backupInfo = await backupDatabase();
    res.json({ success: true, backup: backupInfo });
  } catch (error: any) {
    console.error("Manual backup failed:", error);
    res
      .status(500)
      .json({ error: error.message || "فشل في إنشاء النسخة الاحتياطية" });
  }
};

/**
 * Get backup status (last backup timestamp)
 * GET /api/admin/backup/status
 */
export const getBackupStatus = async (req: Request, res: Response) => {
  try {
    const configured = isBackupConfigured();

    if (!configured) {
      return res.json({
        configured: false,
        message: "النسخ الاحتياطي غير مُعد",
      });
    }

    const lastBackup = await getLastBackupInfo();

    res.json({
      configured: true,
      lastBackup: lastBackup
        ? {
            filename: lastBackup.filename,
            timestamp: lastBackup.timestamp,
            size: lastBackup.size,
          }
        : null,
    });
  } catch (error: any) {
    console.error("Failed to get backup status:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * List all available backups
 * GET /api/admin/backup/list
 */
export const getBackupList = async (req: Request, res: Response) => {
  try {
    if (!isBackupConfigured()) {
      return res.status(503).json({ error: "نظام النسخ الاحتياطي غير مُعد" });
    }

    const backups = await listBackups();
    res.json({ backups });
  } catch (error: any) {
    console.error("Failed to list backups:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Restore database from a backup file
 * POST /api/admin/backup/restore
 */
export const restoreBackup = async (req: Request, res: Response) => {
  try {
    const { filename } = req.body;

    if (!filename) {
      return res.status(400).json({ error: "اسم الملف مطلوب" });
    }

    if (!isBackupConfigured()) {
      return res.status(503).json({ error: "نظام النسخ الاحتياطي غير مُعد" });
    }

    // Download the backup from cloud storage
    const tempBackupPath = await downloadBackup(filename);

    // Determine the current database path
    const dbPath =
      process.env.RAILWAY_ENVIRONMENT ||
      (process.env.DATABASE_PATH && process.env.DATABASE_PATH.startsWith("/"))
        ? process.env.DATABASE_PATH || path.resolve(__dirname, "../../nagar.db")
        : process.env.DATABASE_PATH &&
            !process.env.DATABASE_PATH.startsWith("/")
          ? process.env.DATABASE_PATH
          : path.join(
              os.homedir(),
              "AppData",
              "Roaming",
              "NagarERP",
              "nagar.db",
            );

    // Create a backup of the current database before overwriting
    const currentBackupPath = `${dbPath}.before-restore-${Date.now()}.bak`;
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, currentBackupPath);
      console.log(`Current database backed up to: ${currentBackupPath}`);
    }

    // Close the database connection (if possible)
    // Note: better-sqlite3 requires explicit close, but we need to restart the app
    // For now, we'll just copy the file and let the app restart handle reconnection

    // Overwrite the current database with the restored backup
    fs.copyFileSync(tempBackupPath, dbPath);

    // Clean up temp file
    fs.unlinkSync(tempBackupPath);

    console.log(`Database restored from: ${filename}`);

    res.json({
      success: true,
      message: "تم استعادة قاعدة البيانات بنجاح. يُنصح بإعادة تشغيل التطبيق.",
      backupLocation: currentBackupPath,
    });

    // Note: In production, you might want to trigger an app restart here
    // For Electron apps, you can use app.relaunch() and app.exit()
  } catch (error: any) {
    console.error("Restore failed:", error);
    res
      .status(500)
      .json({ error: error.message || "فشل في استعادة النسخة الاحتياطية" });
  }
};
