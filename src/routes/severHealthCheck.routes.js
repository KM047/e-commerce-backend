import { Router } from "express";
import { serverHealth } from "../controllers/severHealthCheck.controllers.js";

const router = Router();

router.route("/").get(serverHealth);

export default router;
