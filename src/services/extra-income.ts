import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, query, onSnapshot, doc, deleteDoc, orderBy, getDoc } from 'firebase/firestore';
import { addTransaction, deleteTransaction } from './transactions';

export interface ExtraIncome {
    id: string;
    description: string;
    amount: number;
    date: Timestamp;
    transactionId?: string;
}

export type NewExtraIncome = Omit<ExtraIncome, 'id' | 'transactionId'>;

export const addExtraIncome = async (userId: string, income: NewExtraIncome) => {
    if (!userId) {
        throw new Error("Usuário não autenticado.");
    }
    try {
        // Create a corresponding transaction to affect the main balance
        const transactionId = await addTransaction(userId, {
            type: 'income',
            amount: income.amount,
            category: 'extra', // Hardcode category as 'extra' for these incomes
            description: income.description,
            date: income.date,
        });

        // Add the entry to the extraIncomes collection, linking it to the transaction
        await addDoc(collection(db, 'users', userId, 'extraIncomes'), {
            ...income,
            transactionId,
        });
    } catch (error) {
        console.error("Erro ao adicionar ganho extra: ", error);
        throw new Error("Falha ao adicionar ganho extra.");
    }
}

export const getExtraIncomes = (userId: string, callback: (incomes: ExtraIncome[]) => void) => {
    if (!userId) {
        callback([]);
        return () => {};
    }
    const q = query(collection(db, 'users', userId, 'extraIncomes'), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const incomes: ExtraIncome[] = [];
        querySnapshot.forEach((doc) => {
            incomes.push({ id: doc.id, ...doc.data() } as ExtraIncome);
        });
        callback(incomes);
    }, (error) => {
        console.error("Erro ao buscar ganhos extras: ", error);
        callback([]);
    });
    return unsubscribe;
}

export const deleteExtraIncome = async (userId: string, incomeId: string) => {
    if (!userId) {
        throw new Error("Usuário não autenticado.");
    }
    
    const incomeDocRef = doc(db, 'users', userId, 'extraIncomes', incomeId);

    try {
        // First, get the document to find the associated transactionId
        const incomeDocSnap = await getDoc(incomeDocRef);
        if (!incomeDocSnap.exists()) {
            console.warn("Tentativa de excluir um ganho extra que não existe:", incomeId);
            return;
        }

        const extraIncomeData = incomeDocSnap.data() as ExtraIncome;

        // If a transaction is linked, delete it.
        if (extraIncomeData.transactionId) {
            await deleteTransaction(userId, extraIncomeData.transactionId);
        }

        // Finally, delete the extra income document itself.
        await deleteDoc(incomeDocRef);

    } catch (error) {
        console.error("Erro ao deletar ganho extra: ", error);
        throw new Error("Falha ao deletar ganho extra.");
    }
}
