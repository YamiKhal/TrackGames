import type { Metadata } from "next";
import { isSafeLinkHref, isVideoUrl } from "./util/safety";

export const SITE_NAME = "TrackGames";
export const DEFAULT_SITE_URL = "https://trackgames.app";
export const DEFAULT_DESCRIPTION = "Rate, track, and organize your game library. Build playlists, customize your profile, and share your games with friends.";
export const DEFAULT_OG_IMAGE = `${DEFAULT_SITE_URL}/opengraph-image`;

export function absoluteUrl(path: string) {
    if (path.startsWith("http://") || path.startsWith("https://")) return path;

    return `${DEFAULT_SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function metadataDescription(value: string | null | undefined, fallback = DEFAULT_DESCRIPTION) {
    const description = value?.trim() || fallback;

    return description.length > 160 ? `${description.slice(0, 157).trim()}...` : description;
}

export function metadataImage(value: string | null | undefined) {
    return value && isSafeLinkHref(value) && !isVideoUrl(value) ? absoluteUrl(value) : DEFAULT_OG_IMAGE;
}

export function robotsForPrivacy(privacy: string | null | undefined): Metadata["robots"] {
    return privacy === "public" ? {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
        },
    } : {
        index: false,
        follow: false,
        googleBot: {
            index: false,
            follow: false,
        },
    };
}
