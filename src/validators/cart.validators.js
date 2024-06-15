import { body } from "express-validator";

const addProductOrUpdateItemQuantityValidator = () => {
    return [
        body("quantity")
            .optional()
            .isInt({
                min: 1,
            })
            .withMessage("Quantity should be greater than or equal to 1."),
    ];
};

export { addProductOrUpdateItemQuantityValidator };
