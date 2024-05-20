import { Router } from "express";
import {
    loginUser,
    logoutUser,
    registerUser,
} from "../../controllers/auth/user.controllers.js";
import { verifyJWT } from "../../middlewares/auth.middleware.js";

const router = Router();

// ! Public routes
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);

// ! Secured routes
router.route("/logout").post(verifyJWT, logoutUser);

export default router;
