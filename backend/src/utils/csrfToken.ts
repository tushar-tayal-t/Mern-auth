import crypto from "crypto";
import { redisClient } from "../config/redis.js";
import type { Response } from "express";

export const generateCSRFToken = async(userId: string, res: Response) => {
  const csrfToken = crypto.randomBytes(32).toString("hex");

  const csrfKey = `csrf:${userId}`;

  await redisClient.setEx(csrfKey, 3600, csrfToken);

  res.cookie("csrfToken", csrfToken, {
    httpOnly: false,
    secure: true,
    sameSite: "none",
    maxAge: 60 * 60 * 1000,
  });

  return csrfToken;
}

export const refreshCSRFToken = async(userId: string, res: Response) => {
  await revokeCSRFToken(userId);

  return await generateCSRFToken(userId, res);
}

export const revokeCSRFToken = async(userId: string) => {
  const csrfKey = `csrf:${userId}`;

  await redisClient.del(csrfKey);
}