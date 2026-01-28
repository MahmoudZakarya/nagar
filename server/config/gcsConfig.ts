import db from "../db";
import fs from "fs";
import path from "path";
import os from "os";

export interface GCSConfig {
  bucketName: string | null;
  projectId: string | null;
  keyFilePath: string | null;
}

/**
 * Get the directory where GCS key files should be stored
 */
const getKeysDirectory = (): string => {
  const keysDir = path.join(__dirname, "../keys");
  if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true, mode: 0o700 }); // Restrict to owner only
  }
  return keysDir;
};

/**
 * Get GCS configuration from database
 */
export const getGCSConfig = (): GCSConfig => {
  const config: GCSConfig = {
    bucketName: null,
    projectId: null,
    keyFilePath: null,
  };

  try {
    const bucketRow: any = db
      .prepare("SELECT value FROM settings WHERE key = ?")
      .get("gcs_bucket_name");
    const projectRow: any = db
      .prepare("SELECT value FROM settings WHERE key = ?")
      .get("gcs_project_id");
    const keyPathRow: any = db
      .prepare("SELECT value FROM settings WHERE key = ?")
      .get("gcs_key_file_path");

    if (bucketRow) config.bucketName = bucketRow.value;
    if (projectRow) config.projectId = projectRow.value;
    if (keyPathRow) config.keyFilePath = keyPathRow.value;
  } catch (error) {
    console.error("Failed to load GCS config from database:", error);
  }

  return config;
};

/**
 * Save GCS bucket name and project ID to database
 */
export const saveGCSSettings = (
  bucketName: string,
  projectId: string,
): void => {
  const upsertBucket = db.prepare(`
    INSERT INTO settings (key, value, updated_at) 
    VALUES ('gcs_bucket_name', ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
  `);

  const upsertProject = db.prepare(`
    INSERT INTO settings (key, value, updated_at) 
    VALUES ('gcs_project_id', ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
  `);

  upsertBucket.run(bucketName, bucketName);
  upsertProject.run(projectId, projectId);

  console.log("GCS settings saved to database");
};

/**
 * Save service account key file to secure location
 * @returns The path where the key file was saved
 */
export const saveServiceAccountKey = (fileBuffer: Buffer): string => {
  const keysDir = getKeysDirectory();
  const keyFilePath = path.join(keysDir, "gcs-service-account.json");

  // Validate JSON format
  try {
    const keyContent = JSON.parse(fileBuffer.toString("utf8"));

    // Basic validation of service account key structure
    if (!keyContent.type || keyContent.type !== "service_account") {
      throw new Error(
        "Invalid service account key: missing or incorrect type field",
      );
    }
    if (
      !keyContent.project_id ||
      !keyContent.private_key ||
      !keyContent.client_email
    ) {
      throw new Error("Invalid service account key: missing required fields");
    }

    // Write file with restricted permissions
    fs.writeFileSync(keyFilePath, fileBuffer, { mode: 0o600 }); // Owner read/write only

    // Save path to database
    const upsertKeyPath = db.prepare(`
      INSERT INTO settings (key, value, updated_at) 
      VALUES ('gcs_key_file_path', ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
    `);
    upsertKeyPath.run(keyFilePath, keyFilePath);

    console.log("Service account key saved securely");
    return keyFilePath;
  } catch (error: any) {
    throw new Error(`Failed to save service account key: ${error.message}`);
  }
};

/**
 * Check if GCS is configured (has all required settings)
 */
export const isGCSConfigured = (): boolean => {
  const config = getGCSConfig();
  return !!(
    config.bucketName &&
    config.projectId &&
    config.keyFilePath &&
    fs.existsSync(config.keyFilePath)
  );
};

/**
 * Get GCS configuration with fallback to environment variables
 */
export const getGCSConfigWithFallback = (): GCSConfig => {
  const dbConfig = getGCSConfig();

  return {
    bucketName: dbConfig.bucketName || process.env.GCS_BUCKET_NAME || null,
    projectId: dbConfig.projectId || process.env.GCS_PROJECT_ID || null,
    keyFilePath: dbConfig.keyFilePath || process.env.GCS_KEY_FILE || null,
  };
};

/**
 * Clear GCS configuration (for testing or reconfiguration)
 */
export const clearGCSConfig = (): void => {
  try {
    db.prepare("DELETE FROM settings WHERE key = ?").run("gcs_bucket_name");
    db.prepare("DELETE FROM settings WHERE key = ?").run("gcs_project_id");

    const keyPathRow: any = db
      .prepare("SELECT value FROM settings WHERE key = ?")
      .get("gcs_key_file_path");
    if (keyPathRow && fs.existsSync(keyPathRow.value)) {
      fs.unlinkSync(keyPathRow.value);
    }
    db.prepare("DELETE FROM settings WHERE key = ?").run("gcs_key_file_path");

    console.log("GCS configuration cleared");
  } catch (error) {
    console.error("Failed to clear GCS config:", error);
  }
};
