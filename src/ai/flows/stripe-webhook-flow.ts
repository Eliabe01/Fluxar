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
import { auth as adminAuth } from '@/lib/firebase-admin';

const StripeEventSchema = z.any();

const getStripeInstance = () => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error('A chave secreta do Stripe não está configurada.');
    return new Stripe(secretKey, { apiVersion: '2024-04-10' });
};


const handleSubscriptionEvent = async (stripeSubscription: Stripe.Subscription, eventType: string) => {
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

    const planName = stripeSubscription.metadata.plan || 'plano_desconhecido';
    
    const subscriptionData: Partial<UserSubscription> = {
        id: stripeSubscription.id,
        priceId: priceId,
        collectionMethod: stripeSubscription.collection_method,
        current_period_end: Timestamp.fromMillis(stripeSubscription.current_period_end * 1000),
        cancel_at_period_end: stripeSubscription.cancel_at_period_end,
    };
    
    // Lógica para "soft-cancel" e "hard-cancel"
    if (eventType === 'customer.subscription.deleted') {
        subscriptionData.status = 'canceled';
        // Atualiza claims para remover o acesso imediatamente
        await adminAuth.setCustomUserClaims(userId, { plan: 'none', status: 'canceled' });
    } else {
        // Se cancel_at_period_end for true, o usuário ainda tem acesso.
        // O status no Stripe pode ser 'active' ou 'canceled', mas para nós, ele está ativo até o fim do período.
        subscriptionData.status = stripeSubscription.cancel_at_period_end ? 'active' : stripeSubscription.status;
        
        // Atualiza as claims com o status real (ativo ou não)
        await adminAuth.setCustomUserClaims(userId, { 
            plan: planName, 
            status: stripeSubscription.status,
        });
    }

    // Atualiza o documento no Firestore
    await updateUserSubscription(userId, stripeSubscription.id, subscriptionData);
    
    console.log(`[Webhook] Assinatura ${stripeSubscription.id} para usuário ${userId} processada. Evento: ${eventType}, Status salvo: ${subscriptionData.status}`);
};

const handleInvoiceEvent = async (invoice: Stripe.Invoice, eventType: string) => {
    if (invoice.subscription) {
      const stripe = getStripeInstance();
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
      await handleSubscriptionEvent(subscription, eventType);
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
            case 'customer.subscription.trial_will_end':
                await handleSubscriptionEvent(event.data.object as Stripe.Subscription, event.type);
                break;
            
            case 'customer.subscription.deleted':
                await handleSubscriptionEvent(event.data.object as Stripe.Subscription, event.type);
                break;

            case 'invoice.payment_succeeded':
            case 'invoice.payment_failed':
            case 'invoice.paid':
            case 'invoice.finalized':
                await handleInvoiceEvent(event.data.object as Stripe.Invoice, event.type);
                break;

            case 'checkout.session.completed':
                const session = event.data.object as Stripe.Checkout.Session;
                if (session.mode === 'subscription' && session.subscription) {
                    const stripe = getStripeInstance();
                    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
                    await handleSubscriptionEvent(subscription, event.type);
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
