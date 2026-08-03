import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA-6wKmPe1kCAEMIvcp3xEUuDr1vdDsKEE",
  authDomain: "tour-de-l-as.firebaseapp.com",
  projectId: "tour-de-l-as",
  storageBucket: "tour-de-l-as.firebasestorage.app",
  messagingSenderId: "423461577162",
  appId: "1:423461577162:web:51ca4f2816cac746ffef33",
  measurementId: "G-06BWNFPB65",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export default app;
