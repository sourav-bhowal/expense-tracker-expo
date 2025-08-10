import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

export const rateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "15 m"), // 100 requests per 15 minutes
  analytics: true, // Enable analytics for rate limiting
  prefix: "ratelimit",
});
