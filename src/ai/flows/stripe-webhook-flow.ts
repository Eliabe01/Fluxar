
'use server';
/**
 * @fileOverview Processa eventos de webhook do Stripe para gerenciar assinaturas.
 *
 * - handleStripeWebhookEvent - A função principal que recebe e processa eventos.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import Stripe from 'stripe';
import { updateUserSubscription, type UserSubscription } from '@/services/subscriptions';
import { Timestamp } from 'firebase/firestore';

const StripeEventSchema = z.any();

const getStripeInstance = () => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error('A chave secreta do Stripe não está configurada.');
    return new Stripe(secretKey, { apiVersion: '2024-04-10' });
};


const handleSubscriptionEvent = async (stripeSubscription: Stripe.Subscription) => {
    const userId = stripeSubscription.metadata.firebaseUserId;
    if (!userId) {
        console.error(`[Webhook] Assinatura ${stripeSubscription.id} sem firebaseUserId nos metadados.`);
        return;
    }
    
    // Assegura que estamos buscando o priceId do primeiro item.
    const priceId = stripeSubscription.items.data[0]?.price.id;
    if (!priceId) {
        console.error(`[Webhook] Price ID não encontrado no item da assinatura: ${stripeSubscription.id}`);
        return;
    }

    const subscriptionData: UserSubscription = {
        id: stripeSubscription.id,
        priceId: priceId,
        status: stripeSubscription.status,
        collectionMethod: stripeSubscription.collection_method,
        current_period_end: Timestamp.fromMillis(stripeSubscription.current_period_end * 1000),
        cancel_at_period_end: stripeSubscription.cancel_at_period_end,
    };
    
    await updateUserSubscription(userId, stripeSubscription.id, subscriptionData);
    console.log(`[Webhook] Assinatura ${stripeSubscription.id} atualizada para o usuário ${userId}. Status: ${stripeSubscription.status}, Cancel at end: ${subscriptionData.cancel_at_period_end}`);
};

const handleInvoiceEvent = async (invoice: Stripe.Invoice) => {
    if (invoice.subscription) {
      const stripe = getStripeInstance();
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
      await handleSubscriptionEvent(subscription);
    }
}


export async function handleStripeWebhookEvent(event: Stripe.Event): Promise<void> {
    return stripeWebhookFlow(event);
}

const stripeWebhookFlow = ai.defineFlow(
  {
    name: 'stripeWebhookFlow',
    inputSchema: StripeEventSchema,
    outputSchema: z.void(),
  },
  async (event) => {
    console.log(`[Webhook] Evento recebido: ${event.type}`);

    try {
        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
            case 'customer.subscription.trial_will_end':
                await handleSubscriptionEvent(event.data.object as Stripe.Subscription);
                break;
            
            case 'invoice.payment_succeeded':
            case 'invoice.payment_failed':
            case 'invoice.paid':
            case 'invoice.finalized':
                await handleInvoiceEvent(event.data.object as Stripe.Invoice);
                break;

            case 'checkout.session.completed':
                const session = event.data.object as Stripe.Checkout.Session;
                if (session.mode === 'subscription' && session.subscription) {
                    const stripe = getStripeInstance();
                    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
                    await handleSubscriptionEvent(subscription);
                }
                break;

            default:
                // console.log(`[Webhook] Evento não tratado: ${event.type}`);
        }
    } catch (error: any) {
        console.error(`[Webhook] Erro ao processar evento ${event.type}:`, error.message);
        throw error;
    }
  }
);
