import * as admin from "firebase-admin";
import path from "path";

// Create a singleton to manage Firebase initialization
class FirebaseManager {
  private static instance: FirebaseManager;
  private _initialized: boolean = false;

  private constructor() {}

  public static getInstance(): FirebaseManager {
    if (!FirebaseManager.instance) {
      FirebaseManager.instance = new FirebaseManager();
    }
    return FirebaseManager.instance;
  }

  // Initialize Firebase synchronously
  public initialize(): void {
    if (this._initialized) return;

    try {
      // First, try to initialize from environment variable
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        console.log("Initializing Firebase from environment variable");
        const serviceAccount = JSON.parse(
          Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, "base64").toString()
        );

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      }
      // If no environment variable, fall back to file
      else {
        console.log("Initializing Firebase from service account file");
        const serviceAccountPath = path.resolve(
          __dirname,
          "./credentials/serviceAccountKey.json"
        );

        admin.initializeApp({
          credential: admin.credential.cert(require(serviceAccountPath)),
        });
      }

      this._initialized = true;
      console.log("Firebase initialized successfully");
    } catch (error) {
      console.error("Firebase initialization failed:", error);

      if (error instanceof Error) {
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
          name: error.name,
        });
      }

      throw error;
    }
  }

  // Check if Firebase is initialized
  public get isInitialized(): boolean {
    return this._initialized;
  }
}

export const firebaseManager = FirebaseManager.getInstance();
