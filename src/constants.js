export const DB_NAME = "e-commerce";

export const UserRolesEnum = {
    ADMIN: "ADMIN",
    USER: "USER",
};

export const AvailableUserRolesEnum = Object.values(UserRolesEnum);

export const OrderStatusEnum = {
    PENDING: "PENDING",
    CANCELLED: "CANCELLED",
    DELIVERED: "DELIVERED",
};

export const AvailableOrderStatuses = Object.values(OrderStatusEnum);

export const PaymentProviderEnum = {
    UNKNOWN: "UNKNOWN",
    RAZORPAY: "RAZORPAY",
};

export const AvailablePaymentProviders = Object.values(PaymentProviderEnum);

export const CouponTypeEnum = {
    FLAT: "FLAT",
};

export const AvailableCouponTypes = Object.values(CouponTypeEnum);

export const USER_VERIFICATION_TOKEN_EXPIRY = 20 * 60 * 1000;

export const MAX_SUB_IMAGE_COUNT = 4;
