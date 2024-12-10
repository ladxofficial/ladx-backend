import { NextFunction, Request, Response } from "express";

export const asyncHandler =
    (fn: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>) =>
        (req: Request, res: Response, next: NextFunction): void => {
            fn(req, res, next).catch(next);
        };
