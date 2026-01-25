import { useState, useEffect } from "react";
import API_URL from "../config/api";

export interface Client {
  id: number;
  name: string;
  phone_1: string;
  phone_2?: string;
  address?: string;
  created_at: string;
}

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/clients`);
      if (!response.ok) {
        throw new Error("Failed to fetch clients");
      }
      const data = await response.json();
      setClients(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addClient = async (client: Omit<Client, "id" | "created_at">) => {
    try {
      const response = await fetch(`${API_URL}/api/clients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(client),
      });
      if (!response.ok) {
        throw new Error("Failed to add client");
      }
      await fetchClients();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateClient = async (id: number, client: Partial<Client>) => {
    try {
      const response = await fetch(`${API_URL}/api/clients/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(client),
      });
      if (!response.ok) {
        throw new Error("Failed to update client");
      }
      await fetchClients();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return {
    clients,
    loading,
    error,
    refetch: fetchClients,
    addClient,
    updateClient,
  };
};
