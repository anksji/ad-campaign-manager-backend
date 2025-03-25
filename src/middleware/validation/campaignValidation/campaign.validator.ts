import { RequestHandler } from "express";
import validator from "../validator";
import campaignSchema from "./campaign.schema";

// Middleware for campaign creation validation
export const validateCreateCampaign: RequestHandler = (req, res, next) => {
  return validator(campaignSchema.createCampaign, req.body, next);
};

// Middleware for campaign update validation
export const validateUpdateCampaign: RequestHandler = (req, res, next) => {
  return validator(campaignSchema.updateCampaign, req.body, next);
};

export default {
  validateCreateCampaign,
  validateUpdateCampaign,
};
