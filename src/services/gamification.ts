
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { isSameDay, subDays } from 'date-fns';

export interface UserGamification {
    streakDays: number;
    level: number;
    badges: string[];
    lastUpdated: Timestamp;
}

const getGamificationDocRef = (userId: string) => {
    return doc(db, 'users', userId, 'userGamification', 'data');
};

export const getUserGamification = async (userId: string): Promise<UserGamification> => {
    const docRef = getGamificationDocRef(userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return docSnap.data() as UserGamification;
    } else {
        // Create a default gamification document for a new user
        const defaultData: UserGamification = {
            streakDays: 0,
            level: 1,
            badges: [],
            lastUpdated: Timestamp.now(),
        };
        await setDoc(docRef, defaultData);
        return defaultData;
    }
};

export const updateUserStreak = async (userId: string) => {
    if (!userId) return;

    const docRef = getGamificationDocRef(userId);
    const gamificationData = await getUserGamification(userId);

    const today = new Date();
    const lastUpdatedDate = gamificationData.lastUpdated.toDate();

    // Do nothing if already updated today
    if (isSameDay(today, lastUpdatedDate)) {
        return;
    }

    const yesterday = subDays(today, 1);
    
    let newStreakDays = gamificationData.streakDays;

    if (isSameDay(yesterday, lastUpdatedDate)) {
        // Continued streak
        newStreakDays += 1;
    } else {
        // Streak is broken (more than 48h since last update), reset to 1
        newStreakDays = 1;
    }

    await updateDoc(docRef, {
        streakDays: newStreakDays,
        lastUpdated: Timestamp.now(),
    });

};
