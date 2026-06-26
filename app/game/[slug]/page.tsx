import GameCard from "@/app/components/game/GameCard";
import GameLibraryButtonPanel from "@/app/components/game/GameLibraryButtonPanel";
import RelatedGamesTabs from "@/app/components/game/RelatedGamesTabs";
import Container from "@/app/components/layout/Container";
import MediaGallary from "@/app/components/layout/MediaGallary";
import { Game } from "@/lib/types";
import { ImageIdToURL } from "@/lib/external/igdb/util";
import * as normalize from "@/lib/util/normalize";
import { Monitor, ToggleRight, Gamepad2, GamepadDirectional, TabletSmartphone, Astroid, Play, Library, Apple, Clock, Flag, BadgeCheck, Star } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getGame, getGameBySlug, getGameStats } from "@/lib/data/games";
import { getCompany } from "@/lib/data/companies";
import { getFranchise } from "@/lib/data/franchises";
import { getCollection } from "@/lib/data/colllections";
import { getGenre } from "@/lib/data/genre";
import { getPlatform } from "@/lib/data/platforms";
import { getUserPlaylists } from "@/lib/data/playlists";
import { auth } from "@/lib/auth";
import { getUser } from "@/lib/account/user";
import { viewerThemeStyle } from "@/lib/account/preferences";
import { getUserGameEntry } from "@/lib/data/library";
import { ratingToFive } from "@/lib/util/rating";
import CommentSection from "@/app/components/comments/CommentSection";
import { InteractionTargetType } from "@/lib/generated/prisma/enums";
import { shouldHideComments } from "@/lib/account/preferences";

function platformIcon(name: string) {
    const lower = name.toLowerCase();

    if (lower.includes("playstation")) return (<GamepadDirectional size={16} />);
    if (lower.includes("xbox")) return (<Gamepad2 size={16} />);
    if (lower.includes("nintendo")) return (<ToggleRight size={16} />);
    if (lower.includes("pc") || lower.includes("windows") || lower.includes("steam") || lower.includes("epic") || lower.includes("gog")) return (<Monitor size={16} />);
    if (lower.includes("mac")) return (<Apple size={16} />);
    if (lower.includes("ios") || lower.includes("android") || lower.includes("mobile")) return (<TabletSmartphone size={16} />);
}

function formatCompactNumber(value: number) {
    return Intl.NumberFormat("en", {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(value);
}

function formatHours(value: number | null) {
    if (value == null) return "N/A";

    return `${Intl.NumberFormat("en", {
        maximumFractionDigits: value >= 10 ? 0 : 1,
    }).format(value)}h`;
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const [game, session] = await Promise.all([getGameBySlug(slug), auth()]);
    if (!game) redirect("/not-found");
    if (!game.id) redirect("/not-found");

    let backdrop;
    const developerIds = game.developers ? game.developers.map(id => id) : [];
    const publisherIds = game.publishers ? game.publishers.filter(id => !developerIds.some(v => v === id)) : [];

    const [owned, viewer, gameStats, franchises, collections, developers, publishers, similarGames, genres, platforms, userPlaylists] = await Promise.all([
        session?.user?.id && game.id ? getUserGameEntry(session.user.id, game.id) : null,
        getUser(session?.user),
        getGameStats(game.id),
        game.franchises ? getFranchise(game.franchises) : [],
        game.collections ? getCollection(game.collections) : [],
        getCompany(Array.from(developerIds.values())),
        getCompany(Array.from(publisherIds.values())),
        (game.similarGames && game.similarGames.length) ? getGame(game.similarGames) : [],
        (game.genres && game.genres.length) ? getGenre(game.genres) : [],
        (game.platforms && game.platforms.length) ? getPlatform(game.platforms) : [],
        session?.user?.id ? getUserPlaylists(session.user.id) : [],
    ]);

    const [franchiseGames, collectionsGames]: [Game[], Game[]] = await Promise.all([
        franchises.length ? getGame(franchises[0].games) : [],
        collections.length ? getGame(collections[0].games) : [],
    ]);

    if (game.screenshots && game.screenshots.length > 0) {
        backdrop = ImageIdToURL(game.screenshots![0], "1080");
    }

    const media = [
        ...(game.videos?.[0]
            ? [{ type: "video" as const, id: game.videos[0] }]
            : []),
        ...(game.screenshots
            ?.filter((shot): shot is string => Boolean(shot))
            .map((shot) => ({
                type: "image" as const,
                id: shot,
            })) || []),
    ];
    const averageRating = typeof game.totalRating === "number"
        ? normalize.clamp(game.totalRating, 0, 100)
        : null;
    const ratingDistributionMax = Math.max(...gameStats.ratingDistribution.map((rating) => rating.count), 1);
    const ratingDistributionTotal = gameStats.ratingDistribution.reduce((total, rating) => total + rating.count, 0);
    function renderAverageRatingWidget() {
        return (
            <section
                className="rounded"
                aria-label={averageRating !== null ? `Average rating ${averageRating.toFixed(1)} out of 100` : "Average rating unavailable"}
            >
                <div className="flex flex-row items-center gap-5 lg:flex-col lg:items-stretch">
                    <div className="flex shrink-0 flex-col items-center justify-center rounded bg-bg-secondary pb-5 pt-5 pr-6 pl-6 md:order-1">
                        <h2 className="text-sm text-text-muted">Avg. Rating</h2>
                        <p className="text-2xl font-bold text-text">{averageRating !== null ? ratingToFive(Number(averageRating.toFixed(1)))?.toFixed(2) : "N/A"}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex h-18 min-w-36 items-end gap-1">
                            {gameStats.ratingDistribution.map((rating) => {
                                const percentage = ratingDistributionTotal ? rating.count / ratingDistributionTotal * 100 : 0;
                                const label = `${rating.rating} ${rating.rating === 1 ? "star" : "stars"}`;

                                return (
                                    <div key={rating.rating} className="flex h-full flex-1 items-end" title={`${label}: ${formatCompactNumber(rating.count)} ${rating.count === 1 ? "vote" : "votes"} (${percentage.toFixed(1)}%)`}>
                                        <div
                                            className="w-full rounded-t bg-primary/75"
                                            style={{ height: `${rating.count ? Math.max(10, rating.count / ratingDistributionMax * 100) : 0}%` }}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                        <div className="text-xs font-bold text-text-faint">
                            <div className="h-4 border-t border-border" aria-hidden="true" />
                            <div className="-mt-3 flex justify-between">
                                <span>0</span>
                                <span className="flex items-center gap-1 text-primary" title="5 stars">
                                    <Star size={14} className="fill-primary" />
                                    5
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }
    const userPlaylistControls = userPlaylists.map((playlist) => ({
        id: playlist.id,
        name: playlist.name,
        entries: playlist.entries.map((entry) => ({
            id: entry.id,
            gameId: entry.gameId,
        })),
    }));
    const logsHref = viewer?.name && game.slug ? `/library/${viewer.name}/logs/${game.slug}` : undefined;

    return (
        <div style={viewer ? viewerThemeStyle(viewer) : undefined}>
            {/* GAME TITLE / CONTROLS */}
            <section className="relative min-h-136 w-full md:min-h-152">
                {backdrop ? (
                    <div className="pointer-events-none absolute inset-0 bg-cover bg-top" style={{ backgroundImage: `url(${backdrop})` }} />
                ) : (
                    <div className="pointer-events-none absolute inset-0 bg-bg-secondary" />
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-full bg-linear-to-t from-bg via-bg/95 via-50% md:via-30% to-transparent" />

                <Container className="relative z-1 flex min-h-136 justify-center gap-10 items-end pb-8 pt-20 flex-row md:min-h-152 md:justify-start">
                    <div className="flex flex-col items-center md:items-end md:flex-row min-h-max min-w-0 max-w-full gap-3 md:gap-6 text-text">
                        <div className="hidden md:flex">
                            <GameCard game={game} size={210} preload />
                        </div>
                        <div className="flex md:hidden">
                            <GameCard game={game} size={180} preload />
                        </div>
                        <div className="flex min-w-0 flex-col items-left justify-between gap-4">
                            <div className="order-2 min-w-0 pb-2 text-left md:order-1 md:pb-0">
                                <h1 className="max-w-full wrap-break-word text-2xl md:text-4xl font-bold">{game.name}</h1>
                                {developers.length > 0 &&
                                    <p className="mt-2 max-w-full truncate font-body text-md md:text-lg text-text-muted wrap-break-word text-wrap">Developer:
                                        <span> </span>
                                        {
                                            developers.map((dev, index) => (
                                                <span key={dev.id ?? index} className="font-bold wrap-break-word text-wrap">{dev.name}{
                                                    index < developers.length - 1 &&
                                                    <span>, </span>
                                                }</span>
                                            ))
                                        }
                                    </p>
                                }
                                {publishers.length > 0 &&
                                    <p className="max-w-full truncate font-body text-sm md:text-md text-text-muted wrap-break-word text-wrap">Publisher:
                                        <span> </span>
                                        {
                                            publishers.map((pub, index) => (
                                                <span key={pub.id ?? index} className="font-bold wrap-break-word text-wrap">{pub.name}{
                                                    index < publishers.length - 1 &&
                                                    <span>, </span>
                                                }</span>
                                            ))
                                        }
                                    </p>
                                }
                            </div>
                            {game.id && game.slug &&
                                <div className="order-1 md:order-2">
                                    <GameLibraryButtonPanel
                                        gameId={game.id}
                                        gameSlug={game.slug}
                                        loggedIn={Boolean(session?.user)}
                                        entry={owned}
                                        playlists={userPlaylistControls}
                                        logsHref={logsHref}
                                    />
                                </div>
                            }
                            <div className="order-3 mt-1 w-full lg:hidden">
                                {renderAverageRatingWidget()}
                            </div>
                        </div>
                    </div>
                </Container>
            </section>

            {/* INFO */}
            <section className="w-full mt-5">
                <Container className="flex flex-col justify-between gap-10 lg:flex-row">
                    {/* LEFT COLUMN */}
                    <div className="min-w-0 flex-1">

                        {/* GENRES/PLATFORMS */}
                        <section className="flex min-w-0 flex-col md:flex-row gap-10">
                            <div className="grid w-full min-w-0 grid-cols-1 md:grid-cols-[auto_minmax(0,1fr)] items-start gap-x-10 gap-y-2 md:gap-y-5 md:border-b pb-5 md:pb-1.5 border-border">
                                <p className="font-body text-md border-b border-border p-1 text-start md:p-0 md:bg-bg md:border-none">Genres</p>
                                <div className="font-body text-md flex min-w-0 flex-row flex-wrap gap-x-2 gap-y-1">
                                    {genres.length ? genres.map((genre, index) => (
                                        <span key={genre.id ?? genre.name} className="flex min-w-0 flex-row items-center gap-1">
                                            <span className="wrap-break-words hover:text-primary cursor-pointer transition-colors text-sm md:text-md">{genre.name}</span>
                                            <p className="select-none">{index < game.genres!.length - 1 ? " • " : ""}</p>
                                        </span>
                                    )) : "N/A"}
                                </div>

                                <p className="font-body text-md border-b border-border p-1 text-start md:p-0 md:bg-bg md:border-none">Platforms</p>
                                <div className="font-body text-md flex min-w-0 flex-row flex-wrap gap-x-2 gap-y-1">
                                    {platforms?.length ? platforms.map((platform, index) => (
                                        <span key={platform.id ?? platform.name} className="flex min-w-0 flex-row items-center gap-1">
                                            <span className="flex min-w-0 items-center gap-2 wrap-break-words hover:text-primary cursor-pointer transition-colors text-sm md:text-md">{platformIcon(platform.name)}{platform.name}</span>
                                            <p className="select-none">{index < game.platforms!.length - 1 ? " • " : ""}</p>
                                        </span>
                                    )) : "N/A"}
                                </div>
                            </div>
                        </section>

                        {/* MEDIA */}
                        <section className="flex flex-col mt-4">
                            <div className="w-full min-w-0 overflow-hidden">
                                <MediaGallary media={media} />
                            </div>
                        </section>

                        {/* SUMMARY */}
                        <section className="flex flex-col mt-4 pb-4">
                            <div className="mb-5 flex min-w-0 flex-row flex-wrap items-center justify-between gap-2">
                                <h2 className="text-xl md:text-2xl font-bold text-text">Summary</h2>
                                <span className="min-w-8 flex-1 border-t border-border" aria-hidden="true" />
                                <p className="text-text-muted text-md font-body">More info on <Link href={`https://www.igdb.com/games/${game.slug}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary-hover text-primary cursor-pointer transition-colors">IGDB</Link></p>
                            </div>
                            <p className="min-w-0 text-md text-text-muted font-body">{game.summary}</p>
                        </section>
                    </div>


                    {/* RIGHT COLUMN */}
                    <div className="flex min-w-0 max-w-full shrink-0 flex-col gap-5 lg:w-80">

                        <div className="hidden lg:block">
                            {renderAverageRatingWidget()}
                        </div>

                        {/* RELEASE DATE */}
                        <section className="bg-bg-secondary p-4 rounded flex min-w-0 flex-row gap-2 items-start justify-start">
                            <h2 className="text-md text-text ml-5 shrink-0">Released</h2>
                            <p className="ml-auto min-w-0 pr-5 text-right text-md font-bold text-text-muted">{game.releaseDate ? game.releaseDate.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "N/A"}</p>
                        </section>

                        {/* LIBRARY STATS */}
                        <section className="bg-bg-secondary p-4 rounded flex flex-col gap-2 items-start justify-start min-w-50">
                            <div className="border-b border-border pb-2 pr-5 w-full">
                                <div className="ml-5 flex min-w-0 flex-row items-center gap-2">
                                    <Play className="bg-bg/60 text-secondary p-2 rounded-2xl" size={30} />
                                    <p className="min-w-0 truncate text-md text-text-muted">Plays</p>
                                    <p className="ml-auto shrink-0 text-md text-text">{formatCompactNumber(gameStats.plays)}</p>
                                </div>
                            </div>
                            <div className="border-b border-border pb-2 pr-5 w-full">
                                <div className="ml-5 flex min-w-0 flex-row items-center gap-2">
                                    <Library className="bg-bg/60 text-secondary p-2 rounded-2xl" size={30} />
                                    <p className="min-w-0 truncate text-md text-text-muted">Backlog</p>
                                    <p className="ml-auto shrink-0 text-md text-text">{formatCompactNumber(gameStats.backlog)}</p>
                                </div>
                            </div>
                            <div className="w-full">
                                <div className="ml-5 flex min-w-0 flex-row items-center pr-5 gap-2">
                                    <Astroid className="bg-bg/60 text-secondary p-2 rounded-2xl" size={30} />
                                    <p className="min-w-0 truncate text-md text-text-muted">Wishlists</p>
                                    <p className="ml-auto shrink-0 text-md text-text">{formatCompactNumber(gameStats.wishlisted)}</p>
                                </div>
                            </div>
                        </section>

                        {/* PLAYLIST STATS */}
                        <section className="bg-bg-secondary p-4 rounded flex min-w-0 flex-row gap-2 items-start justify-start">
                            <h2 className="text-md text-text-muted ml-5 shrink-0">This entry is in</h2>
                            <p className="ml-auto min-w-0 pr-5 text-right text-md font-bold text-text">{formatCompactNumber(gameStats.publicPlaylistEntries)} playlists</p>
                        </section>

                        {/* TIME SPENT */}
                        <section className="grid min-w-0 grid-cols-3 gap-3">
                            <div className="relative min-w-0 rounded bg-primary/10 border-2 border-primary/30 p-4 pt-7 text-center">
                                <Clock className="absolute right-3 top-3 text-primary" size={18} />
                                <p className="truncate text-xl font-bold text-text">{formatHours(gameStats.averagePlaytime)}</p>
                                <p className="mt-1 truncate font-body text-xs text-text-muted">Avg Time</p>
                            </div>
                            <div className="relative min-w-0 rounded bg-primary/10 border-2 border-primary/30 p-4 pt-7 text-center">
                                <Flag className="absolute right-3 top-3 text-primary" size={18} />
                                <p className="truncate text-xl font-bold text-text">{formatHours(gameStats.averageCompletionTime)}</p>
                                <p className="mt-1 truncate font-body text-xs text-text-muted">To Finish</p>
                            </div>
                            <div className="relative min-w-0 rounded bg-primary/10 border-2 border-primary/30 p-4 pt-7 text-center">
                                <BadgeCheck className="absolute right-3 top-3 text-primary" size={18} />
                                <p className="truncate text-xl font-bold text-text">{formatHours(gameStats.averageMasteryTime)}</p>
                                <p className="mt-1 truncate font-body text-xs text-text-muted">To Master</p>
                            </div>
                        </section>
                    </div>
                </Container>
            </section>

            {/* RELATED GAMES */}
            <section className="w-full mt-20 mb-10">
                <Container>
                    <RelatedGamesTabs franchiesGames={franchiseGames} seriesGames={collectionsGames} similarGames={similarGames} />
                    <div className="mt-10">
                        {!shouldHideComments(viewer) && <CommentSection targetType={InteractionTargetType.GAME} targetId={game.id!.toString()} />}
                    </div>
                </Container>
            </section>
        </div>
    )
}
