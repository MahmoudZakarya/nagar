import { Request, Response } from "express";
import db from "../db";
import { RunResult } from "better-sqlite3";

export const getPurchases = (req: Request, res: Response) => {
  try {
    const purchases = db
      .prepare("SELECT * FROM purchases ORDER BY date DESC")
      .all();
    res.json(purchases);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createPurchase = (req: Request, res: Response) => {
  const {
    supplier_name,
    item_name,
    quantity,
    price_per_unit,
    total_cost,
    discount_received,
    amount_paid_now,
    performed_by_id,
  } = req.body;

  if (!item_name || !total_cost) {
    return res
      .status(400)
      .json({ error: "Item name and total cost are required" });
  }

  const amount_remaining = total_cost - amount_paid_now;

  const insertPurchase = db.transaction(() => {
    // 1. Insert Purchase
    const stmt = db.prepare(`
      INSERT INTO purchases (
        supplier_name, item_name, quantity, price_per_unit, 
        total_cost, discount_received, amount_paid_now, amount_remaining, performed_by_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info: RunResult = stmt.run(
      supplier_name,
      item_name,
      quantity,
      price_per_unit,
      total_cost,
      discount_received,
      amount_paid_now,
      amount_remaining,
      performed_by_id,
    );

    const purchaseId = info.lastInsertRowid;

    // 2. Add to Safe as Expense
    if (amount_paid_now > 0) {
      const safeStmt = db.prepare(
        "INSERT INTO safe (transaction_type, amount, category, related_id, description, performed_by_id) VALUES (?, ?, ?, ?, ?, ?)",
      );
      safeStmt.run(
        "Expense",
        amount_paid_now,
        "مشتريات خامات",
        purchaseId,
        `دفع لفاتورة شراء: ${item_name}`,
        performed_by_id,
      );
    }

    return { id: purchaseId };
  });

  try {
    const result = insertPurchase();
    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePurchasePayment = (req: Request, res: Response) => {
  const { id } = req.params;
  const { payment_amount, performed_by_id } = req.body;

  if (payment_amount === undefined || isNaN(parseFloat(payment_amount))) {
    return res.status(400).json({ error: "Valid payment amount is required" });
  }

  const amount = parseFloat(payment_amount);

  try {
    const transaction = db.transaction(() => {
      // 1. Get purchase
      const purchase: any = db
        .prepare("SELECT * FROM purchases WHERE id = ?")
        .get(id);
      if (!purchase) throw new Error("Purchase not found");

      if (amount > purchase.amount_remaining) {
        throw new Error("Payment amount exceeds remaining balance");
      }

      // 2. Update purchase
      const newPaid = purchase.amount_paid_now + amount;
      const newRemaining = purchase.amount_remaining - amount;

      db.prepare(
        `
        UPDATE purchases 
        SET amount_paid_now = ?, amount_remaining = ? 
        WHERE id = ?
      `,
      ).run(newPaid, newRemaining, id);

      // 3. Log to Safe as Expense
      const safeStmt = db.prepare(
        "INSERT INTO safe (transaction_type, amount, category, related_id, description, performed_by_id) VALUES (?, ?, ?, ?, ?, ?)",
      );
      safeStmt.run(
        "Expense",
        amount,
        "مشتريات خامات",
        id,
        `سداد متبقي لمشتريات: ${purchase.item_name}`,
        performed_by_id,
      );
    });

    transaction();
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deletePurchase = (req: Request, res: Response) => {
  const { id } = req.params;

  const deleteOp = db.transaction(() => {
    const { performed_by_id } = req.body;
    const purchase = db
      .prepare("SELECT * FROM purchases WHERE id = ?")
      .get(id) as any;
    if (!purchase) throw new Error("Purchase not found");

    if (purchase.amount_paid_now > 0) {
      db.prepare(
        `
        INSERT INTO safe (transaction_type, amount, category, related_id, description, performed_by_id)
        VALUES ('Income', ?, 'استرداد', ?, ?, ?)
      `,
      ).run(
        purchase.amount_paid_now,
        purchase.id,
        `حذف فاتورة شراء: ${purchase.item_name} (استرداد مدفوعات)`,
        performed_by_id,
      );
    }

    db.prepare("DELETE FROM purchases WHERE id = ?").run(id);
    return { success: true };
  });

  try {
    const result = deleteOp();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
