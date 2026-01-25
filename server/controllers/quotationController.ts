import { Request, Response } from "express";
import db from "../db";
import path from "path";
import multer from "multer";
import fs from "fs";

// Configure Multer for Quotation Images
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: any) => {
    const dir = "uploads/quotations";
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

export const getQuotationsByClient = (req: Request, res: Response) => {
  const { clientId } = req.params;
  try {
    const quotations = db
      .prepare(
        `
      SELECT id, quotation_number, created_at, total_amount, discount, status 
      FROM quotations 
      WHERE client_id = ? 
      ORDER BY created_at DESC
    `,
      )
      .all(clientId);
    res.json(quotations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getQuotationById = (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const quotation = db
      .prepare("SELECT * FROM quotations WHERE id = ?")
      .get(id) as any;
    if (!quotation)
      return res.status(404).json({ error: "Quotation not found" });

    const items = db
      .prepare(
        "SELECT * FROM quotation_items WHERE quotation_id = ? ORDER BY sort_order ASC",
      )
      .all(id);
    res.json({ ...quotation, items });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createQuotation = (req: Request, res: Response) => {
  const { client_id, quotation_number, items, total_amount, discount, status } =
    req.body;

  const transaction = db.transaction(() => {
    const result = db
      .prepare(
        `
      INSERT INTO quotations (client_id, quotation_number, total_amount, discount, status) 
      VALUES (?, ?, ?, ?, ?)
    `,
      )
      .run(
        client_id,
        quotation_number,
        total_amount,
        discount || 0,
        status || "Draft",
      );

    const quotationId = result.lastInsertRowid;

    const insertItem = db.prepare(`
      INSERT INTO quotation_items (quotation_id, item_name, description, image_path, meter_price, unit_price, quantity, row_total, sort_order) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of items) {
      insertItem.run(
        quotationId,
        item.item_name,
        item.description,
        item.image_path,
        item.meter_price,
        item.unit_price,
        item.quantity,
        item.row_total,
        item.sort_order,
      );
    }

    return quotationId;
  });

  try {
    const quotationId = transaction();
    res.status(201).json({ id: quotationId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateQuotation = (req: Request, res: Response) => {
  const { id } = req.params;
  const { items, total_amount, discount, status, quotation_number } = req.body;

  const transaction = db.transaction(() => {
    db.prepare(
      `
      UPDATE quotations 
      SET quotation_number = ?, total_amount = ?, discount = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `,
    ).run(quotation_number, total_amount, discount || 0, status, id);

    // Simplest way to update items is to delete and re-insert
    db.prepare("DELETE FROM quotation_items WHERE quotation_id = ?").run(id);

    const insertItem = db.prepare(`
      INSERT INTO quotation_items (quotation_id, item_name, description, image_path, meter_price, unit_price, quantity, row_total, sort_order) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of items) {
      insertItem.run(
        id,
        item.item_name,
        item.description,
        item.image_path,
        item.meter_price,
        item.unit_price,
        item.quantity,
        item.row_total,
        item.sort_order,
      );
    }
  });

  try {
    transaction();
    res.sendStatus(204);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
