import jwt, { type JwtPayload } from "jsonwebtoken";
import { TryCatch } from "../utils/TryCatch.js";
import { redisClient } from "../config/redis.js";
import type { NextFunction, Request, Response } from "express";

interface AuthRequest extends Request{
  user?: string
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
  
    const cacheUser = await redisClient.get(`user:${decodedData.id}`);
  
    if (cacheUser) {
      req.user = JSON.parse(cacheUser);
      return next();
    }
    
  } catch(error: any) {

  }
}