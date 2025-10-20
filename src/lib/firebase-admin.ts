
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import admin from 'firebase-admin';

let adminApp: App;

if (!getApps().length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
        throw new Error("As variáveis de ambiente do Firebase Admin não estão completamente definidas.");
    }
    
    try {
        adminApp = initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey.replace(/\\n/g, '\n'),
            }),
        });
        console.log('✅ Firebase Admin inicializado com sucesso via variáveis de ambiente!');
    } catch (error: any) {
        console.error('❌ Erro crítico ao inicializar Firebase Admin:', error.message);
        // Em um ambiente de produção, isso deve impedir o build/deploy
        throw new Error(`Falha na inicialização do Firebase: ${error.message}`);
    }
} else {
  adminApp = getApps()[0];
}

const db = getFirestore(adminApp);
const auth = getAuth(adminApp);

export { admin, db, auth };
