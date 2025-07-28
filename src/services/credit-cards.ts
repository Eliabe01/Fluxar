
import { db } from '@/lib/firebase';
import { collection, addDoc, query, onSnapshot, doc, deleteDoc, orderBy, serverTimestamp, Timestamp, getDoc } from 'firebase/firestore';
import { deleteInstallmentsByCard } from './installments';

export interface CreditCard {
    id: string;
    name: string;
    brand: string;
    category: string;
    createdAt: Timestamp;
}

export type NewCreditCard = Omit<CreditCard, 'id' | 'createdAt'>;

export const addCreditCard = async (userId: string, card: NewCreditCard): Promise<string> => {
    if (!userId) {
        throw new Error("Usuário não autenticado.");
    }
    const docRef = await addDoc(collection(db, 'users', userId, 'creditCards'), {
        ...card,
        createdAt: serverTimestamp()
    });
    return docRef.id;
};

export const getCreditCards = (userId: string, callback: (cards: CreditCard[]) => void) => {
    if (!userId) {
        callback([]);
        return () => {};
    }
    const q = query(collection(db, 'users', userId, 'creditCards'), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const cards: CreditCard[] = [];
        querySnapshot.forEach((doc) => {
            cards.push({ id: doc.id, ...doc.data() } as CreditCard);
        });
        callback(cards);
    }, (error) => {
        console.error("Erro ao buscar cartões de crédito: ", error);
        callback([]);
    });
    return unsubscribe;
};

export const getCreditCard = async (userId: string, cardId: string): Promise<CreditCard | null> => {
    if (!userId) {
        throw new Error("Usuário não autenticado.");
    }
    const docRef = doc(db, 'users', userId, 'creditCards', cardId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as CreditCard;
    } else {
        return null;
    }
};


export const deleteCreditCard = async (userId: string, cardId: string) => {
    if (!userId) {
        throw new Error("Usuário não autenticado.");
    }
    // First, delete all associated installments to avoid orphaned data
    await deleteInstallmentsByCard(userId, cardId);
    
    // Then, delete the card document itself
    await deleteDoc(doc(db, 'users', userId, 'creditCards', cardId));
};
