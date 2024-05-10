import connectDB from "./db/index.js";
import { app } from "./app.js";
import dotenv from "dotenv";

dotenv.config({
    path: "./.env",
});

connectDB()
    .then(() => {
        app.on("error", (err) => {
            console.log("Error: ", err);
        });

        app.listen(process.env.PORT || 8001, () => {
            console.log(`⚙️  Server listening`);
        });
    })

    .catch((error) => {
        console.log(` Mongo db connection failed  !!!  ${error}`);
    });
