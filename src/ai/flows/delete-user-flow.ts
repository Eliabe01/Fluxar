
'use server';
/**
 * @fileOverview Deleta um usuário e todos os seus dados.
 *
 * - deleteUserAccount - Deleta os dados do Firestore e a conta de autenticação.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { auth as adminAuth, db as adminDb } from '@/lib/firebase-admin';
import type Stripe from 'stripe';

const getStripeInstance = async () => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error('A chave secreta do Stripe não está configurada.');
    const { default: Stripe } = await import('stripe');
    return new Stripe(secretKey, { apiVersion: '2024-04-10' });
};


// Helper function to delete all documents in a collection
const deleteCollection = async (userId: string, collectionName: string) => {
    const collectionPath = `users/${userId}/${collectionName}`;
    const collectionRef = adminDb.collection(collectionPath);
    const querySnapshot = await collectionRef.get();
    
    if (querySnapshot.empty) {
        return;
    }

    const batch = adminDb.batch();
    querySnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });

    await batch.commit();
};

const collectionsToDelete = ['transactions', 'fixedIncomes', 'extraIncomes', 'installments', 'budgets', 'fixedExpenses', 'creditCards', 'bills', 'dreams', 'userGamification', 'historicoPagamentos', 'subscriptions'];

const deleteFirestoreData = async (userId: string) => {
    const deletePromises = collectionsToDelete.map(collectionName => deleteCollection(userId, collectionName));
    await Promise.all(deletePromises);
    // Finally, delete the main user document
    await adminDb.collection('users').doc(userId).delete();
};


const deleteStripeCustomer = async (userId: string) => {
    try {
        const userDoc = await adminDb.collection('users').doc(userId).get();
        const userData = userDoc.data();
        const stripeCustomerId = userData?.stripeCustomerId;

        if (stripeCustomerId) {
            const stripe = await getStripeInstance();
            await stripe.customers.del(stripeCustomerId);
            console.log(`[Flow:DeleteUser] Cliente Stripe ${stripeCustomerId} deletado.`);
        }
    } catch (error: any) {
        // Log o erro, mas não impeça a exclusão do usuário do Firebase
        console.error(`[Flow:DeleteUser] Erro ao deletar cliente Stripe para o usuário ${userId}:`, error.message);
    }
};

const DeleteUserInputSchema = z.object({
  userId: z.string().describe('O ID do usuário do Firebase a ser deletado.'),
});
export type DeleteUserInput = z.infer<typeof DeleteUserInputSchema>;

const DeleteUserOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type DeleteUserOutput = z.infer<typeof DeleteUserOutputSchema>;


export async function deleteUserAccount(input: DeleteUserInput): Promise<DeleteUserOutput> {
  return deleteUserAccountFlow(input);
}

const deleteUserAccountFlow = ai.defineFlow(
  {
    name: 'deleteUserAccountFlow',
    inputSchema: DeleteUserInputSchema,
    outputSchema: DeleteUserOutputSchema,
  },
  async ({ userId }) => {
    try {
        if (!userId) {
            throw new Error("O ID do usuário é obrigatório.");
        }

        // Deleta o cliente no Stripe (se existir)
        await deleteStripeCustomer(userId);

        // Deleta todos os dados associados no Firestore
        await deleteFirestoreData(userId);

        // Deleta o usuário da Autenticação do Firebase
        await adminAuth.deleteUser(userId);

        return { success: true, message: 'Usuário e todos os dados foram deletados com sucesso.' };
    } catch (error: any) {
      console.error("Erro ao deletar conta de usuário:", error);
      return { success: false, message: error.message || 'Falha ao deletar a conta.' };
    }
  }
);
