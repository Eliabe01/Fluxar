
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, Calendar as CalendarIcon, Loader2 } from "lucide-react";
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
import { AddFixedExpenseDialog } from "@/components/add-fixed-expense-dialog";
import { getFixedExpenses, deleteFixedExpense, payFixedExpense, payAllFixedExpenses, type FixedExpense } from '@/services/fixed-expenses';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const categoryLabels: { [key: string]: string } = {
  housing: 'Moradia',
  bills: 'Contas e Serviços',
  transport: 'Transporte',
  health: 'Saúde',
  education: 'Educação',
  leisure: 'Lazer',
  other: 'Outros'
};

export default function FixedExpensesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPayingAll, setIsPayingAll] = useState(false);

  const [selectedExpense, setSelectedExpense] = useState<FixedExpense | null>(null);
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [paymentDescription, setPaymentDescription] = useState('');
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());

  const currentMonth = useMemo(() => format(new Date(), 'yyyy-MM'), []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = getFixedExpenses(user.uid, (data) => {
      setFixedExpenses(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const totalDue = useMemo(() => {
    return fixedExpenses
        .filter(expense => expense.lastPaidMonth !== currentMonth)
        .reduce((acc, expense) => acc + expense.amount, 0);
  }, [fixedExpenses, currentMonth]);

  const handleDelete = async (expenseId: string) => {
    if (!user) return;
    try {
      await deleteFixedExpense(user.uid, expenseId);
      toast({
        title: "Sucesso!",
        description: "Despesa fixa removida com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível remover a despesa fixa.",
      });
    }
  };

  const handlePayExpense = async (expense: FixedExpense) => {
    if (!user) return;

    const paymentDetails = {
      description: paymentDescription,
      date: paymentDate
    };

    try {
      await payFixedExpense(user.uid, expense, currentMonth, paymentDetails);
      toast({
        title: "Sucesso!",
        description: `Pagamento de "${expense.description}" registrado.`,
      });
      setIsPayDialogOpen(false);
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível registrar o pagamento.",
      });
    }
  };

  const handlePayAll = async () => {
    if (!user || totalDue <= 0) return;
    setIsPayingAll(true);
    try {
        await payAllFixedExpenses(user.uid, currentMonth);
        toast({
            title: "Sucesso!",
            description: `Todas as despesas fixas pendentes foram pagas.`,
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Erro",
            description: "Não foi possível pagar todas as despesas.",
        });
    } finally {
        setIsPayingAll(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle>Despesas Fixas</CardTitle>
              <CardDescription>
                Gerencie suas despesas recorrentes, como internet e aluguel.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" disabled={totalDue <= 0 || isPayingAll}>
                            {isPayingAll && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Pagar Todas
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Pagamento de Todas as Despesas?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Você vai pagar <strong>{formatCurrency(totalDue)}</strong> referente a todas as despesas fixas pendentes deste mês.
                                Um único lançamento será criado em seus gastos diários. Deseja continuar?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handlePayAll}>
                                Confirmar Pagamento
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <AddFixedExpenseDialog>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Despesa
                  </Button>
                </AddFixedExpenseDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : fixedExpenses.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">Nenhuma despesa fixa cadastrada.</p>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor Mensal</TableHead>
                    <TableHead className="text-center w-[200px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fixedExpenses.map((expense) => {
                    const isPaidThisMonth = expense.lastPaidMonth === currentMonth;
                    return (
                      <TableRow key={expense.id} className={isPaidThisMonth ? "bg-green-100/50 dark:bg-green-900/20" : ""}>
                          <TableCell className="font-medium">{expense.description}</TableCell>
                          <TableCell>{categoryLabels[expense.category] || expense.category}</TableCell>
                          <TableCell className="text-right">{formatCurrency(expense.amount)}</TableCell>
                          <TableCell className="text-center">
                              <div className="flex justify-center gap-2">
                                  <Button 
                                      size="sm" 
                                      onClick={() => {
                                        setSelectedExpense(expense);
                                        setPaymentDescription('');
                                        setPaymentDate(new Date());
                                        setIsPayDialogOpen(true);
                                      }}
                                      disabled={isPaidThisMonth}
                                  >
                                      {isPaidThisMonth ? "Pago este mês" : "Pagar este Mês"}
                                  </Button>
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
                                              Essa ação não pode ser desfeita. Isso excluirá permanentemente esta despesa.
                                          </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction
                                              className="bg-destructive hover:bg-destructive/90"
                                              onClick={() => handleDelete(expense.id)}>
                                              Excluir
                                          </AlertDialogAction>
                                      </AlertDialogFooter>
                                      </AlertDialogContent>
                                  </AlertDialog>
                              </div>
                          </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isPayDialogOpen} onOpenChange={(isOpen) => {
          setIsPayDialogOpen(isOpen);
          if (!isOpen) {
              setSelectedExpense(null);
          }
      }}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Registrar Pagamento de Despesa Fixa</DialogTitle>
                  {selectedExpense && (
                      <DialogDescription>
                          Registrando o pagamento para "{selectedExpense.description}".
                      </DialogDescription>
                  )}
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                      <Label htmlFor="payment-description">Descrição do Lançamento</Label>
                      <Input
                          id="payment-description"
                          value={paymentDescription}
                          onChange={(e) => setPaymentDescription(e.target.value)}
                          placeholder={selectedExpense ? `Pagamento Fixo: ${selectedExpense.description}` : ''}
                      />
                      <p className="text-xs text-muted-foreground">Opcional. Se deixado em branco, a descrição padrão será usada.</p>
                  </div>
                  <div className="grid gap-2">
                      <Label>Data do Pagamento</Label>
                      <Popover>
                          <PopoverTrigger asChild>
                              <Button
                                  variant={"outline"}
                                  className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !paymentDate && "text-muted-foreground"
                                  )}
                              >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {paymentDate ? format(paymentDate, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                              </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                          <Calendar
                              mode="single"
                              selected={paymentDate}
                              onSelect={setPaymentDate}
                              initialFocus
                          />
                          </PopoverContent>
                      </Popover>
                  </div>
              </div>
              <DialogFooter>
                  <DialogClose asChild>
                      <Button variant="ghost">Cancelar</Button>
                  </DialogClose>
                  <Button onClick={() => {
                      if(selectedExpense) handlePayExpense(selectedExpense);
                  }}>
                      Registrar Pagamento
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </>
  );
}
