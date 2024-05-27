import { validationResult } from "express-validator";
import { ApiError } from "../utils/ApiError.utils.js";
import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { errorHandler } from "../middlewares/error.middleware.js";

export const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
        return next();
    }

    const extractedErrors = [];

    errors.array().map((err) => extractedErrors.push({ [err.path]: err.msg }));

    throw new ApiError("Received data is not valid ", extractedErrors);
};
