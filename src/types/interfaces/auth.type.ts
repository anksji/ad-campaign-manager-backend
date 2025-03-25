import { Request } from "express";
import "express-session";

export interface IAuthUser {
  firebaseUserId?: string;
  email?: string;
  userId?: string;
}

export interface IAuthRequest extends Request {
  headers: {
    authorization?: string;
    Authorization?: string;
    "x-node-access-token"?: string;
    "X-Node-Access-Token"?: string;
  };
  cookies: { authToken?: string; accessToken?: string; refreshToken?: string };
  user?: IAuthUser;
}
