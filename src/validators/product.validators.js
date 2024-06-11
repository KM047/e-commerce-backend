import { body } from "express-validator";
import { mongodbIdRequestBodyValidator } from "./common/mongodb.validator.js";

export const createProductValidator = () => {
    return [
        body("name").trim().notEmpty().withMessage("Name is required"),
        body("description")
            .trim()
            .notEmpty()
            .withMessage("Description is required"),
        body("price")
            .trim()
            .notEmpty()
            .withMessage("Price is required")
            .isNumeric()
            .withMessage("Price must be a number"),
        body("stock")
            .optional()
            .trim()
            .notEmpty()
            .withMessage("Stock is required")
            .isNumeric()
            .withMessage("Stock must be a number"),
        ...mongodbIdRequestBodyValidator("category"),
    ];
};
