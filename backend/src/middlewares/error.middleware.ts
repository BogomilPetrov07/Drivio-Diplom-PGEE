import { Request, Response, NextFunction } from "express";

export function errorMiddleware(
    err: Error,
    _: Request,
    res: Response,
    __: NextFunction
) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
}
