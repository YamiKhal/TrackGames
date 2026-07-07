import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AddPlaylistGameForm from "@/app/(library)/playlist/[id]/AddPlaylistGameForm";
import GamesTrackedWidget from "@/app/(library)/playlist/[id]/GamesTrackedWidget";
import CommentSection from "@/components/comments/CommentSection";
import GameListEditButton from "@/components/gamelist/GameListEditButton";
import PlaylistEntriesView from "@/components/gamelist/PlaylistEntriesView";
import Container from "@/components/layout/Container";
import LikeButton from "@/components/social/LikeButton";
import { GhostButton } from "@/components/ui/control/Button";
import CopyIdButton from "@/components/ui/CopyIdButton";
import PrivateDisplay from "@/components/ui/PrivateDisplay";
import BackgroundView from "@/components/user/BackgroundView";
import ReportButton from "@/components/user/ReportButton";
import { auth } from "@/lib/auth";
import { getPlaylist, getPlaylistLibraryCount } from "@/lib/data/gamelist/lists";
import { getPlaylistLikeState } from "@/lib/data/social/social";
import { getUser, isFollower } from "@/lib/data/social/user";
import { InteractionTargetType, LikeTargetType, ReportTargetType, UserRole } from "@/lib/generated/prisma/enums";
import { profileThemeStyle } from "@/lib/util/client/theme";
import { absoluteUrl, metadataDescription, robotsForPrivacy, SITE_NAME } from "@/lib/util/metadata";
import { checkPublicPrivacy, shouldHideComments } from "@/lib/util/privacy";

export default async function Page({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
	const { id } = await params;
	const session = await auth();
	const playlist = await getPlaylist(id, session?.user?.id);
	if (!playlist) {
		notFound();
	}

	const isOwner = session?.user?.id === playlist.userId;
	const [isFollowingOwner, viewer] = await Promise.all([isFollower(session?.user.id, playlist.userId), getUser(session?.user)]);
	const isVisible = checkPublicPrivacy(playlist.privacy, isOwner, isFollowingOwner);

	if (!isVisible) {
		return <PrivateDisplay canBackOption />;
	}

	const canEdit = session?.user?.id === playlist.userId;
	const gameIds = playlist.entries.map((entry) => entry.gameId);
	const [ownedCount, likeState] = await Promise.all([getPlaylistLibraryCount(session?.user?.id, gameIds), getPlaylistLikeState(playlist.id, session?.user?.id)]);
	const ownedPercent = playlist.entries.length ? Math.round((ownedCount / playlist.entries.length) * 100) : 0;
	const tiers = playlist.tierLabels.length ? playlist.tierLabels : ["S", "A", "B", "C", "D"];
	const tierColors = tiers.map((_, index) => playlist.tierColors[index] ?? "#64748b");

	return (
		<main className="relative z-0 flex-1" style={profileThemeStyle(playlist.color, playlist.accentColor)}>
			<BackgroundView src={playlist.background ?? null} />
			<Container>
				<section className="relative z-elevated w-full border-b border-border bg-bg/95">
					<Container className="relative z-raised flex flex-row items-end justify-start gap-10 pt-5">
						<div className="mb-4 flex min-w-0 flex-1 flex-col justify-end gap-3 md:flex-row md:items-end md:justify-between md:gap-5">
							<div>
								<div className="flex flex-col items-center gap-2 md:flex-row">
									<h1 className="text-center text-3xl md:text-start">{playlist.name}</h1>
									<p className="text-center text-sm text-text-faint md:text-start">By {playlist.user?.name ?? "Unknown"}</p>
									<CopyIdButton id={playlist.id} isAdmin={Boolean(viewer?.roles.includes(UserRole.ADMIN))} className="text-sm text-text-faint" />
								</div>
								<p className="text-md text-center text-text-muted md:text-start">{playlist.description || "No description."}</p>
							</div>
							<div className="md:justify-emd flex shrink-0 flex-row flex-wrap justify-center gap-3 md:gap-5">
								<LikeButton
									targetType={LikeTargetType.GAME_LIST}
									targetId={playlist.id}
									initialLikes={likeState.likes}
									hasLikedState={likeState.liked}
									isLoggedIn={Boolean(session?.user?.id)}
								/>
								{!isOwner && session?.user?.id && (
									<ReportButton
										targetType={ReportTargetType.GAME_LIST}
										targetId={playlist.id}
										reportedUserId={playlist.userId}
										context={{ list: playlist.name, owner: playlist.user?.name ?? "" }}
										display="button"
										label={`Report ${playlist.name}`}
									/>
								)}
								{canEdit && <GameListEditButton list={playlist} tiers={tiers} tierColors={tierColors} />}
								{playlist.user?.name && (
									<GhostButton variant="outline" href={`/u/${playlist.user.name}?tab=profile`}>
										View Profile
									</GhostButton>
								)}
							</div>
						</div>
					</Container>
				</section>

				<section className="relative z-elevated bg-bg/95 py-5">
					<Container className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
						<div className="order-2 flex min-w-0 flex-col gap-5 md:order-1">
							<PlaylistEntriesView
								listId={playlist.id}
								entries={playlist.entries}
								mode={playlist.displayMode}
								canEdit={canEdit}
								isLoggedIn={Boolean(session?.user?.id)}
								tiers={tiers}
								tierColors={tierColors}
							/>
							{!playlist.commentsHidden && !shouldHideComments(viewer) && <CommentSection targetType={InteractionTargetType.GAME_LIST} targetId={playlist.id} />}
						</div>

						<aside className="order-1 flex flex-col gap-4 border-border md:order-2 md:border-l">
							<GamesTrackedWidget ownedCount={ownedCount} total={playlist.entries.length} ownedPercent={ownedPercent} />
							{canEdit && <AddPlaylistGameForm playlistId={playlist.id} mode={playlist.displayMode} tiers={tiers} existingGameIds={gameIds} />}
						</aside>
					</Container>
				</section>
			</Container>
		</main>
	);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
	const { id } = await params;
	const playlist = await getPlaylist(id);
	const title = playlist?.name ? `${playlist.name} Playlist` : "Playlist not found";
	const description = metadataDescription(
		playlist?.description,
		playlist ? `Browse ${playlist.name} by ${playlist.user.name ?? "Unknown"} on TrackGames.` : "The requested playlist could not be found.",
	);
	const image = absoluteUrl(`/playlist/${encodeURIComponent(id)}/opengraph-image`);
	const url = absoluteUrl(`/playlist/${id}`);

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
		robots: robotsForPrivacy(playlist?.privacy),
	};
}
