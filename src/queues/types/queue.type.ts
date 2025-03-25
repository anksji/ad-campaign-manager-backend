export enum QueueTypes {
  CAMPAIGN_QUEUE = "campaign-queue",
  CAMPAIGN_SCHEDULE_QUEUE = "campaign-schedule-queue",
  NOTIFICATION = "notification",
  USER_DATA = "user-data",
  BUSINESS_QUEUE = "business-queue",
  INFLUENCER_QUEUE = "influencer-queue",
  PROMOTION_QUEUE = "promotion-queue",
  CHAT = "chat",
  BID_QUEUE = "bid-queue",
  MEETING_QUEUE = "meeting-queue",
  PAYMENT_QUEUE = "payment-queue",
  COUPON_QUEUE = "coupon-queue",
  EMAIL_QUEUE = "email-queue",
}

export enum JobPriority {
  CRITICAL = 1,
  HIGH = 2,
  MEDIUM = 5,
  LOW = 10,
}

export interface CampaignJobData {
  jobType: string;
  userId?: string;
  data: any;
  requestId: string;
}

export interface ScheduleUpdateJob {
  jobType: "update-next-activations";
  batchSize?: number;
}
