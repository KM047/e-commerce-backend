import { Router } from "express";
import {
    verifyJWT,
    verifyUserPermission,
} from "./../middlewares/auth.middleware.js";

import { validate } from "./../validators/validate.js";
import {
    createCoupon,
    getAllCoupons,
    deleteCoupon,
    getCouponById,
    updateCoupon,
    applyCoupon,
    removeCouponFromCart,
    updateCouponActiveStatus,
    getValidCouponsForCustomer,
} from "../controllers/coupon.controllers.js";
import {
    applyCouponCodeValidator,
    couponActivityStatusValidator,
    createCouponValidator,
    updateCouponCodeValidator,
} from "../validators/coupon.validators.js";
import { UserRolesEnum } from "../constants.js";
import { mongodbIdInUrlValidator } from "./../validators/common/mongodb.validator.js";

const router = Router();

// Customer routes
router.use(verifyJWT);

router
    .route("/c/apply")
    .post(applyCouponCodeValidator(), validate, applyCoupon);

router.route("/c/remove").post(removeCouponFromCart);
router.route("/customer/available-coupons").get(getValidCouponsForCustomer);

// Admin routes

router.use(verifyUserPermission([UserRolesEnum.ADMIN]));

router
    .route("/")
    .get(getAllCoupons)
    .post(
        createCouponValidator(),
        validate, 
        createCoupon
);

router
    .route("/:couponId")
    .get(mongodbIdInUrlValidator("couponId"), validate, getCouponById)
    .patch(
        mongodbIdInUrlValidator("couponId"),
        updateCouponCodeValidator(),
        validate,
        updateCoupon
    )
    .delete(mongodbIdInUrlValidator("couponId"), validate, deleteCoupon);

router
    .route("/status/:couponId")
    .patch(
        mongodbIdInUrlValidator("couponId"),
        couponActivityStatusValidator(),
        validate,
        updateCouponActiveStatus
    );

export default router;
