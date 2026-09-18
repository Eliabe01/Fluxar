
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Button } from "@/components/ui/button";
import { PlusCircle, CreditCard as CreditCardIcon, Landmark, Loader2, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AddInstallmentDialog } from "@/components/add-installment-dialog";
import { getInstallments, payCardInvoice, type Installment } from '@/services/installments';
import { getCreditCards, deleteCreditCard, type CreditCard } from '@/services/credit-cards';
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
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

const brandIcons: { [key: string]: React.ElementType } = {
  mastercard: CreditCardIcon,
  visa: CreditCardIcon,
  elo: CreditCardIcon,
  amex: CreditCardIcon,
  hipercard: CreditCardIcon,
  other: Landmark,
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
};

export default function InstallmentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaying, setIsPaying] = useState<string | null>(null);

  const currentMonth = useMemo(() => format(new Date(), 'yyyy-MM'), []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribeCards = getCreditCards(user.uid, (data) => {
        setCards(data);
    });
    const unsubscribeInstallments = getInstallments(user.uid, (data) => {
      setInstallments(data);
    });

    // We can consider loading finished when cards are loaded
    Promise.all([new Promise(resolve => {
        const unsub = getCreditCards(user.uid, (data) => {
            setCards(data);
            unsub();
            resolve(true);
        });
    })]).then(() => setLoading(false));

    return () => {
        unsubscribeCards();
        unsubscribeInstallments();
    };
  }, [user]);

  const cardSummaries = useMemo(() => {
    return cards.map(card => {
        const cardInstallments = installments.filter(inst => 
            inst.cardId === card.id && 
            inst.installmentsPaid < inst.installmentsTotal &&
            inst.lastPaidMonth !== currentMonth
        );

        const totalDue = cardInstallments.reduce((acc, curr) => {
            return acc + (curr.totalAmount / curr.installmentsTotal);
        }, 0);

        return {
            ...card,
            totalDue,
            activeInstallments: installments.filter(inst => inst.cardId === card.id && inst.installmentsPaid < inst.installmentsTotal).length,
        };
    });
  }, [cards, installments, currentMonth]);
  
  const handlePayInvoice = async (card: { id: string; name: string; totalDue: number; }) => {
    if (!user || card.totalDue <= 0) return;
    setIsPaying(card.id);
    try {
        await payCardInvoice(user.uid, card.id, card.name, card.totalDue, currentMonth);
        toast({
            title: "Sucesso!",
            description: `Fatura do cartão ${card.name} paga com sucesso.`,
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Erro",
            description: "Não foi possível pagar a fatura.",
        });
    } finally {
        setIsPaying(null);
    }
  };

  const handleDeleteCard = async (cardId: string, cardName: string) => {
    if (!user) return;
    try {
        await deleteCreditCard(user.uid, cardId);
        toast({
            title: "Sucesso!",
            description: `Cartão "${cardName}" e suas contas foram removidos.`,
        });
    } catch (error) {
         toast({
            variant: "destructive",
            title: "Erro",
            description: "Não foi possível remover o cartão.",
        });
    }
  };

  return (
      <div className="flex flex-col gap-6">
        <Card>
            <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                    <CardTitle>Contas Parceladas</CardTitle>
                    <CardDescription>
                        Gerencie suas faturas e compras parceladas por cartão.
                    </CardDescription>
                    </div>
                    <AddInstallmentDialog>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Adicionar Conta
                    </Button>
                    </AddInstallmentDialog>
                </div>
            </CardHeader>
        </Card>

        {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-72 w-full rounded-2xl" />
                <Skeleton className="h-72 w-full rounded-2xl" />
            </div>
        ) : cardSummaries.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">Nenhum cartão cadastrado. Adicione uma conta parcelada para começar.</p>
            </div>
        ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {cardSummaries.map((card) => {
                    const BrandIcon = brandIcons[card.brand] || CreditCardIcon;
                    const isFaturaPaga = card.totalDue <= 0;
                    
                    return (
                        <div key={card.id} className="relative flex flex-col pt-16">
                            {/* O Cartão Físico Flutuante */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-11/12 h-44 rounded-xl bg-gradient-to-br from-slate-800 via-slate-900 to-black text-white p-5 flex flex-col justify-between shadow-2xl z-10 border border-slate-700/50 transition-transform hover:-translate-y-2">
                                <div className="flex justify-between items-start">
                                    {/* Chip do Cartão */}
                                    <div className="w-10 h-8 rounded bg-gradient-to-br from-yellow-200 to-yellow-500 opacity-80" />
                                    {/* Botão Excluir sutil */}
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-full -mt-2 -mr-2">
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Isso excluirá permanentemente o cartão "{card.name}" e todas as suas contas associadas.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction className="bg-destructive" onClick={() => handleDeleteCard(card.id, card.name)}>Excluir</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                                
                                <div className="flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-slate-400 uppercase tracking-widest mb-1">{card.category}</span>
                                        <span className="font-headline text-lg tracking-wider">{card.name}</span>
                                    </div>
                                    <BrandIcon className="h-8 w-8 text-slate-300 opacity-80" />
                                </div>
                            </div>

                            {/* Resumo da Fatura (O Card Branco embaixo) */}
                            <Card className="flex-1 pt-32 px-6 pb-6 border-border/40 card-shadow flex flex-col justify-between bg-card z-0">
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Fatura Atual</p>
                                        <span className={cn(
                                            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                                            isFaturaPaga ? "bg-success/10 text-success" : "bg-amber-500/10 text-amber-600"
                                        )}>
                                            {isFaturaPaga ? 'Fechada/Paga' : 'Aberta'}
                                        </span>
                                    </div>
                                    
                                    <p className={cn(
                                        "text-3xl font-headline tracking-tighter mb-1",
                                        isFaturaPaga ? "text-success" : "text-primary"
                                    )}>
                                        {formatCurrency(card.totalDue)}
                                    </p>
                                    
                                    <p className="text-xs text-muted-foreground mb-6">
                                        {card.activeInstallments} compras parceladas ativas
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3 mt-auto">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button 
                                                className={cn("w-full rounded-xl transition-all shadow-sm", isFaturaPaga ? "opacity-50" : "bg-primary hover:bg-primary/90")}
                                                disabled={isFaturaPaga || isPaying === card.id}
                                            >
                                                {isPaying === card.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                {isFaturaPaga ? "Fatura Paga" : "Pagar Fatura"}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Confirmar Pagamento</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Você vai pagar <strong>{formatCurrency(card.totalDue)}</strong> referente à fatura do cartão <strong>{card.name}</strong>.
                                                    Deseja continuar?
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handlePayInvoice(card)}>
                                                    Confirmar
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>

                                    <Button asChild variant="outline" className="w-full rounded-xl">
                                        <Link href={`/installments/${card.id}`}>Ver Detalhes e Parcelas</Link>
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    )
                })}
            </div>
        )}
    </div>
  );
}
