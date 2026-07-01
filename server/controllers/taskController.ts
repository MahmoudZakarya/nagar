import { Request, Response } from "express";
import db from "../db";

const DEFAULT_SUBTASKS = [
  "وصول الخشب",
  "مرحله التقطيع",
  "لصق شريط",
  "تجميع",
  "دهانات",
  "مرحله الجوده",
  "التغليف",
  "جاهز للتسليم",
];

export const createTask = async (req: Request, res: Response) => {
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

  try {
    const result = await db.transaction(async (tx) => {
      // Determine payment status
      let paymentStatus = "Unpaid";
      if (deposit_paid >= total_agreed_price && total_agreed_price > 0)
        paymentStatus = "Settled";
      else if (deposit_paid > 0) paymentStatus = "Partial";

      // 1. Insert Task
      const info = await tx.execute(
        `INSERT INTO tasks (
           client_id, title, description, delivery_due_date, 
           total_agreed_price, deposit_paid, final_payment_status
         ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          client_id,
          title,
          description,
          delivery_due_date,
          total_agreed_price,
          deposit_paid,
          paymentStatus,
        ]
      );
      const taskId = info.lastInsertRowid;

      // 2. Add to Safe if deposit paid
      if (deposit_paid > 0) {
        await tx.execute(
          "INSERT INTO safe (transaction_type, amount, category, related_id, description, performed_by_id) VALUES (?, ?, ?, ?, ?, ?)",
          [
            "Income",
            deposit_paid,
            "دفعة مقدمة",
            taskId,
            `عربون مشروع #${taskId}: ${title}`,
            performed_by_id,
          ]
        );

        // 3. Add to task_payments table
        await tx.execute(
          "INSERT INTO task_payments (task_id, amount, note, payment_date, performed_by_id) VALUES (?, ?, ?, ?, ?)",
          [
            taskId,
            deposit_paid,
            "دفعة مقدمة",
            new Date().toISOString(),
            performed_by_id,
          ]
        );
      }

      // 4. Add default subtasks
      for (const subtask of DEFAULT_SUBTASKS) {
        await tx.execute(
          "INSERT INTO subtasks (task_id, description) VALUES (?, ?)",
          [taskId, subtask]
        );
      }

      return { id: taskId };
    });

    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getTasks = async (req: Request, res: Response) => {
  try {
    // Join with clients to get client name
    const tasks: any[] = await db.query(
      `SELECT tasks.*, clients.name as client_name, clients.phone_1, clients.phone_2 
       FROM tasks 
       JOIN clients ON tasks.client_id = clients.id
       ORDER BY delivery_due_date ASC`
    );

    // Fetch subtasks for each task
    const tasksWithSubtasks = await Promise.all(
      tasks.map(async (task) => {
        const subtasks = await db.query(
          "SELECT * FROM subtasks WHERE task_id = ?",
          [task.id]
        );
        return { ...task, subtasks };
      })
    );

    res.json(tasksWithSubtasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateSubtask = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { is_completed, description } = req.body;

  try {
    let query = "";
    let params: any[] = [];

    if (description !== undefined && is_completed !== undefined) {
      query = "UPDATE subtasks SET description = ?, is_completed = ? WHERE id = ?";
      params = [description, is_completed, id];
    } else if (description !== undefined) {
      query = "UPDATE subtasks SET description = ? WHERE id = ?";
      params = [description, id];
    } else {
      query = "UPDATE subtasks SET is_completed = ? WHERE id = ?";
      params = [is_completed, id];
    }

    const result = await db.execute(query, params);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Subtask not found" });
    }

    // After updating a subtask, we should recalculate the completion percentage of the parent task
    const subtask: any = await db.queryOne(
      "SELECT task_id FROM subtasks WHERE id = ?",
      [id]
    );
    if (subtask) {
      const taskId = subtask.task_id;
      const allSubtasks: any[] = await db.query(
        "SELECT is_completed FROM subtasks WHERE task_id = ?",
        [taskId]
      );

      if (allSubtasks.length > 0) {
        const completedCount = allSubtasks.filter(
          (st) => st.is_completed
        ).length;
        const completionPercent = Math.round(
          (completedCount / allSubtasks.length) * 100
        );

        await db.execute(
          "UPDATE tasks SET completion_percent = ? WHERE id = ?",
          [completionPercent, taskId]
        );
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getTaskById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const task: any = await db.queryOne(
      `SELECT tasks.*, clients.name as client_name, clients.phone_1 
       FROM tasks 
       JOIN clients ON tasks.client_id = clients.id
       WHERE tasks.id = ?`,
      [id]
    );

    if (!task) return res.status(404).json({ error: "Task not found" });

    const subtasks = await db.query(
      "SELECT * FROM subtasks WHERE task_id = ?",
      [id]
    );
    res.json({ ...task, subtasks });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const addSubtask = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { description } = req.body;

  if (!description)
    return res.status(400).json({ error: "Description is required" });

  try {
    await db.execute(
      "INSERT INTO subtasks (task_id, description) VALUES (?, ?)",
      [id, description]
    );

    // Recalculate percent
    const allSubtasks: any[] = await db.query(
      "SELECT is_completed FROM subtasks WHERE task_id = ?",
      [id]
    );
    const completedCount = allSubtasks.filter((st) => st.is_completed).length;
    const completionPercent = Math.round(
      (completedCount / allSubtasks.length) * 100
    );
    await db.execute("UPDATE tasks SET completion_percent = ? WHERE id = ?", [
      completionPercent,
      id,
    ]);

    res.status(201).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteSubtask = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Get task_id before deleting to recalculate percent
    const subtask: any = await db.queryOne(
      "SELECT task_id FROM subtasks WHERE id = ?",
      [id]
    );

    if (!subtask) {
      return res.status(404).json({ error: "Subtask not found" });
    }

    const taskId = subtask.task_id;

    await db.execute("DELETE FROM subtasks WHERE id = ?", [id]);

    // Recalculate percent
    const allSubtasks: any[] = await db.query(
      "SELECT is_completed FROM subtasks WHERE task_id = ?",
      [taskId]
    );

    let completionPercent = 0;
    if (allSubtasks.length > 0) {
      const completedCount = allSubtasks.filter((st) => st.is_completed).length;
      completionPercent = Math.round(
        (completedCount / allSubtasks.length) * 100
      );
    }

    await db.execute("UPDATE tasks SET completion_percent = ? WHERE id = ?", [
      completionPercent,
      taskId,
    ]);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTaskStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await db.execute("UPDATE tasks SET status = ? WHERE id = ?", [status, id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTaskFinancials = async (req: Request, res: Response) => {
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
    const result = await db.transaction(async (tx) => {
      // 1. Get current task state
      const task: any = await tx.queryOne("SELECT * FROM tasks WHERE id = ?", [
        id,
      ]);
      if (!task) throw new Error("Task not found");

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

      // 2. Update financials
      await tx.execute(
        `UPDATE tasks SET 
          total_agreed_price = ?, 
          deposit_paid = ?, 
          middle_payment_agreed = ?, 
          extra_costs = ?,
          final_payment_status = ?
        WHERE id = ?`,
        [total, finalPaid, middle, extra, paymentStatus, id]
      );

      // 3. Log to Safe if there's a new payment
      if (newPayment > 0) {
        await tx.execute(
          "INSERT INTO safe (transaction_type, amount, category, related_id, description, performed_by_id) VALUES (?, ?, ?, ?, ?, ?)",
          [
            "Income",
            newPayment,
            "دفعة عميل",
            id,
            `دفعة إضافية للمشروع #${id}: ${task.title}`,
            performed_by_id,
          ]
        );

        // 4. Add to task_payments table
        await tx.execute(
          "INSERT INTO task_payments (task_id, amount, note, payment_date, performed_by_id) VALUES (?, ?, ?, ?, ?)",
          [
            id,
            newPayment,
            "دفعة إضافية",
            new Date().toISOString(),
            performed_by_id,
          ]
        );
      }

      return { success: true, finalPaid };
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, delivery_due_date } = req.body;

  try {
    const result = await db.execute(
      `UPDATE tasks 
       SET title = ?, description = ?, delivery_due_date = ? 
       WHERE id = ?`,
      [title, description, delivery_due_date, id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Get task info for rollback
      const task = (await tx.queryOne(
        "SELECT * FROM tasks WHERE id = ?",
        [id]
      )) as any;
      if (!task) throw new Error("Task not found");

      // 2. Rollback payments from safe if any
      if (task.deposit_paid > 0) {
        const { performed_by_id } = req.body;
        await tx.execute(
          `INSERT INTO safe (transaction_type, amount, category, related_id, description, performed_by_id)
           VALUES ('Expense', ?, 'Refund', ?, ?, ?)`,
          [
            task.deposit_paid,
            task.id,
            `إلغاء مشروع: ${task.title} (استرداد مقدم)`,
            performed_by_id,
          ]
        );
      }

      // 3. Delete subtasks
      await tx.execute("DELETE FROM subtasks WHERE task_id = ?", [id]);

      // 4. Delete task
      await tx.execute("DELETE FROM tasks WHERE id = ?", [id]);

      return { success: true };
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Get payment history for a task
export const getTaskPayments = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const payments = await db.query(
      `SELECT task_payments.*, users.username as performed_by_name 
       FROM task_payments 
       LEFT JOIN users ON task_payments.performed_by_id = users.id 
       WHERE task_id = ? 
       ORDER BY payment_date DESC`,
      [id]
    );
    res.json(payments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Add a new payment for a task
export const addTaskPayment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { amount, note, payment_date, performed_by_id } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Valid amount is required" });
  }

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Get task info
      const task: any = await tx.queryOne(
        "SELECT * FROM tasks WHERE id = ?",
        [id]
      );
      if (!task) throw new Error("Task not found");

      // 2. Insert payment record
      const paymentDate = payment_date || new Date().toISOString();
      await tx.execute(
        "INSERT INTO task_payments (task_id, amount, note, payment_date, performed_by_id) VALUES (?, ?, ?, ?, ?)",
        [id, amount, note || "", paymentDate, performed_by_id]
      );

      // 3. Update task deposit_paid
      const newTotal = task.deposit_paid + parseFloat(amount);
      const totalCost = task.total_agreed_price + (task.extra_costs || 0);

      let paymentStatus = "Unpaid";
      if (newTotal >= totalCost && totalCost > 0) paymentStatus = "Settled";
      else if (newTotal > 0) paymentStatus = "Partial";

      await tx.execute(
        "UPDATE tasks SET deposit_paid = ?, final_payment_status = ? WHERE id = ?",
        [newTotal, paymentStatus, id]
      );

      // 4. Add to safe
      await tx.execute(
        "INSERT INTO safe (transaction_type, amount, category, related_id, description, date, performed_by_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          "Income",
          amount,
          "دفعة عميل",
          id,
          note || `دفعة للمشروع #${id}: ${task.title}`,
          paymentDate,
          performed_by_id,
        ]
      );

      return { success: true };
    });

    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
