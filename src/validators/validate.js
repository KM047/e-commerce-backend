import { validationResult } from "express-validator";
import { ApiError } from "../utils/ApiError.utils.js";
export const validate = (req, res, next) => {
    const errors = validationResult(req);

    console.log(errors);

    if (errors.isEmpty()) {
        return next();
    }

    const extractedErrors = [];

    errors.array().map((err) => extractedErrors.push({ [err.path]: err.msg }));

    throw new ApiError("Received data is not valid ", extractedErrors);
};
