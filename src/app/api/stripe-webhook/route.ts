
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { handleStripeWebhookEvent } from '@/ai/flows/stripe-webhook-flow';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

// Este é o segredo do seu endpoint de webhook no Stripe.
// Certifique-se de que esta variável de ambiente está definida.
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET não está definido.');
    return NextResponse.json({ error: 'Configuração do servidor incorreta.' }, { status: 500 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Assinatura do Stripe ausente.' }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Falha na verificação do webhook: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    // Passa o evento para o flow do Genkit para processamento
    await handleStripeWebhookEvent(event);
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Erro ao processar o evento do webhook:', error);
    return NextResponse.json({ error: 'Erro interno ao processar o evento.' }, { status: 500 });
  }
}
