
"use client";

import { useState, useCallback } from 'react';
import { useToast } from './use-toast';
import { createPaymentIntent } from '@/ai/flows/create-checkout-flow';
import { useAuth } from '@/lib/auth';

type PaymentStatus = 'idle' | 'processing' | 'requires_action' | 'success' | 'error';

interface PaymentOptions {
    payment_method_types: ('card' | 'pix')[];
    metadata?: Record<string, string>;
}

export function usePayment() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [qrCodeText, setQrCodeText] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  const resetPayment = useCallback(() => {
    setStatus('idle');
    setClientSecret(null);
    setQrCodeText(null);
    setQrCodeDataUrl(null);
  }, []);

  const handlePayment = useCallback(async (amount: number, options: PaymentOptions) => {
    if (!user || !user.email) {
      toast({ variant: 'destructive', title: 'Erro de Autenticação', description: 'Você precisa estar logado para realizar um pagamento.' });
      return;
    }

    setStatus('processing');
    console.log('[usePayment] Iniciando processo de pagamento...');

    try {
      const response = await createPaymentIntent({
        amount: Math.round(amount * 100), // Converter para centavos
        userId: user.uid,
        userEmail: user.email,
        payment_method_types: options.payment_method_types,
        metadata: options.metadata,
      });

      setClientSecret(response.clientSecret);

      if (response.qrCodeDataUrl && response.qrCodeText) {
        setQrCodeText(response.qrCodeText);
        setQrCodeDataUrl(response.qrCodeDataUrl);
        setStatus('requires_action');
        console.log('[usePayment] QR Code gerado. Aguardando ação do usuário.');
      } else {
        setStatus('idle'); // Retorna para idle, pois agora a UI deve renderizar o PaymentElement para cartão
      }

    } catch (err: any) {
      console.error("[usePayment] Erro ao criar Payment Intent:", err);
      setStatus('error');
      toast({
        variant: 'destructive',
        title: 'Erro ao Iniciar Pagamento',
        description: err.message || 'Não foi possível preparar o pagamento.',
      });
      resetPayment();
    }
  }, [user, toast, resetPayment]);

  return { status, handlePayment, clientSecret, qrCodeDataUrl, qrCodeText, resetPayment };
}
