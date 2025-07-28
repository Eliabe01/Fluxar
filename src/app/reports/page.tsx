"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from '@/components/dashboard/stat-card';
import { ExpenseBreakdownChart } from '@/components/reports/expense-breakdown-chart';
import { TransactionList } from '@/components/reports/transaction-list';
import { getTransactionsForPeriod, type Transaction } from '@/services/transactions';
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export default function ReportsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const displayMonth = useMemo(() => format(currentDate, 'MMMM yyyy', { locale: ptBR }), [currentDate]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const startDate = startOfMonth(currentDate);
    const endDate = endOfMonth(currentDate);

    const unsubscribe = getTransactionsForPeriod(user.uid, startDate, endDate, (data) => {
      setTransactions(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, currentDate]);

  const { totalIncome, totalExpenses, balance, expensesByCategory } = useMemo(() => {
    let income = 0;
    let expenses = 0;
    const byCategory: { [key: string]: number } = {};

    transactions.forEach(t => {
      if (t.type === 'income') {
        income += t.amount;
      } else {
        expenses += t.amount;
        byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
      }
    });

    const expensesData = Object.entries(byCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return {
      totalIncome: income,
      totalExpenses: expenses,
      balance: income - expenses,
      expensesByCategory: expensesData,
    };
  }, [transactions]);

  const changeMonth = (amount: number) => {
    setCurrentDate(current => addMonths(current, amount));
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle>Relatórios Financeiros</CardTitle>
              <CardDescription>
                Analise suas finanças para o mês selecionado.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => changeMonth(-1)}>
                  <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="w-36 text-center text-lg font-medium capitalize">{displayMonth}</span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => changeMonth(1)}>
                  <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Receitas no Mês"
          value={formatCurrency(totalIncome)}
          icon="trending-up"
          loading={loading}
          valueClassName="text-success"
        />
        <StatCard
          title="Despesas no Mês"
          value={formatCurrency(totalExpenses)}
          icon="trending-down"
          loading={loading}
          valueClassName="text-destructive"
        />
        <StatCard
          title="Saldo do Mês"
          value={formatCurrency(balance)}
          icon="wallet"
          loading={loading}
          valueClassName={cn(balance > 0 && "text-success", balance < 0 && "text-destructive")}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
            <ExpenseBreakdownChart data={expensesByCategory} loading={loading} />
        </div>
        <div className="lg:col-span-3">
            <TransactionList transactions={transactions} loading={loading} />
        </div>
      </div>
    </div>
  );
}
