import express from "express";
import {
  login,
  register,
  getAllUsers,
  changePassword,
  updateUser,
} from "../controllers/authController";
import {
  getClients,
  createClient,
  updateClient,
} from "../controllers/clientController";
import {
  createTask,
  getTasks,
  updateSubtask,
  getTaskById,
  addSubtask,
  updateTaskStatus,
  updateTaskFinancials,
  updateTask,
  deleteTask,
  getTaskPayments,
  addTaskPayment,
} from "../controllers/taskController";
import {
  addTransaction,
  getSafeHistory,
} from "../controllers/transactionController";
import {
  getPurchases,
  createPurchase,
  updatePurchasePayment,
  deletePurchase,
} from "../controllers/purchaseController";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../controllers/employeeController";
import {
  checkIn,
  checkOut,
  getAttendanceByEmployee,
  logManualAttendance,
  paySalary,
} from "../controllers/attendanceController";
import {
  getLeaves,
  createLeave,
  deleteLeave,
} from "../controllers/leaveController";
import {
  getDeductions,
  createDeduction,
  deleteDeduction,
} from "../controllers/deductionController";
import {
  createQuotation,
  getQuotationsByClient,
  getQuotationById,
  updateQuotation,
  uploadImage,
  upload,
} from "../controllers/quotationController";
import {
  triggerBackup,
  getBackupStatus,
  getBackupList,
  restoreBackup,
} from "../controllers/backupController";
import {
  getGCSSettings,
  updateGCSSettings,
  uploadServiceAccountKey,
  testGCSConnection,
  clearGCSSettings,
} from "../controllers/settingsController";
import multer from "multer";

const router = express.Router();

// Auth
router.post("/auth/login", login);
router.post("/auth/register", register);
router.get("/users", getAllUsers);
router.post("/auth/change-password/:id", changePassword);
router.patch("/users/:id", updateUser);

// Clients
router.get("/clients", getClients);
router.post("/clients", createClient);
router.patch("/clients/:id", updateClient);

// Tasks
router.get("/tasks", getTasks);
router.post("/tasks", createTask);
router.get("/tasks/:id", getTaskById);
router.patch("/tasks/:id", updateTask);
router.post("/tasks/:id/subtasks", addSubtask);
router.patch("/tasks/:id/status", updateTaskStatus);
router.patch("/tasks/:id/financials", updateTaskFinancials);
router.get("/tasks/:id/payments", getTaskPayments);
router.post("/tasks/:id/payments", addTaskPayment);
router.delete("/tasks/:id", deleteTask);
router.patch("/subtasks/:id", updateSubtask);

// Safe / Transactions
router.get("/safe", getSafeHistory);
router.post("/transaction", addTransaction);

// Purchases
router.get("/purchases", getPurchases);
router.post("/purchases", createPurchase);
router.patch("/purchases/:id/payment", updatePurchasePayment);
router.delete("/purchases/:id", deletePurchase);

// Employees
router.get("/employees", getEmployees);
router.post("/employees", createEmployee);
router.patch("/employees/:id", updateEmployee);
router.delete("/employees/:id", deleteEmployee);

// Attendance & Payroll
router.get("/attendance/:employee_id", getAttendanceByEmployee);
router.post("/attendance/check-in", checkIn);
router.post("/attendance/manual", logManualAttendance);
router.patch("/attendance/:id/check-out", checkOut);
router.post("/payroll/pay", paySalary);

// Leaves
router.get("/leaves/:employee_id", getLeaves);
router.post("/leaves", createLeave);
router.delete("/leaves/:id", deleteLeave);

// Deductions
router.get("/deductions/:employee_id", getDeductions);
router.post("/deductions", createDeduction);
router.delete("/deductions/:id", deleteDeduction);

// Quotations
router.post("/quotations", createQuotation);
router.get("/quotations/client/:clientId", getQuotationsByClient);
router.get("/quotations/:id", getQuotationById);
router.put("/quotations/:id", updateQuotation);
router.post("/quotations/upload", upload.single("image"), uploadImage);

// Backup (Admin only)
router.post("/admin/backup", triggerBackup);
router.get("/admin/backup/status", getBackupStatus);
router.get("/admin/backup/list", getBackupList);
router.post("/admin/backup/restore", restoreBackup);

// GCS Settings (Admin only)
const keyUpload = multer({ storage: multer.memoryStorage() });
router.get("/admin/settings/gcs", getGCSSettings);
router.post("/admin/settings/gcs", updateGCSSettings);
router.post(
  "/admin/settings/gcs/key",
  keyUpload.single("keyFile"),
  uploadServiceAccountKey,
);
router.post("/admin/settings/gcs/test", testGCSConnection);
router.delete("/admin/settings/gcs", clearGCSSettings);

export default router;
