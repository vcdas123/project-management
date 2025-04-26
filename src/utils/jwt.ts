import jwt from "jsonwebtoken";
import { config } from "../config";
import { User } from "../entities/User";

interface TokenPayload {
  userId: string;
  role: string;
}

export const generateToken = (user: User): string => {
  const payload: TokenPayload = {
    userId: user.id,
    role: user.role,
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: Number(config.jwt.expiresIn) || 24 * 60 * 60,
  });
};

export const generateRefreshToken = (user: User): string => {
  const payload: TokenPayload = {
    userId: user.id,
    role: user.role,
  };

  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: Number(config.jwt.refreshExpiresIn) || 24 * 60 * 60,
  });
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, config.jwt.secret) as TokenPayload;
  } catch (error) {
    throw new Error("Invalid token");
  }
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
  } catch (error) {
    throw new Error("Invalid refresh token");
  }
};
