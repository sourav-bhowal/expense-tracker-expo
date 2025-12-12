import { useCallback, useState } from "react";
import { Alert } from "react-native";

export type Transaction = {
  id: string;
  amount: number;
  title: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  description?: string;
  category: string;
  userId: string;
};

const API_URL = "http://192.168.94.193:8000/api/transactions";

export const useTranscations = (userId: string) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<{
    totalIncome: number;
    totalExpense: number;
    balance: number;
  }>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  // fetch transactions from the server
  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(data)
      setTransactions(data.transactions || []);
      setSummary({
        totalIncome: data.totalEarned || 0,
        totalExpense: data.totalSpend || 0,
        balance: data.totalBalance || 0,
      });
    } catch (error) {
      console.error("Error fetching transactions:", error);
      // Set default values on error
      setTransactions([]);
      setSummary({
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
      });
      Alert.alert(
        "Error fetching transactions",
        error instanceof Error ? error.message : "Unknown error"
      );
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // add a new transaction
  const addTransaction = useCallback(
    async (
      transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt" | "userId">
    ) => {
      setIsLoading(true);
      try {
        await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...transaction, userId }),
        });
        fetchTransactions();
      } catch (error) {
        Alert.alert(
          "Error adding transaction:",
          error instanceof Error ? error.message : "Unknown error"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [fetchTransactions, userId]
  );

  // delete a transaction
  const deleteTransaction = useCallback(
    async (id: string) => {
      setIsLoading(true);
      try {
        await fetch(`${API_URL}/${id}/${userId}`, {
          method: "DELETE",
        });
        fetchTransactions();
      } catch (error) {
        Alert.alert(
          "Error deleting transaction:",
          error instanceof Error ? error.message : "Unknown error"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [fetchTransactions, userId]
  );

  return {
    transactions,
    summary,
    isLoading,
    fetchTransactions,
    addTransaction,
    deleteTransaction,
  };
};
