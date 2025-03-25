import { NextFunction, Response } from "express";
import createHttpError from "http-errors";
import { JobPriority, QueueTypes } from "@src/queues/types/queue.type";
import { queueManagerService } from "@src/queues/QueueManager.service";
import campaignCoreService from "./campaign.core.service";
import { IAuthRequest } from "@src/types/interfaces/auth.type";

export class CampaignService {
  constructor(
    private coreService = campaignCoreService,
    private queueManager = queueManagerService
  ) {}

  /**
   * Get all campaigns with optional filtering and pagination
   */
  async getCampaigns(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, title, type, status } = req.query;

      const result = await this.coreService.getCampaigns({
        page: Number(page),
        limit: Number(limit),
        title: title as string,
        type: type as string,
        status: status as string,
      });

      return res.status(result.status || 200).json(result);
    } catch (error: any) {
      console.error("Error in getCampaigns:", error);
      return next(
        createHttpError(500, error.message || "Something went wrong")
      );
    }
  }

  /**
   * Create a new campaign
   */
  async createCampaign(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const jobData = {
        jobType: "create-campaign",
        userId: req.user?.userId,
        data: {
          ...req.body,
        },
        requestId: "",
      };

      const result = await this.queueManager.processWithOpenConnection(
        QueueTypes.CAMPAIGN_QUEUE,
        jobData,
        { priority: JobPriority.HIGH }
      );

      return res.status(result.status || 201).json(result);
    } catch (error: any) {
      console.error("Error in createCampaign:", error);
      return next(
        createHttpError(500, error.message || "Something went wrong")
      );
    }
  }

  /**
   * Update an existing campaign
   */
  async updateCampaign(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const jobData = {
        jobType: "update-campaign",
        userId: req.user?.userId,
        data: {
          campaignId: req.params.id,
          ...req.body,
        },
        requestId: "",
      };

      const result = await this.queueManager.processWithOpenConnection(
        QueueTypes.CAMPAIGN_QUEUE,
        jobData,
        { priority: JobPriority.HIGH }
      );

      return res.status(result.status || 200).json(result);
    } catch (error: any) {
      console.error("Error in updateCampaign:", error);
      return next(
        createHttpError(500, error.message || "Something went wrong")
      );
    }
  }

  /**
   * Delete a campaign
   */
  async deleteCampaign(req: IAuthRequest, res: Response, next: NextFunction) {
    try {
      const jobData = {
        jobType: "delete-campaign",
        userId: req.user?.userId,
        data: {
          campaignId: req.params.id,
        },
        requestId: "",
      };

      const result = await this.queueManager.processWithOpenConnection(
        QueueTypes.CAMPAIGN_QUEUE,
        jobData,
        { priority: JobPriority.MEDIUM }
      );

      return res.status(result.status || 200).json(result);
    } catch (error: any) {
      console.error("Error in deleteCampaign:", error);
      return next(
        createHttpError(500, error.message || "Something went wrong")
      );
    }
  }
}

const campaignService = new CampaignService();
export default campaignService;

// Create wrapper functions for controller compatibility
export const getCampaignsService = (req: any, res: any, next: any) =>
  campaignService.getCampaigns(req, res, next);
export const createCampaignService = (req: any, res: any, next: any) =>
  campaignService.createCampaign(req, res, next);
export const updateCampaignService = (req: any, res: any, next: any) =>
  campaignService.updateCampaign(req, res, next);
export const deleteCampaignService = (req: any, res: any, next: any) =>
  campaignService.deleteCampaign(req, res, next);
