import type { NextFunction, RequestHandler, Response } from "express";
import type { AuthRequest } from "../middleware/isAuth.js";

export const TryCatch = (
  handler: (req: AuthRequest, res: Response, next: NextFunction) => Promise<any>
): RequestHandler => (
  async(req, res, next) => {
    try {
      await handler(req, res, next);
    } catch(error: any) {
      res.status(500).json({
        message: error.message
      });
    }
  }
)