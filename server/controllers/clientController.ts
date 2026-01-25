import { Request, Response } from "express";
import db from "../db";
import { RunResult } from "better-sqlite3";

export const getClients = (req: Request, res: Response) => {
  try {
    const clients = db.prepare("SELECT * FROM clients ORDER BY name ASC").all();
    res.json(clients);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createClient = (req: Request, res: Response) => {
  const { name, phone_1, phone_2, address } = req.body;

  if (!name || !phone_1) {
    return res.status(400).json({ error: "Name and Phone 1 are required" });
  }

  try {
    const stmt = db.prepare(
      "INSERT INTO clients (name, phone_1, phone_2, address) VALUES (?, ?, ?, ?)",
    );
    const info: RunResult = stmt.run(name, phone_1, phone_2, address);
    res.status(201).json({ id: info.lastInsertRowid, ...req.body });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateClient = (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, phone_1, phone_2, address } = req.body;

  try {
    const stmt = db.prepare(`
      UPDATE clients 
      SET name = ?, phone_1 = ?, phone_2 = ?, address = ? 
      WHERE id = ?
    `);
    const result = stmt.run(name, phone_1, phone_2, address, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
