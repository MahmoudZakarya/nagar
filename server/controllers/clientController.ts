import { Request, Response } from "express";
import db from "../db";

export const getClients = async (req: Request, res: Response) => {
  try {
    const clients = await db.query("SELECT * FROM clients ORDER BY name ASC");
    res.json(clients);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createClient = async (req: Request, res: Response) => {
  const { name, phone_1, phone_2, address } = req.body;

  if (!name || !phone_1) {
    return res.status(400).json({ error: "Name and Phone 1 are required" });
  }

  try {
    const result = await db.execute(
      "INSERT INTO clients (name, phone_1, phone_2, address) VALUES (?, ?, ?, ?)",
      [name, phone_1, phone_2, address]
    );
    res.status(201).json({ id: result.lastInsertRowid, ...req.body });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateClient = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, phone_1, phone_2, address } = req.body;

  try {
    const result = await db.execute(
      `UPDATE clients 
       SET name = ?, phone_1 = ?, phone_2 = ?, address = ? 
       WHERE id = ?`,
      [name, phone_1, phone_2, address, id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
