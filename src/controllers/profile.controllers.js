import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { ApiResponse } from "../utils/ApiResponse.utils.js";
import { ApiError } from "../utils/ApiError.utils.js";
import { UserProfile } from "../models/profile.models.js";
import mongoose from "mongoose";
import { UserOrder } from "./../models/order.models.js";
import { getMongoosePaginationOptions } from "../utils/helpers.js";

const getUserProfile = asyncHandler(async (req, res) => {
    try {
        const userProfile = await UserProfile.findOne({
            owner: new mongoose.Types.ObjectId(req.user?._id),
        });

        if (!userProfile) {
            throw new ApiError(404, "User not found");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    userProfile,
                    "User profile fetched successfully"
                )
            );
    } catch (error) {
        throw new ApiError(
            500,
            error.message || "Error while fetching user profile"
        );
    }
});

const updatedUserProfile = asyncHandler(async (req, res) => {
    try {
        const { firstName, lastName, countryCode, phoneNumber } = req.body;

        const updatedUserProfile = await UserProfile.findOneAndUpdate(
            {
                owner: new mongoose.Types.ObjectId(req.user?._id),
            },
            {
                $set: {
                    firstName,
                    lastName,
                    countryCode,
                    phoneNumber,
                },
            },
            {
                new: true,
            }
        );

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    updatedUserProfile,
                    "Updated User profile fetched successfully"
                )
            );
    } catch (error) {
        throw new ApiError(
            500,
            error.message || "Error while updating user profile data"
        );
    }
});

const getUserOrders = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    const ordersAggregation = await UserOrder.aggregate([
        {
            $match: {
                customer: req.user._id,
            },
        },

        // get customers username and email address using lookup

        {
            $lookup: {
                from: "users",
                localField: "customer",
                foreignField: "_id",
                as: "customer",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            email: 1,
                        },
                    },
                ],
            },
        },

        // lookup for the coupon applied while placing the order

        {
            $lookup: {
                from: "coupons",
                localField: "coupon",
                foreignField: "_id",
                as: "coupon",
                pipeline: [
                    {
                        $project: {
                            name: 1,
                            couponCode: 1,
                        },
                    },
                ],
            },
        },

        {
            $addFields: {
                customer: { $first: "$customer" },
                coupon: { $ifNull: [{ $first: "$coupon" }, null] },
                totalUserOrdersItems: { $size: "$items" },
            },
        },
        {
            $project: {
                items: 0,
            },
        },
    ]);

    const allOrders = await UserOrder.aggregatePaginate(
        ordersAggregation,
        getMongoosePaginationOptions({
            page,
            limit,
            customLabels: {
                totalDocs: "totalOrders",
                docs: "orders",
            },
        })
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                allOrders,
                "User's Order data fetched successfully"
            )
        );
});

export { getUserProfile, updatedUserProfile, getUserOrders };
