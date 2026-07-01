import { Request, Response } from "express";
import db from "../db";

export const addTransaction = async (req: Request, res: Response) => {
  const {
    transaction_type,
    amount,
    category,
    related_id,
    description,
    performed_by_id,
  } = req.body;

  if (!transaction_type || !amount || !category) {
    return res
      .status(400)
      .json({ error: "Type, Amount and Category are required" });
  }

  try {
    const result = await db.execute(
      "INSERT INTO safe (transaction_type, amount, category, related_id, description, performed_by_id) VALUES (?, ?, ?, ?, ?, ?)",
      [
        transaction_type,
        amount,
        category,
        related_id,
        description,
        performed_by_id,
      ]
    );
    res.status(201).json({ id: result.lastInsertRowid, ...req.body });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getSafeHistory = async (req: Request, res: Response) => {
  try {
    const history = await db.query(
      `SELECT safe.*, users.username as performed_by_name 
       FROM safe 
       LEFT JOIN users ON safe.performed_by_id = users.id 
       ORDER BY safe.date DESC`
    );

    // Calculate Balance
    const income: any = await db.queryOne(
      "SELECT SUM(amount) as total FROM safe WHERE transaction_type = 'Income'"
    );
    const expense: any = await db.queryOne(
      "SELECT SUM(amount) as total FROM safe WHERE transaction_type = 'Expense'"
    );
    const balance = (income?.total || 0) - (expense?.total || 0);

    res.json({ balance, history });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
