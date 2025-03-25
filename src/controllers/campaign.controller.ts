import { NextFunction, Request, Response } from "express";
import { IAuthRequest } from "@src/types/interfaces";
import {
  getCampaignsService,
  createCampaignService,
  updateCampaignService,
  deleteCampaignService,
} from "@src/services/campaign/campaign.service";

//controller
export const getCampaigns = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
) => {
  return getCampaignsService(req, res, next);
};

export const createCampaign = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
) => {
  return createCampaignService(req, res, next);
};

export const updateCampaign = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
) => {
  return updateCampaignService(req, res, next);
};

export const deleteCampaign = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
) => {
  return deleteCampaignService(req, res, next);
};
