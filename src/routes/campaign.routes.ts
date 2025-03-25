import { Router } from "express";
import { isFirebaseAuth } from "@src/middleware/authValidation";
import {
  getCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
} from "@src/controllers/campaign.controller";
import {
  validateCreateCampaign,
  validateUpdateCampaign,
} from "@src/middleware/validation/campaignValidation";

const router = Router();

// Apply authentication middleware to all routes
router.use(isFirebaseAuth);

// Campaign routes
router.get("/", getCampaigns);
router.post("/", validateCreateCampaign, createCampaign);
router.put("/:id", validateUpdateCampaign, updateCampaign);
router.delete("/:id", deleteCampaign);

export default router;
