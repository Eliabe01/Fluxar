"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  UtensilsCrossed,
  Car,
  Home,
  ShoppingCart,
  Landmark,
  ReceiptText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import type { Transaction } from "@/services/transactions";
import { useAuth } from "@/lib/auth";

const categoryIcons: { [key: string]: React.ElementType } = {
  food: UtensilsCrossed,
  transport: Car,
  housing: Home,
  shopping: ShoppingCart,
  salary: Landmark,
  bills: ReceiptText,
};

export function RecentTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    };

    const q = query(collection(db, "users", user.uid, "transactions"), orderBy("date", "desc"), limit(5));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const transactionsData: Transaction[] = [];
      querySnapshot.forEach((doc) => {
        transactionsData.push({ id: doc.id, ...doc.data() } as Transaction);
      });
      setTransactions(transactionsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching transactions: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const formatDate = (date: any) => {
    if (!date) return '';
    if (date instanceof Timestamp) {
      return date.toDate().toLocaleDateString('pt-BR');
    }
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transações Recentes</CardTitle>
        <CardDescription>Suas últimas 5 atividades financeiras.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="ml-4 space-y-2">
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-4 w-[100px]" />
                </div>
                <Skeleton className="ml-auto h-4 w-[60px]" />
              </div>
            ))
          ) : transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma transação encontrada.</p>
          ) : (
            transactions.map((t) => {
              const Icon = categoryIcons[t.category] || UtensilsCrossed;
              const amountColor =
                t.type === "income" ? "text-success" : "text-destructive";
              const amountPrefix = t.type === "income" ? "+" : "-";
              return (
                <div key={t.id} className="flex items-center">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {t.description}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(t.date)}
                    </p>
                  </div>
                  <div className={cn("ml-auto font-medium", amountColor)}>
                    {`${amountPrefix}R$ ${t.amount.toFixed(2)}`}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
