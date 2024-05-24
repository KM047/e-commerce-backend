import { asyncHandler } from "../../utils/asyncHandler.utils.js";
import { ApiResponse } from "../../utils/ApiResponse.utils.js";
import { ApiError } from "../../utils/ApiError.utils.js";
import { User } from "./../../models/auth/user.models.js";
import { UserRolesEnum } from "../../constants.js";
import crypto from "crypto";
import { sendAccountVerificationEmail } from "../../utils/sendMail.js";
import {
    emailVerificationMailgenContent,
    sendEmail,
} from "../../utils/mails.js";

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

    //DONE: send email to the user for verification of email address

    // const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

    const { unHashedToken, hashedToken, tokenExpiry } =
        user.getVerificationToken();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;
    await user.save({ validateBeforeSave: true });

    const createdUser = await User.findOne(user._id).select(
        "-password -refreshToken"
    );

    //! sending mail using nodemailer, mailgen, mailtrap

    await sendEmail({
        email: user?.email,
        subject: "Please verify your email",
        mailgenContent: emailVerificationMailgenContent(
            user.username,
            `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`
        ),
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                201,
                createdUser,
                "User registered successfully. Please verify your email"
            )
        );
});

const verifyEmail = asyncHandler(async (req, res) => {
    try {
        const { verificationToken } = req.params;

        if (!verificationToken) {
            throw new ApiError(400, "Email verification token is missing");
        }

        let hashedToken = crypto
            .createHash("sha256")
            .update(verificationToken)
            .digest("hex");

        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpiry: { $gt: Date.now() },
        });

        if (!user) {
            throw new ApiError(489, "Token is invalid or expired");
        }

        (user.emailVerificationToken = undefined),
            (user.emailVerificationExpiry = undefined),
            (user.isEmailVerified = true);

        await user.save({ validateBeforeSave: false });

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { isEmailVerified: true },
                    "Email is verified successfully"
                )
            );
    } catch (error) {
        throw new ApiError(500, "Error while verifying email", error.message);
    }
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
        return res
            .status(200)
            .json(new ApiResponse(200, req.user, "Current logged in user"));
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
    verifyEmail,
    loginUser,
    logoutUser,
    updateUserAvatar,
    forgetPasswordRequest,
    resetForgetPassword,
    changeCurrentPassword,
    getCurrentUser,
};
