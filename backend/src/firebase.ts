import admin from "firebase-admin";
import dotenv from "dotenv";
import path from "node:path";
import { readFileSync } from "node:fs";

const isRender = process.env.RENDER === "true";

console.log("is Render :", isRender);

const envPath = path.join(process.cwd(), "env", "env");

if (!isRender) {
  const result = dotenv.config({
    path: envPath,
  });

  console.log("Fichier env :", envPath);
  console.log("Erreur dotenv :", result.error ?? "aucune");
}

function loadServiceAccount(): admin.ServiceAccount {
  // =========================
  // LOCAL
  // =========================
  if (!isRender) {
    try {
      const rawFile = readFileSync(envPath, "utf8");

      // Récupère tout ce qui se trouve après :
      // FIREBASE_SERVICE_ACCOUNT=
      const match = rawFile.match(
        /^FIREBASE_SERVICE_ACCOUNT\s*=\s*(\{[\s\S]*\})\s*$/m
      );

      if (!match) {
        throw new Error(
          "FIREBASE_SERVICE_ACCOUNT introuvable dans env/env"
        );
      }

      return JSON.parse(match[1]);
    } catch (error) {
      throw new Error(
        `Impossible de charger FIREBASE_SERVICE_ACCOUNT depuis ${envPath}: ${error}`
      );
    }
  }

  // =========================
  // RENDER
  // =========================
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT introuvable dans les variables Render."
    );
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `FIREBASE_SERVICE_ACCOUNT n'est pas un JSON valide sur Render: ${error}`
    );
  }
}

function initFirebase() {
  if (admin.apps.length) {
    return admin;
  }

  const serviceAccount = loadServiceAccount();

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log(
    "Firebase Admin initialisé avec le projet :",
    serviceAccount.projectId || serviceAccount.project_id // (dif entre fichier api local est render var env sur render)
  );


  return admin;
}

export default initFirebase();