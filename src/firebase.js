// Import the functions you need from the SDKs you need
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAkUnrSNDfjsDloyo6_RB7uzMxPXLDiGLA",
  authDomain: "academicai-2f636.firebaseapp.com",
  projectId: "academicai-2f636",
  storageBucket: "academicai-2f636.firebasestorage.app",
  messagingSenderId: "712031171709",
  appId: "1:712031171709:web:3d5b629dd1d451d8682d14"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

let appCheck;
if (typeof window !== "undefined") {
    if (import.meta.env.DEV) {
        self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }

    const siteKey = import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY;
    if (siteKey) {
        try {
            appCheck = initializeAppCheck(app, {
                provider: new ReCaptchaEnterpriseProvider(siteKey),
                isTokenAutoRefreshEnabled: true
            });
        } catch (error) {
            console.warn("App Check no pudo inicializarse:", error);
        }
    }
}

const ai = getAI(app, {
    backend: new GoogleAIBackend()
});

export const model = getGenerativeModel(ai, {
    model: "gemini-3.8-flash"
});
export const auth = getAuth(app);
export const db = getFirestore(app);