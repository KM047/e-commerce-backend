import { Router } from "express";
import {
    getCurrentUser,
    loginUser,
    logoutUser,
    registerUser,
    verifyEmail,
} from "../../controllers/auth/user.controllers.js";
import { verifyJWT } from "../../middlewares/auth.middleware.js";

const router = Router();

// ! Public routes
router.route("/register").post(registerUser);
router.route("/verify-email/:verificationToken").get(verifyEmail);

router.route("/login").post(loginUser);

// ! Secured routes

router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/logout").post(verifyJWT, logoutUser);

export default router;
