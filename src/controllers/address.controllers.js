import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { ApiResponse } from "../utils/ApiResponse.utils.js";
import { ApiError } from "../utils/ApiError.utils.js";
import mongoose from "mongoose";
import { UserAddress } from "./../models/address.models.js";
import { getMongoosePaginationOptions } from "./../utils/helpers.js";

const createAddress = asyncHandler(async (req, res) => {
    const {
        addressLine1,
        addressLine2 = "",
        city,
        country,
        pincode,
        state,
    } = req.body;

    const newAddress = await UserAddress.create({
        addressLine1,
        addressLine2,
        city,
        country,
        owner: new mongoose.Types.ObjectId(req.user?._id),
        pincode,
        state,
    });

    if (!newAddress) {
        throw new ApiError(500, "Error while creating new address");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                newAddress,
                "New address created successfully."
            )
        );
});

const getAllAddresses = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    const allAddress = UserAddress.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user._id),
            },
        },
    ]);

    const addresses = await UserAddress.aggregatePaginate(
        allAddress,
        getMongoosePaginationOptions({
            page,
            limit,
            customLabels: {
                totalDocs: "totalAddresses",
                docs: "userAddresses",
            },
        })
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                addresses,
                "All addresses of user fetched successfully."
            )
        );
});

const getAddressById = asyncHandler(async (req, res) => {
    const { addressId } = req.params;

    const address = await UserAddress.findOne({
        _id: addressId,
        owner: req.user._id,
    });

    if (!address) {
        throw new ApiError(404, "Address does not exist.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, address, "Address fetched successfully."));
});

const updateAddress = asyncHandler(async (req, res) => {
    const { addressId } = req.params;

    const {
        addressLine1,
        addressLine2 = "",
        city,
        country,
        pincode,
        state,
    } = req.body;

    const address = await UserAddress.findOneAndUpdate(
        {
            _id: addressId,
            owner: req.user._id,
        },
        {
            $set: { addressLine1, addressLine2, city, country, pincode, state },
        },
        {
            new: true,
        }
    );

    if (!address) {
        throw new ApiError(404, "Error while updating address.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, address, "Address updated successfully."));
});

const deleteAddress = asyncHandler(async (req, res) => {
    const { addressId } = req.params;

    const address = await UserAddress.findOneAndDelete({
        _id: addressId,
        owner: req.user._id,
    });

    if (!address) {
        throw new ApiError(404, "Error while deleting address.");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { deletedAddress: address },
                "Address deleted successfully."
            )
        );
});

export {
    createAddress,
    getAllAddresses,
    getAddressById,
    updateAddress,
    deleteAddress,
};
