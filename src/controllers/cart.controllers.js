import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { ApiResponse } from "../utils/ApiResponse.utils.js";
import { ApiError } from "../utils/ApiError.utils.js";
import { Cart } from "./../models/cart.models.js";
import mongoose from "mongoose";
import { Product } from "./../models/product.models.js";

export const getCart = async (userId) => {
    const cartAggregation = await Cart.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
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
                as: "product",
            },
        },

        {
            $project: {
                product: { $first: "$product" },
                quantity: "$items.quantity",
                coupon: 1,
            },
        },

        {
            $group: {
                _id: "$_id",

                items: {
                    $push: "$$ROOT",
                },
                coupon: { $first: "$coupon" },
                cartTotal: {
                    $sum: {
                        $multiply: ["$product.price", "$quantity"],
                    },
                },
            },
        },

        {
            $lookup: {
                from: "coupons",
                localField: "coupon",
                foreignField: "_id",
                as: "coupon",
            },
        },
        {
            $addFields: {
                coupon: { $first: "$coupon" },
            },
        },
        {
            $addFields: {
                discountedTotal: {
                    $ifNull: [
                        {
                            $subtract: ["$cartTotal", "$coupon.discountValue"],
                        },
                        "$cartTotal", // when their no coupon
                    ],
                },
            },
        },
    ]);

    return (
        cartAggregation[0] ?? {
            _id: null,
            items: [],
            cartTotal: 0,
            discountedTotal: 0,
        }
    );
};

const getUserCart = asyncHandler(async (req, res) => {
    const userCart = await getCart(req.user?._id);

    return res
        .status(200)
        .json(new ApiResponse(200, userCart, "User cart fetched successfully"));
});

const addProductOrUpdateItemQuantity = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { quantity = 1 } = req.body;

    const userCart = await Cart.findOne({
        owner: req.user._id,
    });

    const product = await Product.findById(productId);

    if (!product) {
        throw new ApiError(404, "Product does not exist");
    }

    if (quantity > product.stock) {
        throw new ApiError(
            400,
            product.stock > 0
                ? "Only " +
                  product.stock +
                  " is remaining. But you are adding " +
                  quantity +
                  "to your cart."
                : "The product is out of stock."
        );
    }

    const alreadyInCart = userCart.items?.find(
        (item) => item.productId.toString() === productId
    );

    if (alreadyInCart) {
        alreadyInCart.quantity = quantity;

        if (userCart.coupon) {
            userCart.coupon = null;
        }
    } else {
        userCart.items.push({ productId, quantity });
    }

    // console.log(userCart.items);

    await userCart.save({ validateBeforeSave: true });

    const updatedCart = await getCart(req.user._id);

    return res
        .status(200)
        .json(new ApiResponse(200, updatedCart, "Item added successfully."));
});

const removeProductFromCart = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const productToRemove = await Product.findById(productId);

    if (!productToRemove) {
        throw new ApiError(404, "Product not found");
    }

    let updatedUserCart = await Cart.findOneAndUpdate(
        {
            owner: req.user._id,
        },
        {
            $pull: {
                items: {
                    productId: productId,
                },
            },
        },
        {
            new: true,
        }
    );

    // console.log(updatedUserCart);

    let cart = await getCart(req.user._id);

    if (cart.coupon && cart.cartTotal < cart.coupon.minimumCartValue) {
        updatedUserCart.coupon = null;

        console.log("this point is updated");
        await updatedUserCart.save({ validateBeforeSave: false });
        cart = await getCart(req.user._id);
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                cart,
                "Product from user cart removed successfully"
            )
        );
});

const clearCart = asyncHandler(async (req, res) => {
    await Cart.findOneAndUpdate(
        {
            owner: new mongoose.Types.ObjectId(req.user._id),
        },
        {
            $set: {
                items: [],
                coupon: null,
            },
        },
        {
            new: true,
        }
    );

    const updatedCart = await getCart(req.user._id);

    // console.log(updatedCart);

    return res
        .status(200)
        .json(new ApiResponse(200, updatedCart, "Cart reset successfully."));
});

export {
    getUserCart,
    addProductOrUpdateItemQuantity,
    removeProductFromCart,
    clearCart,
};
