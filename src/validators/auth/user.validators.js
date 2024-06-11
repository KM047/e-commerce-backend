import { body, param } from "express-validator";
import { AvailableUserRolesEnum } from "../../constants.js";

const userRegistrationValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Email is invalid"),
        body("username")
            .trim()
            .notEmpty()
            .withMessage("Username is required")
            .isLowercase()
            .withMessage("Username must be lowercase")
            .isLength({ min: 3 })
            .withMessage("Username must be at least 3 characters long"),

        body("password")
            .trim()
            .notEmpty()
            .withMessage("password is required")
            .isLength({ min: 5 })
            .withMessage("Username must be at least 5 characters long"),

        body("role")
            .trim()
            .isIn(AvailableUserRolesEnum)
            .withMessage("User role is invalid"),
    ];
};

const userLoginValidator = () => {
    return [
        body("email")
            .optional()
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Email is invalid"),
        body("username")
            .optional()
            .trim()
            .notEmpty()
            .withMessage("Username is required"),
        body("password").notEmpty().withMessage("Password is required"),
    ];
};

const userChangePasswordValidator = () => {
    return [
        body("oldPassword").notEmpty().withMessage("OldPassword is required"),
        body("newPassword").notEmpty().withMessage("newPassword is required"),
    ];
};

const userForgottenPasswordRequestValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Email is invalid"),
    ];
};

const userResetForgottenPasswordValidator = () => {
    return [
        body("newPassword").notEmpty().withMessage("newPassword is required"),
    ];
};

export {
    userRegistrationValidator,
    userLoginValidator,
    userChangePasswordValidator,
    userForgottenPasswordRequestValidator,
    userResetForgottenPasswordValidator,
};
