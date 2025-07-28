import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import admin from 'firebase-admin';

let adminApp: App;

function initializeFirebaseAdmin() {
  // Se já foi inicializado, retorna a instância existente
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // PRODUÇÃO: Usar variáveis de ambiente (SEGURO)
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_CLIENT_EMAIL
  ) {
    console.log('🔐 Inicializando Firebase Admin com variáveis de ambiente...');
    try {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      adminApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: privateKey,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
      console.log('✅ Firebase Admin inicializado com sucesso via env vars!');
      return adminApp;
    } catch (error) {
       console.error('❌ Erro crítico ao inicializar Firebase Admin com env vars:', error);
       throw new Error(`Falha na inicialização do Firebase com variáveis de ambiente: ${error.message}`);
    }
  }

  // DESENVOLVIMENTO LOCAL: Usar arquivo service-account.json
  try {
    console.log('🔧 Tentando usar arquivo local service-account.json para desenvolvimento...');
    const serviceAccount = require('../../service-account.json');
    adminApp = initializeApp({
      credential: cert(serviceAccount),
    });
    console.log('✅ Firebase Admin inicializado com arquivo local!');
    return adminApp;
  } catch (fileError) {
    console.error('❌ Erro ao carregar service-account.json:', fileError.message);
  }
  
  // TENTATIVA FINAL: Usar credenciais padrão da aplicação (para emuladores ou infraestrutura GCP)
  try {
      console.log('ℹ️ Tentando usar Application Default Credentials...');
      adminApp = initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      console.log('✅ Firebase Admin inicializado com Application Default Credentials!');
      return adminApp;
  } catch (defaultError) {
      console.error('❌ Erro ao usar Application Default Credentials:', defaultError.message);
  }

  throw new Error(
    'Configuração do Firebase Admin não encontrada. ' +
    'Configure as variáveis de ambiente (FIREBASE_PROJECT_ID, etc.) ou forneça um arquivo service-account.json.'
  );
}

// Inicializar Firebase Admin
adminApp = initializeFirebaseAdmin();

const db = getFirestore(adminApp);
const auth = getAuth(adminApp);

export { admin, db, auth };
