import { getAuth } from "firebase/auth";
import { app } from "./firebase-app";

export const auth = getAuth(app);
