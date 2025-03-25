import { Job } from "bull";
import CampaignModel from "@src/models/campaign.model";
import { calculateNextActivation } from "@src/utils/date.utils";
import { ServiceResponse } from "@src/types/interfaces/service.response.type";
import mongoose from "mongoose";
import { ICampaignDocument } from "@src/types/interfaces/campaign.types";
import { QueueTypes } from "../types/queue.type";

interface CampaignJobData {
  jobType: string;
  userId?: string;
  data: any;
  requestId: string;
}

/**
 * CampaignProcessorService handles all background processing related to campaigns
 * This includes creating, updating, and deleting campaigns, as well as scheduling tasks
 */
export class CampaignProcessorService {
  /**
   * Main processor function that handles all job types
   * This is the entry point called by Bull when processing jobs with queue
   *
   * @param job The Bull job object containing job data
   * @returns A ServiceResponse object with status, message, and optional data
   */
  public static async process(
    job: Job<CampaignJobData>
  ): Promise<ServiceResponse> {
    const { jobType, data, userId } = job.data;

    console.log(
      `Processing ${jobType} job for user ${userId || "system"} with ID ${
        job.id
      }`
    );

    try {
      switch (jobType) {
        case "create-campaign":
          return await CampaignProcessorService.createCampaign(data);

        case "update-campaign":
          return await CampaignProcessorService.updateCampaign(data);

        case "delete-campaign":
          return await CampaignProcessorService.deleteCampaign(data);

        case "update-next-activations":
          return await CampaignProcessorService.updateNextActivations(data);

        default:
          throw new Error(`Unknown job type: ${jobType}`);
      }
    } catch (error: any) {
      console.error(`Error processing ${jobType} job:`, error);

      // Return a standardized error response
      return {
        success: false,
        message: error.message || "An error occurred while processing the job",
        status: error.status || 500,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Creates a new campaign with the provided data
   *
   * @param data Campaign data including title, purpose, type, dates, and schedule
   * @param userId Optional ID of the user creating the campaign
   * @returns ServiceResponse with the created campaign or error details
   */
  private static async createCampaign(data: any): Promise<ServiceResponse> {
    try {
      const { title, purpose, type, startDate, endDate, schedule } = data;

      // Create a new campaign document with the provided data
      const campaign = new CampaignModel({
        title,
        purpose,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        schedule,
      });

      // Calculate the next time this campaign will be active based on its schedule
      const nextActivation = calculateNextActivation(
        new Date(),
        new Date(endDate),
        schedule
      );

      // Set the next activation time if one was calculated
      if (nextActivation) {
        campaign.nextActivation = nextActivation;
      }

      // Save the campaign to the database
      await campaign.save();

      // Return a success response with the created campaign data
      return {
        success: true,
        message: "Campaign created successfully",
        status: 201,
        data: CampaignProcessorService.formatCampaignResponse(campaign),
      };
    } catch (error: any) {
      console.error("Error creating campaign:", error);

      // Special handling for validation errors
      if (error instanceof mongoose.Error.ValidationError) {
        return {
          success: false,
          message: "Validation error",
          status: 400,
          error: error.message,
        };
      } else {
        // Re-throw any other errors to be caught by the main process handler
        throw error;
      }
    }
  }

  /**
   * Updates an existing campaign with new data
   *
   * @param data Updated campaign data and campaignId
   * @returns ServiceResponse with the updated campaign or error details
   */
  private static async updateCampaign(data: any): Promise<ServiceResponse> {
    try {
      const { campaignId, title, purpose, type, startDate, endDate, schedule } =
        data;

      // Find the campaign by ID
      const campaign = await CampaignModel.findOne({ campaignId });

      // Return a 404 response if the campaign doesn't exist
      if (!campaign) {
        return {
          success: false,
          message: "Campaign not found",
          status: 404,
        };
      }

      // Update the campaign fields with new data
      campaign.title = title;
      campaign.purpose = purpose;
      campaign.type = type;
      campaign.startDate = new Date(startDate);
      campaign.endDate = new Date(endDate);
      campaign.schedule = schedule;

      // Recalculate the next activation time based on the new schedule
      const nextActivation = calculateNextActivation(
        new Date(),
        new Date(endDate),
        schedule
      );

      // Update the next activation time or clear it if none was calculated
      campaign.nextActivation = nextActivation || undefined;

      // Save the updated campaign
      await campaign.save();

      // Return a success response with the updated campaign data
      return {
        success: true,
        message: "Campaign updated successfully",
        status: 200,
        data: CampaignProcessorService.formatCampaignResponse(campaign),
      };
    } catch (error: any) {
      console.error("Error updating campaign:", error);

      // Special handling for validation errors
      if (error instanceof mongoose.Error.ValidationError) {
        return {
          success: false,
          message: "Validation error",
          status: 400,
          error: error.message,
        };
      } else {
        // Re-throw any other errors to be caught by the main process handler
        throw error;
      }
    }
  }

  /**
   * Deletes a campaign from the database
   *
   * @param data Object containing the campaignId to delete
   * @returns ServiceResponse indicating success or failure
   */
  private static async deleteCampaign(data: any): Promise<ServiceResponse> {
    try {
      const { campaignId } = data;

      // Find and delete the campaign in one operation
      const campaign = await CampaignModel.findOneAndDelete({ campaignId });

      // If no campaign was found, return a 404 response
      if (!campaign) {
        return {
          success: false,
          message: "Campaign not found",
          status: 404,
        };
      }

      // Return a success response
      return {
        success: true,
        message: "Campaign deleted successfully",
        status: 200,
      };
    } catch (error: any) {
      console.error("Error deleting campaign:", error);
      throw error;
    }
  }

  /**
   * Updates next activation times for all active campaigns
   * This is typically run as a scheduled job to keep activation times current
   *
   * @param data Optional configuration like batchSize
   * @returns ServiceResponse with count of updated campaigns
   */
  private static async updateNextActivations(data: {
    batchSize?: number;
  }): Promise<ServiceResponse> {
    try {
      const now = new Date();
      const batchSize = data.batchSize || 100;

      // Find campaigns that need their nextActivation updated:
      // 1. End date is in the future (campaign not expired)
      // 2. Next activation is in the past or not set
      const campaigns = await CampaignModel.find({
        $and: [
          { endDate: { $gte: now } }, // End date is in the future
          {
            $or: [
              { nextActivation: { $lte: now } }, // Next activation is in the past
              { nextActivation: { $exists: false } }, // No next activation set
            ],
          },
        ],
      }).limit(batchSize);

      let updatedCount = 0;

      // Process each campaign and update its next activation time
      for (const campaign of campaigns) {
        // Calculate the next activation time based on current time and schedule
        const nextActivation = calculateNextActivation(
          now,
          new Date(campaign.endDate),
          campaign.schedule
        );

        if (nextActivation) {
          // If there's a new activation time, update it
          campaign.nextActivation = nextActivation;
          await campaign.save();
          updatedCount++;
        } else if (campaign.nextActivation) {
          // If there is no next activation but one was previously set, clear it
          campaign.nextActivation = undefined;
          await campaign.save();
          updatedCount++;
        }
      }
      console.log("current corn job update count is ", updatedCount);

      // Return a success response with the count of updated campaigns
      return {
        success: true,
        message: `Updated next activation times for ${updatedCount} campaigns`,
        status: 200,
        data: { updatedCount },
      };
    } catch (error: any) {
      console.error("Error updating next activations:", error);
      throw error;
    }
  }

  /**
   * Formats a campaign document for API response
   * Converts MongoDB document to a clean JSON object
   *
   * @param campaign The campaign document from MongoDB
   * @returns A formatted campaign object suitable for API responses
   */
  private static formatCampaignResponse(campaign: ICampaignDocument): any {
    return {
      id: campaign.campaignId,
      title: campaign.title,
      purpose: campaign.purpose,
      type: campaign.type,
      startDate: campaign.startDate.toISOString(),
      endDate: campaign.endDate.toISOString(),
      schedule: campaign.schedule,
      nextActivation: campaign.nextActivation?.toISOString(),
      createdAt: campaign.createdAt.toISOString(),
      updatedAt: campaign.updatedAt.toISOString(),
    };
  }
}
