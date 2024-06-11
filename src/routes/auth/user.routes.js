import { Router } from "express";
import {
    changeCurrentPassword,
    forgetPasswordRequest,
    getCurrentUser,
    loginUser,
    logoutUser,
    registerUser,
    resendEmailVerificationMailgenContent,
    resetForgetPassword,
    updateUserAvatar,
    verifyEmail,
} from "../../controllers/auth/user.controllers.js";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import {
    userChangePasswordValidator,
    userForgottenPasswordRequestValidator,
    userLoginValidator,
    userRegistrationValidator,
    userResetForgottenPasswordValidator,
} from "../../validators/auth/user.validators.js";
import { validate } from "../../validators/validate.js";
import { upload } from "./../../middlewares/multer.middleware.js";

const router = Router();

// ! Public routes
router
    .route("/register")
    .post(userRegistrationValidator(), validate, registerUser);
router.route("/verify-email/:verificationToken").get(verifyEmail);

router.route("/login").post(userLoginValidator(), validate, loginUser);
router
    .route("/forgot-password")
    .post(
        userForgottenPasswordRequestValidator(),
        validate,
        forgetPasswordRequest
    );
router
    .route("/reset-password/:resetToken")
    .post(userResetForgottenPasswordValidator(), validate, resetForgetPassword);

// ! Secured routes

router.route("/current-user").get(verifyJWT, getCurrentUser);
router
    .route("/avatar")
    .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

router.route("/logout").post(verifyJWT, logoutUser);
router
    .route("/resend-verify-email")
    .post(verifyJWT, resendEmailVerificationMailgenContent);
router
    .route("change-password")
    .post(
        verifyJWT,
        userChangePasswordValidator(),
        validate,
        changeCurrentPassword
    );

export default router;
