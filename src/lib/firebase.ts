import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

// Public web app identifiers. Authorization is enforced by Authentication
// and Firestore rules, never by hiding this configuration.
const firebaseConfig = {
  apiKey: 'AIzaSyBTNWbcE2RgNsV86I6-kAnycmDQowPDyxo',
  authDomain: 'active-personalizados.firebaseapp.com',
  projectId: 'active-personalizados',
  storageBucket: 'active-personalizados.firebasestorage.app',
  messagingSenderId: '885259913241',
  appId: '1:885259913241:web:6144b10d8932a0096d4288',
};

const emulators = import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';
if (emulators) Object.assign(firebaseConfig, { projectId: 'demo-active', apiKey: 'demo-key', authDomain: 'localhost' });

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

if (emulators) { connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true }); connectFirestoreEmulator(db, "127.0.0.1", 8080); }
