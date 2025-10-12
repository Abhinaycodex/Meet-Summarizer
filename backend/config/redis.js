// import Redis from "ioredis";
// import logger from "../src/utils/logger.js";
// import RedisStore from 'connect-redis'

// let redisClient;

// const connectRedis = async () => {
//   try {
//     redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

//     redisClient.on("connect", () => {
//       console.log("Redis connected successfully ✅");
//     });

//     redisClient.on("error", (err) => {
//       console.error("Redis Client Error ❌", err);
//     });

//   } catch (error) {
//     console.error("Redis connection error:", error);
//   }
// };

// const getRedisClient = () => redisClient;

// export { connectRedis, getRedisClient };