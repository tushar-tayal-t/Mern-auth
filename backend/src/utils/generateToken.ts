import jwt from "jsonwebtoken";
import { redisClient } from "../config/redis.js";
import type { Response } from "express";

export const generateToken = async(id: string, res: Response) => {
  const accessToken = jwt.sign({id}, process.env.JWT_SECRET || "", {
    expiresIn: "1m",
  });

  const refreshToken = jwt.sign({id}, process.env.REFRESH_SECRET || "", {
    expiresIn: "7d"
  });

  const refreshTokenKey = `refresh_token:${id}`;

  await redisClient.setEx(refreshTokenKey, 7*24*60*60, refreshToken);

  res.cookie("accesstoken", accessToken, {
    // secure: true,
    httpOnly: true,
    sameSite: "strict",
    maxAge: 1 * 60 * 1000
  });

  res.cookie("refreshToken", refreshToken, {
    // secure: true,
    httpOnly: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  return {refreshToken, accessToken};
}