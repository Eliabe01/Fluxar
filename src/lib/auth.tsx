"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  getAuth, 
  onIdTokenChanged, 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  updateProfile,
  updatePassword,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, Timestamp, collection, query, where, limit } from 'firebase/firestore';
import { updateUserStreak } from '@/services/gamification';
import { resetUserData as resetUserDataAction } from '@/actions/account';

export type AppUser = User & {
    isAdmin?: boolean;
};

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'incomplete_expired';

export interface UserSubscription {
    id: string;
    priceId: string;
    status: SubscriptionStatus;
    collectionMethod: 'charge_automatically' | 'send_invoice';
    current_period_end: Timestamp;
    cancel_at_period_end: boolean;
}

export interface UserSubscriptionData {
  email?: string;
  stripeCustomerId?: string;
}


interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  subscription: UserSubscription | null;
  subscriptionStatus: SubscriptionStatus | null;
  signIn: (email:string, password:string) => Promise<any>;
  signUp: typeof createUserWithEmailAndPassword;
  signOut: () => Promise<void>;
  updateUserProfile: (data: { displayName?: string | null; }) => Promise<void>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  resetUserData: () => Promise<void>;
  reauthenticate: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);


  useEffect(() => {
    const unsubscribeAuth = onIdTokenChanged(auth, async (authUser) => {
      setLoading(true);
      if (authUser) {
        await updateUserStreak(authUser.uid);
        const tokenResult = await authUser.getIdTokenResult(true); // Force refresh of the token
        const userWithClaims: AppUser = {
            ...authUser,
            isAdmin: !!tokenResult.claims.admin,
        };
        setUser(userWithClaims);
      } else {
        setUser(null);
        setSubscription(null);
        setSubscriptionStatus(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    }

    const subscriptionsRef = collection(db, 'users', user.uid, 'subscriptions');
    const q = query(subscriptionsRef, where('status', 'in', ['active', 'trialing', 'past_due']), limit(1));

    const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
            const subDoc = snapshot.docs[0];
            const subData = subDoc.data() as Omit<UserSubscription, 'id'>;
            setSubscription({ id: subDoc.id, ...subData });
            setSubscriptionStatus(subData.status);
        } else {
            setSubscription(null);
            setSubscriptionStatus(null);
        }
        setLoading(false);
    }, (error) => {
        console.error("Error fetching subscription: ", error);
        setLoading(false);
    });

    return () => unsubscribeSnapshot();
}, [user]);
  
  const handleSignIn = async (email:string, password:string) => {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential;
  }

  const signOut = () => firebaseSignOut(auth);

  const updateUserProfile = async (data: { displayName?: string | null; }) => {
    if (auth.currentUser) {
        await updateProfile(auth.currentUser, data);
        await auth.currentUser.reload();
        
        const tokenResult = await auth.currentUser.getIdTokenResult(true);
        const updatedUser: AppUser = { ...auth.currentUser, isAdmin: !!tokenResult.claims.admin };
        setUser(updatedUser);

    } else {
        throw new Error("Usuário não encontrado para atualizar o perfil.");
    }
  };

  const updateUserPassword = async (currentPassword: string, newPassword: string) => {
    if (!auth.currentUser || !auth.currentUser.email) {
      throw new Error("Usuário não autenticado.");
    }
    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    
    await reauthenticateWithCredential(auth.currentUser, credential);
    await updatePassword(auth.currentUser, newPassword);
  };
  
  const handleSendPasswordResetEmail = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const handleResetUserData = async () => {
    if (!user) {
        throw new Error("Usuário não autenticado.");
    }
    await resetUserDataAction(user.uid);
  };
  
  const reauthenticate = async (password: string) => {
    if (!auth.currentUser || !auth.currentUser.email) {
      throw new Error("Usuário não autenticado para reautenticação.");
    }
    const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
    await reauthenticateWithCredential(auth.currentUser, credential);
  };


  const value = {
    user,
    loading,
    subscription,
    subscriptionStatus,
    signIn: handleSignIn,
    signUp: (email, password) => createUserWithEmailAndPassword(auth, email, password),
    signOut,
    updateUserProfile,
    updateUserPassword,
    sendPasswordResetEmail: handleSendPasswordResetEmail,
    resetUserData: handleResetUserData,
    reauthenticate,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
