import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { ApiResponse } from "../utils/ApiResponse.utils.js";
import { ApiError } from "../utils/ApiError.utils.js";
// import { UserProfile } from "../models/profile.models.js";
import mongoose from "mongoose";
// import { getMongoosePaginationOptions } from "../utils/helpers.js";
import { Product } from "./../models/product.models.js";
import { Category } from "./../models/category.models.js";
import {
    deleteFileInCloudinary,
    uploadOnCloudinary,
} from "../utils/cloudinary.utils.js";
import { MAX_SUB_IMAGE_COUNT } from "../constants.js";
import { getMongoosePaginationOptions } from "./../utils/helpers.js";

const createProduct = asyncHandler(async (req, res) => {
    // create product
    const { category, description, name, price, stock } = req.body;

    const isCategoryAvailable = await Category.findById(category);

    if (!isCategoryAvailable) {
        throw new ApiError(404, "Category is not exist");
    }

    // check main image has uploaded or not

    if (!req.files?.mainImage || !req.files.mainImage?.length) {
        throw new ApiError(404, "Main image is not available");
    }

    const mainImageUrl = await uploadOnCloudinary(
        req.files?.mainImage[0]?.path
    );

    // console.log(mainImageUrl);

    // check sub image has uploaded or not

    const subImages =
        req.files?.subImages && req.files.subImages?.length
            ? await Promise.all(
                  req.files.subImages.map(async (img) => {
                      const subImageUrl = await uploadOnCloudinary(img.path);

                      return { url: subImageUrl.url };
                  })
              )
            : [];

    console.log("subImages ", subImages);

    const owner = req.user?._id;
    const createdProduct = await Product.create({
        name,
        description,
        price,
        stock,
        owner,
        mainImage: mainImageUrl.url,
        subImages,
        category,
    });

    if (!createdProduct) {
        throw new ApiError(500, "Error while creating product");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, createdProduct, "Product created successfully")
        );
});

const updateProduct = asyncHandler(async (req, res) => {
    //

    const { productId } = req.params;
    const { category, description, name, price, stock } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
        throw new ApiError(404, " Product not found");
    }

    const mainImage = req.files?.mainImage?.length
        ? await uploadOnCloudinary(req.files?.mainImage[0]?.path).url
        : product.mainImage;

    let subImages =
        req.files?.subImages && req.files.subImages?.length
            ? await Promise.all(
                  req.files.subImages.map(async (img) => {
                      const subImageUrl = await uploadOnCloudinary(img.path);

                      return { url: subImageUrl.url };
                  })
              )
            : [];

    const existedSubImages = product.subImages.length;
    const newSubImages = subImages.length;
    const totalProductSubImages = existedSubImages + newSubImages;

    if (totalProductSubImages > MAX_SUB_IMAGE_COUNT) {
        subImages.map(async (img) => {
            await deleteFileInCloudinary(img);
        });

        return res.status(
            400,
            `For product the maximum count of sub images is ${MAX_SUB_IMAGE_COUNT} and there are already ${existedSubImages} sub images are attached to the product`
        );
    }

    subImages = [...product.subImages, ...subImages];

    const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        {
            $set: {
                name,
                description,
                category,
                price,
                stock,
                mainImage,
                subImages,
            },
        },
        {
            new: true,
        }
    );

    if (product.mainImage !== mainImage) {
        await deleteFileInCloudinary(product.mainImage);
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedProduct, "Product updated successfully")
        );
});

const deleteProduct = asyncHandler(async (req, res) => {
    //

    const { productId } = req.params;

    const deleteProduct = await Product.findByIdAndDelete(productId);

    if (!deleteProduct) {
        throw new ApiError(
            404,
            " Product not found or error while deleting product"
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { deletedProduct: deleteProduct },
                "Product deleted successfully"
            )
        );
});

const getAllProducts = asyncHandler(async (req, res) => {
    //

    const { page = 1, limit = 10 } = req.body;

    const productAggregate = await Product.aggregate([{ $match: {} }]);

    const products = await Product.aggregatePaginate(
        productAggregate,
        getMongoosePaginationOptions({
            page,
            limit,
            customLabels: {
                totalDocs: "totalProducts",
                docs: "products",
            },
        })
    );

    return res
        .status(200)
        .json(new ApiResponse(200, products, "Product fetched successfully"));
});

const getProductById = asyncHandler(async (req, res) => {
    //

    const { productId } = req.params;

    const product = await Product.findById(productId);

    if (!product) {
        throw new ApiError(404, " Product not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, product, "Product fetched successfully"));
});

const getProductsByCategory = asyncHandler(async (req, res) => {
    //

    const { page = 1, limit = 10 } = req.body;

    const { categoryId } = req.params;

    const category = await Category.findById(categoryId).select("name _id");

    if (!category) {
        throw new ApiError(404, " Category not found");
    }

    const productAggregate = await Product.aggregate([
        {
            $match: {
                category: new mongoose.Types.ObjectId(category),
            },
        },
    ]);

    const products = await Product.aggregatePaginate(
        productAggregate,
        getMongoosePaginationOptions({
            page,
            limit,
            customLabels: {
                totalDocs: "totalProducts",
                docs: "products",
            },
        })
    );

    return res
        .status(200)
        .json(
            new ApiResponse(200, products, "All product fetched successfully")
        );
});

const removeProductSubImage = asyncHandler(async (req, res) => {
    //

    const { productId, subImageId } = req.params;

    const product = await Product.findById(productId);

    if (!product) {
        throw new ApiError(404, "Product does not exist");
    }

    const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        {
            $pull: {
                subImages: {
                    _id: new mongoose.Types.ObjectId(subImageId),
                },
            },
        },
        {
            new: true,
        }
    );

    const removedSubImage = product.subImages?.find((image) => {
        return image._id.toString() === subImageId;
    });

    if (removedSubImage) {
        await deleteFileInCloudinary(removedSubImage.url);
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedProduct,
                "Sub image removed successfully"
            )
        );
});

export {
    createProduct,
    updateProduct,
    deleteProduct,
    getAllProducts,
    getProductById,
    getProductsByCategory,
    removeProductSubImage,
};
