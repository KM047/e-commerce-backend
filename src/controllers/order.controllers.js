import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { ApiResponse } from "../utils/ApiResponse.utils.js";
import { ApiError } from "../utils/ApiError.utils.js";
import mongoose from "mongoose";
import Razorpay from "razorpay";
import { UserAddress } from "./../models/address.models.js";
import { Cart } from "./../models/cart.models.js";
import { getCart } from "./cart.controllers.js";
import { nanoid } from "nanoid";
import { UserOrder } from "./../models/order.models.js";
import { AvailableOrderStatuses, PaymentProviderEnum } from "../constants.js";
import crypto from "crypto";
import { Product } from "./../models/product.models.js";
import { sendEmail } from "../utils/mails.js";
import { getMongoosePaginationOptions } from "./../utils/helpers.js";

const orderFulFillmentHelper = async (orderPaymentId, req) => {
    const order = await UserOrder.findOneAndUpdate(
        {
            paymentId: orderPaymentId,
        },
        {
            $set: {
                isPaymentDone: true,
            },
        },
        {
            new: true,
        }
    );

    if (!order) {
        throw new ApiError(404, "Order does not exist");
    }

    const cart = await Cart.findOne({
        owner: req.user._id,
    });

    const userCart = await getCart(req.user._id);

    let bulkStocksUpdate = userCart.items.map((item) => {
        return {
            updateOne: {
                filter: { _id: item.product?._id },
                update: { $inc: { stock: -item.quantity } },
            },
        };
    });

    await Product.bulkWrite(bulkStocksUpdate, {
        skipValidation: true,
    });

    await sendEmail({
        email: req.user?.email,
        subject: "Order confirmed",
        mailgenContent: orderConfirmationMailgenContent(
            req.user?.username,
            userCart.items,
            order.discountedOrderPrice ?? 0
        ),
    });

    cart.items = [];

    cart.coupon = null;

    await cart.save({ validateBeforeSave: false });
    return order;
};

let razorpayInstance;

try {
    razorpayInstance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
} catch (error) {
    console.error("Razorpay error: " + error);
}

const generateRazorpayOrder = asyncHandler(async (req, res) => {
    const { addressId } = req.body;

    if (!razorpayInstance) {
        console.error("RAZORPAY ERROR: `key_id` is mandatory");
        throw new ApiError(500, "Internal server error");
    }

    const address = await UserAddress.findOne({
        _id: addressId,
        owner: req.user._id,
    });

    if (!address) {
        throw new ApiError(404, "Address does not exists");
    }

    const cart = await Cart.findOne({
        owner: req.user._id,
    });

    if (!cart && !cart.items?.length) {
        throw new ApiError(400, "User cart is empty.");
    }

    const orderItems = cart.items;

    const userCart = await getCart(req.user._id);

    const totalPrice = userCart.cartTotal;
    const totalDiscountedPrice = userCart.discountedTotal;

    const orderOptions = {
        amount: parseInt(totalDiscountedPrice) * 100,
        currency: "INR",
        receipt: nanoid(10),
    };

    razorpayInstance.orders.create(
        orderOptions,
        async function (err, razorpayOrder) {
            if (!razorpayOrder || (err && err.error)) {
                return res
                    .status(err.statusCode)
                    .json(
                        new ApiResponse(
                            err.statusCode,
                            null,
                            err.error.reason ||
                                "Something went wrong while initializing the razorpay order."
                        )
                    );
            }

            const {
                addressLine1,
                addressLine2,
                city,
                country,
                pincode,
                state,
            } = address;

            const unpaidOrder = await UserOrder.create({
                address: {
                    addressLine1,
                    addressLine2,
                    city,
                    country,
                    pincode,
                    state,
                },
                customer: req.user._id,
                items: orderItems,
                orderPrice: totalPrice ?? 0,
                discountedOrderPrice: totalDiscountedPrice ?? 0,
                paymentProvider: PaymentProviderEnum.RAZORPAY,
                paymentId: razorpayOrder.id,
                coupon: userCart.coupon?._id,
            });

            if (unpaidOrder) {
                return res
                    .status(200)
                    .json(
                        new ApiResponse(
                            200,
                            razorpayOrder,
                            "Razorpay order generated successfully "
                        )
                    );
            } else {
                return res
                    .status(500)
                    .json(
                        new ApiResponse(
                            500,
                            null,
                            "Something went wrong while generating the razorpay order"
                        )
                    );
            }
        }
    );
});

const verifyRazorpayPayment = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        req.body;

    let body = razorpay_order_id + "|" + razorpay_payment_id;

    let expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

    if (expectedSignature == razorpay_signature) {
        const order = await orderFulFillmentHelper(razorpay_order_id, req);

        return res
            .status(201)
            .json(new ApiResponse(201, order, "Order placed successfully"));
    }
});

const getOrderById = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const order = await UserOrder.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(orderId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: " _id",
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
            },
        },

        {
            $unwind: "$items",
        },
        {
            $lookup: {
                from: "products",
                localField: "items.productId",
                foreignField: "_id",
                as: "items.product",
            },
        },
        {
            $addFields: { "items.product": { $first: "$items.product" } },
        },
        {
            $group: {
                _id: "$_id",
                order: { $first: "$$ROOT" },
                orderItems: {
                    $push: {
                        _id: "$items._id",
                        product: "$items.product",
                        quantity: "$items.quantity",
                    },
                },
            },
        },
        {
            $addFields: {
                "order.items": "$orderItems",
            },
        },
        {
            $project: {
                orderItems: 0,
            },
        },
    ]);

    if (!order[0]) {
        throw new ApiError(404, "Order does not exist");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, order[0], "Order fetched successfully"));
});

const getOrderListByAdmin = asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 10 } = req.query;

    const orderAggregate = await UserOrder.aggregate([
        {
            $match:
                status && AvailableOrderStatuses.includes(status.toUpperCase())
                    ? {
                          status: status.toUpperCase(),
                      }
                    : {},
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: " _id",
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
        {
            $lookup: {
                from: "coupons",
                foreignField: "_id",
                localField: "coupon",
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
                totalOrderItems: { $size: "$items" },
            },
        },
        {
            $project: {
                items: 0,
            },
        },
    ]);

    const orders = await UserOrder.aggregatePaginate(
        orderAggregate,
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
        .json(new ApiResponse(200, orders, "Orders fetched successfully"));
});

export {
    generateRazorpayOrder,
    verifyRazorpayPayment,
    getOrderById,
    getOrderListByAdmin,
};
