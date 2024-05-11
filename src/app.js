import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// * User routes
import userRouter from "./routes/auth/user.routes.js";

// * Server Health check route
import severHealthCheck from "./routes/severHealthCheck.routes.js";

// * User apis
app.use("/api/v1/users", userRouter);

// * Server Health check api
app.use("/api/v1/sever-health", severHealthCheck);

export { app };
