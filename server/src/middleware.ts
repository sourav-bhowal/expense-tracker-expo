import type { Request, Response, NextFunction } from "express";
import { rateLimit } from "./redis";

export const rateLimitMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { success } = await rateLimit.limit(req.ip!); // Use req.ip to get the client's IP address
    if (!success) {
      return res
        .status(429)
        .json({ message: "Too many requests. Please try again later." });
    }
    next();
  } catch (error) {
    console.error("Rate limit error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
