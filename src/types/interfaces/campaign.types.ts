import { Document } from "mongoose";

export type CampaignType =
  | "Cost per Order"
  | "Cost per Click"
  | "Buy One Get One";

export type WeekDay =
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

export interface TimeSlot {
  id?: string;
  startTime: string;
  endTime: string;
}

export interface ScheduleItem {
  id?: string;
  weekday: WeekDay;
  timeSlots: TimeSlot[];
}

export interface CreateCampaignDto {
  title: string;
  purpose: string;
  type: CampaignType;
  startDate: string;
  endDate: string;
  schedule: ScheduleItem[];
}

export type CampaignStatus = "active" | "upcoming" | "ended";

export interface ICampaignDocument extends Document {
  campaignId: string;
  title: string;
  purpose: string;
  type: CampaignType;
  startDate: Date;
  endDate: Date;
  schedule: ScheduleItem[];
  nextActivation?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
