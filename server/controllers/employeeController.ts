import { Request, Response } from "express";
import db from "../db";

export const getEmployees = async (req: Request, res: Response) => {
  try {
    const employees = await db.query(
      "SELECT * FROM employees ORDER BY name ASC"
    );
    res.json(employees);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createEmployee = async (req: Request, res: Response) => {
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
    const result = await db.execute(
      `INSERT INTO employees (
         name, national_id, address, phone_1, phone_2, 
         relative_name, relative_phone, relative_relation, 
         age, role, hourly_rate, start_date
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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
      ]
    );

    res.status(201).json({ id: result.lastInsertRowid });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateEmployee = async (req: Request, res: Response) => {
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
    await db.execute(
      `UPDATE employees 
       SET name = ?, national_id = ?, address = ?, phone_1 = ?, phone_2 = ?, 
           relative_name = ?, relative_phone = ?, relative_relation = ?, 
           age = ?, role = ?, hourly_rate = ?, status = ?
       WHERE id = ?`,
      [
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
      ]
    );

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteEmployee = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await db.execute("DELETE FROM employees WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
