import type { Metadata } from "next";
import RoadmapList from "@/app/(doc)/roadmap/RoadmapList";
import { auth } from "@/lib/auth";
import { getRoadmapItems } from "@/lib/data/roadmap";
import { absoluteUrl, DEFAULT_OG_IMAGE, metadataDescription, SITE_NAME } from "@/lib/util/metadata";

const description = metadataDescription("See what's planned for TrackGames and vote for the features you want most.");

export const metadata: Metadata = {
	title: "Roadmap",
	description,
	alternates: {
		canonical: absoluteUrl("/roadmap"),
	},
	openGraph: {
		title: `Roadmap | ${SITE_NAME}`,
		description,
		url: absoluteUrl("/roadmap"),
		siteName: SITE_NAME,
		type: "website",
		images: [{ url: DEFAULT_OG_IMAGE, alt: SITE_NAME }],
	},
	twitter: {
		card: "summary_large_image",
		title: `Roadmap | ${SITE_NAME}`,
		description,
		images: [DEFAULT_OG_IMAGE],
	},
};

export default async function RoadmapPage() {
	const session = await auth();
	const items = await getRoadmapItems(session?.user?.id);

	return (
		<div className="flex flex-col gap-8">
			<header className="flex flex-col gap-3 border-b border-border pb-6">
				<h1 className="text-3xl font-bold">Roadmap</h1>
			</header>

			<RoadmapList items={items} isLoggedIn={Boolean(session?.user?.id)} />
		</div>
	);
}
