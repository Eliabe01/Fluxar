import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import admin from 'firebase-admin';

let adminApp: App;

if (!getApps().length) {
    try {
        adminApp = initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
        console.log('✅ Firebase Admin inicializado com sucesso via variáveis de ambiente!');
    } catch (error: any) {
        console.error('❌ Erro crítico ao inicializar Firebase Admin:', error.message);
        // Em um ambiente de produção, é melhor lançar o erro para interromper o build se a configuração estiver faltando.
        throw new Error(`Falha na inicialização do Firebase: ${error.message}`);
    }
} else {
    adminApp = getApps()[0];
}


const db = getFirestore(adminApp);
const auth = getAuth(adminApp);

export { admin, db, auth };
