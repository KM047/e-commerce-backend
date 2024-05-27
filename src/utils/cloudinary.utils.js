import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError.utils.js";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (fileLocalPath) => {
    try {
        if (!fileLocalPath) {
            return null;
        }

        const response = await cloudinary.uploader.upload(fileLocalPath, {
            resource_type: "auto",
        });

        if (!response) {
            return null;
        }

        return response;
    } catch (error) {
        throw new ApiError(
            500,
            error.message || "Error while uploading image to cloudinary"
        );
    } finally {
        fs.unlinkSync(fileLocalPath);
    }
};

const deleteFileInCloudinary = async (imageURL) => {
    const oldImagePublicId = imageURL.split("/").pop().split(".")[0];

    const response = await cloudinary.uploader.destroy(
        oldImagePublicId,
        {
            resource_type: "image",
        },
    );

    return response;
};

export { uploadOnCloudinary, deleteFileInCloudinary };
