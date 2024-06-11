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

// * Profile route
import profileRouter from "./routes/profile.routes.js";

// * Products route
import productRouter from "./routes/product.routes.js";

// * Category route
import categoryRouter from "./routes/category.routes.js";

// * Orders route
// import userOrders from "./routes/order.routes.js";

// * Coupon route
// import couponRouter from "./routes/coupon.routes.js";

// * Cart route
// import userCartRouter from "./routes/cart.routes.js";

// * address route
// import userAddressRouter from "./routes/address.routes.js";

// * User apis
app.use("/api/v1/users", userRouter);

// * Server Health check api
app.use("/api/v1/sever-health", severHealthCheck);

// * User profile api
app.use("/api/v1/profile", profileRouter);

// * Products api
app.use("/api/v1/products", productRouter);

// * Category api
app.use("/api/v1/categories", categoryRouter);

// * Orders api
// app.use("/api/v1/orders", userOrders);

// * Coupon api
// app.use("/api/v1/coupons", couponRouter);

// * Cart api
// app.use("/api/v1/cart", userCartRouter);

// * address api
// app.use("/api/v1/addresses", userAddressRouter);

export { app };
