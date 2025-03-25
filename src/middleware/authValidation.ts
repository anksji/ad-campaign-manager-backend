import { Response, NextFunction } from "express";
import { auth } from "firebase-admin";
import createHttpError from "http-errors";
import jwt from "jsonwebtoken";
import { IAuthRequest } from "@src/types/interfaces";

export const isFirebaseAuth = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    console.log(
      "New request with authorization header:",
      authHeader ? "Present" : "Not present"
    );

    // Check for Firebase auth token
    if (!authHeader || typeof authHeader !== "string") {
      throw createHttpError(401, "No authentication token provided");
    }

    // Get the ID token from the Authorization header
    const idToken = authHeader.split(" ")[1];

    if (!idToken) {
      throw createHttpError(401, "Invalid token format");
    }

    try {
      // Verify the ID token using Firebase Admin SDK
      const decodedToken = await auth().verifyIdToken(idToken);

      req.user = {
        firebaseUserId: decodedToken.uid,
        email: decodedToken.email,
        userId: decodedToken.uid,
      };

      next();
    } catch (error: any) {
      // Handle specific Firebase Auth errors
      if (error.code === "auth/id-token-expired") {
        throw createHttpError(401, "Token expired");
      } else if (error.code === "auth/id-token-revoked") {
        throw createHttpError(401, "Token revoked");
      } else {
        throw createHttpError(401, "Invalid token");
      }
    }
  } catch (error) {
    next(error);
  }
};
