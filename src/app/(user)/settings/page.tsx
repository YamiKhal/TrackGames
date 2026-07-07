import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SettingsPanel from "@/app/(user)/settings/SettingsPanel";
import Container from "@/components/layout/Container";
import Tabs from "@/components/layout/Tabs";
import ProfileBackground from "@/components/user/BackgroundView";
import ProfileHeader from "@/components/user/ProfileHeader";
import { auth } from "@/lib/auth";
import { SETTING_TABS } from "@/lib/constants";
import { getUser, getUserProviders, hasUserPassword } from "@/lib/data/social/user";
import { type PublicUser } from "@/lib/types";
import { profileThemeStyle } from "@/lib/util/client/theme";
import { absoluteUrl, DEFAULT_OG_IMAGE, metadataDescription, SITE_NAME } from "@/lib/util/metadata";
import * as lookup from "@/lib/util/validate/normalize";

type SearchPageProps = Readonly<{
	searchParams: Promise<{ tab?: string; error?: string }>;
}>;

const description = metadataDescription("Manage your TrackGames profile, privacy, widgets, preferences, imports, and account settings.");

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
	const activeTab = lookup.value(params.tab, SETTING_TABS, "id", "profile");
	const session = await auth();
	if (!session?.user) redirect("/login");

	const profile = await getUser(session.user);
	if (!profile) redirect("/login");

	const [hasPassword, accounts] = await Promise.all([hasUserPassword(profile.email!), activeTab === "account" ? getUserProviders(profile.id) : []]);
	const active = lookup.byKey(SETTING_TABS, "id", activeTab) ?? SETTING_TABS[0];

	return (
		<main className="relative z-0 flex-1" style={profileThemeStyle(profile.profileColor, profile.accentColor)}>
			<ProfileBackground src={profile.background} />

			<Container>
				<ProfileHeader isSettings={true} profile={profile as PublicUser} />

				<section className="relative z-elevated bg-bg/95 py-5">
					<Container className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start">
						<Tabs tabs={SETTING_TABS} active={activeTab} responsive="drawer" drawerTitle="Settings" />
						<div className="min-w-0">
							<div className="rounded bg-bg p-5">
								<div className="mb-5 flex flex-col gap-3 border-b border-border pb-4 md:flex-row md:items-start md:justify-between">
									<div>
										<h2 className="text-2xl font-bold">{active.label}</h2>
									</div>
								</div>
								<SettingsPanel activeTab={activeTab} profile={profile} linkedProviders={accounts.map((account) => account.provider)} hasPassword={hasPassword} />
							</div>
						</div>
					</Container>
				</section>
			</Container>
		</main>
	);
}
