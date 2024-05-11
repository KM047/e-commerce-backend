import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const addressSchema = new Schema(
    {
        addressLine1: {
            required: true,
            type: String,
        },
        addressLine2: {
            type: String,
        },
        city: {
            required: true,
            type: String,
        },
        country: {
            required: true,
            type: String,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        pincode: {
            required: true,
            type: String,
        },
        state: {
            required: true,
            type: String,
        },
    },
    { timestamps: true }
);

addressSchema.plugin(mongooseAggregatePaginate);

export const UserAddress = mongoose.model("UserAddress", addressSchema);
