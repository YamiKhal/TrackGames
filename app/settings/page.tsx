import Container from "@/app/components/layout/Container";
import ProfileBackground from "@/app/components/user/BackgroundView";
import { auth } from "@/lib/auth";
import { getUser, profileThemeStyle } from "@/lib/account/user";
import * as normalize from "@/lib/util/normalize";
import { Bell, Download, LayoutGrid, Settings, Shield, UserIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import SettingsPanel from "./SettingsPanel";
import SettingsTabs from "./SettingsTabs";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import ProfileHeader from "@/app/components/user/ProfileHeader";
import { parseSocials } from "@/lib/account/socials";
import { absoluteUrl, DEFAULT_OG_IMAGE, metadataDescription, SITE_NAME } from "@/lib/metadata";

type SearchPageProps = Readonly<{
	searchParams: Promise<{ tab?: string; edit?: string; saved?: string; error?: string }>;
}>;

const description = metadataDescription("Manage your TrackGames profile, privacy, widgets, preferences, imports, and account settings.");

const tabs: { id: string; label: string; icon: typeof UserIcon }[] = [
	{ id: "profile", label: "Profile", icon: UserIcon },
	{ id: "privacy", label: "Privacy", icon: Shield },
	{ id: "widgets", label: "Widgets", icon: LayoutGrid },
	{ id: "preferences", label: "Preferences", icon: Bell },
	{ id: "import", label: "Import", icon: Download },
	{ id: "account", label: "Account", icon: Settings },
];

function SectionShell({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
	return (
		<div className="rounded bg-bg p-5">
			<div className="mb-5 flex flex-col gap-3 border-b border-border pb-4 md:flex-row md:items-start md:justify-between">
				<div>
					<h2 className="text-2xl font-bold">{title}</h2>
				</div>
			</div>
			{children}
		</div>
	);
}

function settingsErrorMessage(error: string) {
	switch (error) {
		case "duplicate":
			return "That username or email is already in use.";
		case "invalid-username":
			return "Use 1-32 letters, numbers, underscores, or hyphens.";
		case "invalid-password":
			return "Enter matching passwords with at least 8 characters.";
		case "current-password":
			return "Your current password was incorrect.";
		case "email-required":
			return "Add an email before setting a password.";
		case "last-login":
			return "Add another login method before unlinking that provider.";
		case "invalid-provider":
			return "That provider could not be linked.";
		default:
			return "Some settings were invalid. Check the fields and try again.";
	}
}

export const metadata: Metadata = {
	title: "Settings",
	description,
	alternates: {
		canonical: absoluteUrl("/settings"),
	},
	openGraph: {
		title: `Settings | ${SITE_NAME}`,
		description,
		url: absoluteUrl("/settings"),
		siteName: SITE_NAME,
		type: "website",
		images: [
			{
				url: DEFAULT_OG_IMAGE,
				alt: SITE_NAME,
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: `Settings | ${SITE_NAME}`,
		description,
		images: [DEFAULT_OG_IMAGE],
	},
	robots: {
		index: false,
		follow: false,
	},
};

export default async function SettingsPage({ searchParams }: SearchPageProps) {
	const params = await searchParams;
	const activeTab = normalize.value(params.tab, tabs, "id", "profile");
	const session = await auth();

	if (!session?.user) {
		redirect("/login");
	}

	const profile = await getUser(session.user);

	if (!profile) {
		redirect("/login");
	}

	const background = profile.background;
	const active = normalize.byKey(tabs, "id", activeTab) ?? tabs[0];
	const bio = profile.bio ?? "No bio yet.";
	const socials = parseSocials(profile.socials);

	return (
		<main className="relative z-0 flex-1" style={profileThemeStyle(profile.profileColor, profile.accentColor)}>
			<ProfileBackground src={background} />

			<Container>
				<ProfileHeader isSettings={true} profileImage={profile.image} displayName={profile.name ?? "Player"} socials={socials} bio={bio} />

				<section className="relative z-10 bg-bg/95 py-5">
					<Container className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start">
						<SettingsTabs tabs={tabs.map(({ id, label }) => ({ id, label }))} activeTab={activeTab} />

						<aside className="hidden border-r border-border lg:block">
							<nav className="flex flex-col">
								{tabs.map((tab) => {
									const Icon = tab.icon;
									const selected = tab.id === activeTab;

									return (
										<Link
											key={tab.id}
											href={`/settings?tab=${tab.id}`}
											className={`flex min-w-56 items-start gap-3 border-b border-border p-5 text-left transition-colors lg:min-w-0 ${selected ? "bg-surface text-text" : "text-text-muted hover:bg-surface hover:text-text"}`}
										>
											<Icon size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
											<span className="min-w-0">
												<span className="text-md block font-bold">{tab.label}</span>
											</span>
										</Link>
									);
								})}
							</nav>
						</aside>

						<div className="min-w-0">
							{params.saved === "1" && (
								<div className="mb-4 rounded border border-success/40 bg-success/10 px-4 py-3 text-sm font-bold text-success">Settings saved.</div>
							)}
							{params.error && (
								<div className="mb-4 rounded border border-error/40 bg-error/10 px-4 py-3 text-sm font-bold text-error">{settingsErrorMessage(params.error)}</div>
							)}

							<SectionShell title={active.label}>
								<SettingsPanel activeTab={activeTab} profile={profile} />
							</SectionShell>
						</div>
					</Container>
				</section>
			</Container>
		</main>
	);
}
