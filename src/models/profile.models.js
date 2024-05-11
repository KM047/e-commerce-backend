import mongoose, { Schema } from "mongoose";

const userProfileSchema = new Schema(
    {
        firstName: {
            type: String,
            default: "",
        },
        lastName: {
            type: String,
            default: "",
        },
        countryCode: {
            type: String,
            default: "",
        },
        phoneNumber: {
            type: String,
            default: "",
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

export const UserProfile = mongoose.model("UserProfile", userProfileSchema);
