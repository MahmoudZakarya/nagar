import { Request, Response } from "express";
import db from "../db";

export const getDeductions = async (req: Request, res: Response) => {
  const { employee_id } = req.params;
  try {
    const deductions = await db.query(
      "SELECT * FROM deductions WHERE employee_id = ? ORDER BY date DESC",
      [employee_id]
    );
    res.json(deductions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createDeduction = async (req: Request, res: Response) => {
  const { employee_id, amount, reason, date } = req.body;
  try {
    const result = await db.execute(
      "INSERT INTO deductions (employee_id, amount, reason, date) VALUES (?, ?, ?, ?)",
      [employee_id, amount, reason, date || new Date().toISOString()]
    );
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteDeduction = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await db.execute("DELETE FROM deductions WHERE id = ?", [id]);
    res.sendStatus(204);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
