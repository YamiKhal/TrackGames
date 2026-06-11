import { ALLOWEDHOSTS } from "../constants";

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

export function isSafeLinkHref(href: unknown) {
    if (typeof href !== "string") return false;

    try {
        const url = new URL(href);

        return url.protocol === "https:";
    } catch {
        return href.startsWith("/") && !href.startsWith("//");
    }
}

export function isVideoUrl(value: string) {
    return /\.(mp4|webm|ogg)(\?.*)?$/i.test(value);
}

export function normalizeColorInput(value: string) {
    return /^#[0-9a-f]{6}$/i.test(value) ? value : "#7B5CDB";
}