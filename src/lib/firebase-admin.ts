import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const app =
  getApps().length === 0
    ? initializeApp({
        credential: cert({
          projectId: process.env.AUTH_FIREBASE_PROJECT_ID,
          clientEmail: process.env.AUTH_FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.AUTH_FIREBASE_PRIVATE_KEY!.replaceAll(
            "\\n",
            "\n",
          ),
        }),
      })
    : getApp();

const db = getFirestore(app);

export { app, db };