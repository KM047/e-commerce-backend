import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.utils.js";
import { asyncHandler } from "../utils/asyncHandler.utils.js";

const errorHandler = (err, req, res, next) => {
    let error = err;
    if (!(error instanceof ApiError)) {
        const statusCode =
            res.statusCode || error instanceof mongoose.error ? 400 : 500;
        const message = error.message || "Something went wrong";

        error = new ApiError(
            statusCode,
            message,
            error?.errors || [],
            err.stack
        );
    }

    const response = {
        ...error,
        ...(process.env.NODE_ENV === "production"
            ? { stack: error.stack }
            : {}),
    };
};

export { errorHandler };
