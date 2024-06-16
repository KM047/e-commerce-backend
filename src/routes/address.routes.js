import { Router } from "express";
import { verifyJWT } from "./../middlewares/auth.middleware.js";
import {
    createAddress,
    deleteAddress,
    getAddressById,
    getAllAddresses,
    updateAddress,
} from "../controllers/address.controllers.js";
import {
    createUserAddressValidator,
    updateAddressValidator,
} from "../validators/address.validators.js";
import { validate } from "./../validators/validate.js";
import { mongodbIdInUrlValidator } from "./../validators/common/mongodb.validator.js";

const router = Router();

router.use(verifyJWT);

router
    .route("/")
    .get(getAllAddresses)
    .post(createUserAddressValidator(), validate, createAddress);
router
    .route("/:addressId")
    .get(mongodbIdInUrlValidator("addressId"), validate, getAddressById)
    .patch(
        mongodbIdInUrlValidator("addressId"),
        updateAddressValidator(),
        validate,
        updateAddress
    );
router
    .route("/remove/:addressId")
    .delete(mongodbIdInUrlValidator("addressId"), validate, deleteAddress);

export default router;
