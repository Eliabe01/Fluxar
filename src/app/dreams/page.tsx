
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, Edit, Sparkles } from "lucide-react";
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
import { cn } from "@/lib/utils";

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
              <Card key={dream.id} className={cn(
                  "flex flex-col relative overflow-hidden transition-all duration-500 border-border/40 card-shadow hover:-translate-y-1 hover:shadow-lg group",
                  progress >= 100 && "border-amber-500/50 bg-gradient-to-br from-amber-500/10 via-background to-orange-500/5"
              )}>
                {progress >= 100 && (
                  <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none z-0">
                    <Sparkles className="w-24 h-24 text-amber-500" />
                  </div>
                )}
                
                <CardHeader className="p-0 z-10">
                  <div className="relative h-48 w-full">
                    <Image
                      src={dream.imageURL}
                      alt={dream.title}
                      layout="fill"
                      objectFit="cover"
                      className="rounded-t-2xl opacity-90 group-hover:opacity-100 transition-opacity"
                      data-ai-hint="dream goal"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                  </div>
                   <div className="p-5 relative -mt-8 z-10">
                     <CardTitle className="flex justify-between items-start text-xl font-headline">
                        <span className="flex-1 mr-2 line-clamp-2">{dream.title}</span>
                        <div className="flex items-center gap-1 flex-shrink-0 bg-background/80 backdrop-blur rounded-full p-1 border shadow-sm">
                            <AddDreamDialog dream={dream}>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary rounded-full">
                                    <Edit className="h-3 w-3" />
                                </Button>
                            </AddDreamDialog>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full">
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                        <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction className="bg-destructive hover:bg-destructive/90 rounded-full" onClick={() => handleDelete(dream.id)}>Excluir</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                     </CardTitle>
                     <CardDescription className="mt-2 font-medium">
                        Meta: {format(new Date(dream.dueDate.toDate()), "dd 'de' MMM, yyyy", { locale: ptBR })}
                     </CardDescription>
                   </div>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col items-center justify-center space-y-2 z-10">
                    <DreamProgressChart data={chartData} progress={progress} />
                    <div className="text-center mt-4">
                        <p className={cn("text-2xl font-bold tracking-tight", progress >= 100 ? "text-amber-500" : "text-foreground")}>
                            {formatCurrency(dream.currentAmount)}
                        </p>
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mt-1">de {formatCurrency(dream.targetAmount)}</p>
                    </div>
                </CardContent>
                <CardFooter className="z-10 pb-5 px-5">
                  <ContributeToDreamDialog dream={dream}>
                    <Button 
                        className={cn("w-full rounded-xl h-12 text-base shadow-sm transition-all", 
                            progress >= 100 ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20" : ""
                        )}
                        disabled={progress >= 100}
                    >
                        {progress >= 100 ? "Sonho Realizado! 🎉" : "Contribuir"}
                    </Button>
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
