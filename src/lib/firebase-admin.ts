
import admin from 'firebase-admin';

// This check prevents re-initializing the app in hot-reload environments
if (!admin.apps.length) {
  try {
    // When the GOOGLE_APPLICATION_CREDENTIALS environment variable is set,
    // this will automatically use the correct service account credentials.
    // This is the recommended approach for both local emulation and production.
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    console.log('Firebase Admin SDK initialized successfully using Application Default Credentials.');
  } catch (error: any) {
    console.error('Firebase Admin initialization error:', error.stack);
    // Provide a helpful error message if the environment variable is not set.
    console.error('This error is often caused by a missing GOOGLE_APPLICATION_CREDENTIALS environment variable. Please ensure it is set to the path of your service account key file.');
  }
}

const db = admin.firestore();
const auth = admin.auth();

export { admin, db, auth };
