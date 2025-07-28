
'use server';

import { db as adminDb } from '@/lib/firebase-admin';

const collectionsToDelete = ['transactions', 'fixedIncomes', 'extraIncomes', 'installments', 'budgets', 'fixedExpenses', 'creditCards', 'bills', 'dreams', 'userGamification', 'historicoPagamentos'];

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

export const resetAccountDataAdmin = async (userId: string) => {
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
