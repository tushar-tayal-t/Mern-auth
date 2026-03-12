import mongoose from "mongoose";
import dns from "dns";
import dotenv from "dotenv";
dotenv.config();

dns.setServers(["8.8.8.8", "8.8.4.4"]);

export async function connectToDb() {
  const url = process.env.MONGO_URL || "";
  if (!url) {
    console.log("Db url not found");
    return;
  }
  mongoose
    .connect(url, {
      dbName: "MERNAuth",
      serverSelectionTimeoutMS: 5000,
      family: 4
    })
    .then(()=>{
      console.log("✅ Connected to db successfully");
    })
    .catch(()=>{
      console.log("❌ Failed to connect to db");
    });
}