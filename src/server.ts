import { environmentConfig, connectDB } from "./config";
import app from "./app";
import { queueManagerService } from "./queues/QueueManager.service";
import { QueueTypes } from "./queues/types/queue.type";
import { CampaignProcessorService } from "./queues/processors/CampaignProcessor.service";
import { campaignSchedulerService } from "./services/campaign/campaign.scheduler";
import { firebaseManager } from "./config/firebase.config";

const startServer = async () => {
  try {
    console.log("Starting server in single-process mode...");

    // Initialize Firebase if needed
    await firebaseManager.initialize();

    // Connect to database
    await connectDB();
    console.log("Connected to MongoDB");

    // Register queue processors
    queueManagerService.registerProcessor(
      QueueTypes.CAMPAIGN_QUEUE,
      CampaignProcessorService.process,
      2
    );

    queueManagerService.registerProcessor(
      QueueTypes.CAMPAIGN_SCHEDULE_QUEUE,
      CampaignProcessorService.process,
      1
    );

    // Start the campaign scheduler service
    campaignSchedulerService;

    // Start the Express server
    const server = app.listen(environmentConfig.PORT, () => {
      console.log(`Server started on port ${environmentConfig.PORT}`);
    });

    // Configure graceful shutdown
    const gracefulShutdown = async () => {
      console.log("Starting graceful shutdown...");

      // Stop campaign scheduler
      campaignSchedulerService.stopAllJobs();
      console.log("Stopped campaign scheduler");

      // Close queue connections
      try {
        await queueManagerService.closeAll();
        console.log("Closed queue connections");
      } catch (queueError) {
        console.error("Error closing queue connections:", queueError);
      }

      // Close HTTP server
      server.close(async () => {
        console.log("Server closed successfully");
        process.exit(0);
      });

      // Safety timeout
      setTimeout(() => {
        console.error("Could not close gracefully, forcing exit");
        process.exit(1);
      }, 15000);
    };

    // Register shutdown handlers
    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);

    // Handle uncaught errors
    process.on("uncaughtException", (error) => {
      console.error("Uncaught exception:", error);
      gracefulShutdown();
    });

    process.on("unhandledRejection", (error) => {
      console.error("Unhandled rejection:", error);
      gracefulShutdown();
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();
