import { body } from "express-validator";
import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendEmail = async (options) => {
    const mailGenerator = new Mailgen({
        theme: "default",
        product: {
            name: "E-commerce",
            link: "https://commanysiteurl.com/",
        },
    });

    const emailText = mailGenerator.generatePlaintext(options.mailgenContent);

    const emailHTML = mailGenerator.generate(options.mailgenContent);

    const transport = nodemailer.createTransport({
        host: process.env.MAILTRAP_SMTP_HOST,
        port: process.env.MAILTRAP_SMTP_PORT,
        auth: {
            user: process.env.MAILTRAP_SMTP_USER,
            pass: process.env.MAILTRAP_SMTP_PASS,
        },
    });

    const mail = {
        from: "demomailtrap.com", // sender address
        to: options.email, // list of receivers
        subject: options.subject, // Subject line
        text: emailText, // plain text body
        html: emailHTML, // html body
    };

    try {
        await transport.sendMail(mail);
    } catch (error) {
        console.log(
            "Error while sending mail , please check your .env variable and try again"
        );

        console.log("Email sending service failed silently", error);
    }
};

const emailVerificationMailgenContent = (username, verificationUrl) => {
    return {
        body: {
            name: username,
            intro: "Welcome to e-commerce! We're very excited to have you on board.",
            action: {
                instructions:
                    "To get started with this app , please click here to verify your account:",
                button: {
                    color: "#22BC66", // Optional action button color
                    text: "Verify your account",
                    link: verificationUrl,
                },
            },
            outro: "Need help, or have questions? Just reply to this email, we'd love to help.",
        },
    };
};

const forgotPasswordMailgenContent = (username, resetPasswordURL) => {
    return {
        body: {
            name: username,
            intro: "We got the request for the reset your password.",
            action: {
                instructions: "For reset your password click on give button:",
                button: {
                    color: "#22BC66", // Optional action button color
                    text: "Verify your account",
                    link: resetPasswordURL,
                },
            },
            outro: "If you are not send any request to reset your password then ignore this.",
        },
    };
};

const orderConfirmationMailgenContent = (username, items, totalCost) => {
    return {
        body: {
            name: username,
            intro: "Your order has been processed successfully.",
            table: {
                data: items?.map((item) => {
                    return {
                        item: item.product?.name,
                        price: "INR" + item.product?.price + " /-",
                        quantity: item.quantity,
                    };
                }),

                columns: {
                    customWidth: {
                        item: "20%",
                        price: "15%",
                        quantity: "15%",
                    },
                    customAlignment: {
                        price: "right",
                        quantity: "right",
                    },
                },
            },
            outro: [
                `Total order cost: INR ${totalCost}/-`,
                "You can check the status of your order and more in your order history",
            ],
        },
    };
};

export {
    sendEmail,
    emailVerificationMailgenContent,
    forgotPasswordMailgenContent,
    orderConfirmationMailgenContent,
};
