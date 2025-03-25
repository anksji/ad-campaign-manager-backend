import mongoose, { Schema, Model } from "mongoose";
import {
  CampaignType,
  ICampaignDocument,
  WeekDay,
} from "@src/types/interfaces/campaign.types";

const TimeSlotSchema = new Schema(
  {
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
  },
  { _id: true }
);

const ScheduleItemSchema = new Schema(
  {
    weekday: {
      type: String,
      required: true,
      enum: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
    },
    timeSlots: {
      type: [TimeSlotSchema],
      required: true,
      validate: {
        validator: function (timeSlots: any[]) {
          return timeSlots.length > 0;
        },
        message: "At least one time slot is required",
      },
    },
  },
  { _id: true }
);

const CampaignSchema = new Schema<ICampaignDocument>(
  {
    campaignId: {
      type: String,
      default: function (this: any) {
        return this._id.toString();
      },
      unique: true,
      index: true,
    },
    title: {
      // New field
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    purpose: {
      // New field
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["Cost per Order", "Cost per Click", "Buy One Get One"],
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
      validate: {
        validator: function (this: any, endDate: Date) {
          return endDate >= this.startDate;
        },
        message: "End date must be greater than or equal to start date",
      },
    },
    schedule: {
      type: [ScheduleItemSchema],
      required: true,
      validate: {
        validator: function (schedule: any[]) {
          return schedule.length > 0;
        },
        message: "At least one schedule item is required",
      },
    },
    nextActivation: {
      type: Date,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret.campaignId;
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

CampaignSchema.index({ type: 1, isActive: 1 });
CampaignSchema.index({ startDate: 1, endDate: 1 });
CampaignSchema.index({ nextActivation: 1, isActive: 1 });
CampaignSchema.index({ title: "text" });

// Calculate the next activation time before saving
CampaignSchema.pre<ICampaignDocument>("save", function (next) {
  // The calculation of next activation will be handled by the scheduler service
  // to avoid duplicating complex logic
  this.updatedAt = new Date();
  next();
});

const CampaignModel: Model<ICampaignDocument> =
  mongoose.model<ICampaignDocument>("Campaign", CampaignSchema);

export default CampaignModel;
