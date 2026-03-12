import express from "express";
import { registerUser, verifyUser } from "../controllers/user.js";

const router = express.Router();

router.post("/register", registerUser);
router.get("/verify/:token", verifyUser);

export default router;