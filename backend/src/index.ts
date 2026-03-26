import express from "express";
import dotenv from "dotenv";
import { connectToDb } from "./config/db.js";
import router from "./routes/user.js";
import cors from "cors";
import { connectToRedis } from "./config/redis.js";
import cookieParser from "cookie-parser";

const app = express();
dotenv.config();
app.use(cors(
  {
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "DELETE", "PUT", "OPTIONS"],
  }
));
app.use(express.json());
app.use(cookieParser());
app.use("/api/v1", router); 

connectToDb();
connectToRedis();

app.listen(process.env.PORT, ()=>{
  console.log("App is running at port", process.env.PORT);
})