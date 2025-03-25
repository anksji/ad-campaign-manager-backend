import Joi from "joi";

export const campaignSchema = {
  createCampaign: Joi.object({
    type: Joi.string()
      .valid("Cost per Order", "Cost per Click", "Buy One Get One")
      .required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().greater(Joi.ref("startDate")).required(),
    schedule: Joi.array()
      .items(
        Joi.object({
          weekday: Joi.string()
            .valid(
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday"
            )
            .required(),
          timeSlots: Joi.array()
            .items(
              Joi.object({
                startTime: Joi.string()
                  .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
                  .required(),
                endTime: Joi.string()
                  .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
                  .required(),
              })
            )
            .min(1)
            .required(),
        })
      )
      .min(1)
      .required(),
  }),

  updateCampaign: Joi.object({
    type: Joi.string()
      .valid("Cost per Order", "Cost per Click", "Buy One Get One")
      .required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().greater(Joi.ref("startDate")).required(),
    schedule: Joi.array()
      .items(
        Joi.object({
          weekday: Joi.string()
            .valid(
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday"
            )
            .required(),
          timeSlots: Joi.array()
            .items(
              Joi.object({
                startTime: Joi.string()
                  .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
                  .required(),
                endTime: Joi.string()
                  .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
                  .required(),
              })
            )
            .min(1)
            .required(),
        })
      )
      .min(1)
      .required(),
  }),
};

export default campaignSchema;
