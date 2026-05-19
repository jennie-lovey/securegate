import crypto from "crypto";
import { VERIFICATION_TOKEN_EXPIRY_MS, RESET_TOKEN_EXPIRY_MS } from "./constants";

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function verificationExpiry(): Date {
  return new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_MS);
}

export function resetExpiry(): Date {
  return new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
}
