import jwt, { type JwtPayload } from "jsonwebtoken";
import { redisClient } from "../config/redis.js";
import type { Response } from "express";
import { generateCSRFToken, revokeCSRFToken } from "./csrfToken.js";
import crypto from "crypto";

export const generateToken = async(id: string, res: Response) => {
  const sessionId = crypto.randomBytes(16).toString("hex");

  const accessToken = jwt.sign({id, sessionId}, process.env.JWT_SECRET || "", {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({id, sessionId}, process.env.REFRESH_SECRET || "", {
    expiresIn: "7d"
  });

  const refreshTokenKey = `refresh_token:${id}`;
  const activeSessionKey = `active_session:${id}`;
  const sessionDataKey = `session:${sessionId}`;

  const existingSession = await redisClient.get(activeSessionKey);
  if (existingSession) {
    await redisClient.del(`session:${existingSession}`);
    await redisClient.del(refreshTokenKey);
  }

  const sessionData = {
    userId: id,
    sessionId,
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  }

  await redisClient.setEx(refreshTokenKey, 7*24*60*60, refreshToken);
  await redisClient.setEx(activeSessionKey, 7*24*60*60, sessionId);
  await redisClient.setEx(sessionDataKey, 7*24*60*60, JSON.stringify(sessionData));

  res.cookie("accessToken", accessToken, {
    secure: true,
    httpOnly: true,
    sameSite: "none",
    maxAge: 15 * 60 * 1000
  });

  res.cookie("refreshToken", refreshToken, {
    secure: true,
    httpOnly: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  const csrfToken = await generateCSRFToken(id, res);

  return {refreshToken, accessToken, csrfToken, sessionId};
}

export const verifyRefreshToken = async(refreshToken: string) => {
  try {
    const decode = jwt.verify(refreshToken, process.env.REFRESH_SECRET as string) as JwtPayload;

    const storedToken = await redisClient.get(`refresh_token:${decode.id}`);

    if (storedToken !== refreshToken) {
      return null;
    }

    const activeSessionId = await redisClient.get(`active_session:${decode.id}`);

    if (activeSessionId !== decode.sessionId) {
      return null;
    }

    const sessionData = await redisClient.get(`session:${decode.sessionId}`);

    if (!sessionData) {
      return null;
    }

    const parsedSessionData = JSON.parse(sessionData);
    parsedSessionData.lastActivity = new Date().toISOString();

    await redisClient.setEx(`session:${decode.sessionId}`, 7 * 24 * 60 * 60, JSON.stringify(parsedSessionData));

    return decode;
  } catch(error: any) {
    return null;
  }
}

export const generateAccessToken = (id: string, sessionId: any, res: Response) => {
  const accessToken = jwt.sign({id, sessionId}, process.env.JWT_SECRET as string, {expiresIn: "15m"});
  
  res.cookie("accessToken", accessToken, {
    secure: true,
    httpOnly: true,
    sameSite: "none",
    maxAge: 15 * 60 * 1000
  });
}

export const revokeRefreshToken = async(userId: string)=>{
  const activeSessionId = await redisClient.get(`active_session:${userId}`);
  await redisClient.del(`refresh_token:${userId}`);
  await redisClient.del(`active_session:${userId}`);

  if (activeSessionId) {
    await redisClient.del(`session:${activeSessionId}`);
  }
  await revokeCSRFToken(userId);
}

export const isSessionActive = async(userId: string, sessionId: any) => {
  const activeSessionId = await redisClient.get(`active_session:${userId}`);
  return activeSessionId === sessionId;
}