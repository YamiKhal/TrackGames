import * as z from "zod";

export const USERNAME_MAX_LENGTH = 32;
export const USERNAME_ERROR = "Use 1-32 letters, numbers, underscores, or hyphens.";
export const USERNAME_PATTERN = /^[A-Za-z0-9_-]+$/;
export const usernameSchema = z.string().min(1).max(USERNAME_MAX_LENGTH).regex(USERNAME_PATTERN);
