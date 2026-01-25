import { useState, useEffect } from "react";

export interface Transaction {
  id: number;
  transaction_type: "Income" | "Expense";
  amount: number;
  category: string;
  related_id?: number;
  description?: string;
  date: string;
  performed_by_name?: string;
  performed_by_id?: number;
}

export const useSafe = () => {
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSafeData();
  }, []);

  const fetchSafeData = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:3000/api/safe");
      if (!response.ok) {
        throw new Error("Failed to fetch safe data");
      }
      const data = await response.json();
      setBalance(data.balance);
      setHistory(data.history);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (
    transaction: Omit<Transaction, "id" | "date">,
  ) => {
    try {
      const response = await fetch("http://localhost:3000/api/transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transaction),
      });
      if (!response.ok) {
        throw new Error("Failed to add transaction");
      }
      await fetchSafeData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return {
    balance,
    history,
    loading,
    error,
    refetch: fetchSafeData,
    addTransaction,
  };
};
