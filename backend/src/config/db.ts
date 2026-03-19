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
  try {
    await mongoose.connect(url, {
      dbName: "MERNAuth",
      serverSelectionTimeoutMS: 5000,
      family: 4
    })
    console.log("✅ Connected to db successfully");
  } catch(error) {
    console.error("❌ Fail to connect to mongo server with error:\n", error);
    process.exit(1);
  }
}