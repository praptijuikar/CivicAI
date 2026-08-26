import admin from "firebase-admin";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
const databaseURL = process.env.FIREBASE_DATABASE_URL;

let isFirebaseInitialized = false;

if (projectId && clientEmail && privateKey && databaseURL && !projectId.includes("your-firebase")) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      databaseURL,
    });
    console.log("[Firebase] Successfully initialized Firebase Admin SDK");
    isFirebaseInitialized = true;
  } catch (error) {
    console.error("[Firebase] Initialization error:", error);
  }
} else {
  console.warn("[Firebase] Credentials missing or placeholder. Running in Local Mock Mode.");
}

export const firebaseApp = isFirebaseInitialized ? admin.app() : null;
export const firebaseDb = isFirebaseInitialized ? admin.database() : null;
