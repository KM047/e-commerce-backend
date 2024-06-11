import { body, param } from "express-validator";

export const mongodbIdInUrlValidator = (idName) => {
    return [
        param(idName)
            .notEmpty()
            .isMongoId()
            .withMessage(
                `The given user id ${idName} in url/params is invalid.`
            ),
    ];
};

export const mongodbIdRequestBodyValidator = (idName) => {
    return [
        body(idName)
            .notEmpty()
            .isMongoId()
            .withMessage(`The given user id ${idName} in body is invalid.`),
    ];
};
