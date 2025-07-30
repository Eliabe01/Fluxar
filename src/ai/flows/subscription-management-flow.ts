
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

// Define o schema para a entrada de atualização de método
const UpdateMethodInputSchema = z.object({
  subscriptionId: z.string().describe('O ID da assinatura do Stripe.'),
  collectionMethod: z.enum(['charge_automatically', 'send_invoice']).describe('O novo método de cobrança.'),
});
export type UpdateMethodInput = z.infer<typeof UpdateMethodInputSchema>;

// Define o schema para a entrada de cancelamento
const CancelSubscriptionInputSchema = z.object({
    subscriptionId: z.string().describe('O ID da assinatura do Stripe a ser cancelada.'),
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
export async function cancelSubscription(input: CancelSubscriptionInput): Promise<Stripe.Subscription> {
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
    
    const stripe = getStripeInstance();
    try {
      const existingSubscription = await stripe.subscriptions.retrieve(subscriptionId);
      if (existingSubscription.metadata.firebaseUserId !== userId) {
          throw new Error("Permissão negada. Você não pode cancelar esta assinatura.");
      }

      const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

      console.log(`[Flow:CancelSub] Assinatura ${subscriptionId} do usuário ${userId} programada para cancelamento.`);
      return updatedSubscription;

    } catch (error: any) {
      console.error(`[Flow:CancelSub] Erro ao programar cancelamento da assinatura ${subscriptionId}:`, error.message);
      throw new Error(`Falha ao cancelar a assinatura: ${error.message}`);
    }
  }
);
