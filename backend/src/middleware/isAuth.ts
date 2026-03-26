import jwt, { type JwtPayload } from "jsonwebtoken";
import { TryCatch } from "../utils/TryCatch.js";
import { redisClient } from "../config/redis.js";
import type { NextFunction, Request, Response } from "express";
import { User, type UserSchema } from "../models/User.js";
import { isSessionActive } from "../utils/generateToken.js";

type SafeUser = Omit<UserSchema, "password">;

export interface AuthRequest extends Request{
  user?: SafeUser;
  sessionId?: string;
}

export const isAuth = async(req: AuthRequest, res: Response, next: NextFunction)=>{
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      return res.status(403).json({
        message: "Please login - no token",
      });
    }
    
    const decodedData = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
  
    if (!decodedData) {
      return res.status(400).json({
        message: "Token expired",
      });
    }
    const sessionActive = await isSessionActive(decodedData.id?.toString(), decodedData.sessionId);
    if (!sessionActive) {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      res.clearCookie("csrfToken");

      return res.status(401).json({
        message: "session expired. You have been logged in from another device"
      })
    }
  
    // const cacheUser = await redisClient.get(`user:${decodedData.id}`);
  
    // if (cacheUser) {
    //   req.user = JSON.parse(cacheUser);
    //   req.sessionId = decodedData.sessionId;
    //   return next();
    // }

    const user = await User.findById(decodedData.id).select("-password -__v");
    if (!user) {
      return res.status(404).json({
        message: "No user with this id",
      })
    }

    // await redisClient.setEx(`user:${user._id}`, 3600, JSON.stringify(user.toObject()));
    req.user = user.toObject();
    req.sessionId = decodedData.sessionId;
    next();
  } catch(error: any) {
    res.status(500).json({
      message: error.message
    });
  }
}

export const authorizedAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = req.user;

  if (user?.role !== "admin") {
    return res.status(401).json({
      message: "You are not allowed for this activity",
    });
  }

  next();
}