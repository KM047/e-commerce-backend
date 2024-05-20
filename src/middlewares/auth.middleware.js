import { User } from "../models/auth/user.models.js";
import { ApiError } from "../utils/ApiError.utils.js";
import { asyncHandler } from "../utils/asyncHandler.utils.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token =
            (await req.cookies?.accessToken) ||
            req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(400, "Unauthorized request");
        }

        // console.log("token" + token);

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken._id).select(
            "-password -accessToken"
        );

        if (!user) {
            throw new ApiError(400, "Invalid access token");
        }

        // console.log(user);

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token");
    }
});
