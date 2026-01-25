import { useState, useEffect } from "react";
import API_URL from "../config/api";

export interface Purchase {
  id: number;
  supplier_name?: string;
  item_name: string;
  quantity: number;
  price_per_unit: number;
  total_cost: number;
  discount_received: number;
  amount_paid_now: number;
  amount_remaining: number;
  date: string;
}

export const usePurchases = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/purchases`);
      if (!response.ok) {
        throw new Error("Failed to fetch purchases");
      }
      const data = await response.json();
      setPurchases(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addPurchase = async (
    purchase: Omit<Purchase, "id" | "date" | "amount_remaining">,
    performed_by_id?: number,
  ) => {
    try {
      const response = await fetch(`${API_URL}/api/purchases`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...purchase, performed_by_id }),
      });
      if (!response.ok) {
        throw new Error("Failed to add purchase");
      }
      await fetchPurchases();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updatePurchasePayment = async (
    id: number,
    paymentAmount: number,
    performed_by_id?: number,
  ) => {
    try {
      const response = await fetch(`${API_URL}/api/purchases/${id}/payment`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payment_amount: paymentAmount,
          performed_by_id,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to update purchase payment");
      }
      await fetchPurchases();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deletePurchase = async (id: number, performed_by_id?: number) => {
    try {
      const response = await fetch(`${API_URL}/api/purchases/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ performed_by_id }),
      });
      if (!response.ok) throw new Error("Failed to delete purchase");
      await fetchPurchases();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return {
    purchases,
    loading,
    error,
    refetch: fetchPurchases,
    addPurchase,
    updatePurchasePayment,
    deletePurchase,
  };
};
