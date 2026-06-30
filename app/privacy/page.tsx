import type { Metadata } from "next";
import Container from "../components/layout/Container";
import { absoluteUrl, DEFAULT_OG_IMAGE, metadataDescription, SITE_NAME } from "@/lib/metadata";

const description = metadataDescription("How TrackGames handles account data, cookies, local storage, and third-party content.");

export const metadata: Metadata = {
	title: "Privacy",
	description,
	alternates: {
		canonical: absoluteUrl("/privacy"),
	},
	openGraph: {
		title: `Privacy | ${SITE_NAME}`,
		description,
		url: absoluteUrl("/privacy"),
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
		title: `Privacy | ${SITE_NAME}`,
		description,
		images: [DEFAULT_OG_IMAGE],
	},
};

export default function PrivacyPage() {
	return (
		<main className="flex-1 bg-bg py-12 text-text">
			<Container className="max-w-4xl">
				<div className="flex flex-col gap-8">
					<header className="flex flex-col gap-3 border-b border-border pb-6">
						<h1 className="text-3xl font-bold">Privacy</h1>
						<p className="text-sm text-text-muted">Last updated: June 27, 2026</p>
					</header>

					<section className="flex flex-col gap-3">
						<h2 className="text-xl font-bold">What TrackGames Stores</h2>
						<p className="text-text-muted">
							TrackGames stores the account details and game library information needed to run the service, such as your username, email address, profile settings,
							saved games, ratings, playlists, comments, follows, notifications, and linked sign-in providers.
						</p>
					</section>

					<section className="flex flex-col gap-3">
						<h2 className="text-xl font-bold">Cookies And Local Storage</h2>
						<p className="text-text-muted">
							TrackGames uses essential authentication cookies so you can sign in and keep using your account. During OAuth registration, TrackGames may also set a
							short-lived username cookie so the sign-in flow can finish. These cookies are required for account features and are not used for advertising.
						</p>
						<p className="text-text-muted">
							TrackGames also stores your theme preference in local storage. This keeps the interface in your chosen light or dark mode on future visits.
						</p>
						<p className="text-text-muted">TrackGames does not currently use analytics cookies, advertising cookies, or tracking pixels.</p>
					</section>

					<section className="flex flex-col gap-3">
						<h2 className="text-xl font-bold">Third-Party Content</h2>
						<p className="text-text-muted">
							Game data and imagery are provided by IGDB. Some game pages may show YouTube videos using YouTube&apos;s privacy-enhanced embed host. Third-party
							services may still receive basic request information when their content is loaded.
						</p>
					</section>

					<section className="flex flex-col gap-3">
						<h2 className="text-xl font-bold">Your Choices</h2>
						<p className="text-text-muted">
							You can sign out to end your active session, adjust your profile and privacy settings from the settings page, and remove browser storage through your
							browser controls.
						</p>
					</section>
				</div>
			</Container>
		</main>
	);
}
