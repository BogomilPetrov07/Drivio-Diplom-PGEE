import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import path from 'path';
import {corsOptions} from "./config/cors.js";
import {errorMiddleware} from "./middlewares/error.middleware.js";
import routes from "./routes.js";

export const app = express();

app.set('trust proxy', 1);

app.use(morgan('dev'));
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use("/api", routes);

app.use(errorMiddleware);

app.use((_req, res, next) => {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    next();
});

app.get("/", (_req, res) => {
    res.send("Drivio API is running!");
});

app.head('/health', (_req, res) => {
    res.status(200).send('OK');
});

app.get('/health', (_req, res) => {
    res.status(200).send('OK');
});

const rootPath = process.cwd(); // Gets the root directory of the project
app.use(express.static(path.join(rootPath, 'public')));

export default app;
