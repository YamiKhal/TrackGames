import { ALLOWEDHOSTS } from "../constants";

/*
 * Safety checks
 * These helpers validate whether untrusted strings are allowed to be used in
 * rendered URLs or media sources. They do not rewrite input.
 */

/** Allows HTTPS media/source URLs only from explicitly approved hosts. */
export function isSafeUrl(src: unknown) {
    try {
        if (typeof src !== "string") return false;

        const url = new URL(src);

        if (url.protocol !== "https:") return false;
        if (!ALLOWEDHOSTS.has(url.hostname.toLowerCase())) return false;

        return true;
    } catch {
        return false;
    }
}

/** Allows HTTPS absolute links and same-site relative paths, but rejects protocol-relative URLs. */
export function isSafeLinkHref(href: unknown) {
    if (typeof href !== "string") return false;

    try {
        const url = new URL(href);

        return url.protocol === "https:";
    } catch {
        return href.startsWith("/") && !href.startsWith("//");
    }
}

/** Detects local video file extensions in a URL-like string. */
export function isVideoUrl(value: string) {
    return /\.(mp4|webm|ogg)(\?.*)?$/i.test(value);
}
