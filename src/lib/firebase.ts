
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDwnUHoxlS4DnaOlZjlfv8Kh24D0MCzvnk",
  authDomain: "app-de-gerenciamento-1560b.firebaseapp.com",
  projectId: "app-de-gerenciamento-1560b",
  storageBucket: "app-de-gerenciamento-1560b.appspot.com",
  messagingSenderId: "803490002322",
  appId: "1:803490002322:web:598285329caf68df2dfd4b",
  measurementId: "G-T1FSRN01H8"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };
