import dotenv from "dotenv";
import { cleanEnv, str, port, num, bool } from "envalid";

// Load environment variables from .env file
dotenv.config();

// Validate and extract environment variables
export const environmentConfig = cleanEnv(process.env, {
  // Server
  NODE_ENV: str({
    choices: ["development", "test", "production"],
    default: "development",
  }),
  PORT: port({ default: 3000 }),

  // Database
  MONGODB_CONNECTION_STRING: str({ default: "" }),

  // Redis
  REDIS_HOST: str({ default: "localhost" }),
  REDIS_PORT: port({ default: 6379 }),
  REDIS_DB: num({ default: 0 }),
  REDIS_PASSWORD: str({ default: "", devDefault: "" }),

  // Queue concurrency
  CAMPAIGN_QUEUE_CONCURRENCY: str({ default: "5" }),
  CAMPAIGN_SCHEDULER_CONCURRENCY: str({ default: "2" }),

  // Auth
  ACCESS_TOKEN_SECRET_KEY: str({ default: "campaign-manager-secret-key" }),
  COOKIE_SECRET: str({ default: "campaign-manager-cookie-secret" }),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: num({ default: 300000 }), // 5 minutes
  RATE_LIMIT_MAX: num({ default: 200 }), // Max requests per window
});
