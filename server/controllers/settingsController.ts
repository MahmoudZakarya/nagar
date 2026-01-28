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
export const getGCSSettings = (req: Request, res: Response) => {
  try {
    const config = getGCSConfig();

    res.json({
      configured: isGCSConfigured(),
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
export const updateGCSSettings = (req: Request, res: Response) => {
  try {
    const { bucketName, projectId } = req.body;

    if (!bucketName || !projectId) {
      return res
        .status(400)
        .json({ error: "اسم الحاوية ومعرف المشروع مطلوبان" });
    }

    saveGCSSettings(bucketName, projectId);

    // Reinitialize storage with new settings if key file exists
    if (isGCSConfigured()) {
      reinitializeStorage();
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
export const uploadServiceAccountKey = (req: Request, res: Response) => {
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
    const keyPath = saveServiceAccountKey(req.file.buffer);

    // Reinitialize storage with new key
    if (isGCSConfigured()) {
      reinitializeStorage();
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
    if (!isGCSConfigured()) {
      return res.status(400).json({
        error: "إعدادات التخزين السحابي غير مكتملة",
        details: "يرجى التأكد من إدخال جميع البيانات المطلوبة",
      });
    }

    // Reinitialize storage before testing
    reinitializeStorage();

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
export const clearGCSSettings = (req: Request, res: Response) => {
  try {
    clearGCSConfig();
    reinitializeStorage();

    res.json({
      success: true,
      message: "تم حذف إعدادات التخزين السحابي",
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
