import { TryCatch } from "../utils/TryCatch.js";
import sanitize from "mongo-sanitize";
import { registerSchema } from "../utils/zod.js";
import { redisClient } from "../config/redis.js";
import { User } from "../models/User.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendMail } from "../utils/sendMail.js";
import { getVerifyEmailHtml } from "../templates/html.js";

export const registerUser = TryCatch(async(req, res) => {
  const santizeBody = sanitize(req.body);
  const validation = registerSchema.safeParse(santizeBody);

  if (!validation.success) {
    const zodError = validation.error;
    let firstErrorMessage = "Validation failed"    ;
    let allErrors: any[] = [];
    if (zodError.issues && Array.isArray(zodError.issues)) {
      allErrors = zodError.issues.map((issue) => ({
        field: issue.path ? issue.path.join(".") : "unknown",
        message: issue.message || "Validation error",
        code: issue.code
      }));
      firstErrorMessage = allErrors[0]?.message || "Validation Error"
    }
    res.status(400).json({
      name: firstErrorMessage,
      message: allErrors
    });
    return;
  }

  const {name, email, password} = validation.data;

  const rateLimitKey = `register-rate-limit:${req.ip}:${email}`;

  if (await redisClient.get(rateLimitKey)) {
    return res.status(429).json({
      message: "Too many request, try again later"
    });
  }

  const existingUser = await User.findOne({email});
  if (existingUser) {
    return res.status(400).json({
      message: "User already exists",
    });
  }

  const hashPassword = await bcrypt.hash(password, 10);
  const verifyToken = crypto.randomBytes(32).toString("hex");
  const verfiyKey = `verfiy:${verifyToken}`;
  const dataToStore = JSON.stringify({
    name,
    email,
    password: hashPassword
  });

  await redisClient.set(verfiyKey, dataToStore, {
    EX: 300
  });

  const subject = "Verify your email for account creating";
  const html = getVerifyEmailHtml({email, token: verifyToken});

  await sendMail({email, subject, html});

  await redisClient.set(rateLimitKey, "true", {EX: 60});

  res.json({
    message: "If your email is valid, a verification link has been sent. It will expire in 5 minutes"
  });
});

export const verifyUser = TryCatch(async(req, res) => {
  const {token} = req.params;
  if (!token) {
    return res.status(400).json({
      message: "Verification token is required",
    });
  }

  const verifyKey = `verfiy:${token}`;

  const userDataJson = await redisClient.get(verifyKey);
  if (!userDataJson) {
    return res.status(400).json({
      message: "Verification Link is expired"
    });
  }
  
  await redisClient.del(verifyKey);

  const userData = JSON.parse(userDataJson);

  const existingUser = await User.findOne({email: userData?.email});
  if (existingUser) {
    return res.status(400).json({
      message: "User already exists",
    });
  }

  const newUser = await User.create({
    name: userData.name,
    email: userData.email,
    password: userData.password
  });
  
  res.status(201).json({
    message: "Email verified successfully! Your account has been created",
    user: {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email
    }
  });
})