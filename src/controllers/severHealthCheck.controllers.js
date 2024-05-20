import { asyncHandler } from "./../utils/asyncHandler.utils.js";
import { ApiResponse } from "./../utils/ApiResponse.utils.js";
import { ApiError } from "./../utils/ApiError.utils.js";

const serverHealth = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(201, "Ok", "Server Health is ok"));
});

export { serverHealth };
