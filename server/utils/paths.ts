import path from "path";
import os from "os";

/**
 * Central utility for managing important application paths.
 * Ensures data is stored in writable locations across different environments (Dev, Production, Cloud).
 */

/**
 * Get the base directory for all application data
 */
export const getDataDir = (): string => {
  // 1. Electron provided DATA_DIR (Passed to backend fork)
  if (process.env.DATA_DIR) {
    return process.env.DATA_DIR;
  }

  // 2. Railway / Cloud Environment
  if (process.env.RAILWAY_ENVIRONMENT) {
    return process.cwd(); // Common for cloud
  }

  // 3. Environment variable override
  if (process.env.DATABASE_PATH && path.isAbsolute(process.env.DATABASE_PATH)) {
    return path.dirname(process.env.DATABASE_PATH);
  }

  // 4. Default Local Path (UserData/Nagar ERP for production-like behavior on dev machines)
  return path.join(os.homedir(), "AppData", "Roaming", "Nagar ERP");
};

/**
 * Get the main database file path
 */
export const getDbPath = (): string => {
  if (process.env.DATABASE_PATH) {
    if (path.isAbsolute(process.env.DATABASE_PATH)) {
      return process.env.DATABASE_PATH;
    }
    // Relative path from current working directory
    return path.resolve(process.cwd(), process.env.DATABASE_PATH);
  }

  return path.join(getDataDir(), "nagar.db");
};

/**
 * Get the directory for GCS keys
 */
export const getKeysDir = (): string => {
  return path.join(getDataDir(), "keys");
};

/**
 * Get the directory for uploads
 */
export const getUploadsDir = (): string => {
  return path.join(getDataDir(), "uploads");
};

/**
 * Get the directory for temporary backups (before upload)
 */
export const getTempBackupDir = (): string => {
  return os.tmpdir();
};
