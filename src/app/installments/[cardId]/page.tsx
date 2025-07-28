
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, Edit, Calendar as CalendarIcon, ArrowLeft } from "lucide-react";
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
import { AddInstallmentDialog } from "@/components/add-installment-dialog";
import { getInstallmentsByCard, deleteInstallment, updateInstallment, type Installment, type InstallmentUpdate } from '@/services/installments';
import { getCreditCard, type CreditCard } from '@/services/credit-cards';
import { addTransaction } from '@/services/transactions';
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

export default function InstallmentDetailsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const cardId = params.cardId as string;

  const [installments, setInstallments] = useState<Installment[]>([]);
  const [card, setCard] = useState<CreditCard | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [paymentDescription, setPaymentDescription] = useState('');
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
  
  const currentMonth = useMemo(() => format(new Date(), 'yyyy-MM'), []);

  useEffect(() => {
    if (!user || !cardId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    
    getCreditCard(user.uid, cardId).then(cardData => {
        setCard(cardData);
    });

    const unsubscribe = getInstallmentsByCard(user.uid, cardId, (data) => {
      setInstallments(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, cardId]);

  const handleDelete = async (installmentId: string) => {
    if (!user) return;
    try {
      await deleteInstallment(user.uid, installmentId);
      toast({
        title: "Sucesso!",
        description: "Conta parcelada removida com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível remover a conta parcelada.",
      });
    }
  };

  const handlePayInstallment = async (installment: Installment, createTransaction: boolean, transactionDetails?: { description?: string; date?: Date }) => {
    if (!user || installment.installmentsPaid >= installment.installmentsTotal) return;

    try {
      const newPaidCount = installment.installmentsPaid + 1;
      const paymentDateValue = transactionDetails?.date || new Date();
      const paymentMonth = format(paymentDateValue, 'yyyy-MM');

      const updateData: InstallmentUpdate = {
        installmentsPaid: newPaidCount,
        lastPaidMonth: paymentMonth,
      };
      
      await updateInstallment(user.uid, installment.id, updateData);

      if (createTransaction) {
        const installmentValue = installment.totalAmount / installment.installmentsTotal;
        const description = transactionDetails?.description?.trim()
            ? transactionDetails.description 
            : `Parcela ${newPaidCount}/${installment.installmentsTotal} - ${installment.description}`;

        await addTransaction(user.uid, {
          type: 'expense',
          amount: installmentValue,
          category: installment.category,
          description: description,
          date: paymentDateValue,
        });
      }

      toast({
        title: "Sucesso!",
        description: `Pagamento da parcela ${newPaidCount} registrado.`,
      });
      setIsPayDialogOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível registrar o pagamento da parcela.",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };
  
  const categoryLabels: { [key: string]: string } = {
    electronics: 'Eletrônicos',
    clothing: 'Vestuário',
    home: 'Casa',
    travel: 'Viagem',
    education: 'Educação',
    other: 'Outros'
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
             <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" onClick={() => router.push('/installments')}>
                    <ArrowLeft className="h-4 w-4" />
                 </Button>
                <div>
                    <CardTitle>{card ? `Detalhes de ${card.name}` : 'Carregando...'}</CardTitle>
                    <CardDescription>
                    Gerencie as compras e pagamentos do cartão selecionado.
                    </CardDescription>
                </div>
            </div>
            <AddInstallmentDialog>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Conta
              </Button>
            </AddInstallmentDialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : installments.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">Nenhuma conta parcelada cadastrada para este cartão.</p>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead className="text-right">Valor da Parcela</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-center w-[200px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installments.map((item) => {
                    const installmentValue = item.totalAmount / item.installmentsTotal;
                    const isPaidOff = item.installmentsPaid >= item.installmentsTotal;
                    const isPaidThisMonth = item.lastPaidMonth === currentMonth;

                    return (
                      <TableRow key={item.id} className={isPaidOff || isPaidThisMonth ? "bg-green-100/50 dark:bg-green-900/20" : ""}>
                          <TableCell className="font-medium">{item.description}</TableCell>
                          <TableCell>{categoryLabels[item.category] || item.category}</TableCell>
                          <TableCell>{item.installmentsPaid} / {item.installmentsTotal}</TableCell>
                          <TableCell className="text-right">{formatCurrency(installmentValue)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.totalAmount)}</TableCell>
                          <TableCell className="text-center">
                              <div className="flex justify-center gap-1">
                                  <Button 
                                      size="sm" 
                                      disabled={isPaidOff || isPaidThisMonth}
                                      onClick={() => {
                                          setSelectedInstallment(item);
                                          setPaymentDescription('');
                                          setPaymentDate(new Date());
                                          setIsPayDialogOpen(true);
                                      }}
                                  >
                                      {isPaidOff ? "Quitado" : isPaidThisMonth ? "Pago este mês" : "Pagar Parcela"}
                                  </Button>
                                  <AddInstallmentDialog installment={item}>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                          <Edit className="h-4 w-4" />
                                      </Button>
                                  </AddInstallmentDialog>
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
                                              Essa ação não pode ser desfeita. Isso excluirá permanentemente esta conta.
                                          </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction
                                              className="bg-destructive hover:bg-destructive/90"
                                              onClick={() => handleDelete(item.id)}>
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
              setSelectedInstallment(null);
          }
      }}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Registrar Pagamento de Parcela</DialogTitle>
                  {selectedInstallment && (
                      <DialogDescription>
                          Registrando o pagamento da parcela {selectedInstallment.installmentsPaid + 1} de {selectedInstallment.installmentsTotal} para "{selectedInstallment.description}".
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
                          placeholder={selectedInstallment ? `Parcela ${selectedInstallment.installmentsPaid + 1}/${selectedInstallment.installmentsTotal} - ${selectedInstallment.description}` : ''}
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
                  <Button variant="outline" onClick={() => {
                      if(selectedInstallment) handlePayInstallment(selectedInstallment, false, { date: paymentDate });
                  }}>
                      Apenas Atualizar Progresso
                  </Button>
                  <Button onClick={() => {
                      if(selectedInstallment) handlePayInstallment(selectedInstallment, true, { description: paymentDescription, date: paymentDate });
                  }}>
                      Pagar e Lançar Despesa
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </>
  );
}
