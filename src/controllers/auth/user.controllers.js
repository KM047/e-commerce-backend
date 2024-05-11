import { asyncHandler } from "../../utils/asyncHandler.utils.js";
import { ApiResponse } from "../../utils/ApiResponse.utils.js";
import { ApiError } from "../../utils/ApiError.utils.js";
import { User } from "./../../models/auth/user.models.js";
import { UserRolesEnum } from "../../constants.js";
import crypto from "crypto";


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.getAccessToken();
        const newRefreshToken = user.getRefreshToken();

        user.refreshToken = newRefreshToken;

        await user.save({ validateBeforeSave: false });

        return { accessToken, newRefreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating refresh and access tokens."
        );
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const { email, username, password, role } = req.body;

    console.log(email);

    const exitedUser = await User.findOne({
        $or: [{ email, username }],
    });

    if (exitedUser) {
        throw new ApiError(401, "User with email or username already exists");
    }

    const user = await User.create({
        email,
        username,
        password,
        role: role || UserRolesEnum.USER,
    });

    if (!user) {
        throw new ApiError(500, "Error while creating user");
    }

    const createdUser = await User.findOne(user._id).select(
        "-password -refreshToken"
    );

    return res
        .status(200)
        .json(new ApiResponse(201, createdUser, "User created successfully"));
});

export { registerUser };
