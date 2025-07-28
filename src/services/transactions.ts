import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp, query, onSnapshot, where, orderBy, doc, deleteDoc } from 'firebase/firestore';

export interface Transaction {
    id: string;
    type: 'income' | 'expense';
    amount: number;
    category: string;
    description: string;
    date: Date | Timestamp;
}

export type NewTransaction = Omit<Transaction, 'id'>;

export const addTransaction = async (userId: string, transaction: NewTransaction): Promise<string> => {
    if (!userId) {
        throw new Error("Usuário não autenticado.");
    }
    try {
        const docRef = await addDoc(collection(db, 'users', userId, 'transactions'), {
            ...transaction,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Erro ao adicionar documento: ", error);
        throw new Error("Falha ao adicionar transação.");
    }
}

export const getTransactions = (userId: string, callback: (transactions: Transaction[]) => void) => {
    if (!userId) {
        callback([]);
        return () => {};
    }

    const q = query(
        collection(db, 'users', userId, 'transactions'),
        orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const transactions: Transaction[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            transactions.push({ 
                id: doc.id, 
                ...data,
                date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
            } as Transaction);
        });
        callback(transactions);
    }, (error) => {
        console.error("Erro ao buscar transações: ", error);
        callback([]);
    });

    return unsubscribe;
};

export const deleteTransaction = async (userId: string, transactionId: string) => {
    if (!userId) {
        throw new Error("Usuário não autenticado.");
    }
    await deleteDoc(doc(db, 'users', userId, 'transactions', transactionId));
};


export const getTransactionsForPeriod = (userId: string, startDate: Date, endDate: Date, callback: (transactions: Transaction[]) => void) => {
    if (!userId) {
        callback([]);
        return () => {};
    }

    const q = query(
        collection(db, 'users', userId, 'transactions'),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const transactions: Transaction[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            transactions.push({ 
                id: doc.id, 
                ...data,
                date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
            } as Transaction);
        });
        callback(transactions);
    }, (error) => {
        console.error("Erro ao buscar transações do período: ", error);
        callback([]);
    });

    return unsubscribe;
};

export const getTransactionsForMonth = (userId: string, month: string, callback: (transactions: Transaction[]) => void) => {
    if (!userId) {
        callback([]);
        return () => {};
    }
    const [year, monthIndex] = month.split('-').map(Number);
    // Month in JS is 0-indexed, so monthIndex - 1 is correct.
    const startDate = new Date(year, monthIndex - 1, 1);
    // Getting last day of month. monthIndex is not 0-indexed here.
    const endDate = new Date(year, monthIndex, 0, 23, 59, 59);

    const q = query(
        collection(db, 'users', userId, 'transactions'),
        where('date', '>=', startDate),
        where('date', '<=', endDate)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const transactions: Transaction[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.type === 'expense') {
                transactions.push({ id: doc.id, ...data } as Transaction);
            }
        });
        callback(transactions);
    }, (error) => {
        console.error("Erro ao buscar transações do mês: ", error);
        callback([]);
    });

    return unsubscribe;
}
