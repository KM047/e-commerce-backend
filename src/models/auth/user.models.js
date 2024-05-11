import mongoose, { Schema, model } from "mongoose";
import { AvailableUserRolesEnum, UserRolesEnum } from "../../constants.js";
import bcrypt from "bcrypt";
import { UserProfile } from "./../profile.models.js";
import { Cart } from "./../cart.models.js";
import jwt from "jsonwebtoken";

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
        forgotPasswordToken: {
            type: String,
        },
        forgotPasswordExpiry: {
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

userSchema.methods.getUserRefreshToken = async function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
};

export const User = mongoose.model("User", userSchema);
