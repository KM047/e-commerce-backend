import mongoose, { Schema, model } from "mongoose";
import {
    AvailableUserRolesEnum,
    USER_VERIFICATION_TOKEN_EXPIRY,
    UserRolesEnum,
} from "../../constants.js";
import bcrypt from "bcrypt";
import { UserProfile } from "./../profile.models.js";
import { Cart } from "./../cart.models.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new Schema(
    {
        avatar: {
            type: "string",
            default: "https://placehold.co/200x200",
        },
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        role: {
            type: String,
            enum: AvailableUserRolesEnum,
            default: UserRolesEnum.USER,
            required: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },

        refreshToken: {
            type: String,
        },

        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        forgotPasswordToken: {
            type: String,
        },
        forgotPasswordExpiry: {
            type: Date,
        },
        emailVerificationToken: {
            type: String,
        },
        emailVerificationExpiry: {
            type: Date,
        },
    },
    { timestamps: true }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.post("save", async function (user, next) {
    const userProfile = await UserProfile.findOne(user._id);
    const userCart = await Cart.findOne(user._id);

    if (!userProfile) {
        await UserProfile.create({
            owner: user._id,
        });
    }

    if (!userCart) {
        await Cart.create({
            owner: user._id,
        });
    }

    next();
});

// methods for the password checking

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// generate the user access token

userSchema.methods.getUserAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            role: this.role,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
};

userSchema.methods.getUserRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
};

userSchema.methods.getVerificationToken = function () {
    const unHashedToken = crypto.randomBytes(20).toString("hex");

    const hashedToken = crypto
        .createHash("sha256")
        .update(unHashedToken)
        .digest("hex");

    const tokenExpiry = Date.now() + USER_VERIFICATION_TOKEN_EXPIRY;

    return { unHashedToken, hashedToken, tokenExpiry };
};

export const User = mongoose.model("User", userSchema);
