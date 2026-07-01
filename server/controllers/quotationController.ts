import { Request, Response } from "express";
import db from "../db";
import path from "path";
import multer from "multer";
import fs from "fs";
import { getUploadsDir } from "../utils/paths";

// Configure Multer for Quotation Images
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: any) => {
    const dir = path.join(getUploadsDir(), "quotations");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req: Request, file: Express.Multer.File, cb: any) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "quotation-" + uniqueSuffix + path.extname(file.originalname));
  },
});

export const upload = multer({ storage: storage });

export const uploadImage = (req: Request, res: Response) => {
  const file = (req as any).file;
  if (!file) {
    return res.status(400).json({ error: "No image uploaded" });
  }
  const filePath = `/uploads/quotations/${file.filename}`;
  res.json({ filePath });
};

export const getQuotationsByClient = async (req: Request, res: Response) => {
  const { clientId } = req.params;
  try {
    const quotations = (await db.query(
      `SELECT id, quotation_number, created_at, total_amount, discount, status 
       FROM quotations 
       WHERE client_id = ? 
       ORDER BY created_at DESC`,
      [clientId]
    )) as any[];

    // Add items to each quotation
    const quotationsWithItems = [];
    for (const q of quotations) {
      const items = await db.query(
        "SELECT * FROM quotation_items WHERE quotation_id = ? ORDER BY sort_order ASC",
        [q.id]
      );
      quotationsWithItems.push({ ...q, items });
    }

    res.json(quotationsWithItems);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getQuotationById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const quotation = (await db.queryOne(
      "SELECT * FROM quotations WHERE id = ?",
      [id]
    )) as any;
    if (!quotation)
      return res.status(404).json({ error: "Quotation not found" });

    const items = await db.query(
      "SELECT * FROM quotation_items WHERE quotation_id = ? ORDER BY sort_order ASC",
      [id]
    );
    res.json({ ...quotation, items });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createQuotation = async (req: Request, res: Response) => {
  const { client_id, quotation_number, items, total_amount, discount, status } =
    req.body;

  try {
    const quotationId = await db.transaction(async (tx) => {
      const result = await tx.execute(
        `INSERT INTO quotations (client_id, quotation_number, total_amount, discount, status) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          client_id,
          quotation_number,
          total_amount,
          discount || 0,
          status || "Draft",
        ]
      );

      const qId = result.lastInsertRowid;

      for (const item of items) {
        await tx.execute(
          `INSERT INTO quotation_items (quotation_id, item_name, description, image_path, meter_price, unit_price, quantity, row_total, sort_order) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            qId,
            item.item_name,
            item.description,
            item.image_path,
            item.meter_price,
            item.unit_price,
            item.quantity,
            item.row_total,
            item.sort_order,
          ]
        );
      }

      return qId;
    });

    res.status(201).json({ id: quotationId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateQuotation = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { items, total_amount, discount, status, quotation_number } = req.body;

  try {
    await db.transaction(async (tx) => {
      await tx.execute(
        `UPDATE quotations 
         SET quotation_number = ?, total_amount = ?, discount = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [quotation_number, total_amount, discount || 0, status, id]
      );

      // Simplest way to update items is to delete and re-insert
      await tx.execute("DELETE FROM quotation_items WHERE quotation_id = ?", [
        id,
      ]);

      for (const item of items) {
        await tx.execute(
          `INSERT INTO quotation_items (quotation_id, item_name, description, image_path, meter_price, unit_price, quantity, row_total, sort_order) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            item.item_name,
            item.description,
            item.image_path,
            item.meter_price,
            item.unit_price,
            item.quantity,
            item.row_total,
            item.sort_order,
          ]
        );
      }
    });

    res.sendStatus(204);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
