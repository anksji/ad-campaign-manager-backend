import CampaignModel from "@src/models/campaign.model";
import { ServiceResponse } from "@src/types/interfaces/service.response.type";
import { getCampaignStatus } from "@src/utils/date.utils";

class CampaignCoreService {
  /**
   * Get campaigns with optional parameters
   */
  async getCampaigns({
    page = 1,
    limit = 10,
    title,
    type,
    status,
  }: {
    page: number;
    limit: number;
    title?: string;
    type?: string;
    status?: string;
  }): Promise<ServiceResponse> {
    try {
      const query: any = {};
      const now = new Date();

      if (title) {
        try {
          query.title = { $regex: title, $options: "i" };
        } catch (err) {
          console.warn(
            "Regex search failed, falling back to simple matching",
            err
          );
          query.title = title;
        }
      }

      if (type) {
        query.type = type;
      }

      if (status) {
        switch (status) {
          case "active":
            query.startDate = { $lte: now };
            query.endDate = { $gte: now };
            break;
          case "upcoming":
            query.startDate = { $gt: now };
            break;
          case "ended":
            query.endDate = { $lt: now };
            break;
        }
      }

      console.log("Query filter:", JSON.stringify(query, null, 2));

      // Get total count for pagination
      const total = await CampaignModel.countDocuments(query);

      const campaigns = await CampaignModel.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const formattedCampaigns = campaigns.map((campaign) => ({
        id: campaign.campaignId,
        title: campaign.title,
        purpose: campaign.purpose,
        type: campaign.type,
        startDate: campaign.startDate.toISOString(),
        endDate: campaign.endDate.toISOString(),
        schedule: campaign.schedule,
        nextActivation: campaign.nextActivation?.toISOString(),
        status: getCampaignStatus(now, campaign.startDate, campaign.endDate),
        createdAt: campaign.createdAt.toISOString(),
        updatedAt: campaign.updatedAt.toISOString(),
      }));

      return {
        success: true,
        message: "Campaigns retrieved successfully",
        status: 200,
        data: formattedCampaigns,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      console.error("Error retrieving campaigns:", error);
      return {
        success: false,
        message: error.message || "Failed to retrieve campaigns",
        status: 500,
        error: error,
      };
    }
  }
}

// Create a singleton instance
const campaignCoreService = new CampaignCoreService();
export default campaignCoreService;
