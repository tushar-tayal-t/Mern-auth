import express from "express";
import dotenv from "dotenv";
import { connectToDb } from "./config/db.js";
import router from "./routes/user.js";
import cors from "cors";
import { connectToRedis } from "./config/redis.js";

const app = express();
dotenv.config();
app.use(express.json());
app.use("/api/v1", router); 
app.use(cors());

connectToDb();
connectToRedis();

app.listen(process.env.PORT, ()=>{
  console.log("App is running at port", process.env.PORT);
})