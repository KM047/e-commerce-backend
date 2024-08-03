import { Router } from "express";
import {
    verifyJWT,
    verifyUserPermission,
} from "./../middlewares/auth.middleware.js";
import {
    mongodbIdInUrlValidator,
    mongodbIdRequestBodyValidator,
} from "./../validators/common/mongodb.validator.js";
import { validate } from "./../validators/validate.js";
import {    
    generateRazorpayOrder,
    getOrderById,
    getOrderListByAdmin,
    verifyRazorpayPayment,
} from "../controllers/order.controllers.js";
import { verifyRazorpayPaymentValidator } from "../validators/order.validators.js";
import { UserRolesEnum } from "../constants.js";

const router = Router();

router.use(verifyJWT);

router
    .route("/provider/razorpay")
    .post(
        mongodbIdRequestBodyValidator("addressId"),
        validate,
        generateRazorpayOrder
    );

router
    .route("/provider/razorpay/verify-payment")
    .post(verifyRazorpayPaymentValidator(), validate, verifyRazorpayPayment);

router
    .route("/:orderId")
    .get(
        mongodbIdInUrlValidator("orderId"), 
        validate, 
        getOrderById);

router
    .route("/list/admin")
    .get(verifyUserPermission([UserRolesEnum.ADMIN]), getOrderListByAdmin);

export default router;
