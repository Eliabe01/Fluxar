
"use client";

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { PaymentForm } from '@/components/payment-form';
import { usePayment } from '@/hooks/use-payment';
import Link from 'next/link';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '@/lib/auth';
import { FullScreenLoader } from '@/components/full-screen-loader';

// A chave publicável do Stripe deve ser carregada fora do componente para evitar recarregá-la a cada renderização.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function PaymentStatus() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');

  // Não renderiza nada se não houver status na URL
  if (!status) {
    return null;
  }
  
  if (status === 'success' && paymentIntentClientSecret) {
    return (
      <div className="flex flex-col items-center text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
        <h3 className="text-xl font-bold">Pagamento bem-sucedido!</h3>
        <p className="text-muted-foreground mt-2">
          Seu investimento foi registrado. Obrigado por confiar no Fluxar!
        </p>
        <Button asChild className="mt-6">
            <Link href="/dashboard">Voltar para o Painel</Link>
        </Button>
      </div>
    );
  }

  return (
     <div className="flex flex-col items-center text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h3 className="text-xl font-bold">Ocorreu um erro no pagamento.</h3>
        <p className="text-muted-foreground mt-2">
          Não foi possível processar seu pagamento. Por favor, tente novamente ou contate o suporte se o problema persistir.
        </p>
        <Button asChild className="mt-6">
            <Link href="/invest">Tentar Novamente</Link>
        </Button>
      </div>
  );
}

function InvestPageContent() {
  const { user, loading: authLoading } = useAuth();
  const { status: paymentHookStatus, handlePayment, clientSecret } = usePayment();
  const searchParams = useSearchParams();
  const showStatusScreen = searchParams.has('status');

  if (authLoading) {
    return <FullScreenLoader />;
  }

  return (
      <div className="flex justify-center items-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Investir com Fluxar</CardTitle>
            <CardDescription>Faça um aporte único e seguro para seus objetivos.</CardDescription>
          </CardHeader>
          <CardContent>
              {showStatusScreen ? (
                  <PaymentStatus />
              ) : clientSecret ? (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <PaymentForm />
                  </Elements>
              ) : (
                  <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 border rounded-lg">
                          <div>
                              <p className="font-semibold">Plano de Investimento Único</p>
                              <p className="text-sm text-muted-foreground">Aporte para o futuro.</p>
                          </div>
                          <p className="text-2xl font-bold">R$ 50,00</p>
                      </div>
                       <Button 
                          onClick={() => handlePayment(50, { investmentType: 'unique' })}
                          disabled={paymentHookStatus === 'processing' || !user}
                          className="w-full"
                      >
                          {paymentHookStatus === 'processing' ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processando...
                            </>
                          ) : (
                            'Investir R$ 50,00'
                          )}
                      </Button>
                      {!user && <p className="text-xs text-center text-destructive">Você precisa estar logado para investir.</p>}
                  </div>
              )}
          </CardContent>
          <CardFooter>
              <p className="text-xs text-muted-foreground text-center w-full">
                  Pagamentos seguros processados pela Stripe.
              </p>
          </CardFooter>
        </Card>
      </div>
  );
}


export default function InvestPage() {
    return (
      <InvestPageContent />
    )
}
