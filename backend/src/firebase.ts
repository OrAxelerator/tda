import admin from "firebase-admin";
import dotenv from "dotenv";
import path from "node:path";
import { readFileSync } from "node:fs";

// Charger les variables d'environnement depuis /env/.env
dotenv.config({ path: path.join(process.cwd(), "env", ".env") });

function parseServiceAccountFromEnvFile() {
  const envFile = path.join(process.cwd(), "env", ".env");
  try {
    const raw = readFileSync(envFile, "utf8");
    const match = raw.match(/^FIREBASE_SERVICE_ACCOUNT\s*=\s*(\{[\s\S]*?\})/m);
    if (match?.[1]) {
      return JSON.parse(match[1]);
    }
  } catch (error) {
    console.error("Impossible de parser FIREBASE_SERVICE_ACCOUNT depuis env/.env:", error);
  }

  return undefined;
}

function loadServiceAccount() {
  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountString) {
    return undefined;
  }

  try {
    return JSON.parse(serviceAccountString);
  } catch {
    // support JSON with escaped newlines
    try {
      return JSON.parse(serviceAccountString.replace(/\\n/g, "\n"));
    } catch {
      return parseServiceAccountFromEnvFile();
    }
  }
}

function initFirebase() {
  if (admin.apps.length) return admin;

  try {
    const serviceAccount = loadServiceAccount();
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else if (credPath) {
      const fullPath = path.isAbsolute(credPath) ? credPath : path.join(process.cwd(), credPath);
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const serviceAccountFromFile = require(fullPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountFromFile),
      });
    } else {
      console.warn("Aucun service account Firebase renseigné, tentative d'authentification par défaut");
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    }

    console.log("firebase-admin initialisé (helper)");
  } catch (err) {
    console.error("Erreur initialisation firebase-admin (helper):", err);
  }

  return admin;
}

export default initFirebase();
