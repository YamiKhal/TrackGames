export function isSafeUrl(src: unknown) {
	try {
		if (typeof src !== "string") return false;

		return new URL(src).protocol === "https:";
	} catch {
		return false;
	}
}

/** Allows HTTPS absolute links and same-site relative paths, but rejects protocol-relative URLs. */
export function isSafeLinkHref(href: unknown) {
	if (typeof href !== "string") return false;
	if (isSafeUrl(href)) return true;

	return href.startsWith("/") && !href.startsWith("//");
}

/** Detects local video file extensions in a URL-like string. */
export function isVideoUrl(value: string) {
	const path = value.split("?", 1)[0].toLowerCase();

	return path.endsWith(".mp4") || path.endsWith(".webm") || path.endsWith(".ogg");
}
