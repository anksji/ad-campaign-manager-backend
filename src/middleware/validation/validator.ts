import createHttpError from "http-errors";
import { NextFunction } from "express";
import Joi from "joi";

const validator = async (
  schemaName: Joi.ObjectSchema,
  body: object,
  next: NextFunction
) => {
  try {
    const { error, value } = (await schemaName.validate(body, {
      abortEarly: false, // include all errors
      allowUnknown: true, // ignore unknown props
      stripUnknown: true, // remove unknown props
    })) as Joi.ValidationResult<any>;

    if (error) {
      const errorMessage = error.details
        .map((detail: Joi.ValidationErrorItem) => detail.message)
        .join(", ");
      return next(createHttpError(400, errorMessage));
    }

    next();
  } catch (error) {
    console.log(error);
    next(createHttpError(500, "Internal Server Error!"));
  }
};

export default validator;
