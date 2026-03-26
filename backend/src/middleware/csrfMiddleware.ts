import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../middleware/isAuth.js";
import { redisClient } from "../config/redis.js";

export const verifyCsrfToken = async(req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.method === 'GET') {
      return next();
    }
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        message: "User not authenticated",
      })
    }

    const clientToken = 
      req.headers["x-csrf-token"] || 
      req.headers["x-xsrf-token"] || 
      req.headers["csrf-token"];

    if (!clientToken) {
      return res.status(403).json({
        message: "Csrf token missing. Please refresh the page.",
        code: "CSRF_TOKEN_MISSING",
      })
    }

    const csrfKey = `csrf:${userId}`;

    const storedToken = await redisClient.get(csrfKey);

    if (!storedToken) {
      return res.status(403).json({
        message: "Csrf token expired. Please try again.",
        code: "CSRF_TOKEN_EXPIRED",
      })
    }

    if (storedToken !== clientToken) {
      return res.status(403).json({
        message: "Invalid csrf token. Please refresh the page",
        code: "CSRF_TOKEN_INVALID",
      })
    }

    next();
  } catch(error) {
    console.log("CSRF verification error:\n", error);
    res.status(403).json({
      message: "CSRF verificaiton failed",
      code: "CSRF_VERIFICATION_ERROR",
    })
  }
}