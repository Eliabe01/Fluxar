
'use server';
/**
 * @fileOverview Ativa um plano para um usuário via pagamento PIX manual.
 *
 * - activatePixPlan - Ativa o acesso por 30 dias para um plano específico.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Timestamp } from 'firebase-admin/firestore';
import { addDays } from 'date-fns';
import { db as adminDb } from '@/lib/firebase-admin';
import type { UserSubscription } from '@/services/subscriptions';


const updateUserSubscription = async (userId: string, subscriptionId: string, data: UserSubscription) => {
  if (!userId) throw new Error('User ID is required.');
  const subscriptionDocRef = adminDb.collection('users').doc(userId).collection('subscriptions').doc(subscriptionId);
  await subscriptionDocRef.set({ ...data }, { merge: true });
};

const ActivatePixInputSchema = z.object({
  plan: z.enum(['bronze', 'prata', 'ouro']).describe('O plano selecionado pelo usuário.'),
  userId: z.string().describe('O ID do usuário do Firebase.'),
});
export type ActivatePixInput = z.infer<typeof ActivatePixInputSchema>;

const ActivatePixOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type ActivatePixOutput = z.infer<typeof ActivatePixOutputSchema>;


export async function activatePixPlan(input: ActivatePixInput): Promise<ActivatePixOutput> {
  return activatePixPlanFlow(input);
}

const activatePixPlanFlow = ai.defineFlow(
  {
    name: 'activatePixPlanFlow',
    inputSchema: ActivatePixInputSchema,
    outputSchema: ActivatePixOutputSchema,
  },
  async ({ plan, userId }) => {
    try {
        const endDate = addDays(new Date(), 30);
        const subscriptionId = `pix-${Date.now()}`;
        
        const priceIdKey = `STRIPE_PIX_PRICE_ID_${plan.toUpperCase()}`;
        const priceId = process.env[priceIdKey];
        
        if (!priceId) {
            throw new Error(`Price ID para o plano PIX "${plan}" não encontrado. Verifique a variável de ambiente ${priceIdKey}.`);
        }
        
        const subscriptionData: UserSubscription = {
            id: subscriptionId,
            priceId: priceId,
            status: 'active',
            collectionMethod: 'send_invoice', // PIX is always a manual invoice
            current_period_end: Timestamp.fromDate(endDate),
            cancel_at_period_end: false, // Default value
        };

        await updateUserSubscription(userId, subscriptionId, subscriptionData);
        
        return { success: true, message: 'Plano ativado com sucesso por 30 dias!' };
    } catch (error: any) {
      console.error("Erro ao ativar plano via PIX:", error);
      return { success: false, message: error.message || 'Falha ao ativar o plano.' };
    }
  }
);
