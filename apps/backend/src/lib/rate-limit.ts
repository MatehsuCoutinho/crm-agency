import rateLimit from "express-rate-limit";

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false
});

export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: "Too many write requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false
});
