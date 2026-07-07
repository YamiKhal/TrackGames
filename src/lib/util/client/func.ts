import { twMerge } from "tailwind-merge";
import { clamp } from "@/lib/util/validate/normalize";

export function deferHook(callback: () => void) {
	const shortTimer = globalThis.setTimeout(callback, 0);

	return () => globalThis.clearTimeout(shortTimer);
}

export function joinClass(...classes: Array<string | false | undefined | null>) {
	return twMerge(classes.filter(Boolean) as string[]);
}

export function formLabel(status: string) {
	return status.toLowerCase().replace("_", " ");
}

export function stepIndex(current: number, direction: -1 | 1, length: number, mode: "wrap" | "clamp" = "clamp") {
	if (mode === "wrap") return (current + direction + length) % length;

	return clamp(current + direction, 0, length - 1);
}
