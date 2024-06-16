import { body } from "express-validator";

const createUserAddressValidator = () => {
    return [
        body("addressLine1")
            .notEmpty()
            .withMessage("Address line 1 should be required"),
        body("addressLine2").optional(),
        body("city").notEmpty().withMessage("City should be required"),
        body("country").notEmpty().withMessage("Country should be required"),
        body("pincode")
            .notEmpty()
            .withMessage("Pincode should be required")
            .isLength({
                min: 6,
                max: 6,
            })
            .withMessage("Invalid pincode, pincode should be 6 digit"),
        body("state").notEmpty().withMessage("State should be required"),
    ];
};

const updateAddressValidator = () => {
    return [
        body("addressLine1")
            .optional()
            .notEmpty()
            .withMessage("Address line 1 should be required"),
        body("addressLine2").optional(),
        body("city")
            .optional()
            .notEmpty()
            .withMessage("City should be required"),
        body("country")
            .optional()
            .notEmpty()
            .withMessage("Country should be required"),
        body("pincode")
            .optional()
            .notEmpty()
            .withMessage("Pincode should be required")
            .isLength({
                min: 6,
                max: 6,
            })
            .withMessage("Invalid pincode, pincode should be 6 digit"),
        body("state")
            .optional()
            .notEmpty()
            .withMessage("State should be required"),
    ];
};

export { createUserAddressValidator, updateAddressValidator };
