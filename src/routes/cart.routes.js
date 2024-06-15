import { Router } from "express";
import {
    verifyJWT,
    verifyUserPermission,
} from "./../middlewares/auth.middleware.js";
import {
    addProductOrUpdateItemQuantity,
    clearCart,
    getUserCart,
    removeProductFromCart,
} from "../controllers/cart.controllers.js";
import { mongodbIdInUrlValidator } from "../validators/common/mongodb.validator.js";
import { validate } from "../validators/validate.js";
import { addProductOrUpdateItemQuantityValidator } from "../validators/cart.validators.js";

const router = Router();

// Customer routes
router.use(verifyJWT);

router.route("/").get(getUserCart);
router.route("/").delete(clearCart);

router
    .route("/item/:productId")
    .post(
        mongodbIdInUrlValidator("productId"),
        addProductOrUpdateItemQuantityValidator(),
        validate,
        addProductOrUpdateItemQuantity
    )
    .delete(
        mongodbIdInUrlValidator("productId"),
        addProductOrUpdateItemQuantityValidator(),
        validate,
        removeProductFromCart
    );

export default router;
