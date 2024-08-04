import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDOMMzuNuWJTb7UmItf6EM__CY0nIGc-vo",
  authDomain: "inventory-management-450f6.firebaseapp.com",
  projectId: "inventory-management-450f6",
  storageBucket: "inventory-management-450f6",
  messagingSenderId: "587686532817",
  appId: "G-1Z81GVGGQF"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);
