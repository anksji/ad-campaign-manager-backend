import Bull from "bull";
import { v4 as uuidv4 } from "uuid";
import { environmentConfig } from "@src/config/env.variables.config";
import { queueConfig } from "./queue.config";
import { ServiceResponse } from "@src/types/interfaces/service.response.type";
import { QueueTypes } from "./types/queue.type";

export enum JobPriority {
  CRITICAL = 1,
  HIGH = 2,
  MEDIUM = 5,
  LOW = 10,
}

export interface JobOptions {
  priority?: JobPriority;
  timeout?: number;
  delay?: number;
  attempts?: number;
}

export class QueueManagerService {
  private static instance: QueueManagerService;
  private queues: Map<QueueTypes, Bull.Queue> = new Map();
  private openRequests: Map<string, { resolve: Function; reject: Function }> =
    new Map();

  private constructor() {
    // Simple Redis connection configuration for this project
    const redisOptions = queueConfig.connection;
    this.initializeQueues(redisOptions);
  }

  private initializeQueues(redisOptions: any): void {
    // Create queues for just the two types needed
    const queueTypes = [
      QueueTypes.CAMPAIGN_QUEUE,
      QueueTypes.CAMPAIGN_SCHEDULE_QUEUE,
    ];

    for (const queueType of queueTypes) {
      const queue = new Bull(queueType, {
        redis: redisOptions,
        defaultJobOptions: {
          attempts: queueConfig.settings.maxAttempts,
          backoff: {
            type: queueConfig.settings.backoffStrategy as any,
            delay: 5000,
          },
          removeOnComplete: queueConfig.settings.removeOnComplete,
          removeOnFail: queueConfig.settings.removeOnFail,
        },
      });

      this.queues.set(queueType, queue);

      // Set up event handlers
      queue.on("completed", (job, result) => {
        this.resolveOpenRequest(job.id.toString(), result);
      });

      queue.on("failed", (job, error) => {
        this.rejectOpenRequest(job.id.toString(), error);
      });

      queue.on("error", (error) => {
        console.error(`Queue ${queueType} error:`, error);
      });
    }
  }

  public static getInstance(): QueueManagerService {
    if (!QueueManagerService.instance) {
      QueueManagerService.instance = new QueueManagerService();
    }
    return QueueManagerService.instance;
  }

  /**
   * Process a job with an open connection and optional delay
   * Returns a Promise that resolves when the job completes
   */
  public async processWithOpenConnection<T, R extends ServiceResponse>(
    queueType: QueueTypes,
    data: T,
    options: JobOptions = {}
  ): Promise<R> {
    const queue = this.queues.get(queueType);
    if (!queue) {
      throw new Error(`Queue ${queueType} not found`);
    }

    // Add unique ID to identify the job
    const jobData = {
      ...data,
      requestId: uuidv4(),
    };

    // Create a promise that will resolve when the job completes
    const jobPromise = new Promise<R>((resolve, reject) => {
      const job = queue.add(jobData, {
        priority: options.priority || JobPriority.MEDIUM,
        timeout: options.timeout || 30000, // 30 second default timeout
        delay: options.delay || 0,
        attempts: options.attempts || queueConfig.settings.maxAttempts,
      });

      job
        .then((createdJob) => {
          // For delayed jobs, we handle differently - we don't want to timeout on the client side
          if (options.delay && options.delay > 0) {
            // For delayed jobs, we resolve immediately as they'll run later
            resolve({
              success: true,
              message: `Job scheduled to run in ${options.delay}ms`,
              status: 202,
              data: { jobId: createdJob.id },
            } as unknown as R);
          } else {
            // For immediate jobs, we store the resolve/reject functions to be called when job completes
            this.openRequests.set(createdJob.id.toString(), {
              resolve,
              reject,
            });

            // Set a timeout to prevent hanging connections
            const timeoutMs = options.timeout || 30000;
            setTimeout(() => {
              const request = this.openRequests.get(createdJob.id.toString());
              if (request) {
                this.openRequests.delete(createdJob.id.toString());
                reject(new Error(`Job timed out after ${timeoutMs}ms`));
              }
            }, timeoutMs);
          }
        })
        .catch(reject);
    });

    return jobPromise;
  }

  /**
   * Process a job without waiting for the result
   * Useful for fire-and-forget operations
   */
  public async processWithoutWaiting<T>(
    queueType: QueueTypes,
    data: T,
    options: JobOptions = {}
  ): Promise<{ jobId: string }> {
    const queue = this.queues.get(queueType);
    if (!queue) {
      throw new Error(`Queue ${queueType} not found`);
    }

    // Add unique ID to identify the job
    const jobData = {
      ...data,
      requestId: uuidv4(),
    };

    const job = await queue.add(jobData, {
      priority: options.priority || JobPriority.MEDIUM,
      delay: options.delay || 0,
      attempts: options.attempts || queueConfig.settings.maxAttempts,
    });

    return { jobId: job.id.toString() };
  }

  private resolveOpenRequest(jobId: string, result: any): void {
    const request = this.openRequests.get(jobId);
    if (request) {
      this.openRequests.delete(jobId);
      request.resolve(result);
    }
  }

  private rejectOpenRequest(jobId: string, error: Error): void {
    const request = this.openRequests.get(jobId);
    if (request) {
      this.openRequests.delete(jobId);
      request.reject(error);
    }
  }

  public registerProcessor<T, R>(
    queueType: QueueTypes,
    processor: (job: Bull.Job<T>) => Promise<R>,
    concurrency: number = 5
  ): void {
    const queue = this.queues.get(queueType);
    if (!queue) {
      throw new Error(`Queue ${queueType} not found`);
    }

    // Use provided concurrency
    queue.process(concurrency, processor);
  }

  public async closeAll(): Promise<void> {
    const promises = Array.from(this.queues.values()).map((queue) =>
      queue.close()
    );
    await Promise.all(promises);

    // Reject any remaining open requests
    for (const [jobId, request] of this.openRequests.entries()) {
      request.reject(new Error("Server shutting down"));
      this.openRequests.delete(jobId);
    }
  }

  public getQueue(queueType: QueueTypes): Bull.Queue {
    const queue = this.queues.get(queueType);
    if (!queue) {
      throw new Error(`Queue ${queueType} not found`);
    }
    return queue;
  }

  public getQueues(): Bull.Queue[] {
    return Array.from(this.queues.values());
  }

  /**
   * Get job status by ID
   */
  public async getJobStatus(
    queueType: QueueTypes,
    jobId: string
  ): Promise<string> {
    const queue = this.queues.get(queueType);
    if (!queue) {
      throw new Error(`Queue ${queueType} not found`);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      return "not_found";
    }

    const state = await job.getState();
    return state;
  }

  /**
   * Cancel a scheduled job by ID
   */
  public async cancelJob(
    queueType: QueueTypes,
    jobId: string
  ): Promise<boolean> {
    const queue = this.queues.get(queueType);
    if (!queue) {
      throw new Error(`Queue ${queueType} not found`);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      return false;
    }

    await job.remove();
    return true;
  }
}

// Export a singleton instance
export const queueManagerService = QueueManagerService.getInstance();
