import type { NextFunction, Request, RequestHandler, Response } from "express";

export const TryCatch = (
  handler: (req: Request, res: Response, next: NextFunction) => Promise<any>
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