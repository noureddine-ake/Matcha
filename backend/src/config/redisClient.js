import { createClient } from "redis";

// Use Docker service name 'redis' as host
const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://redis:6379"
});

redisClient.on("error", (err) => console.error("Redis error:", err));

await redisClient.connect(); // connect once when server starts

export default redisClient;
