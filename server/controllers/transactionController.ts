import { Request, Response } from "express";
import db from "../db";
import { RunResult } from "better-sqlite3";

export const addTransaction = (req: Request, res: Response) => {
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
    const stmt = db.prepare(
      "INSERT INTO safe (transaction_type, amount, category, related_id, description, performed_by_id) VALUES (?, ?, ?, ?, ?, ?)",
    );
    const info: RunResult = stmt.run(
      transaction_type,
      amount,
      category,
      related_id,
      description,
      performed_by_id,
    );
    res.status(201).json({ id: info.lastInsertRowid, ...req.body });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getSafeHistory = (req: Request, res: Response) => {
  try {
    const history = db
      .prepare(
        `
      SELECT safe.*, users.username as performed_by_name 
      FROM safe 
      LEFT JOIN users ON safe.performed_by_id = users.id 
      ORDER BY safe.date DESC
    `,
      )
      .all();

    // Calculate Balance
    const income = db
      .prepare(
        "SELECT SUM(amount) as total FROM safe WHERE transaction_type = 'Income'",
      )
      .get() as { total: number };
    const expense = db
      .prepare(
        "SELECT SUM(amount) as total FROM safe WHERE transaction_type = 'Expense'",
      )
      .get() as { total: number };
    const balance = (income.total || 0) - (expense.total || 0);

    res.json({ balance, history });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
