
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        ) : cardSummaries.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">Nenhum cartão cadastrado. Adicione uma conta parcelada para começar.</p>
            </div>
        ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {cardSummaries.map((card) => {
                    const BrandIcon = brandIcons[card.brand] || CreditCardIcon;
                    return (
                        <Card key={card.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle>{card.name}</CardTitle>
                                        <CardDescription>{card.category}</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <BrandIcon className="h-6 w-6 text-muted-foreground" />
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
                                                        Essa ação não pode ser desfeita. Isso excluirá permanentemente o cartão "{card.name}" e todas as suas contas parceladas associadas.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        className="bg-destructive hover:bg-destructive/90"
                                                        onClick={() => handleDeleteCard(card.id, card.name)}>
                                                        Excluir
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-xs text-muted-foreground">Total da Fatura (Mês Atual)</p>
                                <p className="text-2xl font-bold">{formatCurrency(card.totalDue)}</p>
                                <p className="text-xs text-muted-foreground">{card.activeInstallments} compras ativas</p>
                            </CardContent>
                            <CardFooter className="flex flex-col items-stretch gap-2">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button 
                                            variant="outline"
                                            disabled={card.totalDue <= 0 || isPaying === card.id}
                                        >
                                            {isPaying === card.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Pagar Fatura
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Confirmar Pagamento da Fatura</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Você vai pagar <strong>{formatCurrency(card.totalDue)}</strong> referente à fatura do cartão <strong>{card.name}</strong>.
                                                Um lançamento será criado em seus gastos diários. Deseja continuar?
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handlePayInvoice(card)}>
                                                Confirmar Pagamento
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                <Button asChild className="w-full">
                                    <Link href={`/installments/${card.id}`}>Ver Detalhes</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    )
                })}
            </div>
        )}
    </div>
  );
}
