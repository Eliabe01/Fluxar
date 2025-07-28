import { db } from '@/lib/firebase';
import { collection, addDoc, query, onSnapshot, doc, deleteDoc, where, getDocs, updateDoc } from 'firebase/firestore';

export interface Budget {
    id: string;
    category: string;
    amount: number;
    month: string; // YYYY-MM
}

export type NewBudget = Omit<Budget, 'id'>;

// Check if a budget for the category and month already exists
export const checkBudgetExists = async (userId: string, category: string, month: string): Promise<boolean> => {
    const q = query(
        collection(db, 'users', userId, 'budgets'),
        where('category', '==', category),
        where('month', '==', month)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
};

export const addBudget = async (userId: string, budget: NewBudget) => {
    if (!userId) {
        throw new Error("Usuário não autenticado.");
    }
    const exists = await checkBudgetExists(userId, budget.category, budget.month);
    if (exists) {
        const categoryLabels: { [key: string]: string } = {
            food: 'Alimentação',
            transport: 'Transporte',
            shopping: 'Compras',
            housing: 'Moradia',
            bills: 'Contas e Serviços',
            leisure: 'Lazer',
            health: 'Saúde',
            education: 'Educação',
            other: 'Outros'
        };
        throw new Error(`Já existe um orçamento para a categoria "${categoryLabels[budget.category] || budget.category}" neste mês.`);
    }
    await addDoc(collection(db, 'users', userId, 'budgets'), budget);
};

export const updateBudget = async (userId: string, budgetId: string, data: Partial<Omit<Budget, 'id' | 'month'>>) => {
    if (!userId) throw new Error("Usuário não autenticado.");
    const docRef = doc(db, 'users', userId, 'budgets', budgetId);
    await updateDoc(docRef, data);
};

export const getBudgets = (userId: string, month: string, callback: (budgets: Budget[]) => void) => {
    if (!userId) {
        callback([]);
        return () => {};
    }
    const q = query(
        collection(db, 'users', userId, 'budgets'),
        where('month', '==', month)
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const budgets: Budget[] = [];
        querySnapshot.forEach((doc) => {
            budgets.push({ id: doc.id, ...doc.data() } as Budget);
        });
        callback(budgets);
    }, (error) => {
        console.error("Erro ao buscar orçamentos: ", error);
        callback([]);
    });

    return unsubscribe;
};

export const deleteBudget = async (userId: string, budgetId: string) => {
    if (!userId) {
        throw new Error("Usuário não autenticado.");
    }
    await deleteDoc(doc(db, 'users', userId, 'budgets', budgetId));
};
