import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCxtC4d0TyPHQ_LsEoGeOmBSlHtreYSK7g",
  authDomain: "legal-ai-206f1.firebaseapp.com",
  projectId: "legal-ai-206f1",
  storageBucket: "legal-ai-206f1.firebasestorage.app",
  messagingSenderId: "1030289739424",
  appId: "1:1030289739424:web:86b52153daf878086283c5",
  measurementId: "G-L8YB6BY8NQ",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

let analyticsInstance: ReturnType<typeof getAnalytics> | null = null;

// Analytics is optional and only available in supported browser environments.
if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        analyticsInstance = getAnalytics(app);
      }
    })
    .catch(() => {
      analyticsInstance = null;
    });
}

export { analyticsInstance as analytics };
