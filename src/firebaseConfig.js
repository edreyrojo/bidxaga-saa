import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyClV_LoLEjLFxvmp7KlDirY6DUdgDp-v4w",
    authDomain: "bidxaga-saa.firebaseapp.com",
    projectId: "bidxaga-saa",
    storageBucket: "bidxaga-saa.firebasestorage.app",
    messagingSenderId: "928544193414",
    appId: "1:928544193414:web:3b09460529d9aba5234a07"
};
const app = initializeApp(firebaseConfig);

// ¡AQUÍ ESTÁ LA CLAVE! Debe llevar "export" y llamarse exactamente "db"
export const db = getFirestore(app);