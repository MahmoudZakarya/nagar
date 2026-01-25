import { useState, useEffect } from "react";
import API_URL from "../config/api";
import { Task, Subtask } from "./useTasks";

export interface Payment {
  id: number;
  task_id: number;
  amount: number;
  note: string;
  payment_date: string;
  created_at: string;
  performed_by_name?: string;
  performed_by_id?: number;
}

export const useTask = (id: string | undefined) => {
  const [task, setTask] = useState<Task | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchTask();
      fetchPayments();
    }
  }, [id]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/tasks/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch task");
      }
      const data = await response.json();
      setTask(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await fetch(`${API_URL}/api/tasks/${id}/payments`);
      if (!response.ok) throw new Error("Failed to fetch payments");
      const data = await response.json();
      setPayments(data);
    } catch (err: any) {
      console.error("Error fetching payments:", err);
    }
  };

  const addPayment = async (
    amount: number,
    note: string,
    payment_date: string,
    performed_by_id?: number,
  ) => {
    try {
      const response = await fetch(`${API_URL}/api/tasks/${id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, note, payment_date, performed_by_id }),
      });
      if (!response.ok) throw new Error("Failed to add payment");
      await fetchTask();
      await fetchPayments();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const addSubtask = async (description: string) => {
    try {
      const response = await fetch(`${API_URL}/api/tasks/${id}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      if (!response.ok) throw new Error("Failed to add subtask");
      await fetchTask();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateStatus = async (status: string) => {
    try {
      const response = await fetch(`${API_URL}/api/tasks/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      await fetchTask();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateFinancials = async (data: {
    total_agreed_price?: number;
    deposit_paid?: number;
    extra_costs?: number;
    middle_payment_agreed?: number;
    payment_amount?: number;
    performed_by_id?: number;
  }) => {
    try {
      const response = await fetch(`${API_URL}/api/tasks/${id}/financials`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update financials");
      await fetchTask();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateTask = async (data: {
    title: string;
    description: string;
    delivery_due_date: string;
  }) => {
    try {
      const response = await fetch(`${API_URL}/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update task");
      await fetchTask();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return {
    task,
    payments,
    loading,
    error,
    refetch: fetchTask,
    addSubtask,
    updateStatus,
    updateFinancials,
    updateTask,
    addPayment,
    fetchPayments,
  };
};
