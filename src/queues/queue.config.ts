import { environmentConfig } from "@src/config/env.variables.config";

export const queueConfig = {
  // Redis connection options - simple configuration for this project
  connection: {
    host: environmentConfig.REDIS_HOST || "localhost",
    port: environmentConfig.REDIS_PORT ? environmentConfig.REDIS_PORT : 6379,
    ...(environmentConfig.NODE_ENV === "production" &&
    environmentConfig.REDIS_PASSWORD
      ? { password: environmentConfig.REDIS_PASSWORD }
      : {}),
    db: environmentConfig.REDIS_DB ? environmentConfig.REDIS_DB : 0,
    maxRetriesPerRequest: 10,
    enableReadyCheck: false,
  },

  // Default concurrency for each queue
  defaultConcurrency: {
    "campaign-queue": parseInt(
      environmentConfig.CAMPAIGN_QUEUE_CONCURRENCY || "5"
    ),
    "campaign-schedule-queue": parseInt(
      environmentConfig.CAMPAIGN_SCHEDULER_CONCURRENCY || "2"
    ),
  },

  // Queue settings
  settings: {
    stalledInterval: 30000,
    maxAttempts: 3,
    backoffStrategy: "exponential",
    removeOnComplete: 100,
    removeOnFail: 1000 * 60 * 60 * 24, // 24 hours
  },
};
