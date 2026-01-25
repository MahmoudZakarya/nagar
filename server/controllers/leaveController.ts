import { Request, Response } from "express";
import db from "../db";

export const getLeaves = (req: Request, res: Response) => {
  const { employee_id } = req.params;
  try {
    const leaves = db
      .prepare(
        "SELECT * FROM leaves WHERE employee_id = ? ORDER BY start_date DESC",
      )
      .all(employee_id);
    res.json(leaves);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createLeave = (req: Request, res: Response) => {
  const { employee_id, type, start_date, end_date, is_paid } = req.body;
  try {
    const result = db
      .prepare(
        "INSERT INTO leaves (employee_id, type, start_date, end_date, is_paid) VALUES (?, ?, ?, ?, ?)",
      )
      .run(employee_id, type, start_date, end_date, is_paid ? 1 : 0);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteLeave = (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    db.prepare("DELETE FROM leaves WHERE id = ?").run(id);
    res.sendStatus(204);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
