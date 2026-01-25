import { Request, Response } from "express";
import db from "../db";

export const getEmployees = (req: Request, res: Response) => {
  try {
    const employees = db
      .prepare("SELECT * FROM employees ORDER BY name ASC")
      .all();
    res.json(employees);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createEmployee = (req: Request, res: Response) => {
  const {
    name,
    national_id,
    address,
    phone_1,
    phone_2,
    relative_name,
    relative_phone,
    relative_relation,
    age,
    role,
    hourly_rate,
    start_date,
  } = req.body;

  if (!name || !role) {
    return res.status(400).json({ error: "Name and role are required" });
  }

  try {
    const info = db
      .prepare(
        `
      INSERT INTO employees (
        name, national_id, address, phone_1, phone_2, 
        relative_name, relative_phone, relative_relation, 
        age, role, hourly_rate, start_date
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      )
      .run(
        name,
        national_id,
        address,
        phone_1,
        phone_2,
        relative_name,
        relative_phone,
        relative_relation,
        age,
        role,
        hourly_rate,
        start_date || new Date().toISOString(),
      );

    res.status(201).json({ id: info.lastInsertRowid });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateEmployee = (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name,
    national_id,
    address,
    phone_1,
    phone_2,
    relative_name,
    relative_phone,
    relative_relation,
    age,
    role,
    hourly_rate,
    status,
  } = req.body;

  try {
    db.prepare(
      `
      UPDATE employees 
      SET name = ?, national_id = ?, address = ?, phone_1 = ?, phone_2 = ?, 
          relative_name = ?, relative_phone = ?, relative_relation = ?, 
          age = ?, role = ?, hourly_rate = ?, status = ?
      WHERE id = ?
    `,
    ).run(
      name,
      national_id,
      address,
      phone_1,
      phone_2,
      relative_name,
      relative_phone,
      relative_relation,
      age,
      role,
      hourly_rate,
      status,
      id,
    );

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteEmployee = (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    db.prepare("DELETE FROM employees WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
