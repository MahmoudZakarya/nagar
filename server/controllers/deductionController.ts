import { Request, Response } from "express";
import db from "../db";

export const getDeductions = (req: Request, res: Response) => {
  const { employee_id } = req.params;
  try {
    const deductions = db
      .prepare(
        "SELECT * FROM deductions WHERE employee_id = ? ORDER BY date DESC",
      )
      .all(employee_id);
    res.json(deductions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createDeduction = (req: Request, res: Response) => {
  const { employee_id, amount, reason, date } = req.body;
  try {
    const result = db
      .prepare(
        "INSERT INTO deductions (employee_id, amount, reason, date) VALUES (?, ?, ?, ?)",
      )
      .run(employee_id, amount, reason, date || new Date().toISOString());
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteDeduction = (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    db.prepare("DELETE FROM deductions WHERE id = ?").run(id);
    res.sendStatus(204);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
