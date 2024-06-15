import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { ApiResponse } from "../utils/ApiResponse.utils.js";
import { ApiError } from "../utils/ApiError.utils.js";
import { Category } from "./../models/category.models.js";
import { getMongoosePaginationOptions } from "./../utils/helpers.js";

const createCategory = asyncHandler(async (req, res) => {
    const { name } = req.body;

    const category = await Category.create({
        name,
        owner: req.user._id,
    });

    if (!category) {
        throw new ApiError(500, "Error while creating category");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, category, "Successfully created category"));
});

const getAllCategories = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    const categoryAggregate = Category.aggregate([{ $match: {} }]);

    const categories = await Category.aggregatePaginate(
        categoryAggregate,
        getMongoosePaginationOptions({
            page,
            limit,
            customLabels: {
                totalDocs: "totalCategories",
                docs: "categories",
            },
        })
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                categories,
                "All categories fetched successfully"
            )
        );
});

const getCategoryById = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;

    const category = await Category.findById(categoryId);

    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, category, "Category fetched successfully"));
});

const updateCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;

    const { name } = req.body;

    const category = await Category.findByIdAndUpdate(
        categoryId,
        {
            $set: {
                name: name,
            },
        },
        {
            new: true,
        }
    );

    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, category, "Category updated successfully"));
});

const deleteCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;

    const category = await Category.findByIdAndDelete(categoryId);

    if (!category) {
        throw new ApiError(404, "Category not found or already deleted");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Category deleted successfully"));
});

export {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
};
