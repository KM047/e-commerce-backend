import mongoose, { Schema } from "mongoose";

import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const productSchema = new Schema(
    {
        category: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            required: true,
        },
        description: {
            required: true,
            type: String,
        },
        mainImage: {
            type: String,
            required: true,
        },
        name: {
            required: true,
            type: String,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        price: {
            default: 0,
            type: Number,
        },
        stock: {
            default: 0,
            type: Number,
        },
        subImages: {
            type: [
                {
                    url: String,
                },
            ],
            default: [],
        },
    },
    { timestamps: true }
);

productSchema.plugin(mongooseAggregatePaginate);

export const Product = mongoose.model("Product", productSchema);
