import fs from "fs";
import path from "path";
import os from "os";
import { Storage } from "@google-cloud/storage";
import db from "../db";
import { getGCSConfigWithFallback } from "../config/gcsConfig";

// Get database path (from db.ts logic)
const getDbPath = (): string => {
  if (
    process.env.RAILWAY_ENVIRONMENT ||
    (process.env.DATABASE_PATH && process.env.DATABASE_PATH.startsWith("/"))
  ) {
    return (
      process.env.DATABASE_PATH || path.resolve(__dirname, "../../nagar.db")
    );
  } else if (
    process.env.DATABASE_PATH &&
    !process.env.DATABASE_PATH.startsWith("/")
  ) {
    return process.env.DATABASE_PATH;
  } else {
    return path.join(
      os.homedir(),
      "AppData",
      "Roaming",
      "NagarERP",
      "nagar.db",
    );
  }
};

// Initialize Google Cloud Storage (dynamic)
let storage: Storage | null = null;
let bucketName: string | null = null;

/**
 * Initialize or reinitialize Google Cloud Storage with current configuration
 */
export const reinitializeStorage = (): void => {
  try {
    const config = getGCSConfigWithFallback();

    if (config.keyFilePath && config.bucketName && config.projectId) {
      // Check if key file exists
      if (!fs.existsSync(config.keyFilePath)) {
        console.warn(`GCS key file not found at: ${config.keyFilePath}`);
        storage = null;
        bucketName = null;
        return;
      }

      storage = new Storage({
        keyFilename: config.keyFilePath,
        projectId: config.projectId,
      });
      bucketName = config.bucketName;
      console.log("Google Cloud Storage initialized for backups");
    } else {
      storage = null;
      bucketName = null;
      console.warn(
        "GCS credentials not fully configured. Backup system disabled.",
      );
    }
  } catch (error) {
    console.error("Failed to initialize Google Cloud Storage:", error);
    storage = null;
    bucketName = null;
  }
};

// Initialize on module load
reinitializeStorage();

export interface BackupInfo {
  filename: string;
  timestamp: string;
  size: number;
  cloudUrl?: string;
}

/**
 * Create a backup of the database and upload to Google Cloud Storage
 */
export const backupDatabase = async (): Promise<BackupInfo | null> => {
  if (!storage || !bucketName) {
    throw new Error("Google Cloud Storage not configured");
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFileName = `backup-nagar-${timestamp}.db`;
  const sourcePath = getDbPath();
  const tempPath = path.join(os.tmpdir(), backupFileName);

  try {
    // 1. Check if database exists
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Database file not found at: ${sourcePath}`);
    }

    // 2. Create a copy in temp directory
    console.log(`Creating backup copy: ${backupFileName}`);
    fs.copyFileSync(sourcePath, tempPath);

    const fileStats = fs.statSync(tempPath);

    // 3. Upload to Google Cloud Storage
    console.log(`Uploading backup to Google Cloud Storage...`);
    await storage.bucket(bucketName).upload(tempPath, {
      destination: `backups/${backupFileName}`,
      metadata: {
        contentType: "application/x-sqlite3",
        metadata: {
          timestamp: new Date().toISOString(),
          source: "nagar-erp-auto-backup",
        },
      },
    });

    // 4. Clean up temp file
    fs.unlinkSync(tempPath);

    console.log(`Backup successful: ${backupFileName}`);

    return {
      filename: backupFileName,
      timestamp: new Date().toISOString(),
      size: fileStats.size,
      cloudUrl: `gs://${bucketName}/backups/${backupFileName}`,
    };
  } catch (error: any) {
    console.error("Backup failed:", error);

    // Clean up temp file if it exists
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }

    throw error;
  }
};

/**
 * List all available backups from Google Cloud Storage
 */
export const listBackups = async (): Promise<BackupInfo[]> => {
  if (!storage || !bucketName) {
    throw new Error("Google Cloud Storage not configured");
  }

  try {
    const [files] = await storage.bucket(bucketName).getFiles({
      prefix: "backups/",
    });

    const backups: BackupInfo[] = files
      .filter((file) => file.name.endsWith(".db"))
      .map((file) => ({
        filename: path.basename(file.name),
        timestamp: file.metadata.timeCreated || file.metadata.updated || "",
        size: Number(file.metadata.size) || 0,
        cloudUrl: `gs://${bucketName}/${file.name}`,
      }))
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

    return backups;
  } catch (error) {
    console.error("Failed to list backups:", error);
    throw error;
  }
};

/**
 * Download a specific backup from Google Cloud Storage
 */
export const downloadBackup = async (filename: string): Promise<string> => {
  if (!storage || !bucketName) {
    throw new Error("Google Cloud Storage not configured");
  }

  const tempPath = path.join(os.tmpdir(), filename);

  try {
    await storage
      .bucket(bucketName)
      .file(`backups/${filename}`)
      .download({ destination: tempPath });

    console.log(`Downloaded backup: ${filename}`);
    return tempPath;
  } catch (error) {
    console.error("Failed to download backup:", error);
    throw error;
  }
};

/**
 * Get the last backup information (for status display)
 */
export const getLastBackupInfo = async (): Promise<BackupInfo | null> => {
  try {
    const backups = await listBackups();
    return backups.length > 0 ? backups[0] : null;
  } catch (error) {
    console.error("Failed to get last backup info:", error);
    return null;
  }
};

/**
 * Check if backup system is configured and ready
 */
export const isBackupConfigured = (): boolean => {
  return storage !== null && bucketName !== null;
};

/**
 * Test GCS connection (for configuration validation)
 */
export const testConnection = async (): Promise<{
  success: boolean;
  bucketName?: string;
  error?: string;
}> => {
  if (!storage || !bucketName) {
    return {
      success: false,
      error: "GCS not configured",
    };
  }

  try {
    // Try to access the bucket
    const bucket = storage.bucket(bucketName);
    const [exists] = await bucket.exists();

    if (!exists) {
      return {
        success: false,
        error: `Bucket '${bucketName}' does not exist or is not accessible`,
      };
    }

    // Try to list files (basic permission check)
    await bucket.getFiles({ maxResults: 1 });

    return {
      success: true,
      bucketName: bucketName,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to connect to GCS",
    };
  }
};
