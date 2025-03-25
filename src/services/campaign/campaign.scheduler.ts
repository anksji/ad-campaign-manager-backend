import { queueManagerService } from "@src/queues/QueueManager.service";
import { JobPriority, QueueTypes } from "@src/queues/types/queue.type";
import { CronJob } from "cron";

/**
 * CampaignSchedulerService handles background tasks related to campaign scheduling:
 * 1. Updates next activation times for campaigns on a schedule
 * 2. Initializes cron jobs for campaign-related tasks
 */
export class CampaignSchedulerService {
  private static instance: CampaignSchedulerService;
  private cronJobs: Map<string, CronJob> = new Map();

  private constructor() {
    // Initialize cron jobs on service creation
    this.initializeCronJobs();
  }

  public static getInstance(): CampaignSchedulerService {
    if (!CampaignSchedulerService.instance) {
      CampaignSchedulerService.instance = new CampaignSchedulerService();
    }
    return CampaignSchedulerService.instance;
  }

  private initializeCronJobs(): void {
    // Update campaign next activation times every 15 minutes
    this.createCronJob(
      "update-next-activations",
      "*/15 * * * *", // Every 15 minutes
      async () => {
        await this.scheduleCampaignUpdates();
      }
    );
  }

  /**
   * Create and start a cron job
   */
  private createCronJob(
    jobId: string,
    cronPattern: string,
    callback: () => Promise<void>
  ): void {
    try {
      const job = new CronJob(
        cronPattern,
        async () => {
          try {
            await callback();
          } catch (error) {
            console.error(`Error in cron job ${jobId}:`, error);
          }
        },
        null, // onComplete
        true, // start
        "UTC" // universal timezone
      );

      this.cronJobs.set(jobId, job);
      console.log(`Cron job ${jobId} scheduled with pattern: ${cronPattern}`);
    } catch (error) {
      console.error(`Failed to create cron job ${jobId}:`, error);
    }
  }

  /**
   * Schedule batch updates for campaign next activation times
   */
  private async scheduleCampaignUpdates(
    batchSize: number = 100
  ): Promise<void> {
    try {
      // Queue job to update campaign next activation times
      await queueManagerService.processWithoutWaiting(
        QueueTypes.CAMPAIGN_SCHEDULE_QUEUE,
        {
          jobType: "update-next-activations",
          data: {
            batchSize,
          },
          requestId: "",
          userId: "system",
        },
        { priority: JobPriority.LOW }
      );
    } catch (error) {
      console.error("Error scheduling campaign updates:", error);
    }
  }

  /**
   * Stop all cron jobs
   */
  public stopAllJobs(): void {
    for (const [jobId, job] of this.cronJobs.entries()) {
      job.stop();
      console.log(`Stopped cron job: ${jobId}`);
    }
  }
}

// Export a singleton instance
export const campaignSchedulerService = CampaignSchedulerService.getInstance();
