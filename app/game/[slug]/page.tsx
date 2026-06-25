import GameCard from "@/app/components/game/GameCard";
import GameLibraryButtonPanel from "@/app/components/game/GameLibraryButtonPanel";
import RelatedGamesTabs from "@/app/components/game/RelatedGamesTabs";
import Container from "@/app/components/layout/Container";
import MediaGallary from "@/app/components/layout/MediaGallary";
import { Game } from "@/lib/types";
import { ImageIdToURL } from "@/lib/external/igdb/util";
import * as normalize from "@/lib/util/normalize";
import { Monitor, ToggleRight, Gamepad2, GamepadDirectional, TabletSmartphone, Astroid, Play, Library, Apple, Clock, Flag, BadgeCheck } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getGame, getGameBySlug, getGameStats } from "@/lib/data/games";
import { getCompany } from "@/lib/data/companies";
import { getFranchise } from "@/lib/data/franchises";
import { getCollection } from "@/lib/data/colllections";
import { getGenre } from "@/lib/data/genre";
import { getPlatform } from "@/lib/data/platforms";
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

    const [owned, viewer, gameStats, franchises, collections, developers, publishers, similarGames, genres, platforms] = await Promise.all([
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
    const averageRatingColor = averageRating === null
        ? "var(--border)"
        : averageRating < 40
            ? "color-mix(in srgb, var(--surface) 100%, transparent)"
            : averageRating < 70
                ? "color-mix(in srgb, var(--secondary) 40%, transparent)"
                : "color-mix(in srgb, var(--primary) 40%, transparent)";
    const averageRatingTrackColor = "color-mix(in srgb, var(--bg-secondary) 70%, transparent)";

    return (
        <div style={viewer ? viewerThemeStyle(viewer) : undefined}>
            {/* GAME TITLE / CONTROLS */}
            <section className="relative h-100 w-full">
                {backdrop ? (
                    <div className="pointer-events-none absolute inset-0 bg-cover bg-center mask-[radial-gradient(ellipse_at_center,black_68%,transparent_88%)] mask-size-[100%_120%] mask-no-repeat before:absolute before:inset-0 before:bg-bg/85 before:content-['']" style={{ backgroundImage: `url(${backdrop})` }} />
                ) : (
                    <div className="pointer-events-none absolute inset-0 bg-cover bg-center mask-[radial-gradient(ellipse_at_center,black_68%,transparent_88%)] mask-size-[100%_120%] mask-no-repeat before:absolute before:inset-0 before:bg-bg-secondary/55 before:content-['']" />
                )}

                <Container className="relative z-1 flex justify-start gap-10 items-end h-full flex-row">
                    <div className="mb-4 flex flex-col md:flex-row min-h-max min-w-0 max-w-full gap-2 md:gap-6 text-text">
                        <div className="hidden md:flex">
                            <GameCard game={game} size={140} preload />
                        </div>
                        <div className="flex md:hidden">
                            <GameCard game={game} size={120} preload />
                        </div>
                        <div className="flex min-w-0 flex-col justify-between">
                            <div className="min-w-0 pb-2 md:pb-0">
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
                                <GameLibraryButtonPanel
                                    gameId={game.id}
                                    gameSlug={game.slug}
                                    loggedIn={Boolean(session?.user)}
                                    inLibrary={Boolean(owned)}
                                />
                            }
                        </div>
                    </div>
                </Container>
            </section>

            {/* INFO */}
            <section className="w-full mt-5">
                <Container className="flex flex-col justify-between gap-10 lg:flex-row">
                    {/* LEFT COLUMN */}
                    <div className="min-w-0 flex-1">

                        {/* RATING & GENRES/PLATFORMS */}
                        <section className="flex min-w-0 flex-col md:flex-row gap-10">
                            <div
                                className="rounded flex shrink-0 flex-col items-center justify-center min-w-50 p-0.5"
                                style={{
                                    background: averageRating !== null
                                        ? `conic-gradient(${averageRatingColor} ${averageRating}%, ${averageRatingTrackColor} ${averageRating}%)`
                                        : "var(--border)",
                                }}
                                aria-label={averageRating !== null ? `Average rating ${averageRating.toFixed(1)} out of 100` : "Average rating unavailable"}
                            >
                                <div className="flex h-full w-full flex-row gap-10 md:gap-0 md:flex-col items-center justify-center rounded bg-bg-secondary pb-5 pt-5 pr-10 pl-10">
                                    <h2 className="text-md text-text-muted md:mb-2">Avg. Rating</h2>
                                    <p className="text-2xl font-bold text-text">{averageRating !== null ? ratingToFive(Number(averageRating.toFixed(1)))?.toFixed(2) : "N/A"}</p>
                                </div>
                            </div>
                            <div className="grid w-full min-w-0 grid-cols-1 md:grid-cols-[auto_minmax(0,1fr)] items-start gap-x-10 gap-y-2 md:gap-y-5 border-b pb-5 md:pb-0 border-border">
                                <p className="font-body text-md bg-bg-secondary p-1 text-center md:text-start md:p-0 md:bg-bg">Genres</p>
                                <div className="font-body text-md flex min-w-0 flex-row flex-wrap gap-x-2 gap-y-1">
                                    {genres.length ? genres.map((genre, index) => (
                                        <span key={genre.id ?? genre.name} className="flex min-w-0 flex-row items-center gap-1">
                                            <span className="wrap-break-words hover:text-primary cursor-pointer transition-colors text-sm md:text-md">{genre.name}</span>
                                            <p className="select-none">{index < game.genres!.length - 1 ? " • " : ""}</p>
                                        </span>
                                    )) : "N/A"}
                                </div>

                                <p className="font-body text-md bg-bg-secondary p-1 text-center md:text-start md:p-0 md:bg-bg">Platforms</p>
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
                                <h2 className="text-2xl font-bold text-text">Summary</h2>
                                <span className="min-w-8 flex-1 border-t border-border" aria-hidden="true" />
                                <p className="text-text-muted text-md font-body">More info on <Link href={`https://www.igdb.com/games/${game.slug}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary-hover text-primary cursor-pointer transition-colors">IGDB</Link></p>
                            </div>
                            <p className="min-w-0 text-md text-text-muted font-body">{game.summary}</p>
                        </section>
                    </div>


                    {/* RIGHT COLUMN */}
                    <div className="flex min-w-0 max-w-full shrink-0 flex-col gap-5 lg:w-80">

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
