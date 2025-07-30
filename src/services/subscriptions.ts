
'use server';

import { Timestamp } from 'firebase/firestore';
import { db as adminDb, auth as adminAuth } from '@/lib/firebase-admin';
import Stripe from 'stripe';
import type { UserSubscription, UserSubscriptionData } from '@/lib/auth';

export { type UserSubscription, type UserSubscriptionData } from '@/lib/auth';

export interface PaymentHistoryEntry {
  id: string;
  amount: number;
  status: 'paid' | 'failed' | 'pending';
  date: Timestamp;
}

const getStripeInstance = () => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('A chave secreta do Stripe não está configurada.');
    }
    return new Stripe(secretKey, {
        apiVersion: '2024-04-10',
        typescript: true,
    });
}

// SERVER-SIDE FUNCTION
export const findOrCreateStripeCustomerId = async (userId: string, userEmail: string): Promise<string> => {
    if (!userId) throw new Error('User ID is required.');
    const userDocRef = adminDb.collection('users').doc(userId);
    
    try {
        const userDoc = await userDocRef.get();
        const userData = userDoc.data() as UserSubscriptionData | undefined;

        if (userData?.stripeCustomerId) {
            return userData.stripeCustomerId;
        }

        const stripe = getStripeInstance();

        const customer = await stripe.customers.create({
            email: userEmail,
            metadata: {
                firebaseUserId: userId,
            },
        });

        const newUserData: Partial<UserSubscriptionData> = {
            email: userEmail,
            stripeCustomerId: customer.id,
        };
        await userDocRef.set(newUserData, { merge: true });

        return customer.id;
    } catch (error: any) {
        console.error(`[findOrCreateStripeCustomerId] Failed for userId: ${userId}. Error: ${error.message}`);
        throw new Error(`Failed to find or create Stripe customer: ${error.message}`);
    }
};

export const updateUserSubscription = async (userId: string, subscriptionId: string, subscriptionData: Partial<UserSubscription>) => {
    if (!userId) throw new Error('User ID is required.');
    const subscriptionDocRef = adminDb.collection('users').doc(userId).collection('subscriptions').doc(subscriptionId);
    await subscriptionDocRef.set(subscriptionData, { merge: true });
};

export const getUserSubscription = async (userId: string, subscriptionId: string): Promise<UserSubscription | null> => {
    if (!userId) throw new Error('User ID is required.');
    const subscriptionDocRef = adminDb.collection('users').doc(userId).collection('subscriptions').doc(subscriptionId);
    const docSnap = await subscriptionDocRef.get();

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as UserSubscription;
    }
    
    return null;
}
