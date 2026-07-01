import { Request, Response } from "express";
import {
  getGCSConfig,
  saveGCSSettings,
  saveServiceAccountKey,
  isGCSConfigured,
  clearGCSConfig,
} from "../config/gcsConfig";
import { reinitializeStorage, testConnection } from "../services/backupService";

/**
 * Get current GCS configuration (without exposing key file content)
 * GET /api/admin/settings/gcs
 */
export const getGCSSettings = async (req: Request, res: Response) => {
  try {
    const config = await getGCSConfig();
    const configured = await isGCSConfigured();

    res.json({
      configured: configured,
      bucketName: config.bucketName,
      projectId: config.projectId,
      hasKeyFile: !!config.keyFilePath,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update GCS bucket name and project ID
 * POST /api/admin/settings/gcs
 */
export const updateGCSSettings = async (req: Request, res: Response) => {
  try {
    const { bucketName, projectId } = req.body;

    if (!bucketName || !projectId) {
      return res
        .status(400)
        .json({ error: "اسم الحاوية ومعرف المشروع مطلوبان" });
    }

    await saveGCSSettings(bucketName, projectId);

    const configured = await isGCSConfigured();
    // Reinitialize storage with new settings if key file exists
    if (configured) {
      await reinitializeStorage();
    }

    res.json({
      success: true,
      message: "تم حفظ إعدادات التخزين السحابي بنجاح",
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Upload service account key file
 * POST /api/admin/settings/gcs/key
 */
export const uploadServiceAccountKey = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "ملف المفتاح مطلوب" });
    }

    // Validate file type
    if (
      req.file.mimetype !== "application/json" &&
      !req.file.originalname.endsWith(".json")
    ) {
      return res.status(400).json({ error: "يجب أن يكون الملف بصيغة JSON" });
    }

    // Save the service account key
    const keyPath = await saveServiceAccountKey(req.file.buffer);

    const configured = await isGCSConfigured();
    // Reinitialize storage with new key
    if (configured) {
      await reinitializeStorage();
    }

    res.json({
      success: true,
      message: "تم رفع مفتاح الخدمة بنجاح",
      keyPath: keyPath,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Test GCS connection with current credentials
 * POST /api/admin/settings/gcs/test
 */
export const testGCSConnection = async (req: Request, res: Response) => {
  try {
    const configured = await isGCSConfigured();
    if (!configured) {
      return res.status(400).json({
        error: "إعدادات التخزين السحابي غير مكتملة",
        details: "يرجى التأكد من إدخال جميع البيانات المطلوبة",
      });
    }

    // Reinitialize storage before testing
    await reinitializeStorage();

    // Test connection
    const result = await testConnection();

    if (result.success) {
      res.json({
        success: true,
        message: "تم الاتصال بنجاح بالتخزين السحابي",
        bucketName: result.bucketName,
      });
    } else {
      res.status(400).json({
        error: "فشل الاتصال بالتخزين السحابي",
        details: result.error,
      });
    }
  } catch (error: any) {
    res.status(500).json({
      error: "خطأ في اختبار الاتصال",
      details: error.message,
    });
  }
};

/**
 * Clear GCS configuration
 * DELETE /api/admin/settings/gcs
 */
export const clearGCSSettings = async (req: Request, res: Response) => {
  try {
    await clearGCSConfig();
    await reinitializeStorage();

    res.json({
      success: true,
      message: "تم حذف إعدادات التخزين السحابي",
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
