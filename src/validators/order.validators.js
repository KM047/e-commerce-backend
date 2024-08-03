import { body } from "express-validator";

const verifyRazorpayPaymentValidator = () => {
    return [
        body("razorpay_order_id")
            .trim()
            .notEmpty()
            .withMessage("Razorpay order id must be required"),
        body("razorpay_payment_id")
            .trim()
            .notEmpty()
            .withMessage("Razorpay payment id must be required"),
        body("razorpay_signature")
            .trim()
            .notEmpty()
            .withMessage("Razorpay signature is missing"),
    ];
};

export { verifyRazorpayPaymentValidator };
