'use server';

import { Timestamp } from 'firebase-admin/firestore';
import { addDays } from 'date-fns';
import { db as adminDb, auth as adminAuth } from '@/lib/firebase-admin';

export async function activatePixPlan(input: { plan: 'bronze' | 'prata' | 'ouro'; userId: string }): Promise<{ success: boolean; message: string }> {
    const { plan, userId } = input;
    try {
        const endDate = addDays(new Date(), 30);
        const subscriptionId = `pix-${Date.now()}`;
        const priceIdKey = `STRIPE_PIX_PRICE_ID_${plan.toUpperCase()}` as keyof NodeJS.ProcessEnv;
        const priceId = process.env[priceIdKey] || `admin_granted_${plan}`;

        const subscriptionData = {
            id: subscriptionId,
            priceId,
            status: 'active',
            collectionMethod: 'send_invoice',
            current_period_end: Timestamp.fromDate(endDate),
            cancel_at_period_end: false,
        };

        // 1. Salvar assinatura no Firestore
        const subscriptionDocRef = adminDb
            .collection('users')
            .doc(userId)
            .collection('subscriptions')
            .doc(subscriptionId);
        await subscriptionDocRef.set(subscriptionData, { merge: true });

        // 2. Atualizar custom claims no Firebase Auth (para atualizar o token JWT)
        await adminAuth.setCustomUserClaims(userId, {
            plan,
            status: 'active',
        });

        // 3. Salvar plan no documento principal do usuário
        await adminDb.collection('users').doc(userId).set(
            { plan, planStatus: 'active', planExpiry: Timestamp.fromDate(endDate) },
            { merge: true }
        );

        console.log(`[Admin] Plano ${plan} ativado para usuário ${userId}.`);
        return { success: true, message: 'Plano ativado com sucesso por 30 dias!' };
    } catch (error: any) {
        console.error('[Admin] Erro ao ativar plano:', error);
        return { success: false, message: error.message || 'Falha ao ativar o plano.' };
    }
}
