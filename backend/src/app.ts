import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import { corsOptions } from "./config/cors.js";
import routes from "./routes.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

export const app = express();

app.use(morgan('dev'));
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use("/api", routes);

app.use(errorMiddleware);

app.get("/", (_req, res) => {
    res.send("Drivio API is running!");
});

export default app;
