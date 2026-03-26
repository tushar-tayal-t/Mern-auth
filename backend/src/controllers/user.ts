import { TryCatch } from "../utils/TryCatch.js";
import sanitize from "mongo-sanitize";
import { loginSchema, otpSchema, registerSchema } from "../utils/zod.js";
import { redisClient } from "../config/redis.js";
import { User } from "../models/User.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendMail } from "../utils/sendMail.js";
import { getOtpHtml, getVerifyEmailHtml } from "../templates/html.js";
import { generateAccessToken, generateToken, revokeRefreshToken, verifyRefreshToken } from "../utils/generateToken.js";
import { refreshCSRFToken } from "../utils/csrfToken.js";

export const registerUser = TryCatch(async(req, res) => {
  const santizeBody = sanitize(req.body);
  const validation = registerSchema.safeParse(santizeBody);

  if (!validation.success) {
    const zodError = validation.error;
    let firstErrorMessage = "Validation failed";
    let allErrors: any[] = [];
    if (zodError.issues && Array.isArray(zodError.issues)) {
      allErrors = zodError.issues.map((issue) => ({
        field: issue.path ? issue.path.join(".") : "unknown",
        message: issue.message || "Validation error",
        code: issue.code
      }));
      firstErrorMessage = allErrors[0]?.message || firstErrorMessage
    }
    return res.status(400).json({
      name: firstErrorMessage,
      message: allErrors
    });
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
      message: "User already exist with this email",
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
      name: newUser.name,
      email: newUser.email
    }
  });
});

export const loginUser = TryCatch(async(req, res)=>{
  const sanitizeBody = sanitize(req.body);
  const validation = loginSchema.safeParse(sanitizeBody);
  
  if (!validation.success) {
    const zodError = validation.error;
    let allErrors: any[] = [];
    let firstErrorMessage = "Validation error";
    if (zodError.issues && Array.isArray(zodError.issues)) {
      allErrors = zodError.issues.map((issue)=>({
        field: issue.path ? issue.path.join(".") : "unknown",
        message: issue.message || "Validation error",
        code: issue.code
      }));
      firstErrorMessage = allErrors[0]?.message || firstErrorMessage;
    }
    return res.status(400).json({
      name: firstErrorMessage,
      message: allErrors
    });
  }

  const {email, password} = validation.data;

  const rateLimitKey = `login-rate-limit:${req.ip}:${email}`
  if (await redisClient.get(rateLimitKey)) {
    return res.status(429).json({
      message: "Too many request, try again later"
    });
  }

  const user = await User.findOne({
    email
  });

  if (!user) {
    return res.status(400).json({
      message: "Please enter valid crendials",
    });
  }

  const matchPassword = await bcrypt.compare(password, user?.password as string);
  if (!matchPassword) {
    return res.status(400).json({
      message: "Please enter valid crendials",
    });
  }

  const otp = Math.floor(100000 + Math.random() * 90000).toString();
  const otpKey = `otp:${email}`;

  await redisClient.set(otpKey, JSON.stringify(otp), {EX: 300});

  const subject = `Otp for verification`;
  const html = getOtpHtml({email, otp})

  await sendMail({email, subject, html});

  await redisClient.set(rateLimitKey, "true", {EX: 60});

  return res.json({
    message: "If your email is valid, an otp has been sent. It will expires in 5 minutes",
  });
});

export const verifyOtp = TryCatch(async(req, res)=>{
  const sanitizeBody = sanitize(req.body);
  const validation = otpSchema.safeParse(sanitizeBody);

  if (!validation.success) {
    const zodError = validation.error;
    let allErrors: any[] = [];
    let firstErrorMessage = "Validation error";
    if (zodError.issues && Array.isArray(zodError.issues)) {
      allErrors = zodError.issues.map((issue)=>({
        field: issue.path ? issue.path.join(".") : "unknown",
        message: issue.message || "Validation error",
        code: issue.code
      }));
      firstErrorMessage = allErrors[0]?.message || firstErrorMessage;
    }
    return res.status(400).json({
      name: firstErrorMessage,
      message: allErrors
    });
  }

  const {email, otp} = validation.data;

  if (!email || !otp) {
    return res.status(400).json({
      message: "Please provide all details"
    })
  }
  
  const otpKey = `otp:${email}`;

  const storedOtpString = await redisClient.get(otpKey);

  if (!storedOtpString) {
    return res.status(400).json({
      message: "otp expired"
    })
  }
  
  const storedOtp = JSON.parse(storedOtpString);
  if (storedOtp !== otp) {
    return res.status(400).json({
      message: "Invalid otp"
    })
  }

  await redisClient.del(otpKey);

  let user = await User.findOne({email}).select("-password -__v");

  if (!user) {
    return res.status(404).json({
      message: "User not found"
    });
  }

  const tokenData = await generateToken(user._id.toString(), res);

  res.json({
    message: `Welcome ${user.name}`,
    user,
    sessionInfo: {
      sessionId: tokenData.sessionId,
      loginTime: new Date().toISOString(),
      csrfToken: tokenData.csrfToken,
    }
  });
});

export const myProfile = TryCatch(async(req, res)=>{
  const user = req.user;
  const sessionId = req.sessionId;
  const sessionData = await redisClient.get(`session:${sessionId}`);

  let sessionInfo = null;
  if (sessionData) {
    const parsedSession = JSON.parse(sessionData);
    sessionInfo = {
      sessionId,
      loginTime: parsedSession.createdAt,
      lastActivity: parsedSession.lastActivity,
    }
  }
  res.json({user, sessionInfo});
});

export const refreshToken = TryCatch(async(req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      message: "Invalid refresh token",
    });
  }

  const decode = await verifyRefreshToken(refreshToken);
  if (!decode || !decode.id) {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.clearCookie("csrfToken");
    return res.status(401).json({
      message: "Invalid refresh token or session expired",
    });
  }

  generateAccessToken(decode.id, decode.sessionId, res);
  res.status(200).json({
    message: "Access token refreshed"
  })
});

export const logoutUser = TryCatch(async(req, res)=>{
  const userId = req.user?._id;

  if (!userId) {
    return res.status(404).json({
      message: "User id not found"
    });
  }

  await revokeRefreshToken(userId.toString());

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.clearCookie("csrfToken");

  await redisClient.del(`user:${userId}`);

  res.json({
    message: "Logout successfully"
  })
});

export const refreshCSRF = TryCatch(async(req, res)=>{
  const userId = req.user?._id;

  if (!userId) {
    return res.status(404).json({
      message: "User id not found"
    });
  }

  const newCSRFToken = await refreshCSRFToken(userId.toString(), res);

  res.json({
    message: "CSRF token refreshed successfully",
    csrfToken: newCSRFToken
  })
})

export const adminController = TryCatch(async(req, res)=>{
  res.json({
    message: "hello admin",
  })
})