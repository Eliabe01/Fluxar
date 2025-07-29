
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp, query, onSnapshot, doc, deleteDoc, orderBy } from 'firebase/firestore';

export interface FixedIncome {
    id: string;
    description: string;
    amount: number;
    frequency: 'monthly' | 'fortnightly';
    createdAt: Timestamp;
}

export type NewFixedIncome = Omit<FixedIncome, 'id' | 'createdAt'>;

export const addFixedIncome = async (userId: string, income: NewFixedIncome) => {
    if (!userId) {
        throw new Error("Usuário não autenticado.");
    }
    try {
        await addDoc(collection(db, 'users', userId, 'fixedIncomes'), {
            ...income,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Erro ao adicionar ganho fixo: ", error);
        throw new Error("Falha ao adicionar ganho fixo.");
    }
}

export const getFixedIncomes = (userId: string, callback: (incomes: FixedIncome[]) => void) => {
    if (!userId) {
        callback([]);
        return () => {};
    }
    const q = query(collection(db, 'users', userId, 'fixedIncomes'), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const incomes: FixedIncome[] = [];
        querySnapshot.forEach((doc) => {
            incomes.push({ id: doc.id, ...doc.data() } as FixedIncome);
        });
        callback(incomes);
    }, (error) => {
        console.error("Erro ao buscar ganhos fixos: ", error);
        callback([]);
    });
    return unsubscribe;
}

export const deleteFixedIncome = async (userId: string, incomeId: string) => {
    if (!userId) {
        throw new Error("Usuário não autenticado.");
    }
    try {
        await deleteDoc(doc(db, 'users', userId, 'fixedIncomes', incomeId));
    } catch (error) {
        console.error("Erro ao deletar ganho fixo: ", error);
        throw new Error("Falha ao deletar ganho fixo.");
    }
}
