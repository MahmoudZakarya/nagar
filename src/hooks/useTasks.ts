import { useState, useEffect } from "react";
import API_URL from "../config/api";

export interface Subtask {
  id: number;
  task_id: number;
  description: string;
  is_completed: boolean;
}

export interface Task {
  id: number;
  client_id: number;
  client_name?: string;
  phone_1?: string;
  phone_2?: string;
  title: string;
  description?: string;
  status:
    | "Pending"
    | "Postponed"
    | "In Progress"
    | "Ready"
    | "Delivered"
    | "Cancelled";
  completion_percent: number;
  registered_at: string;
  delivery_due_date?: string;
  delivered_at?: string;
  total_agreed_price: number;
  deposit_paid: number;
  middle_payment_agreed: number;
  extra_costs: number;
  final_payment_status: "Unpaid" | "Partial" | "Settled";
  subtasks?: Subtask[];
}

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/tasks`);
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      const data = await response.json();
      setTasks(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateSubtask = async (subtaskId: number, isCompleted: boolean) => {
    try {
      const response = await fetch(`${API_URL}/api/subtasks/${subtaskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_completed: isCompleted ? 1 : 0 }),
      });
      if (!response.ok) {
        throw new Error("Failed to update subtask");
      }
      // Refetch tasks to get updated state
      await fetchTasks();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const addTask = async (task: any, performed_by_id?: number) => {
    try {
      const response = await fetch(`${API_URL}/api/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...task, performed_by_id }),
      });
      if (!response.ok) {
        throw new Error("Failed to add task");
      }
      await fetchTasks();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteTask = async (id: number, performed_by_id?: number) => {
    try {
      const response = await fetch(`${API_URL}/api/tasks/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ performed_by_id }),
      });
      if (!response.ok) throw new Error("Failed to delete task");
      await fetchTasks();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return {
    tasks,
    loading,
    error,
    refetch: fetchTasks,
    updateSubtask,
    addTask,
    deleteTask,
  };
};
