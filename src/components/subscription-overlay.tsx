
"use client";

import { useAuth, type SubscriptionStatus } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { AlertTriangle } from 'lucide-react';
import { createCustomerPortalSession } from '@/ai/flows/customer-portal-flow';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

const blockedStatuses: SubscriptionStatus[] = ['past_due', 'unpaid', 'incomplete', 'incomplete_expired'];

const statusMessages: { [key in SubscriptionStatus & {}]: string } = {
    past_due: "Seu pagamento está pendente. Para continuar usando todas as funcionalidades, por favor, regularize sua fatura.",
    unpaid: "Ocorreu um problema com seu pagamento. Para continuar usando todas as funcionalidades, por favor, atualize seus dados de pagamento.",
    incomplete: "O processo de assinatura não foi concluído. Finalize o pagamento para ativar seu acesso.",
    incomplete_expired: "Sua tentativa de assinatura expirou. Por favor, inicie o processo novamente.",
    active: "",
    trialing: "",
    canceled: "",
};


export function SubscriptionOverlay() {
  const { user, subscription, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isManaging, setIsManaging] = useState(false);

  const isBlocked = !loading && subscription && blockedStatuses.includes(subscription.status);
  const message = isBlocked ? statusMessages[subscription!.status] : "";

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


  if (!isBlocked) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm p-8 text-center rounded-lg">
      <div className="bg-card border border-destructive/50 p-8 rounded-lg shadow-xl">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-destructive">Seu plano requer atenção</h2>
        <p className="text-muted-foreground mt-2 mb-6 max-w-sm">
          {message}
        </p>
        <Button onClick={handleManageBilling} disabled={isManaging}>
          {isManaging ? 'Carregando...' : 'Resolver Pendência'}
        </Button>
      </div>
    </div>
  );
}
