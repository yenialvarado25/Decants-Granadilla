import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyB7SOtHdJ8r5QMsCyn5YGD-kxVIzOW4Zx0',
  authDomain: 'decants-granadilla.firebaseapp.com',
  projectId: 'decants-granadilla',
  storageBucket: 'decants-granadilla.firebasestorage.app',
  messagingSenderId: '596805107436',
  appId: '1:596805107436:web:b794d77de66b1e8c1eefc9',
  measurementId: 'G-5W5QPPQJ5E'
};

export const firebaseApp =
  getApps().length ? getApp() : initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);
