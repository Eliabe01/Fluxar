
'use server';
/**
 * @fileOverview Deleta um usuário e todos os seus dados.
 *
 * - deleteUserAccount - Deleta os dados do Firestore e a conta de autenticação.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { auth as adminAuth, db as adminDb } from '@/lib/firebase-admin';

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

const collectionsToDelete = ['transactions', 'fixedIncomes', 'extraIncomes', 'installments', 'budgets', 'fixedExpenses', 'creditCards', 'bills', 'dreams', 'userGamification', 'historicoPagamentos'];

const resetAccountDataAdmin = async (userId: string) => {
    if (!userId) {
        throw new Error("Usuário não autenticado.");
    }

    try {
        const deletePromises = collectionsToDelete.map(collectionName => deleteCollection(userId, collectionName));
        await Promise.all(deletePromises);
        // Also delete the main user document data, but not the doc itself
        await adminDb.collection('users').doc(userId).set({}, { merge: false });

    } catch(error) {
        console.error("Erro ao zerar os dados da conta:", error);
        throw new Error("Ocorreu um erro ao tentar zerar os dados da conta.");
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

        // Primeiro, deleta todos os dados associados no Firestore
        await resetAccountDataAdmin(userId);

        // Depois, deleta o usuário da Autenticação do Firebase
        await adminAuth.deleteUser(userId);

        return { success: true, message: 'Usuário e todos os dados foram deletados com sucesso.' };
    } catch (error: any) {
      console.error("Erro ao deletar conta de usuário:", error);
      return { success: false, message: error.message || 'Falha ao deletar a conta.' };
    }
  }
);
