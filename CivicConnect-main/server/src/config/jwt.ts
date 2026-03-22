import jwt, { type SignOptions } from "jsonwebtoken";

const getJwtSecret = (): string => {
  return process.env.JWT_SECRET || "dev-secret-change-me";
};

export interface JwtPayload {
  userId: string;
  role: "citizen" | "admin";
  email: string;
}

export const signToken = (payload: JwtPayload): string => {
  const expiresIn = (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"];

  return jwt.sign(payload, getJwtSecret(), {
    expiresIn,
  });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, getJwtSecret()) as JwtPayload;
};
