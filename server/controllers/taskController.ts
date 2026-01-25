import { Request, Response } from "express";
import db from "../db";
import { RunResult } from "better-sqlite3";

export const createTask = (req: Request, res: Response) => {
  const {
    client_id,
    title,
    description,
    delivery_due_date,
    total_agreed_price,
    deposit_paid,
    performed_by_id,
  } = req.body;

  if (!client_id || !title) {
    return res.status(400).json({ error: "Client ID and Title are required" });
  }

  const insertTask = db.transaction(() => {
    // 1. Insert Task
    const stmt = db.prepare(`
      INSERT INTO tasks (
        client_id, title, description, delivery_due_date, 
        total_agreed_price, deposit_paid, final_payment_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    // Determine payment status
    let paymentStatus = "Unpaid";
    if (deposit_paid >= total_agreed_price && total_agreed_price > 0)
      paymentStatus = "Settled";
    else if (deposit_paid > 0) paymentStatus = "Partial";

    const info: RunResult = stmt.run(
      client_id,
      title,
      description,
      delivery_due_date,
      total_agreed_price,
      deposit_paid,
      paymentStatus,
    );
    const taskId = info.lastInsertRowid;

    // 2. Add to Safe if deposit paid
    if (deposit_paid > 0) {
      const safeStmt = db.prepare(
        "INSERT INTO safe (transaction_type, amount, category, related_id, description, performed_by_id) VALUES (?, ?, ?, ?, ?, ?)",
      );
      safeStmt.run(
        "Income",
        deposit_paid,
        "دفعة مقدمة",
        taskId,
        `عربون مشروع #${taskId}: ${title}`,
        performed_by_id,
      );

      // 3. Add to task_payments table
      const paymentStmt = db.prepare(
        "INSERT INTO task_payments (task_id, amount, note, payment_date, performed_by_id) VALUES (?, ?, ?, ?, ?)",
      );
      paymentStmt.run(
        taskId,
        deposit_paid,
        "دفعة مقدمة",
        new Date().toISOString(),
        performed_by_id,
      );
    }

    return { id: taskId };
  });

  try {
    const result = insertTask();
    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getTasks = (req: Request, res: Response) => {
  try {
    // Join with clients to get client name
    const tasks: any[] = db
      .prepare(
        `
       SELECT tasks.*, clients.name as client_name, clients.phone_1, clients.phone_2 
       FROM tasks 
       JOIN clients ON tasks.client_id = clients.id
       ORDER BY delivery_due_date ASC
    `,
      )
      .all();

    // Fetch subtasks for each task
    const tasksWithSubtasks = tasks.map((task) => {
      const subtasks = db
        .prepare("SELECT * FROM subtasks WHERE task_id = ?")
        .all(task.id);
      return { ...task, subtasks };
    });

    res.json(tasksWithSubtasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateSubtask = (req: Request, res: Response) => {
  const { id } = req.params;
  const { is_completed } = req.body;

  try {
    const stmt = db.prepare(
      "UPDATE subtasks SET is_completed = ? WHERE id = ?",
    );
    const result = stmt.run(is_completed, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Subtask not found" });
    }

    // After updating a subtask, we should recalculate the completion percentage of the parent task
    const subtask: any = db
      .prepare("SELECT task_id FROM subtasks WHERE id = ?")
      .get(id);
    if (subtask) {
      const taskId = subtask.task_id;
      const allSubtasks: any[] = db
        .prepare("SELECT is_completed FROM subtasks WHERE task_id = ?")
        .all(taskId);

      if (allSubtasks.length > 0) {
        const completedCount = allSubtasks.filter(
          (st) => st.is_completed,
        ).length;
        const completionPercent = Math.round(
          (completedCount / allSubtasks.length) * 100,
        );

        db.prepare("UPDATE tasks SET completion_percent = ? WHERE id = ?").run(
          completionPercent,
          taskId,
        );
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getTaskById = (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const task: any = db
      .prepare(
        `
        SELECT tasks.*, clients.name as client_name, clients.phone_1 
        FROM tasks 
        JOIN clients ON tasks.client_id = clients.id
        WHERE tasks.id = ?
    `,
      )
      .get(id);

    if (!task) return res.status(404).json({ error: "Task not found" });

    const subtasks = db
      .prepare("SELECT * FROM subtasks WHERE task_id = ?")
      .all(id);
    res.json({ ...task, subtasks });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const addSubtask = (req: Request, res: Response) => {
  const { id } = req.params;
  const { description } = req.body;

  if (!description)
    return res.status(400).json({ error: "Description is required" });

  try {
    const stmt = db.prepare(
      "INSERT INTO subtasks (task_id, description) VALUES (?, ?)",
    );
    stmt.run(id, description);

    // Recalculate percent
    const allSubtasks: any[] = db
      .prepare("SELECT is_completed FROM subtasks WHERE task_id = ?")
      .all(id);
    const completedCount = allSubtasks.filter((st) => st.is_completed).length;
    const completionPercent = Math.round(
      (completedCount / allSubtasks.length) * 100,
    );
    db.prepare("UPDATE tasks SET completion_percent = ? WHERE id = ?").run(
      completionPercent,
      id,
    );

    res.status(201).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTaskStatus = (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    db.prepare("UPDATE tasks SET status = ? WHERE id = ?").run(status, id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTaskFinancials = (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    total_agreed_price,
    deposit_paid,
    middle_payment_agreed,
    extra_costs,
    payment_amount,
    performed_by_id,
  } = req.body;

  try {
    const updateFinancials = db.transaction(() => {
      // 1. Get current task state
      const task: any = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
      if (!task) throw new Error("Task not found");

      // 2. Update financials
      const stmt = db.prepare(`
        UPDATE tasks SET 
          total_agreed_price = ?, 
          deposit_paid = ?, 
          middle_payment_agreed = ?, 
          extra_costs = ?,
          final_payment_status = ?
        WHERE id = ?
      `);

      const total =
        total_agreed_price !== undefined
          ? parseFloat(total_agreed_price)
          : task.total_agreed_price;
      const paid =
        deposit_paid !== undefined
          ? parseFloat(deposit_paid)
          : task.deposit_paid;
      const extra =
        extra_costs !== undefined ? parseFloat(extra_costs) : task.extra_costs;
      const middle =
        middle_payment_agreed !== undefined
          ? parseFloat(middle_payment_agreed)
          : task.middle_payment_agreed;

      const newPayment = parseFloat(payment_amount) || 0;
      const finalPaid = paid + newPayment;

      let paymentStatus = "Unpaid";
      if (finalPaid >= total + extra && total + extra > 0)
        paymentStatus = "Settled";
      else if (finalPaid > 0) paymentStatus = "Partial";

      stmt.run(total, finalPaid, middle, extra, paymentStatus, id);

      // 3. Log to Safe if there's a new payment
      if (newPayment > 0) {
        const safeStmt = db.prepare(
          "INSERT INTO safe (transaction_type, amount, category, related_id, description, performed_by_id) VALUES (?, ?, ?, ?, ?, ?)",
        );
        safeStmt.run(
          "Income",
          newPayment,
          "دفعة عميل",
          id,
          `دفعة إضافية للمشروع #${id}: ${task.title}`,
          performed_by_id,
        );

        // 4. Add to task_payments table
        const paymentStmt = db.prepare(
          "INSERT INTO task_payments (task_id, amount, note, payment_date, performed_by_id) VALUES (?, ?, ?, ?, ?)",
        );
        paymentStmt.run(
          id,
          newPayment,
          "دفعة إضافية",
          new Date().toISOString(),
          performed_by_id,
        );
      }

      return { success: true, finalPaid };
    });

    const result = updateFinancials();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTask = (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, delivery_due_date } = req.body;

  try {
    const stmt = db.prepare(`
      UPDATE tasks 
      SET title = ?, description = ?, delivery_due_date = ? 
      WHERE id = ?
    `);
    const result = stmt.run(title, description, delivery_due_date, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
export const deleteTask = (req: Request, res: Response) => {
  const { id } = req.params;

  const deleteOp = db.transaction(() => {
    // 1. Get task info for rollback
    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as any;
    if (!task) throw new Error("Task not found");

    // 2. Rollback payments from safe if any
    if (task.deposit_paid > 0) {
      const { performed_by_id } = req.body;
      db.prepare(
        `
        INSERT INTO safe (transaction_type, amount, category, related_id, description, performed_by_id)
        VALUES ('Expense', ?, 'Refund', ?, ?, ?)
      `,
      ).run(
        task.deposit_paid,
        task.id,
        `إلغاء مشروع: ${task.title} (استرداد مقدم)`,
        performed_by_id,
      );
    }

    // 3. Delete subtasks
    db.prepare("DELETE FROM subtasks WHERE task_id = ?").run(id);

    // 4. Delete task
    db.prepare("DELETE FROM tasks WHERE id = ?").run(id);

    return { success: true };
  });

  try {
    const result = deleteOp();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Get payment history for a task
export const getTaskPayments = (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const payments = db
      .prepare(
        `
        SELECT task_payments.*, users.username as performed_by_name 
        FROM task_payments 
        LEFT JOIN users ON task_payments.performed_by_id = users.id 
        WHERE task_id = ? 
        ORDER BY payment_date DESC
      `,
      )
      .all(id);
    res.json(payments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Add a new payment for a task
export const addTaskPayment = (req: Request, res: Response) => {
  const { id } = req.params;
  const { amount, note, payment_date, performed_by_id } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Valid amount is required" });
  }

  const addPayment = db.transaction(() => {
    // 1. Get task info
    const task: any = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
    if (!task) throw new Error("Task not found");

    // 2. Insert payment record
    const paymentStmt = db.prepare(
      "INSERT INTO task_payments (task_id, amount, note, payment_date, performed_by_id) VALUES (?, ?, ?, ?, ?)",
    );
    const paymentDate = payment_date || new Date().toISOString();
    paymentStmt.run(id, amount, note || "", paymentDate, performed_by_id);

    // 3. Update task deposit_paid
    const newTotal = task.deposit_paid + parseFloat(amount);
    const totalCost = task.total_agreed_price + (task.extra_costs || 0);

    let paymentStatus = "Unpaid";
    if (newTotal >= totalCost && totalCost > 0) paymentStatus = "Settled";
    else if (newTotal > 0) paymentStatus = "Partial";

    db.prepare(
      "UPDATE tasks SET deposit_paid = ?, final_payment_status = ? WHERE id = ?",
    ).run(newTotal, paymentStatus, id);

    // 4. Add to safe
    const safeStmt = db.prepare(
      "INSERT INTO safe (transaction_type, amount, category, related_id, description, date, performed_by_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
    );
    safeStmt.run(
      "Income",
      amount,
      "دفعة عميل",
      id,
      note || `دفعة للمشروع #${id}: ${task.title}`,
      paymentDate,
      performed_by_id,
    );

    // 5. Explicitly add performed_by_id to task_payments (already handled in step 2 but let's be sure the logic is clear)
    // Actually the statement in step 2 (line 401-405) needs to be updated to include performed_by_id
    // I'll redo the addTaskPayment chunk properly
    return { success: true };
  });

  try {
    const result = addPayment();
    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
