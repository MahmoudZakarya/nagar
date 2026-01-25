import { Request, Response } from "express";
import db from "../db";

export const checkIn = (req: Request, res: Response) => {
  const { employee_id, date, check_in } = req.body;

  try {
    // Check if already checked in today
    const existing = db
      .prepare("SELECT * FROM attendance WHERE employee_id = ? AND date = ?")
      .get(employee_id, date);

    if (existing) {
      return res.status(400).json({ error: "Already checked in for today" });
    }

    const info = db
      .prepare(
        `
      INSERT INTO attendance (employee_id, date, check_in)
      VALUES (?, ?, ?)
    `,
      )
      .run(employee_id, date, check_in);

    res.status(201).json({ id: info.lastInsertRowid });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const checkOut = (req: Request, res: Response) => {
  const { id } = req.params;
  const { check_out, unpaid_break_minutes } = req.body;

  try {
    const attendance: any = db
      .prepare("SELECT * FROM attendance WHERE id = ?")
      .get(id);
    if (!attendance) throw new Error("Attendance record not found");

    const employee: any = db
      .prepare("SELECT hourly_rate FROM employees WHERE id = ?")
      .get(attendance.employee_id);

    const start = new Date(attendance.check_in).getTime();
    const end = new Date(check_out).getTime();

    // Calculate total hours (subtracting breaks)
    let totalMs = end - start;
    totalMs -= (unpaid_break_minutes || 0) * 60 * 1000;

    const totalHours = Math.max(0, totalMs / (1000 * 60 * 60));
    const calculatedPay = totalHours * (employee?.hourly_rate || 0);

    db.prepare(
      `
      UPDATE attendance 
      SET check_out = ?, unpaid_break_minutes = ?, total_hours = ?, calculated_pay = ?
      WHERE id = ?
    `,
    ).run(check_out, unpaid_break_minutes, totalHours, calculatedPay, id);

    res.json({ success: true, totalHours, calculatedPay });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAttendanceByEmployee = (req: Request, res: Response) => {
  const { employee_id } = req.params;
  try {
    const history = db
      .prepare(
        "SELECT * FROM attendance WHERE employee_id = ? ORDER BY date DESC",
      )
      .all(employee_id);
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const paySalary = (req: Request, res: Response) => {
  const { employee_id, amount, period_start, period_end, performed_by_id } =
    req.body;

  const payOp = db.transaction(() => {
    // 1. Log Payroll
    db.prepare(
      `
      INSERT INTO payroll (employee_id, amount_paid, period_start, period_end, performed_by_id)
      VALUES (?, ?, ?, ?, ?)
    `,
    ).run(employee_id, amount, period_start, period_end, performed_by_id);

    // 2. Log to Safe as Expense
    db.prepare(
      `
      INSERT INTO safe (transaction_type, amount, category, related_id, description, performed_by_id)
      VALUES ('Expense', ?, 'رواتب', ?, ?, ?)
    `,
    ).run(
      amount,
      employee_id,
      `صرف راتب موظف رقم: ${employee_id}`,
      performed_by_id,
    );

    return { success: true };
  });

  try {
    const result = payOp();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const logManualAttendance = (req: Request, res: Response) => {
  const { employee_id, date, check_in, check_out, unpaid_break_minutes } =
    req.body;

  try {
    const employee: any = db
      .prepare("SELECT hourly_rate FROM employees WHERE id = ?")
      .get(employee_id);

    const start = new Date(check_in).getTime();
    const end = new Date(check_out).getTime();

    let totalMs = end - start;
    totalMs -= (unpaid_break_minutes || 0) * 60 * 1000;

    const totalHours = Math.max(0, totalMs / (1000 * 60 * 60));
    const calculatedPay = totalHours * (employee?.hourly_rate || 0);

    const info = db
      .prepare(
        `
      INSERT INTO attendance (employee_id, date, check_in, check_out, unpaid_break_minutes, total_hours, calculated_pay)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      )
      .run(
        employee_id,
        date,
        check_in,
        check_out,
        unpaid_break_minutes,
        totalHours,
        calculatedPay,
      );

    res
      .status(201)
      .json({ id: info.lastInsertRowid, totalHours, calculatedPay });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
