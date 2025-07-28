"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, Timestamp } from "firebase/firestore";
import type { Transaction } from "@/services/transactions";
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
  income: {
    label: "Receita",
    color: "hsl(var(--success))",
  },
  outcome: {
    label: "Despesa",
    color: "hsl(var(--destructive))",
  },
} satisfies ChartConfig;

const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function FinancialReportChart() {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, "users", user.uid, "transactions"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const monthlyData: { [key: string]: { month: string, income: number, outcome: number } } = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
        const monthName = monthNames[d.getMonth()];
        monthlyData[monthKey] = { month: monthName, income: 0, outcome: 0 };
      }

      querySnapshot.forEach((doc) => {
        const transaction = doc.data() as Transaction;
        const transactionDate = transaction.date instanceof Timestamp 
          ? transaction.date.toDate() 
          : new Date(transaction.date);
        
        const monthKey = `${transactionDate.getFullYear()}-${transactionDate.getMonth()}`;

        if (monthlyData[monthKey]) {
            if (transaction.type === 'income') {
              monthlyData[monthKey].income += transaction.amount;
            } else { // 'expense'
              monthlyData[monthKey].outcome += transaction.amount;
            }
        }
      });
      
      setChartData(Object.values(monthlyData));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching chart data: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatório Financeiro</CardTitle>
        <CardDescription>Receitas vs. Despesas (Últimos 6 meses)</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="min-h-[300px] w-full flex items-center justify-center">
            <Skeleton className="h-full w-full" />
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
            <BarChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `R$${Number(value) / 1000}k`}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="income"
                fill="var(--color-income)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="outcome"
                fill="var(--color-outcome)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
