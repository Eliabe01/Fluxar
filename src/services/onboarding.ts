
import { db } from '@/lib/firebase';
import {
    collection,
    doc,
    getDocs,
    writeBatch,
    Timestamp,
    onSnapshot,
    updateDoc
} from 'firebase/firestore';
import { addBadge } from './badges';

export interface OnboardingTask {
    id: string;
    name: string;
    label: string;
    completed: boolean;
    completedAt?: Timestamp;
}

const initialTasks: Omit<OnboardingTask, 'id' | 'completed' | 'completedAt'>[] = [
    { name: 'add_fixed_income', label: 'Adicionar seu primeiro ganho fixo' },
    { name: 'add_first_expense', label: 'Registrar sua primeira despesa' },
    { name: 'explore_dashboard', label: 'Explorar o painel de controle' },
    { name: 'create_dream', label: 'Criar seu primeiro sonho financeiro' },
];

export const initializeOnboardingTasks = async (userId: string) => {
    if (!userId) return;

    const onboardingCollectionRef = collection(db, 'users', userId, 'onboarding');
    const snapshot = await getDocs(onboardingCollectionRef);

    // If the collection is not empty, it means onboarding has already been initialized.
    if (!snapshot.empty) {
        return;
    }

    const batch = writeBatch(db);
    initialTasks.forEach(task => {
        const docRef = doc(onboardingCollectionRef, task.name);
        batch.set(docRef, {
            ...task,
            completed: false,
        });
    });

    await batch.commit();
};

export const getOnboardingTasks = (userId: string, callback: (tasks: OnboardingTask[]) => void) => {
    if (!userId) {
        callback([]);
        return () => {};
    }

    const onboardingCollectionRef = collection(db, 'users', userId, 'onboarding');
    const unsubscribe = onSnapshot(onboardingCollectionRef, (snapshot) => {
        const tasks: OnboardingTask[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as OnboardingTask));
        callback(tasks);
    });

    return unsubscribe;
};

export const updateOnboardingTask = async (userId: string, taskName: string) => {
    if (!userId) return;

    const taskRef = doc(db, 'users', userId, 'onboarding', taskName);
    
    // Check if task is already completed to avoid re-triggering
    const taskDoc = await getDocs(collection(db, 'users', userId, 'onboarding'));
    const task = taskDoc.docs.find(d => d.id === taskName)?.data() as OnboardingTask;
    if(task.completed) return;

    await updateDoc(taskRef, {
        completed: true,
        completedAt: Timestamp.now(),
    });

    // Award a badge for completing the task
    await addBadge(userId, {
        name: taskName,
        label: `Completou: ${task.label}`,
        awardedAt: Timestamp.now(),
    });
};
