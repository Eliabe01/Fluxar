
import { db } from '@/lib/firebase';
import {
    collection,
    addDoc,
    Timestamp
} from 'firebase/firestore';

export interface Badge {
    id: string;
    name: string;
    label: string;
    awardedAt: Timestamp;
}

export type NewBadge = Omit<Badge, 'id'>;

export const addBadge = async (userId: string, badge: NewBadge) => {
    if (!userId) {
        throw new Error("Usuário não autenticado.");
    }
    await addDoc(collection(db, 'users', userId, 'badges'), badge);
};
