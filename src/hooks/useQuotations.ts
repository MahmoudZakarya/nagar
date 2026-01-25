import { useState, useCallback } from "react";

export interface QuotationItem {
  id?: number;
  quotation_id?: number;
  item_name: string;
  description: string;
  image_path?: string;
  meter_price: number;
  unit_price: number;
  quantity: number;
  row_total: number;
  sort_order: number;
}

export interface Quotation {
  id: number;
  client_id: number;
  quotation_number: string;
  created_at: string;
  updated_at: string;
  total_amount: number;
  discount: number;
  status: "Draft" | "Sent" | "Accepted" | "Rejected";
  items?: QuotationItem[];
}

export const useQuotations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getQuotationsByClient = useCallback(async (clientId: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/api/quotations/client/${clientId}`,
      );
      if (!response.ok) throw new Error("Failed to fetch quotations");
      return (await response.json()) as Quotation[];
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getQuotationById = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/api/quotations/${id}`,
      );
      if (!response.ok) throw new Error("Failed to fetch quotation");
      return (await response.json()) as Quotation;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createQuotation = async (
    quotation: Omit<Quotation, "id" | "created_at" | "updated_at">,
  ) => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3000/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quotation),
      });
      if (!response.ok) throw new Error("Failed to create quotation");
      return await response.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateQuotation = async (id: number, quotation: Partial<Quotation>) => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/api/quotations/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(quotation),
        },
      );
      if (!response.ok) throw new Error("Failed to update quotation");
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(
        "http://localhost:3000/api/quotations/upload",
        {
          method: "POST",
          body: formData,
        },
      );
      if (!response.ok) throw new Error("Failed to upload image");
      const data = await response.json();
      return data.filePath;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    loading,
    error,
    getQuotationsByClient,
    getQuotationById,
    createQuotation,
    updateQuotation,
    uploadImage,
  };
};
