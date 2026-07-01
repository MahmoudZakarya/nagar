import { Request, Response } from "express";
import db from "../db";

export const getPurchases = async (req: Request, res: Response) => {
  try {
    const purchases = await db.query(
      "SELECT * FROM purchases ORDER BY date DESC"
    );
    res.json(purchases);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createPurchase = async (req: Request, res: Response) => {
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

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Insert Purchase
      const info = await tx.execute(
        `INSERT INTO purchases (
           supplier_name, item_name, quantity, price_per_unit, 
           total_cost, discount_received, amount_paid_now, amount_remaining, performed_by_id
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          supplier_name,
          item_name,
          quantity,
          price_per_unit,
          total_cost,
          discount_received,
          amount_paid_now,
          amount_remaining,
          performed_by_id,
        ]
      );

      const purchaseId = info.lastInsertRowid;

      // 2. Add to Safe as Expense
      if (amount_paid_now > 0) {
        await tx.execute(
          "INSERT INTO safe (transaction_type, amount, category, related_id, description, performed_by_id) VALUES (?, ?, ?, ?, ?, ?)",
          [
            "Expense",
            amount_paid_now,
            "مشتريات خامات",
            purchaseId,
            `دفع لفاتورة شراء: ${item_name}`,
            performed_by_id,
          ]
        );
      }

      return { id: purchaseId };
    });

    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePurchasePayment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { payment_amount, performed_by_id } = req.body;

  if (payment_amount === undefined || isNaN(parseFloat(payment_amount))) {
    return res.status(400).json({ error: "Valid payment amount is required" });
  }

  const amount = parseFloat(payment_amount);

  try {
    await db.transaction(async (tx) => {
      // 1. Get purchase
      const purchase: any = await tx.queryOne(
        "SELECT * FROM purchases WHERE id = ?",
        [id]
      );
      if (!purchase) throw new Error("Purchase not found");

      if (amount > purchase.amount_remaining) {
        throw new Error("Payment amount exceeds remaining balance");
      }

      // 2. Update purchase
      const newPaid = purchase.amount_paid_now + amount;
      const newRemaining = purchase.amount_remaining - amount;

      await tx.execute(
        `UPDATE purchases 
         SET amount_paid_now = ?, amount_remaining = ? 
         WHERE id = ?`,
        [newPaid, newRemaining, id]
      );

      // 3. Log to Safe as Expense
      await tx.execute(
        "INSERT INTO safe (transaction_type, amount, category, related_id, description, performed_by_id) VALUES (?, ?, ?, ?, ?, ?)",
        [
          "Expense",
          amount,
          "مشتريات خامات",
          id,
          `سداد متبقي لمشتريات: ${purchase.item_name}`,
          performed_by_id,
        ]
      );
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deletePurchase = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await db.transaction(async (tx) => {
      const { performed_by_id } = req.body;
      const purchase = (await tx.queryOne(
        "SELECT * FROM purchases WHERE id = ?",
        [id]
      )) as any;
      if (!purchase) throw new Error("Purchase not found");

      if (purchase.amount_paid_now > 0) {
        await tx.execute(
          `INSERT INTO safe (transaction_type, amount, category, related_id, description, performed_by_id)
           VALUES ('Income', ?, 'استرداد', ?, ?, ?)`,
          [
            purchase.amount_paid_now,
            purchase.id,
            `حذف فاتورة شراء: ${purchase.item_name} (استرداد مدفوعات)`,
            performed_by_id,
          ]
        );
      }

      await tx.execute("DELETE FROM purchases WHERE id = ?", [id]);
      return { success: true };
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
