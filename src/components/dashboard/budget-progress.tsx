"use client";

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';
import { getBudgets, type Budget } from '@/services/budgets';
import { getTransactionsForMonth } from '@/services/transactions';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import Link from 'next/link';

const expenseCategories: { [key: string]: string } = {
  food: 'Alimentação',
  transport: 'Transporte',
  shopping: 'Compras',
  housing: 'Moradia',
  bills: 'Contas e Serviços',
  leisure: 'Lazer',
  health: 'Saúde',
  education: 'Educação',
  other: 'Outros'
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export function BudgetProgress() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [spentAmounts, setSpentAmounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const currentMonth = useMemo(() => format(new Date(), 'yyyy-MM'), []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const unsubscribeBudgets = getBudgets(user.uid, currentMonth, (data) => {
      setBudgets(data);
      setLoading(false);
    });

    const unsubscribeTransactions = getTransactionsForMonth(user.uid, currentMonth, (transactions) => {
        const spent: Record<string, number> = {};
        transactions.forEach(t => {
          spent[t.category] = (spent[t.category] || 0) + t.amount;
        });
        setSpentAmounts(spent);
    });

    return () => {
        unsubscribeBudgets();
        unsubscribeTransactions();
    };
  }, [user, currentMonth]);


  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Andamento dos Orçamentos</CardTitle>
        <CardDescription>Seus limites de gastos para este mês.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
             <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
             </div>
        ) : budgets.length === 0 ? (
          <div className="flex h-full min-h-[120px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 p-4 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Nenhum orçamento definido para este mês.
            </p>
            <Button asChild>
                <Link href="/budgets">Criar Orçamento</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {budgets.slice(0, 3).map((budget) => { // Show max 3 budgets on dashboard
              const spent = spentAmounts[budget.category] || 0;
              const progress = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
              return (
                <div key={budget.id}>
                  <div className="mb-2 flex justify-between">
                    <span className="text-sm font-medium">{expenseCategories[budget.category] || budget.category}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(spent)} / {formatCurrency(budget.amount)}
                    </span>
                  </div>
                  <Progress value={progress} />
                </div>
              );
            })}
             {budgets.length > 3 && (
                <Button variant="link" asChild className="p-0 h-auto">
                    <Link href="/budgets">Ver todos os orçamentos</Link>
                </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
