import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // <--- 1. Importamos getAuth

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

// App Check es gratuito con reCAPTCHA v3. Se activa solo si existe la site key.
const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

if (recaptchaSiteKey) {
    try {
        initializeAppCheck(app, {
            provider: new ReCaptchaV3Provider(recaptchaSiteKey),
            isTokenAutoRefreshEnabled: true,
        });
    } catch (error) {
        console.error('No se pudo inicializar App Check:', error);
    }
} else if (import.meta.env.DEV) {
    console.warn('App Check no está configurado. Define VITE_RECAPTCHA_SITE_KEY para probarlo.');
}

// Exportamos la base de datos y la autenticación
export const db = getFirestore(app);
export const auth = getAuth(app); // <--- 2. Exportamos auth
