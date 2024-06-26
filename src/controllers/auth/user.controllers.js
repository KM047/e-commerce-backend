import { asyncHandler } from "../../utils/asyncHandler.utils.js";
import { ApiResponse } from "../../utils/ApiResponse.utils.js";
import { ApiError } from "../../utils/ApiError.utils.js";
import { User } from "./../../models/auth/user.models.js";
import { UserRolesEnum } from "../../constants.js";
import crypto from "crypto";
import {
    emailVerificationMailgenContent,
    forgotPasswordMailgenContent,
    sendEmail,
} from "../../utils/mails.js";
import {
    deleteFileInCloudinary,
    uploadOnCloudinary,
} from "../../utils/cloudinary.utils.js";
import { log } from "console";

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

const resendEmailVerificationMailgenContent = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.user?._id);

        if (user.isEmailVerified) {
            throw new ApiError(403, "Email is already verified");
        }

        const { unHashedToken, hashedToken, tokenExpiry } =
            user.getVerificationToken();

        user.emailVerificationToken = hashedToken;
        user.emailVerificationExpiry = tokenExpiry;
        await user.save({ validateBeforeSave: true });

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
            .json(new ApiResponse(201, {}, "Mail sent to you email address"));
    } catch (error) {
        throw new ApiError(403, error.message || "Error while resending email");
    }
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

        user.emailVerificationToken = undefined;
        user.emailVerificationExpiry = undefined;
        user.isEmailVerified = true;

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
        throw new ApiError(500, error.message || "Error while verifying email");
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
        // console.log(req.user);
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
        const { email } = req.body;

        // if (!verifyTokenForPasswordReset) {
        //     throw new ApiError(
        //         401,
        //         "Invalid token or verification token is required"
        //     );
        // }

        const user = await User.findOne({ email });

        if (!user) {
            throw new ApiError(401, "User not found with given email");
        }

        const { unHashedToken, hashedToken, tokenExpiry } =
            user.getVerificationToken();

        (user.forgotPasswordToken = hashedToken),
            (user.forgotPasswordExpiry = tokenExpiry);
        await user.save({ validateBeforeSave: false });

        await sendEmail({
            email: user?.email,
            subject: "Reset your forget password request",
            mailgenContent: forgotPasswordMailgenContent(
                user.username,
                `${req.protocol}://${req.get("host")}/api/v1/users/reset-password/${unHashedToken}`
            ),
        });

        return res
            .status(200)
            .json(
                new ApiResponse(
                    201,
                    {},
                    "Reset Password request send successfully, check your email"
                )
            );
    } catch (error) {
        throw new ApiError(
            500,
            error.message || "Error while sending forgot password request"
        );
    }
});

const resetForgetPassword = asyncHandler(async (req, res) => {
    try {
        const { resetToken } = req.params;
        const { newPassword } = req.body;

        const hashedToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        const user = await User.findOne({
            forgotPasswordToken: hashedToken,
            forgotPasswordExpiry: { $gt: Date.now() },
        });

        if (!user) {
            throw new ApiError(403, "Invalid token or user not found");
        }

        user.forgotPasswordToken = undefined;
        user.forgotPasswordExpiry = undefined;

        user.password = newPassword;

        await user.save({ validateBeforeSave: false });

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Password updated successfully"));
    } catch (error) {
        throw new ApiError(500, "Error while resetting user password");
    }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        const user = await User.findById(req.user?._id);

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const isPasswordValid = await user.isPasswordCorrect(oldPassword);

        if (!isPasswordValid) {
            throw new ApiError(401, "Password is incorrect");
        }

        user.password = newPassword;

        await user.save({ validateBeforeSave: false });

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Password updated successfully"));
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
        if (!req.file?.path) {
            throw new ApiError(401, "File does not exist ooo");
        }

        // console.log(req.file.path);

        const avatarLocalPath  = req.file?.path;

        // using cloudinary for uploading files
        const avatar = await uploadOnCloudinary(avatarLocalPath);

        if (!avatar) {
            throw new ApiError(
                500,
                "Error while uploading avatar to cloudinary"
            );
        }

        const user = await User.findById(req.user._id);

        const updatedUser = await User.findOneAndUpdate(
            req.user?._id,
            {
                $set: {
                    avatar: avatar.url,
                },
            },
            {
                new: true,
            }
        ).select(
            "-password -refreshToken -emailVerificationToken -emailVerificationExpiry "
        );

        if (!updatedUser) {
            throw new ApiError(
                500,
                "User not found or error while updating the user avatar"
            );
        }

        if (user.avatar != "https://placehold.co/200x200") {
            await deleteFileInCloudinary(user.avatar);
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    updatedUser,
                    "User avatar updated successfully"
                )
            );
    } catch (error) {
        throw new ApiError(
            500,
            error.message || "Error while updating user avatar image"
        );
    }
});

export {
    registerUser,
    resendEmailVerificationMailgenContent,
    verifyEmail,
    loginUser,
    logoutUser,
    updateUserAvatar,
    forgetPasswordRequest,
    resetForgetPassword,
    changeCurrentPassword,
    getCurrentUser,
};
