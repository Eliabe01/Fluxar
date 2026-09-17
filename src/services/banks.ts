import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp, query, onSnapshot, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';

export interface Bank {
    id: string;
    name: string;
    initialBalance: number;
    color?: string;
    logoUrl?: string;
    createdAt?: Date | Timestamp;
}

export type NewBank = Omit<Bank, 'id' | 'createdAt'>;

export const addBank = async (userId: string, bank: NewBank): Promise<string> => {
    if (!userId) {
        throw new Error("Usuário não autenticado.");
    }
    try {
        const docRef = await addDoc(collection(db, 'users', userId, 'banks'), {
            ...bank,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Erro ao adicionar banco: ", error);
        throw new Error("Falha ao adicionar banco.");
    }
}

export const getBanks = (userId: string, callback: (banks: Bank[]) => void) => {
    if (!userId) {
        callback([]);
        return () => {};
    }

    const q = query(
        collection(db, 'users', userId, 'banks'),
        orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const banks: Bank[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            banks.push({ 
                id: doc.id, 
                ...data,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date()),
            } as Bank);
        });
        callback(banks);
    }, (error) => {
        console.error("Erro ao buscar bancos: ", error);
        callback([]);
    });

    return unsubscribe;
};

export const deleteBank = async (userId: string, bankId: string) => {
    if (!userId) {
        throw new Error("Usuário não autenticado.");
    }
    await deleteDoc(doc(db, 'users', userId, 'banks', bankId));
};

export const updateBank = async (userId: string, bankId: string, data: Partial<Bank>) => {
    if (!userId) {
        throw new Error("Usuário não autenticado.");
    }
    const bankRef = doc(db, 'users', userId, 'banks', bankId);
    await updateDoc(bankRef, data);
};
