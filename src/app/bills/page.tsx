
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, Edit, CalendarClock, DollarSign, Barcode, Info } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { AddBillDialog } from "@/components/add-bill-dialog";
import { ScheduleBillDialog } from "@/components/schedule-bill-dialog";
import { getBills, deleteBill, payBill, type Bill } from '@/services/bills';
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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatDate = (date: Date) => {
    if (!date) return 'N/A';
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
};

export default function BillsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  // Auto-pay scheduled bills
  const processScheduledBills = useCallback(async () => {
    if (!user) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const billsToPay = bills.filter(bill => 
      bill.status === 'scheduled' && 
      bill.scheduledPaymentDate && 
      new Date(bill.scheduledPaymentDate) <= today
    );

    for (const bill of billsToPay) {
      try {
        await payBill(user.uid, bill);
        toast({
          title: "Pagamento Agendado Processado",
          description: `O boleto "${bill.description}" foi pago automaticamente.`,
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Falha no Pagamento Agendado",
          description: `Não foi possível processar o pagamento de "${bill.description}".`,
        });
      }
    }
  }, [bills, user, toast]);

  useEffect(() => {
    if (bills.length > 0) {
      processScheduledBills();
    }
  }, [bills, processScheduledBills]);


  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = getBills(user.uid, (data) => {
      setBills(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (billId: string) => {
    if (!user) return;
    try {
      await deleteBill(user.uid, billId);
      toast({
        title: "Sucesso!",
        description: "Boleto removido com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível remover o boleto.",
      });
    }
  };
  
  const handlePayNow = async (bill: Bill) => {
    if (!user) return;
    try {
        await payBill(user.uid, bill);
        toast({
            title: "Sucesso!",
            description: `Boleto "${bill.description}" pago com sucesso.`,
        });
    } catch (error) {
         toast({
            variant: "destructive",
            title: "Erro",
            description: "Não foi possível registrar o pagamento.",
        });
    }
  };

  const getStatus = (bill: Bill): { text: string; variant: "default" | "secondary" | "destructive" | "outline"; } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(bill.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    if (bill.status === 'paid') return { text: 'Pago', variant: 'default' };
    if (bill.status === 'scheduled') return { text: `Agendado (${formatDate(bill.scheduledPaymentDate as Date)})`, variant: 'outline' };
    if (dueDate < today) return { text: 'Atrasado', variant: 'destructive' };
    
    return { text: 'Pendente', variant: 'secondary' };
  };

  const billsToPayCount = useMemo(() => {
    return bills.filter(b => b.status === 'pending' || b.status === 'scheduled').length;
  }, [bills]);

  return (
    <TooltipProvider>
    <div className="flex flex-col gap-6">
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle>Boletos</CardTitle>
            <CardDescription>
              Gerencie seus boletos e pagamentos agendados.
            </CardDescription>
          </div>
          <AddBillDialog>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Boleto
            </Button>
          </AddBillDialog>
        </div>
      </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
                 <Barcode className="h-8 w-8 text-primary" />
                 <div>
                    <CardTitle>Boletos a Pagar</CardTitle>
                    <p className="text-sm text-muted-foreground">Você tem {billsToPayCount} boleto(s) pendente(s) ou agendado(s).</p>
                 </div>
            </div>
        </CardHeader>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Lista de Boletos</CardTitle>
        </CardHeader>
        <CardContent>
            {loading ? (
            <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
            ) : bills.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">Nenhum boleto cadastrado.</p>
            </div>
            ) : (
            <div className="border rounded-md">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-center w-[280px]">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {bills.map((bill) => {
                        const status = getStatus(bill);
                        const isActionable = status.text === 'Pendente' || status.text === 'Atrasado';

                        return (
                        <TableRow key={bill.id} className={status.text === 'Pago' ? 'bg-green-100/30 dark:bg-green-900/20' : ''}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    {bill.description}
                                    {bill.recurrent && (
                                         <Tooltip>
                                            <TooltipTrigger>
                                                <Info className="h-4 w-4 text-muted-foreground" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Este boleto é recorrente.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>{formatDate(bill.dueDate)}</TableCell>
                            <TableCell>
                                <Badge variant={status.variant} className="capitalize">{status.text}</Badge>
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(bill.value)}</TableCell>
                            <TableCell className="text-center">
                                <div className="flex justify-center gap-2">
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button size="sm" variant="outline" disabled={!isActionable}>
                                                <DollarSign className="mr-2 h-4 w-4" />
                                                Pagar
                                           </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Confirmar Pagamento?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Isso irá registrar o pagamento de {formatCurrency(bill.value)} e criar uma transação em seus Gastos Diários.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handlePayNow(bill)}>Confirmar</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>

                                    <ScheduleBillDialog bill={bill} disabled={!isActionable}>
                                        <Button size="sm" variant="outline" disabled={!isActionable}>
                                            <CalendarClock className="mr-2 h-4 w-4" />
                                            Agendar
                                        </Button>
                                    </ScheduleBillDialog>
                                    
                                    <AddBillDialog bill={bill}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </AddBillDialog>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Essa ação não pode ser desfeita. Isso excluirá permanentemente este boleto.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction
                                                className="bg-destructive hover:bg-destructive/90"
                                                onClick={() => handleDelete(bill.id)}>
                                                Excluir
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </TableCell>
                        </TableRow>
                        )
                    })}
                </TableBody>
                </Table>
            </div>
            )}
        </CardContent>
      </Card>
    </div>
    </TooltipProvider>
  );
}
