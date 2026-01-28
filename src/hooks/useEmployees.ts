import { useState, useEffect } from "react";
import API_URL from "../config/api";

export interface Employee {
  id: number;
  name: string;
  age: number;
  role: string;
  hourly_rate: number;
  start_date: string;
  status: "Active" | "Inactive" | "On Leave";
  national_id?: string;
  address?: string;
  phone_1?: string;
  phone_2?: string;
  relative_name?: string;
  relative_phone?: string;
  relative_relation?: string;
}

export interface Attendance {
  id: number;
  employee_id: number;
  date: string;
  check_in: string | null;
  check_out: string | null;
  unpaid_break_minutes: number;
  total_hours: number;
  calculated_pay: number;
  current_break_start: string | null;
}

export interface Payroll {
  id: number;
  employee_id: number;
  amount_paid: number;
  payment_date: string;
  period_start: string;
  period_end: string;
  performed_by_id?: number;
}

export interface Leave {
  id: number;
  employee_id: number;
  type: "Sick" | "Vacation" | "Weekend" | "Unpaid";
  start_date: string;
  end_date: string;
  is_paid: boolean;
}

export interface Deduction {
  id: number;
  employee_id: number;
  amount: number;
  reason: string;
  date: string;
}

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/employees`);
      if (!response.ok) throw new Error("Failed to fetch employees");
      const data = await response.json();
      setEmployees(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addEmployee = async (employee: Partial<Employee>) => {
    try {
      const response = await fetch(`${API_URL}/api/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employee),
      });
      if (!response.ok) throw new Error("Failed to add employee");
      await fetchEmployees();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateEmployee = async (id: number, updates: Partial<Employee>) => {
    try {
      const response = await fetch(`${API_URL}/api/employees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update employee");
      await fetchEmployees();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteEmployee = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/api/employees/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete employee");
      await fetchEmployees();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return {
    employees,
    loading,
    error,
    refetch: fetchEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
  };
};

export const useAttendance = (employeeId?: number) => {
  const [history, setHistory] = useState<Attendance[]>([]);
  const [payroll, setPayroll] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async (id: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/attendance/${id}`);
      const data = await response.json();
      setHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayroll = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/api/payroll/${id}`);
      const data = await response.json();
      setPayroll(data);
    } catch (err) {
      console.error(err);
    }
  };

  const checkIn = async (employee_id: number, check_in: string) => {
    await fetch(`${API_URL}/api/attendance/check-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employee_id,
        date: new Date().toISOString().split("T")[0],
        check_in,
      }),
    });
  };

  const checkOut = async (
    id: number,
    check_out: string,
    unpaid_break_minutes: number,
  ) => {
    await fetch(`${API_URL}/api/attendance/${id}/check-out`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ check_out, unpaid_break_minutes }),
    });
  };

  const startBreak = async (attendanceId: number, break_start: string) => {
    await fetch(`${API_URL}/api/attendance/${attendanceId}/break-start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ break_start }),
    });
  };

  const endBreak = async (attendanceId: number, break_end: string) => {
    await fetch(`${API_URL}/api/attendance/${attendanceId}/break-end`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ break_end }),
    });
  };

  const paySalary = async (
    employee_id: number,
    amount: number,
    period_start: string,
    period_end: string,
    performed_by_id?: number,
  ) => {
    await fetch(`${API_URL}/api/payroll/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employee_id,
        amount,
        period_start,
        period_end,
        performed_by_id,
      }),
    });
  };

  const logManualAttendance = async (data: any) => {
    await fetch(`${API_URL}/api/attendance/manual`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  };

  const updateAttendanceRecord = async (id: number, data: any) => {
    await fetch(`${API_URL}/api/attendance/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  };

  return {
    history,
    payroll,
    loading,
    fetchHistory,
    fetchPayroll,
    checkIn,
    checkOut,
    startBreak,
    endBreak,
    paySalary,
    logManualAttendance,
    updateAttendanceRecord,
  };
};

export const useLeaves = (employeeId?: number) => {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLeaves = async (id: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/leaves/${id}`);
      const data = await response.json();
      setLeaves(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addLeave = async (leave: Partial<Leave>) => {
    await fetch(`${API_URL}/api/leaves`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leave),
    });
  };

  const removeLeave = async (id: number) => {
    await fetch(`${API_URL}/api/leaves/${id}`, {
      method: "DELETE",
    });
  };

  return { leaves, loading, fetchLeaves, addLeave, removeLeave };
};

export const useDeductions = (employeeId?: number) => {
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDeductions = async (id: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/deductions/${id}`);
      const data = await response.json();
      setDeductions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addDeduction = async (deduction: Partial<Deduction>) => {
    await fetch(`${API_URL}/api/deductions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(deduction),
    });
  };

  const removeDeduction = async (id: number) => {
    await fetch(`${API_URL}/api/deductions/${id}`, {
      method: "DELETE",
    });
  };

  return {
    deductions,
    loading,
    fetchDeductions,
    addDeduction,
    removeDeduction,
  };
};
