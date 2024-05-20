import { asyncHandler } from "../../utils/asyncHandler.utils.js";
import { ApiResponse } from "../../utils/ApiResponse.utils.js";
import { ApiError } from "../../utils/ApiError.utils.js";
import { User } from "./../../models/auth/user.models.js";
import { UserRolesEnum } from "../../constants.js";
import crypto from "crypto";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.getUserAccessToken();
        const newRefreshToken = user.getUserRefreshToken();

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

    //TODO: send email to the user for verification of email address

    const createdUser = await User.findOne(user._id).select(
        "-password -refreshToken"
    );

    return res
        .status(200)
        .json(new ApiResponse(201, createdUser, "User created successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username && !email) {
            throw new ApiError(401, "Username or email is required");
        }

        const user = await User.findOne({
            $or: [{ username }, { email }],
        });

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const isPasswordValid = await user.isPasswordCorrect(password);
        if (!isPasswordValid) {
            throw new ApiError(401, "Password is not correct");
        }

        const { accessToken, newRefreshToken } =
            await generateAccessAndRefreshTokens(user._id);

        const loggedInUser = await User.findById(user._id).select(
            "-password -refreshToken"
        );

        const options = {
            httpOnly: true,
            secure: true,
            expiresIn: Date.now() + 27 * 24 * 60 * 60, // 1 day
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { user: loggedInUser, accessToken, newRefreshToken },
                    "User logged in successfully"
                )
            );
    } catch (error) {
        throw new ApiError(500, error.message ?? "Error while logging in user");
    }
});

const logoutUser = asyncHandler(async (req, res) => {
    try {
        console.log(req.user);
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    refreshToken: undefined,
                },
            },
            {
                new: true,
            }
        );

        const options = {
            httpOnly: true,
            secure: true,
        };

        return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(new ApiResponse(200, {}, "User logged out successfully"));
    } catch (error) {
        throw new ApiError(
            500,
            error.message || "Error while logging out user"
        );
    }
});

const forgetPasswordRequest = asyncHandler(async (req, res) => {
    try {
    } catch (error) {
        throw new ApiError(500, "Error while sending forgot password request");
    }
});

const resetForgetPassword = asyncHandler(async (req, res) => {
    try {
    } catch (error) {
        throw new ApiError(500, "Error while resetting user password");
    }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    try {
    } catch (error) {
        throw new ApiError(500, "Error while updating user current password");
    }
});

const getCurrentUser = asyncHandler(async (req, res) => {
    try {
    } catch (error) {
        throw new ApiError(500, "Error while getting current user");
    }
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    try {
    } catch (error) {
        throw new ApiError(500, "Error while updating user avatar image");
    }
});

export {
    registerUser,
    loginUser,
    logoutUser,
    updateUserAvatar,
    forgetPasswordRequest,
    resetForgetPassword,
    changeCurrentPassword,
    getCurrentUser,
};
