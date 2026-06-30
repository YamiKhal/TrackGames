import LibraryEntriesPanel from "@/app/components/library/LibraryEntriesPanel";
import Container from "@/app/components/layout/Container";
import { GhostButton } from "@/app/components/ui/Buttons";
import BackgroundView from "@/app/components/user/BackgroundView";
import { getUserGameEntries, UserLibraryEntryWithTags } from "@/lib/data/library";
import { ensureAndGetUserLibrary } from "@/lib/playlist/library";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import GameListEditButton from "@/app/components/playlist/GameListEditButton";
import { canViewPrivacy, profileThemeStyle, getUser } from "@/lib/account/user";
import { defaultLibraryFilters } from "@/lib/account/preferences";
import db from "@/lib/db";
import { GameListType } from "@/lib/generated/prisma/enums";
import type { Metadata } from "next";
import { absoluteUrl, metadataDescription, robotsForPrivacy, SITE_NAME } from "@/lib/metadata";
import { CSSProperties } from "react";
import { User } from "@/lib/types";

function Entries({
	entries,
	isOwnLibrary,
	themeStyle,
	viewer,
}: {
	entries: UserLibraryEntryWithTags[];
	isOwnLibrary: boolean;
	themeStyle: CSSProperties & Record<string, string>;
	viewer: User | null;
}) {
	return entries.length ? (
		<LibraryEntriesPanel entries={entries} canEdit={isOwnLibrary} themeStyle={themeStyle} defaults={viewer ? defaultLibraryFilters(viewer) : undefined} />
	) : (
		<p>No games found.</p>
	);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
	const { slug } = await params;
	const library = await db.gameList.findFirst({
		where: {
			slug,
			type: GameListType.LIBRARY,
		},
		select: {
			name: true,
			description: true,
			image: true,
			background: true,
			privacy: true,
			user: {
				select: {
					libraryPrivacy: true,
				},
			},
		},
	});
	const title = library?.name ?? "Library not found";
	const description = metadataDescription(library?.description, library ? `Browse ${library.name} on TrackGames.` : "The requested library could not be found.");
	const image = absoluteUrl(`/library/${encodeURIComponent(slug)}/opengraph-image`);
	const privacy = library?.user?.libraryPrivacy ?? library?.privacy;
	const url = absoluteUrl(`/library/${slug}`);

	return {
		title,
		description,
		alternates: {
			canonical: url,
		},
		openGraph: {
			title: `${title} | ${SITE_NAME}`,
			description,
			url,
			siteName: SITE_NAME,
			type: "website",
			images: [
				{
					url: image,
					alt: title,
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title: `${title} | ${SITE_NAME}`,
			description,
			images: [image],
		},
		robots: robotsForPrivacy(privacy),
	};
}

export default async function Page({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
	const { slug } = await params;
	const [library, session] = await Promise.all([ensureAndGetUserLibrary(slug), auth()]);
	if (!library) redirect("/not-found");

	const isOwnLibrary = session?.user ? session.user.id === library.userId : false;
	const follow =
		!isOwnLibrary && session?.user?.id
			? await db.userFollow.findUnique({
					where: {
						followerId_followingId: {
							followerId: session.user.id,
							followingId: library.userId,
						},
					},
					select: {
						id: true,
					},
				})
			: null;
	const canViewLibrary = canViewPrivacy(library.user?.libraryPrivacy ?? library.privacy, isOwnLibrary, Boolean(follow));
	const userEntries = canViewLibrary ? await getUserGameEntries(library?.userId) : [];
	const viewer = await getUser(session?.user);
	const background = library.background ?? null;
	const themeStyle = profileThemeStyle(library.color, library.accentColor);

	return (
		<main className="relative z-0 mb-40 flex-1" style={themeStyle}>
			<BackgroundView src={background} />
			<Container>
				{/* HEADER */}
				<section className="relative z-10 w-full border-b border-border bg-bg/95">
					<Container className="relative z-1 flex flex-row items-end justify-start gap-10 pt-5">
						<div className="mb-4 flex min-w-0 flex-1 flex-col justify-end gap-3 md:flex-row md:items-end md:justify-between md:gap-5">
							<div>
								<h1 className="text-center text-3xl md:text-start">{library.name}</h1>
								<p className="text-md text-center text-text-muted md:text-start">{library.description}</p>
							</div>
							<div className="md:justify-emd flex shrink-0 flex-row flex-wrap justify-center gap-3 md:gap-5">
								{isOwnLibrary && <GameListEditButton list={library} />}
								<GhostButton href={`/u/${slug}`}>Profile</GhostButton>
							</div>
						</div>
					</Container>
				</section>

				<section className="relative z-10 bg-bg/95 pt-5 pb-10">
					<Container className="flex flex-col-reverse gap-5 lg:flex-row lg:items-start">
						{canViewLibrary ? (
							<Entries entries={userEntries} isOwnLibrary themeStyle={themeStyle} viewer={viewer} />
						) : (
							<p className="rounded border border-border bg-bg p-4 text-sm text-text-muted">This library is private.</p>
						)}
					</Container>
				</section>
			</Container>
		</main>
	);
}
