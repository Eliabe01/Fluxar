"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, Edit, ArrowLeft, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AddBudgetDialog } from "@/components/add-budget-dialog";
import { getBudgets, deleteBudget, type Budget } from '@/services/budgets';
import { getTransactionsForMonth } from '@/services/transactions';
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

export default function BudgetsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [spentAmounts, setSpentAmounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const currentMonth = useMemo(() => format(currentDate, 'yyyy-MM'), [currentDate]);
  const displayMonth = useMemo(() => format(currentDate, 'MMMM yyyy', { locale: ptBR }), [currentDate]);

  const fetchBudgetData = () => {
    if (!user) return;

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
  }

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    }
    const unsubscribe = fetchBudgetData();
    return () => unsubscribe?.();
  }, [user, currentMonth]);

  const handleDelete = async (budgetId: string) => {
    if (!user) return;
    try {
      await deleteBudget(user.uid, budgetId);
      toast({
        title: "Sucesso!",
        description: "Orçamento removido com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível remover o orçamento.",
      });
    }
  };

  const changeMonth = (amount: number) => {
    setCurrentDate(current => addMonths(current, amount));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle>Orçamentos</CardTitle>
            <CardDescription>
              Acompanhe seus limites de gastos por categoria.
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => changeMonth(-1)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="w-36 text-center text-lg font-medium capitalize">{displayMonth}</span>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => changeMonth(1)}>
                    <ArrowRight className="h-4 w-4" />
                </Button>
             </div>
            <AddBudgetDialog month={currentMonth}>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Orçamento
              </Button>
            </AddBudgetDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
           </div>
        ) : budgets.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">Nenhum orçamento definido para {displayMonth}.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {budgets.map((budget) => {
                const spent = spentAmounts[budget.category] || 0;
                const progress = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
                const remaining = budget.amount - spent;

                return (
                    <Card key={budget.id} className="flex flex-col">
                        <CardHeader className="flex-row items-center justify-between pb-2">
                           <CardTitle className="text-base font-medium">{expenseCategories[budget.category] || budget.category}</CardTitle>
                            <div className="flex items-center gap-1">
                                <AddBudgetDialog budget={budget} month={currentMonth}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </AddBudgetDialog>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDelete(budget.id)}>Excluir</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </CardHeader>
                        <CardContent className="flex flex-1 flex-col justify-end">
                            <div className="space-y-2">
                                <Progress value={progress} />
                                <div className="text-sm">
                                    <span className="font-semibold">{formatCurrency(spent)}</span>
                                    <span className="text-muted-foreground"> de {formatCurrency(budget.amount)}</span>
                                </div>
                                <p className={`text-xs ${remaining < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                    {remaining >= 0 ? `${formatCurrency(remaining)} restantes` : `${formatCurrency(Math.abs(remaining))} acima do limite`}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
