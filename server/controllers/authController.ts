import { Request, Response } from "express";
import db from "../db";
import bcrypt from "bcryptjs";

export const login = (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  try {
    const user: any = db
      .prepare("SELECT * FROM users WHERE username = ?")
      .get(username);

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Since it's a local app, we can just return the user info
    // In a real web app, we'd use JWT
    const { password_hash, ...userInfo } = user;
    res.json(userInfo);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const register = (req: Request, res: Response) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const stmt = db.prepare(
      "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
    );
    const result = stmt.run(username, hashedPassword, role || "user");
    res
      .status(201)
      .json({ id: result.lastInsertRowid, username, role: role || "user" });
  } catch (error: any) {
    if (error.message.includes("UNIQUE constraint failed")) {
      return res.status(400).json({ error: "Username already exists" });
    }
    res.status(500).json({ error: error.message });
  }
};

export const getAllUsers = (req: Request, res: Response) => {
  try {
    const users = db
      .prepare("SELECT id, username, role, status FROM users")
      .all();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const changePassword = (req: Request, res: Response) => {
  const { id } = req.params;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res
      .status(400)
      .json({ error: "الرجاء إدخال كلمة المرور القديمة والجديدة" });
  }

  try {
    const user: any = db.prepare("SELECT * FROM users WHERE id = ?").get(id);

    if (!user) {
      return res.status(404).json({ error: "المستخدم غير موجود" });
    }

    const isMatch = bcrypt.compareSync(oldPassword, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "كلمة المرور القديمة غير صحيحة" });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    const stmt = db.prepare("UPDATE users SET password_hash = ? WHERE id = ?");
    stmt.run(hashedPassword, id);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUser = (req: Request, res: Response) => {
  const { id } = req.params;
  const { password, role, status } = req.body;

  try {
    const updates = [];
    const values = [];

    if (password) {
      updates.push("password_hash = ?");
      values.push(bcrypt.hashSync(password, 10));
    }

    if (role) {
      updates.push("role = ?");
      values.push(role);
    }

    if (status) {
      updates.push("status = ?");
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "لا يوجد بيانات للتحديث" });
    }

    values.push(id);
    const query = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;

    const stmt = db.prepare(query);
    const result = stmt.run(...values);

    if (result.changes === 0) {
      return res.status(404).json({ error: "المستخدم غير موجود" });
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message }); // In production, don't expose error directly
  }
};
