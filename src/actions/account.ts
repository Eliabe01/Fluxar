
'use server';

import { db as adminDb } from '@/lib/firebase-admin';

// Helper function to delete all documents in a collection or subcollection
const deleteCollection = async (path: string) => {
    const collectionRef = adminDb.collection(path);
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


export const resetUserData = async (userId: string) => {
    if (!userId) {
        throw new Error("Usuário não autenticado.");
    }

    // Collections to delete
    const collectionsToDelete = ['transactions', 'fixedIncomes', 'extraIncomes', 'installments', 'budgets', 'fixedExpenses', 'creditCards', 'bills', 'dreams', 'userGamification', 'historicoPagamentos'];

    try {
        // Delete operational collections
        const deletePromises = collectionsToDelete.map(collectionName => deleteCollection(`users/${userId}/${collectionName}`));
        
        await Promise.all(deletePromises);

        // Reset the main user document, but preserve essential fields like stripeCustomerId and email.
        // All other fields will be wiped.
        const userDocRef = adminDb.collection('users').doc(userId);
        const userDoc = await userDocRef.get();

        if (userDoc.exists) {
            const userData = userDoc.data();
            const dataToKeep = {
                // Preserve stripeCustomerId if it exists
                ...(userData?.stripeCustomerId && { stripeCustomerId: userData.stripeCustomerId }),
                // Preserve email if it exists
                ...(userData?.email && { email: userData.email }),
                // Preserve admin status if it exists
                ...(userData?.isAdmin && { isAdmin: userData.isAdmin }),
            };
            
            // Overwrite the document with only the data we want to keep, effectively deleting everything else.
            await userDocRef.set(dataToKeep, { merge: false });
        }

    } catch(error) {
        console.error("Erro ao zerar os dados da conta:", error);
        throw new Error("Ocorreu um erro ao tentar zerar os dados da conta.");
    }
};

// This file no longer needs deleteUserAccount since it's handled by a Genkit flow.
