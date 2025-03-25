import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import compression from "compression";
import { environmentConfig } from "./config/env.variables.config";
import api from "./api/index";
import {
  notFoundMiddleware,
  errorHandlerMiddleware,
} from "./middleware/errors";

// Create Express application.
const app: express.Application = express();

// Enable compression for all routes
app.use(compression());

// Apply security headers
app.use(helmet());

// Apply CORS
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:3003",
        "https://ad-campaign-manager-bftmgdv6w-ankitraj-dwivedis-projects.vercel.app",
        "https://ad-campaign-manager-three.vercel.app",
        ...(process.env.ALLOWED_ORIGINS?.split(",") || []),
      ];

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

// Apply rate limiting to API routes
app.use(
  "/api/v1/",
  rateLimit({
    windowMs: environmentConfig.RATE_LIMIT_WINDOW_MS,
    max: environmentConfig.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      status: 429,
      message: "Too many requests from this IP, please try again later.",
    },
  })
);

// MongoDB data sanitization
app.use(
  mongoSanitize({
    allowDots: true,
    replaceWith: "_",
  })
);

// Additional security headers
app.use((req, res, next) => {
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// Body parsing middleware
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// Cookie parser
app.use(cookieParser(environmentConfig.COOKIE_SECRET));

// Logging in non-test environments
if (environmentConfig.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Log HTTP method
app.use((req, res, next) => {
  console.log(`HTTPS METHOD = ${req.method} PATH = ${req.path}`);
  next();
});

// Mount API routes
app.use("/api/v1", api);

// Handle 404 and errors
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

export default app;
