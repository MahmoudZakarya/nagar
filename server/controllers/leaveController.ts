import { Request, Response } from "express";
import db from "../db";

export const getLeaves = async (req: Request, res: Response) => {
  const { employee_id } = req.params;
  try {
    const leaves = await db.query(
      "SELECT * FROM leaves WHERE employee_id = ? ORDER BY start_date DESC",
      [employee_id]
    );
    res.json(leaves);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createLeave = async (req: Request, res: Response) => {
  const { employee_id, type, start_date, end_date, is_paid } = req.body;
  try {
    const result = await db.execute(
      "INSERT INTO leaves (employee_id, type, start_date, end_date, is_paid) VALUES (?, ?, ?, ?, ?)",
      [employee_id, type, start_date, end_date, is_paid ? true : false]
    );
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteLeave = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await db.execute("DELETE FROM leaves WHERE id = ?", [id]);
    res.sendStatus(204);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
