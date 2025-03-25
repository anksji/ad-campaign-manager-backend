import express from "express";

import healthCheckRoute from "@src/routes/healthCheck.routes";
import campaignRoutes from "@src/routes/campaign.routes";

const router = express.Router();

router.use("/apiHealth", healthCheckRoute);
router.use("/campaigns", campaignRoutes);

router.get("/", (req, res) => {
  res.send("**********Current api version 1**********");
});
export default router;
