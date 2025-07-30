
"use client";

import { useState } from 'react';
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { createSubscriptionCheckout } from '@/ai/flows/create-checkout-flow';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2, CreditCard, QrCode } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type PlanName = 'bronze' | 'prata' | 'ouro';
type CollectionMethod = 'charge_automatically' | 'send_invoice';

const plans = [
  {
    name: "Bronze",
    id: "bronze" as PlanName,
    price: "R$ 19,90",
    description: "O essencial para organizar suas finanças e começar a ter controle.",
    features: [
      "Painel de visão geral",
      "Registro de Gastos Diários",
      "Controle de Boletos",
      "Orçamento único",
      "Relatórios simples",
    ],
    variant: "outline",
  },
  {
    name: "Prata",
    id: "prata" as PlanName,
    price: "R$ 29,90",
    description: "A experiência completa para quem quer transformar seus hábitos financeiros.",
    features: [
      "Tudo do Bronze, e mais:",
      "Ganhos Fixos e Extras",
      "Despesas Fixas e Parceladas",
      "Metas com 'Meus Sonhos'",
      "Análise Financeira e IA Coach",
      "Multi-orçamentos",
    ],
    variant: "default",
    highlight: true,
  },
  {
    name: "Ouro",
    id: "ouro" as PlanName,
    price: "R$ 59,90",
    description: "Para usuários avançados que precisam de mais poder e suporte.",
    features: [
      "Tudo do Prata, e mais:",
      "Gerenciamento de Investimentos",
      "Análise com AI Coach avançado",
      "Contas para Família (em breve)",
      "Suporte VIP",
    ],
    variant: "outline",
  },
];


export function PricingSection() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<CollectionMethod | null>(null);

  const handleCheckout = async (plan: PlanName, collectionMethod: CollectionMethod) => {
     if (!user || !user.email) {
      toast({
        variant: "destructive",
        title: "Não autenticado",
        description: "Você precisa estar logado para assinar um plano.",
      });
      router.push('/login');
      return;
    }

    setLoading(collectionMethod);
    try {
      const { checkoutUrl } = await createSubscriptionCheckout({
        plan,
        userId: user.uid,
        userEmail: user.email,
        collectionMethod,
      });
      
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error("URL de checkout não foi retornada.");
      }

    } catch (error) {
      console.error("Erro ao criar checkout:", error);
      toast({
        variant: "destructive",
        title: "Erro ao iniciar pagamento",
        description: "Não foi possível redirecionar para o pagamento. Tente novamente.",
      });
    } finally {
        setLoading(null);
    }
  };


  return (
    <section id="pricing" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
            <div className="inline-block rounded-lg bg-secondary/80 px-3 py-1 text-sm text-secondary-foreground">
                Planos e Preços
            </div>
          <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Um plano para cada etapa da sua jornada.
          </h2>
          <p className="text-muted-foreground md:text-xl/relaxed">
            Comece com um teste gratuito de 7 dias no plano Prata. Cancele quando quiser.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.name} className={plan.highlight ? "border-primary border-2 shadow-lg flex flex-col" : "flex flex-col"}>
              <CardHeader className="pb-4">
                {plan.highlight && (
                    <div className="mb-2 text-center">
                        <span className="rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground">MAIS POPULAR</span>
                    </div>
                )}
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex-grow">
                <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="ml-1 text-muted-foreground">/ mês</span>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="flex flex-col items-stretch gap-2">
                <Dialog>
                   <DialogTrigger asChild>
                     <Button 
                        className="w-full" 
                        variant={plan.variant as "default" | "outline"}
                      >
                       Começar Teste Grátis
                      </Button>
                  </DialogTrigger>
                  <DialogContent>
                      <DialogHeader>
                          <DialogTitle>Escolha como pagar</DialogTitle>
                          <DialogDescription>
                            Se optar por Cartão de Crédito, sua assinatura será renovada automaticamente. Você pode gerenciar isso nas configurações. Pagamentos via PIX ou Boleto são únicos para 30 dias de acesso.
                          </DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2">
                          <Button 
                              variant="outline" 
                              className="h-24 flex-col gap-2"
                              onClick={() => handleCheckout(plan.id, 'charge_automatically')}
                              disabled={loading === 'charge_automatically'}
                          >
                              {loading === 'charge_automatically' ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                                  <>
                                      <CreditCard className="h-8 w-8" />
                                      <span className="font-semibold">Cartão de Crédito</span>
                                  </>
                              )}
                          </Button>
                          <Button 
                              variant="outline" 
                              className="h-24 flex-col gap-2"
                              onClick={() => handleCheckout(plan.id, 'send_invoice')}
                              disabled={loading === 'send_invoice'}
                          >
                              {loading === 'send_invoice' ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                                  <>
                                      <QrCode className="h-8 w-8" />
                                      <span className="font-semibold">PIX / Boleto</span>
                                  </>
                              )}
                          </Button>
                      </div>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
