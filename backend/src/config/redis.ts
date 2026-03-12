import { createClient } from "redis";

export const redisClient = createClient({
  url: process.env.REDIS_URL || "",
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 5) {
        console.log("❌ Max Redis reconnection attempts reached");
        return false;
      }
      return Math.min(retries * 500, 3000);
    }
  }
});

redisClient.on("error", (err) => {
  console.error("❌ Redis client error:", err.message);
});

redisClient.on("connect", function() {
  console.log("✅ Successfully connect to redis");
});

redisClient.on("reconnecting", () => {
  console.log("🔄 Reconnecting to Redis...");
});

export async function connectToRedis() {
  try {
    await redisClient.connect()
  } catch(error) {
    console.error("❌ Failed to connect to Redis:", error);
  }
}