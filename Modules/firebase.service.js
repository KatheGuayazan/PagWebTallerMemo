const path = require('path');
const admin = require('firebase-admin');

// Cargar las credenciales desde env/serviceAccountKey.json
let serviceAccount;
try {
  serviceAccount = require("../env/serviceAccountKey.json");
} catch (error) {
  console.error("⚠️ No se encontró env/serviceAccountKey.json. Intenta cargar desde variables de entorno...");
  // Alternativa: usar variables de entorno
  serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
  };
}

// Validar que tenemos las credenciales necesarias
if (!serviceAccount.project_id || !serviceAccount.private_key) {
  throw new Error("❌ Error: Credenciales de Firebase no configuradas correctamente. Verifica env/serviceAccountKey.json o variables de entorno.");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount) 
});

const db = admin.firestore();

module.exports = db;