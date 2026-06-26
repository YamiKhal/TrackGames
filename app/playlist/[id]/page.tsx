import PlaylistEntriesView from "@/app/components/playlist/PlaylistEntriesView";
import Container from "@/app/components/layout/Container";
import { GhostButton } from "@/app/components/ui/Buttons";
import { Select } from "@/app/components/ui/Inputs";
import BackgroundView from "@/app/components/user/BackgroundView";
import { updatePlaylistDisplayMode } from "@/lib/actions/playlists";
import { auth } from "@/lib/auth";
import { getPlaylist, getPlaylistAccess, getPlaylistLibraryCount } from "@/lib/data/playlists";
import { redirect } from "next/navigation";
import AddPlaylistGameForm from "./AddPlaylistGameForm";
import TierLabelsForm from "./TierLabelsForm";
import GameListEditButton from "@/app/components/playlist/GameListEditButton";
import { canViewPrivacy, getUser, profileThemeStyle } from "@/lib/account/user";
import { shouldHideComments } from "@/lib/account/preferences";
import CommentSection from "@/app/components/comments/CommentSection";
import { InteractionTargetType, LikeTargetType } from "@/lib/generated/prisma/enums";
import LikeButton from "@/app/components/social/LikeButton";
import { getPlaylistLikeState } from "@/lib/data/social";
import db from "@/lib/db";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [access, session] = await Promise.all([getPlaylistAccess(id), auth()]);

    if (!access) {
        redirect("/not-found");
    }

    const isOwner = session?.user?.id === access.userId;
    const follow = !isOwner && session?.user?.id ? await db.userFollow.findUnique({
        where: {
            followerId_followingId: {
                followerId: session.user.id,
                followingId: access.userId,
            },
        },
        select: {
            id: true,
        },
    }) : null;
    const canViewPlaylist = canViewPrivacy(access.privacy, isOwner, Boolean(follow));

    if (!canViewPlaylist) {
        return (
            <main className="relative z-0 flex-1">
                <Container>
                    <section className="relative z-10 bg-bg/95 py-5">
                        <Container>
                            <p className="rounded border border-border bg-bg p-4 text-sm text-text-muted">This playlist is private.</p>
                        </Container>
                    </section>
                </Container>
            </main>
        );
    }

    const playlist = await getPlaylist(id);

    if (!playlist) {
        redirect("/not-found");
    }

    const canEdit = session?.user?.id === playlist.userId;
    const viewer = await getUser(session?.user);
    const gameIds = playlist.entries.map((entry) => entry.gameId);
    const [ownedCount, likeState] = await Promise.all([
        getPlaylistLibraryCount(session?.user?.id, gameIds),
        getPlaylistLikeState(playlist.id, session?.user?.id),
    ]);
    const ownedPercent = playlist.entries.length ? Math.round((ownedCount / playlist.entries.length) * 100) : 0;
    const modeAction = updatePlaylistDisplayMode.bind(null, playlist.id);
    const tiers = playlist.tierLabels.length ? playlist.tierLabels : ["S", "A", "B", "C", "D"];
    const tierColors = tiers.map((_, index) => playlist.tierColors[index] ?? "#64748b");

    return (
        <main className="relative z-0 flex-1" style={profileThemeStyle(playlist.color, playlist.accentColor)}>
            <BackgroundView src={playlist.background ?? null} />
            <Container>
                <section className="relative z-10 w-full border-b border-border bg-bg/95">
                    <Container className="relative z-1 flex flex-row items-end justify-start gap-10 pt-5">
                        <div className="mb-4 flex min-w-0 flex-1 flex-col justify-end gap-3 md:flex-row md:items-end md:justify-between md:gap-5">
                            <div>
                                <div className="flex flex-col gap-2 md:flex-row md:items-end">
                                    <h1 className="text-3xl text-center md:text-start">{playlist.name}</h1>
                                    <p className="text-sm text-text-faint text-center md:text-start">By {playlist.user?.name ?? "Unknown"}</p>
                                </div>
                                <p className="text-md text-text-muted text-center md:text-start">{playlist.description || "No description."}</p>
                            </div>
                            <div className="flex shrink-0 flex-row flex-wrap justify-center md:justify-emd gap-3 md:gap-5">
                                <LikeButton targetType={LikeTargetType.GAME_LIST} targetId={playlist.id} initialLikes={likeState.likes} initiallyLiked={likeState.liked} loggedIn={Boolean(session?.user?.id)} />
                                {canEdit && <GameListEditButton list={playlist} />}
                                {playlist.user?.name && <GhostButton href={`/u/${playlist.user.name}`}>View Profile</GhostButton>}
                            </div>
                        </div>
                    </Container>
                </section>

                <section className="relative z-10 bg-bg/95 py-5">
                    <Container className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
                        <div className="flex min-w-0 flex-col gap-5 order-2 md:order-1">
                            <PlaylistEntriesView listId={playlist.id} entries={playlist.entries} mode={playlist.displayMode} canEdit={canEdit} tiers={tiers} tierColors={tierColors} />
                            {!playlist.commentsHidden && !shouldHideComments(viewer) && <CommentSection targetType={InteractionTargetType.GAME_LIST} targetId={playlist.id} />}
                        </div>

                        <aside className="flex flex-col gap-4 md:border-l border-border order-1 md:order-2">
                            <div className="rounded bg-bg p-4">
                                <h2 className="border-b border-border pb-2 text-sm font-bold">Games tracked</h2>
                                <div className="mt-4 flex flex-col items-center">
                                    <div className="grid size-32 place-items-center rounded-full" style={{ background: `conic-gradient(var(--primary) ${ownedPercent}%, var(--border) 0)` }}>
                                        <div className="grid size-24 place-items-center rounded-full bg-bg">
                                            <p className="text-2xl font-bold text-primary">{ownedPercent}%</p>
                                        </div>
                                    </div>
                                    <p className="mt-3 text-sm text-text-muted">{ownedCount} of {playlist.entries.length} playlist games</p>
                                </div>
                            </div>
                            {canEdit && (
                                <>
                                    <AddPlaylistGameForm playlistId={playlist.id} mode={playlist.displayMode} tiers={tiers} />
                                    <form action={modeAction} className="rounded bg-bg p-4 text-sm font-bold">
                                        <h2 className="border-b border-border pb-2 text-sm font-bold">Change display</h2>
                                        <div className="mt-2 flex gap-2 text-text-muted">
                                            <Select name="displayMode" defaultValue={playlist.displayMode} className="min-w-0 flex-1">
                                                <option value="GRID">Grid</option>
                                                <option value="RANKING">Ranking</option>
                                                <option value="TIER">Tier list</option>
                                            </Select>
                                            <GhostButton type="submit" className="px-4">Save</GhostButton>
                                        </div>
                                    </form>
                                    {playlist.displayMode === "TIER" && <TierLabelsForm playlistId={playlist.id} tiers={tiers} colors={tierColors} />}
                                </>
                            )}
                        </aside>
                    </Container>
                </section>
            </Container>
        </main>
    );
}
