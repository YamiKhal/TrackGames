export function ratingToFive(value?: number | null) {
	if (!value) return undefined;
	return Math.min(5, Math.max(0, value / 20));
}

export function ratingToHundred(value?: number | null) {
	if (!value) return undefined;
	return Math.min(100, Math.max(0, value * 20));
}
