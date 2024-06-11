import { Router } from "express";
import { verifyJWT } from "./../middlewares/auth.middleware.js";
import {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
} from "../controllers/category.controllers.js";

const router = Router();

router.use(verifyJWT);

router.route("/").get(getAllCategories).post(createCategory);
router
    .route("/:categoryId")
    .get(getCategoryById)
    .patch(updateCategory)
    .delete(deleteCategory);

export default router;
