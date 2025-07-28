
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp, query, onSnapshot, doc, deleteDoc, orderBy, updateDoc, writeBatch, getDocs } from 'firebase/firestore';
import { addTransaction } from './transactions';

export interface FixedExpense {
    id: string;
    description: string;
    amount: number;
    category: string;
    createdAt: Timestamp;
    lastPaidMonth?: string; // Format: YYYY-MM
}

export type NewFixedExpense = Omit<FixedExpense, 'id' | 'createdAt' | 'lastPaidMonth'>;

export const addFixedExpense = async (userId: string, expense: NewFixedExpense) => {
    if (!userId) {
        throw new Error("Usuário não autenticado.");
    }
    await addDoc(collection(db, 'users', userId, 'fixedExpenses'), {
        ...expense,
        createdAt: serverTimestamp()
    });
};

export const getFixedExpenses = (userId: string, callback: (expenses: FixedExpense[]) => void) => {
    if (!userId) {
        callback([]);
        return () => {};
    }
    const q = query(collection(db, 'users', userId, 'fixedExpenses'), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const expenses: FixedExpense[] = [];
        querySnapshot.forEach((doc) => {
            expenses.push({ id: doc.id, ...doc.data() } as FixedExpense);
        });
        callback(expenses);
    }, (error) => {
        console.error("Erro ao buscar despesas fixas: ", error);
        callback([]);
    });
    return unsubscribe;
};

export const payFixedExpense = async (userId: string, expense: FixedExpense, month: string, paymentDetails: { description?: string; date?: Date }) => {
    if (!userId) {
        throw new Error("Usuário não autenticado.");
    }
    
    const transactionDescription = paymentDetails.description?.trim() 
        ? paymentDetails.description 
        : `Pagamento Fixo: ${expense.description}`;

    // 1. Add a new expense transaction
    await addTransaction(userId, {
        type: 'expense',
        amount: expense.amount,
        category: expense.category,
        description: transactionDescription,
        date: paymentDetails.date || new Date(),
    });

    // 2. Mark expense as paid for the month
    const docRef = doc(db, 'users', userId, 'fixedExpenses', expense.id);
    await updateDoc(docRef, { lastPaidMonth: month });
};

export const payAllFixedExpenses = async (userId: string, month: string) => {
    if (!userId) {
        throw new Error("Usuário não autenticado.");
    }

    const expensesQuery = query(collection(db, 'users', userId, 'fixedExpenses'));
    const querySnapshot = await getDocs(expensesQuery);

    const expensesToPay: FixedExpense[] = [];
    querySnapshot.forEach(doc => {
        const expense = { id: doc.id, ...doc.data() } as FixedExpense;
        if (expense.lastPaidMonth !== month) {
            expensesToPay.push(expense);
        }
    });

    if (expensesToPay.length === 0) {
        // This case should be handled by disabling the button UI-side, but good to have a check.
        throw new Error("Nenhuma despesa fixa pendente encontrada para este mês.");
    }

    const totalToPay = expensesToPay.reduce((acc, expense) => acc + expense.amount, 0);

    try {
        await addTransaction(userId, {
            type: 'expense',
            amount: totalToPay,
            category: 'bills', // A generic category for this bulk payment
            description: 'Pagamento de Despesas Fixas do Mês',
            date: new Date(),
        });

        const batch = writeBatch(db);
        expensesToPay.forEach(expense => {
            const docRef = doc(db, 'users', userId, 'fixedExpenses', expense.id);
            batch.update(docRef, { lastPaidMonth: month });
        });

        await batch.commit();

    } catch (error) {
        console.error("Erro ao pagar todas as despesas fixas:", error);
        throw new Error("Ocorreu um erro ao processar o pagamento em lote das despesas fixas.");
    }
};

export const deleteFixedExpense = async (userId: string, expenseId: string) => {
    if (!userId) {
        throw new Error("Usuário não autenticado.");
    }
    await deleteDoc(doc(db, 'users', userId, 'fixedExpenses', expenseId));
};
