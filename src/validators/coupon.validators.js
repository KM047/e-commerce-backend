import { body } from "express-validator";
import { AvailableCouponTypes } from "../constants.js";

const applyCouponCodeValidator = () => {
    return [
        body("couponCode")
            .trim()
            .notEmpty()
            .withMessage("Coupon code is required")
            .isLength({ min: 4 })
            .withMessage("Invalid coupon code"),
    ];
};

const createCouponValidator = () => {
    return [
        body("name")
            .optional()
            .trim()
            .notEmpty()
            .withMessage("Coupon name is required")
            .isLength({ min: 4 })
            .withMessage("Invalid coupon code"),
        body("couponCode")
            .optional()
            .trim()
            .notEmpty()
            .withMessage("Coupon code is required")
            .isLength({ min: 4 })
            .withMessage("Invalid coupon code"),
        body("type")
            .optional()
            .notEmpty()
            .isIn(AvailableCouponTypes)
            .withMessage("Invalid coupon type"),
        body("discountValue")
            .optional()
            .trim()
            .notEmpty()
            .withMessage("Discount value is required")
            .isInt({
                min: 1,
            })
            .withMessage("Discount value must be greater than 0"),
        body("minimumCartValue")
            .optional()
            .trim()
            .notEmpty()
            .withMessage("Minimum cart value is required")
            .isInt({
                min: 0,
            })
            .withMessage("The cart value never be negative"),
        body("startDate")
            .optional()
            .trim()
            .notEmpty()
            .withMessage("Start date is required")
            .isISO8601()
            .withMessage(
                "Invalid start date, the date should be in the ISO8601 format"
            ),
        body("expiryDate")
            .optional()
            .trim()
            .notEmpty()
            .withMessage("Expiry date is required")
            .isISO8601()
            .withMessage(
                "Invalid expiry date, the date should be in the ISO8601 format"
            )
            .isAfter(new Date().toISOString())
            .withMessage("Expiry date must be future date"),
    ];
};

const updateCouponCodeValidator = () => {
    return [
        body("name")
            .optional()
            .trim()
            .notEmpty()
            .withMessage("Coupon name is required")
            .isLength({ min: 4 })
            .withMessage("Invalid coupon code"),
        body("couponCode")
            .optional()
            .trim()
            .notEmpty()
            .withMessage("Coupon code is required")
            .isLength({ min: 4 })
            .withMessage("Invalid coupon code"),
        body("type")
            .optional()
            .notEmpty()
            .isIn(AvailableCouponTypes)
            .withMessage("Invalid coupon type"),
        body("discountValue")
            .optional()
            .trim()
            .notEmpty()
            .withMessage("Discount value is required")
            .isInt({
                min: 1,
            })
            .withMessage("Discount value must be greater than 0"),
        body("minimumCartValue")
            .optional()
            .trim()
            .notEmpty()
            .withMessage("Minimum cart value is required")
            .isInt({
                min: 0,
            })
            .withMessage("The cart value never be negative"),
        body("startDate")
            .optional()
            .trim()
            .notEmpty()
            .withMessage("Start date is required")
            .isISO8601()
            .withMessage(
                "Invalid start date, the date should be in the ISO8601 format"
            ),
        body("expiryDate")
            .optional()
            .trim()
            .notEmpty()
            .withMessage("Expiry date is required")
            .isISO8601()
            .withMessage(
                "Invalid expiry date, the date should be in the ISO8601 format"
            )
            .isAfter(new Date().toISOString())
            .withMessage("Expiry date must be future date"),
    ];
};

const couponActivityStatusValidator = () => {
    return [
        body("isActive")
            .notEmpty()
            .withMessage("Coupon activity status must be required")
            .isBoolean({
                strict: true,
            })
            .withMessage(
                "Coupon activity status must be boolean. True or false"
            ),
    ];
};

export {
    applyCouponCodeValidator,
    createCouponValidator,
    updateCouponCodeValidator,
    couponActivityStatusValidator,
};
