import { SOCIALPLATFORMS } from "../constants";
import { LinkType } from "../enums";
import { SocialLink } from "../types";

export function isSocialPlatform(value: string): boolean {
    return SOCIALPLATFORMS.some((platform) => platform.value === value);
}

export function getSocialPlatform(value: string, kind: LinkType) {
    return SOCIALPLATFORMS.find((platform) => platform.value === value && platform.kind === kind) ?? SOCIALPLATFORMS.find((platform) => platform.value === value);
}

export function getSocialOption(id: string) {
    return SOCIALPLATFORMS.find((platform) => platform.id === id);
}

export function getSocialPlatformLabel(value: string, kind: LinkType) {
    return getSocialPlatform(value, kind)?.label ?? value;
}

export function getSocialPlaceholder(value: string, kind: LinkType) {
    return getSocialPlatform(value, kind)?.placeholder ?? (kind === LinkType.COPY ? "username" : "https://...");
}

export function parseSocials(value: string | null | undefined): SocialLink[] {
    if (!value) return [];

    try {
        const parsed = JSON.parse(value);

        if (!Array.isArray(parsed)) return [];

        return parsed.flatMap((item, index) => {
            if (!isSocialPlatform(item?.platform) || typeof item.value !== "string") return [];

            return [{
                id: typeof item.id === "string" ? item.id : `${Date.now()}-${index}`,
                platform: item.platform,
                kind: item.kind,
                value: item.value,
            }];
        });
    } catch {
        return [];
    }
}

export function serializeSocials(socialLinks: SocialLink[]) {
    return JSON.stringify(socialLinks.map(({ platform, kind, value }) => ({ platform, kind, value: value.trim() })).filter((item) => item.value));
}