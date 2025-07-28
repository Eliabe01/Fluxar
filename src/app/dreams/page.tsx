
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, Edit } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AddDreamDialog } from "@/components/add-dream-dialog";
import { ContributeToDreamDialog } from "@/components/contribute-dream-dialog";
import { getDreams, type Dream } from '@/services/dreams';
import { deleteDream } from '@/actions/dreams';
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
import Image from 'next/image';
import { DreamProgressChart } from '@/components/dream-progress-chart';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export default function DreamsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = getDreams(user.uid, (data) => {
      setDreams(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (dreamId: string) => {
    if (!user) return;
    try {
      await deleteDream(dreamId);
      toast({
        title: "Sucesso!",
        description: "Sonho removido com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível remover o sonho.",
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle>Meus Sonhos</CardTitle>
              <CardDescription>
                Visualize e acompanhe o progresso para alcançar seus objetivos financeiros.
              </CardDescription>
            </div>
            <AddDreamDialog>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Sonho
              </Button>
            </AddDreamDialog>
          </div>
        </CardHeader>
      </Card>
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      ) : dreams.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">Você ainda não cadastrou nenhum sonho. Comece agora!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {dreams.map((dream) => {
            const progress = (dream.targetAmount > 0) ? (dream.currentAmount / dream.targetAmount) * 100 : 0;
            const chartData = [
              { name: 'completed', value: dream.currentAmount, fill: 'hsl(var(--primary))' },
              { name: 'remaining', value: Math.max(0, dream.targetAmount - dream.currentAmount), fill: 'hsl(var(--secondary))' },
            ];

            return (
              <Card key={dream.id} className="flex flex-col">
                <CardHeader className="p-0">
                  <div className="relative h-48 w-full">
                    <Image
                      src={dream.imageURL}
                      alt={dream.title}
                      layout="fill"
                      objectFit="cover"
                      className="rounded-t-lg"
                      data-ai-hint="dream goal"
                    />
                  </div>
                   <div className="p-4">
                     <CardTitle className="flex justify-between items-start">
                        <span className="flex-1 mr-2">{dream.title}</span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                            <AddDreamDialog dream={dream}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </AddDreamDialog>
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
                                        <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDelete(dream.id)}>Excluir</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                     </CardTitle>
                     <CardDescription>
                        Meta: {format(new Date(dream.dueDate.toDate()), "dd/MM/yyyy", { locale: ptBR })}
                     </CardDescription>
                   </div>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col items-center justify-center space-y-4">
                    <DreamProgressChart data={chartData} progress={progress} />
                    <div className="text-center">
                        <p className="text-xl font-bold">{formatCurrency(dream.currentAmount)}</p>
                        <p className="text-sm text-muted-foreground">de {formatCurrency(dream.targetAmount)}</p>
                    </div>
                </CardContent>
                <CardFooter>
                  <ContributeToDreamDialog dream={dream}>
                    <Button className="w-full">Contribuir</Button>
                  </ContributeToDreamDialog>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
