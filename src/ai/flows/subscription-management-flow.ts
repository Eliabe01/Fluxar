
'use server';
/**
 * @fileOverview Gerencia assinaturas existentes do Stripe.
 *
 * - updateSubscriptionMethod - Altera o método de cobrança de uma assinatura.
 * - cancelSubscription - Cancela uma assinatura ao final do período de cobrança.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import Stripe from 'stripe';
import { updateUserSubscription, getUserSubscription } from '@/services/subscriptions';
import { auth as adminAuth } from '@/lib/firebase-admin';

// Define o schema para a entrada de atualização de método
const UpdateMethodInputSchema = z.object({
  subscriptionId: z.string().describe('O ID da assinatura do Stripe.'),
  collectionMethod: z.enum(['charge_automatically', 'send_invoice']).describe('O novo método de cobrança.'),
});
export type UpdateMethodInput = z.infer<typeof UpdateMethodInputSchema>;

// Define o schema para a entrada de cancelamento
const CancelSubscriptionInputSchema = z.object({
    subscriptionId: z.string().describe('O ID da assinatura a ser cancelada.'),
    userId: z.string().describe('O ID do usuário do Firebase que possui a assinatura.'),
});
export type CancelSubscriptionInput = z.infer<typeof CancelSubscriptionInputSchema>;

const getStripeInstance = () => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error('A chave secreta do Stripe não está configurada.');
    return new Stripe(secretKey, { apiVersion: '2024-04-10' });
};


// Função exportada para atualizar o método de cobrança
export async function updateSubscriptionMethod(input: UpdateMethodInput): Promise<void> {
  return updateSubscriptionMethodFlow(input);
}

// Função exportada para cancelar a assinatura
export async function cancelSubscription(input: CancelSubscriptionInput): Promise<Stripe.Subscription | void> {
  return cancelSubscriptionFlow(input);
}


const updateSubscriptionMethodFlow = ai.defineFlow(
  {
    name: 'updateSubscriptionMethodFlow',
    inputSchema: UpdateMethodInputSchema,
    outputSchema: z.void(),
  },
  async ({ subscriptionId, collectionMethod }) => {
    const stripe = getStripeInstance();
    
    try {
        const updateParams: Stripe.SubscriptionUpdateParams = {
            collection_method: collectionMethod,
        };
        
        if (collectionMethod === 'send_invoice') {
            updateParams.days_until_due = 3;
        } 
        
        await stripe.subscriptions.update(subscriptionId, updateParams);
        console.log(`[Flow:UpdateSub] Método de cobrança da assinatura ${subscriptionId} atualizado para ${collectionMethod}.`);

    } catch (error: any) {
        console.error(`[Flow:UpdateSub] Erro ao atualizar assinatura ${subscriptionId}:`, error.message);
        throw new Error(`Falha ao atualizar o método de cobrança da assinatura: ${error.message}`);
    }
  }
);


const cancelSubscriptionFlow = ai.defineFlow(
  {
    name: 'cancelSubscriptionFlow',
    inputSchema: CancelSubscriptionInputSchema,
    outputSchema: z.any(),
  },
  async ({ subscriptionId, userId }) => {
    if (!userId) {
        throw new Error("ID do usuário é obrigatório para cancelar a assinatura.");
    }
    
    // Se a assinatura for interna (ex: concedida por admin via PIX),
    // agende o cancelamento no Firestore em vez de na API do Stripe.
    if (subscriptionId.startsWith('pix-')) {
        try {
            const currentSub = await getUserSubscription(userId, subscriptionId);
            if (!currentSub) {
                throw new Error(`Assinatura interna ${subscriptionId} não encontrada para o usuário ${userId}.`);
            }
            
            const isPendingPayment = currentSub?.status === 'past_due' || currentSub?.status === 'unpaid';

            // Se o pagamento estiver pendente, cancela imediatamente.
            // Senão, apenas agenda o cancelamento para o fim do período.
            if (isPendingPayment) {
                await updateUserSubscription(userId, subscriptionId, { status: 'canceled', cancel_at_period_end: true });
                await adminAuth.setCustomUserClaims(userId, { plan: 'none', status: 'canceled' });
                console.log(`[Flow:CancelSub] Assinatura interna ${subscriptionId} do usuário ${userId} cancelada imediatamente por pendência.`);
            } else {
                await updateUserSubscription(userId, subscriptionId, { cancel_at_period_end: true });
                console.log(`[Flow:CancelSub] Assinatura interna ${subscriptionId} do usuário ${userId} agendada para cancelamento no fim do período.`);
            }
            return { success: true }; // Encerra o flow aqui, retornando um objeto serializável.
        } catch (error: any) {
             console.error(`[Flow:CancelSub] Erro ao cancelar assinatura interna ${subscriptionId}:`, error.message);
             throw new Error(`Falha ao cancelar a assinatura interna: ${error.message}`);
        }
    }

    // Se for uma assinatura normal do Stripe, prossiga com a API do Stripe.
    const stripe = getStripeInstance();
    try {
      const existingSubscription = await stripe.subscriptions.retrieve(subscriptionId);
      if (existingSubscription.metadata.firebaseUserId !== userId) {
          throw new Error("Permissão negada. Você não pode cancelar esta assinatura.");
      }
      
      const isPendingPayment = existingSubscription.status === 'past_due' || existingSubscription.status === 'unpaid';
      
      // Se o pagamento estiver pendente, cancela imediatamente.
      // Senão, apenas agenda o cancelamento.
      if (isPendingPayment) {
          const deletedSubscription = await stripe.subscriptions.cancel(subscriptionId);
          console.log(`[Flow:CancelSub] Assinatura Stripe ${subscriptionId} do usuário ${userId} cancelada imediatamente por pendência.`);
          return deletedSubscription;
      } else {
          const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
          });
          console.log(`[Flow:CancelSub] Assinatura Stripe ${subscriptionId} do usuário ${userId} programada para cancelamento.`);
          return updatedSubscription;
      }

    } catch (error: any) {
      console.error(`[Flow:CancelSub] Erro ao programar cancelamento da assinatura Stripe ${subscriptionId}:`, error.message);
      throw new Error(`Falha ao cancelar a assinatura: ${error.message}`);
    }
  }
);
