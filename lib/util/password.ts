import "server-only";

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;
const PASSWORD_VERSION = "scrypt-v1";

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;

  return `${PASSWORD_VERSION}:${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [version, salt, key] = storedHash.split(":");

  if (version !== PASSWORD_VERSION || !salt || !key) {
    return false;
  }

  const expectedKey = Buffer.from(key, "hex");
  const actualKey = (await scryptAsync(password, salt, expectedKey.length)) as Buffer;

  if (actualKey.length !== expectedKey.length) {
    return false;
  }

  return timingSafeEqual(actualKey, expectedKey);
}