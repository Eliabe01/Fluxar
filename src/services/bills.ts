
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp, query, onSnapshot, doc, deleteDoc, orderBy, updateDoc } from 'firebase/firestore';
import { addTransaction } from './transactions';
import { addMonths } from 'date-fns';

export interface Bill {
    id: string;
    description: string;
    value: number;
    dueDate: Date | Timestamp;
    barcode?: string;
    status: 'pending' | 'paid' | 'scheduled' | 'cancelled';
    recurrent: boolean;
    recurrenceEndDate?: Date | Timestamp;
    lastPaymentDate?: Date | Timestamp;
    scheduledPaymentDate?: Date | Timestamp;
    createdAt: Timestamp;
}

export type NewBill = Omit<Bill, 'id' | 'createdAt' | 'lastPaymentDate'>;
export type BillUpdate = Partial<Omit<Bill, 'id' | 'createdAt'>>;

export const addBill = async (userId: string, bill: NewBill): Promise<string> => {
    if (!userId) {
        throw new Error("Usuário não autenticado.");
    }
    const docRef = await addDoc(collection(db, 'users', userId, 'bills'), {
        ...bill,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
};

export const getBills = (userId: string, callback: (bills: Bill[]) => void): (() => void) => {
    if (!userId) {
        callback([]);
        return () => {};
    }
    const q = query(collection(db, 'users', userId, 'bills'), orderBy('dueDate', 'asc'));
    return onSnapshot(q, (snapshot) => {
        const bills: Bill[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                dueDate: (data.dueDate as Timestamp).toDate(),
                recurrenceEndDate: data.recurrenceEndDate ? (data.recurrenceEndDate as Timestamp).toDate() : undefined,
                scheduledPaymentDate: data.scheduledPaymentDate ? (data.scheduledPaymentDate as Timestamp).toDate() : undefined,
            } as Bill;
        });
        callback(bills);
    });
};

export const updateBill = async (userId: string, billId: string, data: BillUpdate) => {
    if (!userId) throw new Error("Usuário não autenticado.");
    const docRef = doc(db, 'users', userId, 'bills', billId);
    await updateDoc(docRef, data);
};

export const deleteBill = async (userId: string, billId: string) => {
    if (!userId) throw new Error("Usuário não autenticado.");
    await deleteDoc(doc(db, 'users', userId, 'bills', billId));
};

export const payBill = async (userId: string, bill: Bill) => {
    if (!userId) throw new Error("Usuário não autenticado.");
    
    // 1. Create the transaction
    await addTransaction(userId, {
        type: 'expense',
        amount: bill.value,
        category: 'bills', // Using a generic category
        description: `Pagamento Boleto: ${bill.description}`,
        date: new Date(),
    });

    // 2. Update the bill status
    await updateBill(userId, bill.id, {
        status: 'paid',
        lastPaymentDate: new Date(),
    });

    // 3. If recurrent, create the next bill
    if (bill.recurrent) {
        const nextDueDate = addMonths(new Date(bill.dueDate), 1);
        
        // Check if the recurrence has an end date and if we've passed it
        if (bill.recurrenceEndDate && nextDueDate > new Date(bill.recurrenceEndDate)) {
            // Do not create next bill if past the end date
            return;
        }

        const newBill: NewBill = {
            description: bill.description,
            value: bill.value,
            dueDate: nextDueDate,
            barcode: bill.barcode,
            status: 'pending',
            recurrent: bill.recurrent,
            recurrenceEndDate: bill.recurrenceEndDate,
        };
        
        await addBill(userId, newBill);
    }
};
