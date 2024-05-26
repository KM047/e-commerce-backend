import { Router } from "express";
import {
    forgetPasswordRequest,
    getCurrentUser,
    loginUser,
    logoutUser,
    registerUser,
    resendEmailVerificationMailgenContent,
    resetForgetPassword,
    verifyEmail,
} from "../../controllers/auth/user.controllers.js";
import { verifyJWT } from "../../middlewares/auth.middleware.js";

const router = Router();

// ! Public routes
router.route("/register").post(registerUser);
router.route("/verify-email/:verificationToken").get(verifyEmail);

router.route("/login").post(loginUser);
router.route("/forgot-password").post(forgetPasswordRequest);
router.route("/reset-password/:resetToken").post(resetForgetPassword);

// ! Secured routes

router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/logout").post(verifyJWT, logoutUser);
router
    .route("/resend-verify-email")
    .post(verifyJWT, resendEmailVerificationMailgenContent);

export default router;
