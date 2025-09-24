import Redis from "ioredis";
import logger from "../src/utils/logger.js";

let redisClient;

const connectRedis = async () => {
  try {
    redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

    redisClient.on("connect", () => {
      logger.info("Redis connected successfully ✅");
    });

    redisClient.on("error", (err) => {
      logger.error("Redis Client Error ❌", err);
    });

  } catch (error) {
    logger.error("Redis connection error:", error);
  }
};

const getRedisClient = () => redisClient;

export default { connectRedis, getRedisClient };