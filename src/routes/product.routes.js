import { Router } from "express";
import {
    verifyJWT,
    verifyUserPermission,
} from "../middlewares/auth.middleware.js";
import {
    createProduct,
    deleteProduct,
    getAllProducts,
    getProductById,
    getProductsByCategory,
    updateProduct,
    removeProductSubImage,
} from "../controllers/product.controllers.js";
import { MAX_SUB_IMAGE_COUNT, UserRolesEnum } from "../constants.js";
import { upload } from "./../middlewares/multer.middleware.js";
import { validate } from "../validators/validate.js";
import { createProductValidator } from "../validators/product.validators.js";
import {
    mongodbIdRequestBodyValidator,
    mongodbIdInUrlValidator,
} from "../validators/common/mongodb.validator.js";

const router = Router();

// ! All routes are secured.
router
    .route("/")
    .get(getAllProducts)
    .post(
        verifyJWT,
        verifyUserPermission([UserRolesEnum.ADMIN]),
        upload.fields([
            {
                name: "mainImage",
                maxCount: 1,
            },
            {
                name: "subImages",
                maxCount: MAX_SUB_IMAGE_COUNT,
            },
        ]),
        createProductValidator(),
        validate,
        createProduct
    );

router
    .route("/:productId")
    .get(mongodbIdInUrlValidator("productId"), validate, getProductById)
    .patch(
        verifyJWT,
        verifyUserPermission([UserRolesEnum.ADMIN]),
        upload.fields([
            {
                name: "mainImage",
                maxCount: 1,
            },
            {
                name: "subImages",
                maxCount: MAX_SUB_IMAGE_COUNT,
            },
        ]),
        mongodbIdInUrlValidator("productId"),
        validate,
        updateProduct
    )
    .delete(
        verifyJWT,
        verifyUserPermission([UserRolesEnum.ADMIN]),
        mongodbIdInUrlValidator("productId"),
        validate,
        deleteProduct
    );

router
    .route("/category/:categoryId")
    .get(
        mongodbIdInUrlValidator("categoryId"),
        validate,
        getProductsByCategory
    );

router
    .route("/remove/sub-image/:productId/:subImageId")
    .patch(
        verifyJWT,
        verifyUserPermission([UserRolesEnum.ADMIN]),
        mongodbIdInUrlValidator("productId"),
        mongodbIdInUrlValidator("subImageId"),
        validate,
        removeProductSubImage
    );

export default router;
