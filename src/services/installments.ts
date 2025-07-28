
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, query, onSnapshot, doc, deleteDoc, orderBy, updateDoc, serverTimestamp, where, getDocs, writeBatch } from 'firebase/firestore';
import { addTransaction } from './transactions';

export interface Installment {
    id: string;
    cardId: string;
    description: string;
    totalAmount: number;
    installmentsTotal: number;
    installmentsPaid: number;
    category: string;
    purchaseDate: Timestamp | Date;
    createdAt: Timestamp;
    lastPaidMonth?: string; // Format: YYYY-MM
}

export type NewInstallment = Omit<Installment, 'id' | 'createdAt' | 'installmentsPaid' | 'lastPaidMonth'>;
export type InstallmentUpdate = Partial<Omit<Installment, 'id' | 'createdAt'>>;


export const addInstallment = async (userId: string, installment: NewInstallment) => {
    if (!userId) {
        throw new Error("Usuário não autenticado.");
    }
    try {
        await addDoc(collection(db, 'users', userId, 'installments'), {
            ...installment,
            installmentsPaid: 0,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Erro ao adicionar conta parcelada: ", error);
        throw new Error("Falha ao adicionar conta parcelada.");
    }
};

export const getInstallments = (userId: string, callback: (installments: Installment[]) => void) => {
    if (!userId) {
        callback([]);
        return () => {};
    }
    const q = query(collection(db, 'users', userId, 'installments'), orderBy("purchaseDate", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const installments: Installment[] = [];
        querySnapshot.forEach((doc) => {
            installments.push({ id: doc.id, ...doc.data() } as Installment);
        });
        callback(installments);
    }, (error) => {
        console.error("Erro ao buscar contas parceladas: ", error);
        callback([]);
    });
    return unsubscribe;
};

export const getInstallmentsByCard = (userId: string, cardId: string, callback: (installments: Installment[]) => void) => {
    if (!userId) {
        callback([]);
        return () => {};
    }
    const q = query(
        collection(db, 'users', userId, 'installments'),
        where('cardId', '==', cardId)
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const installments: Installment[] = [];
        querySnapshot.forEach((doc) => {
            installments.push({ id: doc.id, ...doc.data() } as Installment);
        });

        installments.sort((a, b) => {
            const dateA = a.purchaseDate instanceof Timestamp ? a.purchaseDate.toMillis() : new Date(a.purchaseDate).getTime();
            const dateB = b.purchaseDate instanceof Timestamp ? b.purchaseDate.toMillis() : new Date(b.purchaseDate).getTime();
            return dateB - dateA; // For descending order
        });
        
        callback(installments);
    }, (error) => {
        console.error("Erro ao buscar contas parceladas por cartão: ", error);
        callback([]);
    });
    return unsubscribe;
}

export const updateInstallment = async (userId: string, installmentId: string, data: InstallmentUpdate) => {
    if (!userId) {
        throw new Error("Usuário não autenticado.");
    }
    try {
        const docRef = doc(db, 'users', userId, 'installments', installmentId);
        await updateDoc(docRef, data);
    } catch (error) {
        console.error("Erro ao atualizar conta parcelada: ", error);
        throw new Error("Falha ao atualizar conta parcelada.");
    }
};

export const deleteInstallment = async (userId: string, installmentId: string) => {
    if (!userId) {
        throw new Error("Usuário não autenticado.");
    }
    try {
        await deleteDoc(doc(db, 'users', userId, 'installments', installmentId));
    } catch (error) {
        console.error("Erro ao deletar conta parcelada: ", error);
        throw new Error("Falha ao deletar conta parcelada.");
    }
};

export const deleteInstallmentsByCard = async (userId: string, cardId: string) => {
    if (!userId) throw new Error("Usuário não autenticado.");

    const installmentsQuery = query(
        collection(db, 'users', userId, 'installments'),
        where('cardId', '==', cardId)
    );
    const querySnapshot = await getDocs(installmentsQuery);

    if (querySnapshot.empty) {
        return;
    }

    const batch = writeBatch(db);
    querySnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();
};

export const payCardInvoice = async (userId: string, cardId: string, cardName: string, totalDue: number, currentMonth: string) => {
    if (!userId) throw new Error("Usuário não autenticado.");
    if (totalDue <= 0) throw new Error("Nenhum valor a ser pago.");

    const installmentsQuery = query(
        collection(db, 'users', userId, 'installments'),
        where('cardId', '==', cardId)
    );
    const querySnapshot = await getDocs(installmentsQuery);
    
    const installmentsToUpdate: Installment[] = [];
    querySnapshot.forEach(doc => {
        const installment = { id: doc.id, ...doc.data() } as Installment;
        if (installment.installmentsPaid < installment.installmentsTotal && installment.lastPaidMonth !== currentMonth) {
            installmentsToUpdate.push(installment);
        }
    });

    if (installmentsToUpdate.length === 0) {
        throw new Error("Nenhuma parcela pendente encontrada para este mês.");
    }
    
    try {
        await addTransaction(userId, {
            type: 'expense',
            amount: totalDue,
            category: 'bills',
            description: `Pagamento Fatura - ${cardName}`,
            date: new Date(),
        });
        
        const batch = writeBatch(db);
        installmentsToUpdate.forEach(inst => {
            const docRef = doc(db, 'users', userId, 'installments', inst.id);
            const newPaidCount = inst.installmentsPaid + 1;
            batch.update(docRef, { 
                lastPaidMonth: currentMonth,
                installmentsPaid: newPaidCount,
            });
        });
        
        await batch.commit();

    } catch (error) {
        console.error("Erro ao pagar fatura do cartão: ", error);
        throw new Error("Ocorreu um erro ao processar o pagamento da fatura.");
    }
};
