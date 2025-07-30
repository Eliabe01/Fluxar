
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, CheckCircle, XCircle, AlertTriangle, PauseCircle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createCustomerPortalSession } from '@/ai/flows/customer-portal-flow';
import { updateSubscriptionMethod, cancelSubscription } from '@/ai/flows/subscription-management-flow';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const planDisplayName: { [key: string]: string } = {
  bronze: 'Bronze',
  prata: 'Prata',
  ouro: 'Ouro',
  none: 'Nenhum',
};

const statusDetails: { [key: string]: { text: string; icon: JSX.Element; color: string; description: string } } = {
    active: { text: "Ativo", icon: <CheckCircle className="text-green-500" />, color: "text-green-500", description: "Sua assinatura está em dia." },
    trialing: { text: "Período de Teste", icon: <CheckCircle className="text-green-500" />, color: "text-green-500", description: "Aproveite o acesso completo." },
    past_due: { text: "Pendente", icon: <AlertTriangle className="text-amber-500" />, color: "text-amber-500", description: "O pagamento da sua fatura está pendente." },
    unpaid: { text: "Pendente", icon: <AlertTriangle className="text-amber-500" />, color: "text-amber-500", description: "O pagamento da sua última fatura falhou." },
    incomplete: { text: "Incompleto", icon: <AlertTriangle className="text-amber-500" />, color: "text-amber-500", description: "O processo de assinatura não foi concluído." },
    canceled: { text: "Cancelado", icon: <XCircle className="text-red-500" />, color: "text-red-500", description: "Sua assinatura foi cancelada." },
    incomplete_expired: { text: "Expirado", icon: <XCircle className="text-red-500" />, color: "text-red-500", description: "Sua tentativa de assinatura expirou." },
};

export function SubscriptionCard() {
  const { user, subscription, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isManaging, setIsManaging] = useState(false);
  const [isUpdatingMethod, setIsUpdatingMethod] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const handleManageBilling = async () => {
    if (!user || !user.email) return;
    setIsManaging(true);
    try {
      const { portalUrl } = await createCustomerPortalSession({
        userId: user.uid,
        userEmail: user.email,
      });
      router.push(portalUrl);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível abrir o portal de faturamento." });
    } finally {
        setIsManaging(false);
    }
  };

  const handleToggleAutoRenew = async (enabled: boolean) => {
      if (!subscription) return;
      const newMethod = enabled ? 'charge_automatically' : 'send_invoice';
      setIsUpdatingMethod(true);
      try {
          await updateSubscriptionMethod({ subscriptionId: subscription.id, collectionMethod: newMethod });
          toast({ title: "Sucesso!", description: "Método de cobrança atualizado." });
      } catch (error) {
          toast({ variant: "destructive", title: "Erro", description: "Não foi possível atualizar o método de cobrança." });
      } finally {
          setIsUpdatingMethod(false);
      }
  }

  const handleCancelSubscription = async () => {
    if (!subscription || !user) return;
    setIsCanceling(true);
    try {
        await cancelSubscription({ subscriptionId: subscription.id, userId: user.uid });
        toast({ title: "Assinatura será cancelada", description: "Sua assinatura será cancelada no final do período de cobrança atual." });
    } catch(error: any) {
        toast({ variant: "destructive", title: "Erro", description: error.message || "Não foi possível cancelar a assinatura." });
    } finally {
        setIsCanceling(false);
    }
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      );
    }

    if (!user || !user.plan || user.plan === 'none') {
      return (
        <div className="text-center">
          <p className="text-muted-foreground">Você não possui uma assinatura ativa.</p>
          <Button onClick={() => router.push('/#pricing')} className="mt-4">Ver Planos</Button>
        </div>
      );
    }

    const currentPlanName = planDisplayName[user.plan] || 'Plano Desconhecido';
    const currentStatus = statusDetails[user.status!] || { text: user.status, icon: <PauseCircle />, color: "", description: "" };
    const endDate = subscription?.current_period_end ? subscription.current_period_end.toDate() : null;
    const isAutoRenew = subscription?.collectionMethod === 'charge_automatically';

    return (
      <div className="space-y-6">
        <div>
            <h3 className="text-2xl font-bold">Plano {currentPlanName}</h3>
            
            <div className="flex items-center gap-2 text-sm font-semibold mt-2">
                {currentStatus.icon}
                <span className={currentStatus.color}>{currentStatus.text}</span>
            </div>
            
            {endDate && (
              <p className="text-sm text-muted-foreground mt-1">
                  Seu acesso é válido até {format(endDate, "dd/MM/yyyy")}.
              </p>
            )}
        </div>

        {subscription?.cancel_at_period_end && endDate && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-amber-700">
                <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                    <p className="font-semibold">Cancelamento Agendado</p>
                    <p className="text-sm">Sua assinatura será encerrada e não será renovada ao final do período atual, em {format(endDate, "dd/MM/yyyy")}.</p>
                </div>
            </div>
        )}
        
        {!subscription?.cancel_at_period_end && subscription?.collectionMethod && (
            <div className="flex items-center space-x-2 rounded-lg border p-4">
                <Switch 
                    id="auto-renew" 
                    checked={isAutoRenew}
                    onCheckedChange={handleToggleAutoRenew}
                    disabled={isUpdatingMethod}
                />
                <div className="flex flex-col">
                    <Label htmlFor="auto-renew">Ativar renovação automática</Label>
                    <span className="text-xs text-muted-foreground">
                        {isAutoRenew ? 'Seu cartão será cobrado automaticamente.' : 'Você receberá uma fatura por e-mail.'}
                    </span>
                </div>
                 {isUpdatingMethod && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
        )}

      </div>
    );
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Minha Assinatura</CardTitle>
        <CardDescription>Gerencie seu plano e informações de faturamento.</CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
      {user?.plan !== 'none' && (
        <CardFooter className="flex flex-wrap items-center justify-between gap-2 border-t px-6 py-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => router.push('/#pricing')} variant="outline" disabled={loading}>
                  Trocar Plano
              </Button>
               {!subscription?.cancel_at_period_end && (
                 <Button variant="destructive" onClick={handleCancelSubscription} disabled={isCanceling || loading}>
                      {isCanceling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                     Cancelar Assinatura
                 </Button>
             )}
            </div>
            <Button onClick={handleManageBilling} disabled={isManaging || loading}>
              {isManaging && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Gerenciar Cobrança
            </Button>
        </CardFooter>
      )}
    </Card>
  );
}
