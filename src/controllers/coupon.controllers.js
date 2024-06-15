import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { ApiResponse } from "../utils/ApiResponse.utils.js";
import { ApiError } from "../utils/ApiError.utils.js";
import mongoose from "mongoose";
import { CouponTypeEnum } from "../constants.js";
import { Coupon } from "./../models/coupon.models.js";
import { getMongoosePaginationOptions } from "./../utils/helpers.js";
import { getCart } from "./cart.controllers.js";
import { Cart } from "../models/cart.models.js";

const createCoupon = asyncHandler(async (req, res) => {
    //
    const {
        name,
        couponCode,
        type = CouponTypeEnum.FLAT,
        discountValue,
        minimumCartValue,
        startDate,
        expiryDate,
    } = req.body;

    const duplicateCoupon = await Coupon.findOne({
        couponCode: couponCode.trim().toUpperCase(),
    });

    if (duplicateCoupon) {
        throw new ApiError(
            409,
            `The couponCode ${duplicateCoupon.couponCode} is already exists`
        );
    }

    // This + is used to convert to number for future comparison
    if (minimumCartValue && +minimumCartValue < +discountValue) {
        throw new ApiError(
            401,
            "The minimumCartValue is greater than the discountValue"
        );
    }
    const newCoupon = await Coupon.create({
        name,
        couponCode,
        type,
        discountValue,
        minimumCartValue,
        startDate,
        expiryDate,
        owner: new mongoose.Types.ObjectId(req.user._id),
    });

    if (!newCoupon) {
        throw new ApiError(500, "Error while creating coupon");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                newCoupon,
                "New coupon is created is successfully"
            )
        );
});

const getAllCoupons = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.body;
    const allCoupons = Coupon.aggregate([{ $match: {} }]);

    const coupons = await Coupon.aggregatePaginate(
        allCoupons,
        getMongoosePaginationOptions({
            page,
            limit,
            customLabels: {
                totalDocs: "totalCoupons",
                docs: "coupons",
            },
        })
    );

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                coupons,
                "All coupons are fetched successfully."
            )
        );
});
const deleteCoupon = asyncHandler(async (req, res) => {
    const { couponId } = req.params;

    const deletedCoupon = await Coupon.findByIdAndDelete(couponId);

    if (!deletedCoupon) {
        throw new ApiError(403, "Coupon is not found or deleted already");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                { "deleteCoupon ": deletedCoupon },
                "Coupon is deleted successfully."
            )
        );
});

const getCouponById = asyncHandler(async (req, res) => {
    const { couponId } = req.params;

    const coupon = await Coupon.findById(couponId);

    if (!coupon) {
        throw new ApiError(
            403,
            "Coupon is not found, Please give valid coupon."
        );
    }

    return res
        .status(201)
        .json(new ApiResponse(201, coupon, "Coupon fetched successfully."));
});

const updateCoupon = asyncHandler(async (req, res) => {
    const { couponId } = req.params;

    const {
        name,
        couponCode,
        type = CouponTypeEnum.FLAT,
        discountValue,
        minimumCartValue,
        startDate,
        expiryDate,
    } = req.body;

    const couponIsExist = await Coupon.findById(couponId);

    if (!couponIsExist) {
        throw new ApiError(403, "Coupon with given id does not exist");
    }

    const duplicateCoupon = await Coupon.aggregate([
        {
            $match: {
                couponCode: couponCode?.trim().toUpperCase(),
                _id: {
                    $ne: new mongoose.Types.ObjectId(couponIsExist._id),
                },
            },
        },
    ]);

    if (duplicateCoupon[0]) {
        throw new ApiError(
            403,
            `Coupon code with ${duplicateCoupon[0].couponCode} already exists`
        );
    }

    const _minimumCartValue =
        minimumCartValue || couponIsExist.minimumCartValue;

    const _discountValue = discountValue || couponIsExist.discountValue;

    if (_minimumCartValue && +_minimumCartValue < +_discountValue) {
        throw new ApiError(
            401,
            "The minimumCartValue is greater than the discountValue"
        );
    }

    const coupon = await Coupon.findByIdAndUpdate(
        couponId,
        {
            $set: {
                name,
                couponCode,
                type,
                discountValue: _discountValue,
                minimumCartValue: _minimumCartValue,
                startDate,
                expiryDate,
            },
        },
        {
            new: true,
        }
    );

    return res
        .status(201)
        .json(new ApiResponse(201, coupon, "Coupon is updated successfully"));
});

const applyCoupon = asyncHandler(async (req, res) => {
    const { couponCode } = req.body;

    const aggregatedCoupon = await Coupon.aggregate([
        {
            $match: {
                couponCode: couponCode.trim().toUpperCase(),

                startDate: {
                    $lt: new Date(),
                },
                expiryDate: {
                    $gt: new Date(),
                },

                isActive: {
                    $eq: true,
                },
            },
        },
    ]);

    const coupon = aggregatedCoupon[0];

    if (!coupon) {
        throw new ApiError(
            403,
            "Coupon is not valid, Please enter a valid coupon."
        );
    }

    const userCart = await getCart(req.user._id);

    if (userCart.cartTotal < coupon.minimumCartValue) {
        throw new ApiError(
            400,
            `Added items worth ₹ ${userCart.cartTotal - coupon.minimumCartValue} /- or more to apply this coupon`
        );
    }

    await Cart.findOneAndUpdate(
        {
            owner: new mongoose.Types.ObjectId(req.user._id),
        },
        {
            $set: {
                coupon: coupon._id,
            },
        },
        {
            new: true,
        }
    );

    const newCart = await getCart(req.user._id);

    return res
        .status(201)
        .json(new ApiResponse(201, newCart, "Coupon applied successfully."));
});

const removeCouponFromCart = asyncHandler(async (req, res) => {
    await Cart.findOneAndUpdate(
        {
            owner: new mongoose.Types.ObjectId(req.user._id),
        },
        {
            $set: {
                coupon: null,
            },
        }
    );

    const newCart = await getCart(req.user._id);

    return res
        .status(201)
        .json(new ApiResponse(201, newCart, "Coupon removed successfully."));
});

const updateCouponActiveStatus = asyncHandler(async (req, res) => {
    const { couponId } = req.params;

    const { isActive } = req.body;

    const updatedCoupon = await Coupon.findByIdAndUpdate(
        couponId,
        {
            $set: {
                isActive,
            },
        },
        {
            new: true,
        }
    );

    if (!updatedCoupon) {
        throw new ApiError(403, "Coupon does not exist");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                updatedCoupon,
                `Coupon is ${updatedCoupon.isActive ? "active" : "inactive"}`
            )
        );
});

const getValidCouponsForCustomer = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.body;
    const userCart = await getCart(req.user._id);

    const aggregatedCoupons = Coupon.aggregate([
        {
            $match: {
                startDate: {
                    $lt: new Date(),
                },

                // expiryDate: {
                //     $gt: new Date(),
                // },

                isActive: {
                    $eq: true,
                },

                // minimumCartValue: {
                //     $lte: userCart.cartTotal,
                // },
            },
        },
    ]);

    const coupons = await Coupon.aggregatePaginate(
        aggregatedCoupons,
        getMongoosePaginationOptions({
            page,
            limit,
            customLabels: {
                totalDocs: "totalCoupons",
                docs: "coupons",
            },
        })
    );

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                coupons,
                "All the valid coupons fetched successfully."
            )
        );
});

export {
    createCoupon,
    getAllCoupons,
    deleteCoupon,
    getCouponById,
    updateCoupon,
    applyCoupon,
    removeCouponFromCart,
    updateCouponActiveStatus,
    getValidCouponsForCustomer,
};
