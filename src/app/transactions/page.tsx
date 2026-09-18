"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AddTransactionDialog } from "@/components/add-transaction-dialog";
import { getTransactions, deleteTransaction, type Transaction } from '@/services/transactions';
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
import { cn } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const categoryLabels: { [key: string]: string } = {
  food: 'Alimentação',
  transport: 'Transporte',
  shopping: 'Compras',
  housing: 'Moradia',
  bills: 'Contas e Serviços',
  leisure: 'Lazer',
  health: 'Saúde',
  education: 'Educação',
  salary: 'Salário',
  investment: 'Investimentos',
  gift: 'Presente',
  extra: 'Renda Extra',
  other: 'Outros'
};

export default function TransactionsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = getTransactions(user.uid, (data) => {
      setTransactions(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (transactionId: string) => {
    if (!user) return;
    try {
      await deleteTransaction(user.uid, transactionId);
      toast({
        title: "Sucesso!",
        description: "Transação removida com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível remover a transação.",
      });
    }
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };
  
  const formatDate = (date: any) => {
    if (!date) return '';
    const d = date instanceof Timestamp ? date.toDate() : new Date(date);
    return format(d, "dd/MM/yyyy", { locale: ptBR });
  };

  const formatTime = (date: any) => {
    if (!date) return '';
    const d = date instanceof Timestamp ? date.toDate() : new Date(date);
    return format(d, "HH:mm", { locale: ptBR });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle>Gastos Diários</CardTitle>
            <CardDescription>
              Gerencie todas as suas receitas e despesas.
            </CardDescription>
          </div>
          <AddTransactionDialog>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Transação
            </Button>
          </AddTransactionDialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">Nenhuma transação cadastrada.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(
              transactions.reduce((groups, transaction) => {
                const dateKey = formatDate(transaction.date);
                if (!groups[dateKey]) groups[dateKey] = [];
                groups[dateKey].push(transaction);
                return groups;
              }, {} as Record<string, typeof transactions>)
            ).map(([date, dailyTransactions]) => {
              
              // Verifica se a data é hoje ou ontem para mostrar label amigável
              let dateLabel = date;
              const today = format(new Date(), "dd/MM/yyyy", { locale: ptBR });
              const yesterdayDate = new Date();
              yesterdayDate.setDate(yesterdayDate.getDate() - 1);
              const yesterday = format(yesterdayDate, "dd/MM/yyyy", { locale: ptBR });
              
              if (date === today) dateLabel = "Hoje";
              else if (date === yesterday) dateLabel = "Ontem";
              else {
                  // Converte "25/09/2026" para "25 de set"
                  const [d, m] = date.split('/');
                  const monthNames = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
                  dateLabel = `${d} de ${monthNames[parseInt(m) - 1]}`;
              }

              return (
                <div key={date} className="space-y-4">
                  <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase sticky top-[64px] bg-background/95 backdrop-blur z-10 py-2 border-b border-border/40">
                    {dateLabel}
                  </h3>
                  <div className="space-y-3 px-1">
                    {dailyTransactions.map((transaction) => {
                        const isIncome = transaction.type === "income";
                        
                        // Ícones simples para categorias
                        const iconMap: Record<string, string> = {
                            food: "🍔", transport: "🚗", shopping: "🛍️", housing: "🏠", 
                            bills: "🧾", leisure: "🍿", health: "💊", education: "📚", 
                            salary: "💰", investment: "📈", gift: "🎁", extra: "✨", other: "📌"
                        };
                        const icon = iconMap[transaction.category] || "📌";

                        return (
                          <div key={transaction.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-secondary/40 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-xl shrink-0 shadow-sm border border-border/50">
                                    {icon}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-foreground text-[15px]">{transaction.description}</span>
                                    <span className="text-xs text-muted-foreground">{categoryLabels[transaction.category] || transaction.category} • {formatTime(transaction.date)}</span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <span className={cn("font-bold", isIncome ? "text-success" : "text-foreground")}>
                                    {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
                                </span>
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                        <span className="sr-only">Excluir</span>
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                      <AlertDialogDescription>Essa ação excluirá permanentemente esta transação.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDelete(transaction.id)}>
                                        Excluir
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                            </div>
                          </div>
                        );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
