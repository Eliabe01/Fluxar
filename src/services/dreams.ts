
import { db } from '@/lib/firebase';
import {
    collection,
    query,
    onSnapshot,
    orderBy,
    Timestamp,
} from 'firebase/firestore';

export interface Dream {
    id: string;
    title: string;
    targetAmount: number;
    currentAmount: number;
    dueDate: Timestamp;
    imageURL: string;
    imagePath: string;
    createdAt: Timestamp;
}

export const getDreams = (userId: string, callback: (dreams: Dream[]) => void) => {
    if (!userId) {
        callback([]);
        return () => {};
    }
    const q = query(collection(db, 'users', userId, 'dreams'), orderBy('dueDate', 'asc'));
    return onSnapshot(q, (snapshot) => {
        const dreams: Dream[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as Dream));
        callback(dreams);
    });
};
