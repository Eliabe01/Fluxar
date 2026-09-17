
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import admin from 'firebase-admin';

let adminApp: App;

if (!getApps().length) {
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
            // Método preferencial: JSON completo em base64 (sem problemas de formatação)
            const serviceAccount = JSON.parse(
                Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8')
            );
            adminApp = initializeApp({ credential: cert(serviceAccount) });
            console.log('✅ Firebase Admin inicializado via FIREBASE_SERVICE_ACCOUNT_BASE64!');
        } else {
            // Fallback: variáveis individuais
            const privateKey = process.env.FIREBASE_PRIVATE_KEY;
            if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
                throw new Error("Variáveis de ambiente do Firebase Admin não estão definidas.");
            }
            adminApp = initializeApp({
                credential: cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: privateKey.replace(/\\n/g, '\n'),
                }),
            });
            console.log('✅ Firebase Admin inicializado via variáveis individuais!');
        }
    } catch (error: any) {
        console.error('❌ Erro ao inicializar Firebase Admin:', error.message);
        throw new Error(`Falha na inicialização do Firebase: ${error.message}`);
    }
} else {
    adminApp = getApps()[0];
}

const db = getFirestore(adminApp);
const auth = getAuth(adminApp);

export { admin, db, auth };
