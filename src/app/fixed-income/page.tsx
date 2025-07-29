
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
import { AddFixedIncomeDialog } from "@/components/add-fixed-income-dialog";
import { getFixedIncomes, deleteFixedIncome, FixedIncome } from '@/services/fixed-income';
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
} from "@/components/ui/alert-dialog"

export default function FixedIncomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fixedIncomes, setFixedIncomes] = useState<FixedIncome[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = getFixedIncomes(user.uid, (incomes) => {
      setFixedIncomes(incomes);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (incomeId: string) => {
    if (!user) return;
    try {
      await deleteFixedIncome(user.uid, incomeId);
      toast({
        title: "Sucesso!",
        description: "Ganho fixo removido com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível remover o ganho fixo.",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };
  
  const frequencyLabels: Record<string, string> = {
    monthly: 'Mensal',
    fortnightly: 'Quinzenal'
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle>Ganhos Fixos</CardTitle>
            <CardDescription>
              Gerencie seus ganhos recorrentes, como salários e aluguéis.
            </CardDescription>
          </div>
          <AddFixedIncomeDialog>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Ganho
            </Button>
          </AddFixedIncomeDialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : fixedIncomes.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">Nenhum ganho fixo cadastrado.</p>
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Frequência</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fixedIncomes.map((income) => (
                  <TableRow key={income.id}>
                    <TableCell className="font-medium">{income.description}</TableCell>
                    <TableCell>{frequencyLabels[income.frequency] || 'N/A'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(income.amount)}</TableCell>
                    <TableCell className="text-right">
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                             <span className="sr-only">Excluir</span>
                             <Trash2 className="h-4 w-4" />
                           </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Essa ação não pode ser desfeita. Isso excluirá permanentemente este ganho fixo.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive hover:bg-destructive/90"
                              onClick={() => handleDelete(income.id)}>
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
