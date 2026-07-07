import z from "zod";
import { type FeedbackType, type ReportReason, type ReportTargetType } from "@/lib/generated/prisma/enums";
import { LinkType } from "@/lib/types";

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
	SPAM: "Spam or advertising",
	HARASSMENT: "Harassment or bullying",
	HATE: "Hate speech",
	SEXUAL: "Sexual or explicit content",
	VIOLENCE: "Violence or threats",
	ILLEGAL: "Illegal content",
	IMPERSONATION: "Impersonation",
	MISINFORMATION: "Misinformation",
	OTHER: "Something else",
};

export const REPORT_TARGET_LABELS: Record<ReportTargetType, string> = {
	COMMENT: "Comment",
	USER_PROFILE: "Profile",
	GAME_LIST: "List",
	GAME: "Game",
};

export const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
	BUG: "Bug report",
	SUGGESTION: "Suggestion",
	UI: "Design / UI",
	PERFORMANCE: "Performance",
	CONTENT: "Content / data",
	OTHER: "Other",
};

export const SOCIAL_PLATFORMS = [
	{ id: "x-link", value: "x", kind: LinkType.LINK, label: "X (Twitter)", placeholder: "https://x.com/username" },
	{ id: "discord-copy", value: "discord", kind: LinkType.COPY, label: "Discord username", placeholder: "username" },
	{
		id: "discord-link",
		value: "discord",
		kind: LinkType.LINK,
		label: "Discord server",
		placeholder: "https://discord.gg/invite",
	},
	{
		id: "github-link",
		value: "github",
		kind: LinkType.LINK,
		label: "GitHub",
		placeholder: "https://github.com/username",
	},
	{
		id: "twitch-link",
		value: "twitch",
		kind: LinkType.LINK,
		label: "Twitch",
		placeholder: "https://twitch.tv/username",
	},
	{
		id: "youtube-link",
		value: "youtube",
		kind: LinkType.LINK,
		label: "YouTube",
		placeholder: "https://youtube.com/@username",
	},
	{ id: "website-link", value: "website", kind: LinkType.LINK, label: "Website", placeholder: "https://example.com" },
];

export const AUTH_PROVIDERS = [
	{ slug: "google", label: "Google" },
	{ slug: "github", label: "GitHub" },
	{ slug: "twitch", label: "Twitch" },
	{ slug: "discord", label: "Discord" },
];

export const SETTING_TABS: { id: string; label: string; href: string }[] = [
	{ id: "profile", label: "Profile", href: "/settings?tab=profile" },
	{ id: "privacy", label: "Privacy", href: "/settings?tab=privacy" },
	{ id: "widgets", label: "Widgets", href: "/settings?tab=widgets" },
	{ id: "preferences", label: "Preferences", href: "/settings?tab=preferences" },
	{ id: "import", label: "Import", href: "/settings?tab=import" },
	{ id: "backing", label: "Backing", href: "/settings?tab=backing" },
	{ id: "feedback", label: "Feedback", href: "/settings?tab=feedback" },
	{ id: "data", label: "Data", href: "/settings?tab=data" },
	{ id: "account", label: "Account", href: "/settings?tab=account" },
];

export const ADMIN_TABS: { id: string; label: string; href: string }[] = [
	{ id: "overview", label: "Overview", href: "/dashboard?tab=overview" },
	{ id: "reports", label: "Reports", href: "/dashboard?tab=reports" },
	{ id: "feedback", label: "Feedback", href: "/dashboard?tab=feedback" },
	{ id: "members", label: "Members", href: "/dashboard?tab=members" },
	{ id: "moderation", label: "Moderation", href: "/dashboard?tab=moderation" },
	{ id: "changelog", label: "Changelog", href: "/dashboard?tab=changelog" },
	{ id: "roadmap", label: "Roadmap", href: "/dashboard?tab=roadmap" },
];

export const DOC_TABS = [
	{ id: "about", label: "About", href: "/about" },
	{ id: "backing", label: "Backing", href: "/backing" },
	{ id: "changelog", label: "Changelog", href: "/changelog" },
	{ id: "roadmap", label: "Roadmap", href: "/roadmap" },
	{ id: "privacy", label: "Privacy", href: "/privacy" },
	{ id: "terms", label: "Terms", href: "/terms" },
] as const;

export const ALLOWED_TAGS = [
	"p",
	"br",
	"strong",
	"em",
	"del",
	"blockquote",
	"ul",
	"ol",
	"li",
	"code",
	"pre",
	"h1",
	"h2",
	"h3",
	"a",
	"hr",
	"table",
	"thead",
	"tbody",
	"tr",
	"th",
	"td",
];

export const USERNAME_MAX_LENGTH = 32;
export const USERNAME_ERROR = "Use 1-32 letters, numbers, underscores, or hyphens.";
export const USERNAME_PATTERN = /^[A-Za-z0-9_-]+$/;
export const usernameSchema = z.string().min(1).max(USERNAME_MAX_LENGTH).regex(USERNAME_PATTERN);
