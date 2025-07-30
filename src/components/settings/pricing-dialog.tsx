
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { changeSubscriptionPlan } from '@/ai/flows/subscription-management-flow';

type PlanName = 'bronze' | 'prata' | 'ouro';

interface PricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: PlanName;
  subscriptionId: string;
}

const plans = [
  {
    name: "Bronze",
    id: "bronze" as PlanName,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BRONZE,
    features: [
      "Painel de visão geral",
      "Registro de Gastos Diários",
      "Controle de Boletos",
    ],
  },
  {
    name: "Prata",
    id: "prata" as PlanName,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRATA,
    features: [
      "Tudo do Bronze, e mais:",
      "Metas com 'Meus Sonhos'",
      "Análise Financeira com IA",
    ],
  },
  {
    name: "Ouro",
    id: "ouro" as PlanName,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_OURO,
    features: [
      "Tudo do Prata, e mais:",
      "Gerenciamento de Investimentos",
      "Suporte VIP",
    ],
  },
];

export function PricingDialog({ open, onOpenChange, currentPlan, subscriptionId }: PricingDialogProps) {
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<PlanName | null>(null);

  const handleChangePlan = async (newPlan: PlanName, newPriceId?: string) => {
    if (!newPriceId) {
      toast({
        variant: "destructive",
        title: "Erro de Configuração",
        description: `O ID de preço para o plano ${newPlan} não está configurado.`,
      });
      return;
    }

    setLoadingPlan(newPlan);
    try {
      await changeSubscriptionPlan({
        subscriptionId,
        newPriceId,
      });
      toast({
        title: "Sucesso!",
        description: "Seu plano foi alterado. A mudança será refletida em breve.",
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao Mudar de Plano",
        description: error.message || "Não foi possível alterar seu plano. Tente novamente.",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Trocar de Plano</DialogTitle>
          <DialogDescription>
            Escolha seu novo plano. O valor será calculado proporcionalmente.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-6 py-4 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            return (
              <Card key={plan.name} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow space-y-2">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={isCurrent ? "outline" : "default"}
                    disabled={isCurrent || !!loadingPlan}
                    onClick={() => handleChangePlan(plan.id, plan.priceId)}
                  >
                    {loadingPlan === plan.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isCurrent ? "Plano Atual" : "Mudar para este"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
