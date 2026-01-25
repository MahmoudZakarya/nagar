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
    const users = db.prepare("SELECT id, username, role FROM users").all();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateRole = (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role) {
    return res.status(400).json({ error: "Role is required" });
  }

  try {
    const stmt = db.prepare("UPDATE users SET role = ? WHERE id = ?");
    const result = stmt.run(role, id);
    if (result.changes === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
