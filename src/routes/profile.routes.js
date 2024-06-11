import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getUserProfile,
    updatedUserProfile,
    getUserOrders,
} from "../controllers/profile.controllers.js";
import { validate } from "../validators/validate.js";
import { eComProfileUpdateValidator } from "../validators/profile.validators.js";

const router = Router();

router.use(verifyJWT);

// ! All routes are secured.
router
    .route("/")
    .get(getUserProfile)
    .patch(eComProfileUpdateValidator(), validate, updatedUserProfile);

router.route("/my-orders").get(getUserOrders);

export default router;
