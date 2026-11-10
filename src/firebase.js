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

if (import.meta.env.DEV) {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(
        import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY
    ),
    isTokenAutoRefreshEnabled: true
});

const ai = getAI(app, {
    backend: new GoogleAIBackend()
});

export const model = getGenerativeModel(ai, {
    model: "gemini-3.8-flash"
});
export const auth = getAuth(app);
export const db = getFirestore(app);