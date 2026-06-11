import { Rss } from "lucide-react";
import { DiscordIcon, GithubIcon, GoogleIcon, TwitchIcon, XIcon, YoutubeIcon } from "@/app/components/SVG";
import { LinkType } from "./enums";

export const SOCIALPLATFORMS = [
    { id: "x-link", value: "x", kind: LinkType.LINK, label: "X (Twitter)", placeholder: "https://x.com/username", icon: XIcon },
    { id: "discord-copy", value: "discord", kind: LinkType.COPY, label: "Discord username", placeholder: "username", icon: DiscordIcon },
    { id: "discord-link", value: "discord", kind: LinkType.LINK, label: "Discord server", placeholder: "https://discord.gg/invite", icon: DiscordIcon },
    { id: "github-link", value: "github", kind: LinkType.LINK, label: "GitHub", placeholder: "https://github.com/username", icon: GithubIcon },
    { id: "twitch-link", value: "twitch", kind: LinkType.LINK, label: "Twitch", placeholder: "https://twitch.tv/username", icon: TwitchIcon },
    { id: "youtube-link", value: "youtube", kind: LinkType.LINK, label: "YouTube", placeholder: "https://youtube.com/@username", icon: YoutubeIcon },
    { id: "website-link", value: "website", kind: LinkType.LINK, label: "Website", placeholder: "https://example.com", icon: Rss },
];

export const AUTHPROVIDERS = [
    { slug: "google", label: "Google", icon: GoogleIcon },
    { slug: "github", label: "GitHub", icon: GithubIcon },
    { slug: "twitch", label: "Twitch", icon: TwitchIcon },
    { slug: "discord", label: "Discord", icon: DiscordIcon },
];

export const ALLOWEDHOSTS = new Set([
    "i.imgur.com",
    "images.unsplash.com",
    "media.discordapp.net",
    "cdn.discordapp.com",
    "cdn.pixabay.com"
]);