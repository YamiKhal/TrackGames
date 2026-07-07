import { type CSSProperties, Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SearchX } from "lucide-react";
import GameListEditButton from "@/components/gamelist/GameListEditButton";
import LibraryEntriesPanel from "@/components/gamelist/LibraryEntriesPanel";
import Container from "@/components/layout/Container";
import { GhostButton } from "@/components/ui/control/Button";
import EmptyState from "@/components/ui/EmptyState";
import Loading from "@/components/ui/Loading";
import PrivateDisplay from "@/components/ui/PrivateDisplay";
import BackgroundView from "@/components/user/BackgroundView";
import { auth } from "@/lib/auth";
import { ensureAndGetUserLibrary, getUserGameEntries, getViewerEntriesForGames, type ViewerGameEntry } from "@/lib/data/gamelist/library";
import { getUser, isFollower, type SecuredUser } from "@/lib/data/social/user";
import { profileThemeStyle } from "@/lib/util/client/theme";
import { absoluteUrl, metadataDescription, robotsForPrivacy, SITE_NAME } from "@/lib/util/metadata";
import { defaultLibraryFilters } from "@/lib/util/preferences";
import { checkPublicPrivacy } from "@/lib/util/privacy";

export default async function Page({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
	const { slug } = await params;
	const [library, session] = await Promise.all([ensureAndGetUserLibrary(slug), auth()]);
	if (!library) notFound();

	const isOwnLibrary = session?.user ? session.user.id === library.userId : false;
	const isFollowingOwner = await isFollower(session?.user.id, library.id);
	const canViewLibrary = checkPublicPrivacy(library.user?.libraryPrivacy ?? library.privacy, isOwnLibrary, isFollowingOwner);

	if (!canViewLibrary) return <PrivateDisplay canBackOption message={`${library.name} is private`} />;

	const viewer = await getUser(session?.user);
	const background = library.background ?? null;
	const themeStyle = profileThemeStyle(library.color, library.accentColor);

	return (
		<main className="relative z-0 mb-40 flex-1" style={themeStyle}>
			<BackgroundView src={background} />
			<Container>
				{/* HEADER */}
				<section className="relative z-elevated w-full border-b border-border bg-bg/95">
					<Container className="relative z-raised flex flex-row items-end justify-start gap-10 pt-5">
						<div className="mb-4 flex min-w-0 flex-1 flex-col justify-end gap-3 md:flex-row md:items-end md:justify-between md:gap-5">
							<div>
								<h1 className="text-center text-3xl md:text-start">{library.name}</h1>
								<p className="text-md text-center text-text-muted md:text-start">{library.description}</p>
							</div>
							<div className="md:justify-emd flex shrink-0 flex-row flex-wrap justify-center gap-3 md:gap-5">
								{isOwnLibrary && <GameListEditButton list={library} />}
								<GhostButton variant="outline" href={`/u/${slug}?tab=profile`}>
									Profile
								</GhostButton>
							</div>
						</div>
					</Container>
				</section>

				<section className="relative z-elevated bg-bg/95 pt-5 pb-10">
					<Container className="flex flex-col-reverse gap-5 lg:flex-row lg:items-start">
						{canViewLibrary ? (
							<Suspense fallback={<Loading />}>
								<Entries
									userId={library.userId}
									isOwnLibrary={isOwnLibrary}
									isLoggedIn={Boolean(session?.user)}
									viewerId={session?.user?.id}
									themeStyle={themeStyle}
									viewer={viewer}
								/>
							</Suspense>
						) : (
							<p className="rounded border border-border bg-bg p-4 text-sm text-text-muted">This library is private.</p>
						)}
					</Container>
				</section>
			</Container>
		</main>
	);
}

async function Entries({
	userId,
	isOwnLibrary,
	isLoggedIn,
	viewerId,
	themeStyle,
	viewer,
}: {
	userId: string;
	isOwnLibrary: boolean;
	isLoggedIn: boolean;
	viewerId?: string;
	themeStyle: CSSProperties & Record<string, string>;
	viewer: SecuredUser | null;
}) {
	const entries = await getUserGameEntries(userId);
	const viewerEntries =
		!isOwnLibrary && viewerId && entries.length
			? (Object.fromEntries(
					await getViewerEntriesForGames(
						viewerId,
						entries.map((entry) => entry.gameId),
					),
				) as Record<number, ViewerGameEntry>)
			: undefined;

	return entries.length ? (
		<LibraryEntriesPanel
			entries={entries}
			canEdit={isOwnLibrary}
			isLoggedIn={isLoggedIn}
			viewerEntries={viewerEntries}
			themeStyle={themeStyle}
			defaults={viewer ? defaultLibraryFilters(viewer) : undefined}
		/>
	) : (
		<EmptyState icon={SearchX} message="No games found." />
	);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
	const { slug } = await params;
	const library = await ensureAndGetUserLibrary(slug);
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
