import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type Session } from "next-auth";
import { Apple, Astroid, BadgeCheck, Clock, Flag, Gamepad2, GamepadDirectional, Library, Monitor, Play, Star, TabletSmartphone, ToggleRight } from "lucide-react";
import CommentSection from "@/components/comments/CommentSection";
import { GameCard } from "@/components/game/GameDisplay";
import GameLibraryButtonPanel from "@/components/game/GameLibraryButtonPanel";
import RelatedGamesTabs from "@/components/game/RelatedGamesTabs";
import Container from "@/components/layout/Container";
import MediaGallary from "@/components/layout/MediaGallery";
import { auth } from "@/lib/auth";
import { type Collection, getCollection } from "@/lib/data/catalog/collections";
import { getCompany } from "@/lib/data/catalog/companies";
import { type Franchise, getFranchise } from "@/lib/data/catalog/franchises";
import { type Game, getGame, getGameBySlug, getGameStats, getMinifiedGame } from "@/lib/data/catalog/games";
import { getGenre } from "@/lib/data/catalog/genre";
import { getMultiplayerFeatures } from "@/lib/data/catalog/multiplayer";
import { getPlatform } from "@/lib/data/catalog/platforms";
import { getTheme } from "@/lib/data/catalog/themes";
import { MULTIPLAYER_FILTERS } from "@/lib/data/filters";
import { getUserGameEntry } from "@/lib/data/gamelist/library";
import { getUserPlaylists } from "@/lib/data/gamelist/lists";
import { getUser } from "@/lib/data/social/user";
import { ImageIdToURL } from "@/lib/external/igdb/util";
import { InteractionTargetType } from "@/lib/generated/prisma/enums";
import { joinClass } from "@/lib/util/client/func";
import { viewerThemeStyle } from "@/lib/util/client/theme";
import { formatNumber } from "@/lib/util/format/numbers";
import { ratingToFive } from "@/lib/util/format/rating";
import { absoluteUrl, metadataDescription, SITE_NAME } from "@/lib/util/metadata";
import { shouldHideComments } from "@/lib/util/privacy";
import * as normalize from "@/lib/util/validate/normalize";

type GameStats = {
	plays: number;
	backlog: number;
	wishlisted: number;
	publicPlaylistEntries: number;
	averagePlaytime: number | null;
	averageCompletionTime: number | null;
	averageMasteryTime: number | null;
	ratingDistribution: {
		rating: number;
		count: number;
	}[];
};

type LogStatFormatProps = Readonly<{ className?: string; title: string; stat: number | null; Icon: typeof Play }>;

type RenderAverageRatingWidgetProps = Readonly<{
	game: Game;
	gameStats: GameStats;
}>;

export default async function Page({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
	const { slug } = await params;
	const [game, session] = await Promise.all([getGameBySlug(slug), auth()]);
	if (!game) notFound();

	let backdrop;
	const developerIds = game.developers ? game.developers.map((id) => id) : [];
	const publisherIds = game.publishers ? game.publishers.filter((id) => !developerIds.includes(id)) : [];

	const [
		owned,
		viewer,
		gameStats,
		franchises,
		collections,
		developers,
		publishers,
		similarGames,
		genres,
		themes,
		platforms,
		userPlaylists,
		multiplayerFeatures,
		dlcGames,
		expansionGames,
		versionParentGame,
	] = await fetchSubData(session, game, developerIds, publisherIds);
	const [franchiseGames, collectionsGames]: [Game[], Game[]] = await fetchGroupedData(franchises, collections);

	if (game.screenshots && game.screenshots.length > 0) {
		backdrop = ImageIdToURL(game.screenshots![0], "1080");
	}

	const media = [
		...(game.videos?.[0] ? [{ type: "video" as const, id: game.videos[0] }] : []),
		...(game.screenshots
			?.filter((shot): shot is string => Boolean(shot))
			.map((shot) => ({
				type: "image" as const,
				id: shot,
			})) || []),
	];
	const userPlaylistControls = userPlaylists.map((playlist) => ({
		id: playlist.id,
		name: playlist.name,
		entries: playlist.entries.map((entry) => ({
			id: entry.id,
			gameId: entry.gameId,
		})),
	}));
	const logsHref = viewer?.name && game.slug ? `/library/${viewer.name}/logs/${game.slug}` : undefined;
	const genreTags: { id: number; name: string; facet: "genres" | "themes" }[] = [
		...genres.map((genre) => ({ id: genre.id, name: genre.name, facet: "genres" as const })),
		...themes.filter((theme) => !genres.some((genre) => genre.name === theme.name)).map((theme) => ({ id: theme.id, name: theme.name, facet: "themes" as const })),
	];

	return (
		<div className="animate-content-fade-in" style={viewer ? viewerThemeStyle(viewer) : undefined}>
			{/* GAME TITLE / CONTROLS */}
			<section className="relative min-h-136 w-full md:min-h-152">
				{backdrop ? (
					<Image src={backdrop} alt="image backdrop image" fill priority sizes="100vw" className="pointer-events-none object-cover object-top" />
				) : (
					<div className="pointer-events-none absolute inset-0 bg-bg-secondary" />
				)}
				<div className="pointer-events-none absolute inset-x-0 bottom-0 h-full bg-linear-to-t from-bg via-bg/95 via-50% to-transparent md:via-30%" />

				<Container className="relative z-raised flex min-h-136 flex-row items-end justify-center gap-10 pt-20 pb-8 md:min-h-152 md:justify-start">
					<div className="flex min-h-max max-w-full min-w-0 flex-col items-center gap-3 text-text md:flex-row md:items-end md:gap-6">
						<div className="hidden md:flex">
							<GameCard game={game} size={210} priority />
						</div>
						<div className="flex md:hidden">
							<GameCard game={game} size={180} priority />
						</div>
						<div className="items-left flex min-w-0 flex-col justify-between gap-4">
							<div className="order-2 min-w-0 pb-2 text-left md:order-1 md:pb-0">
								<h1 className="max-w-full text-2xl font-bold wrap-break-word md:text-4xl">{game.name}</h1>
								{developers.length > 0 && (
									<p className="text-md mt-2 max-w-full truncate font-body text-wrap wrap-break-word text-text-muted md:text-lg">
										Developer:{" "}
										{developers.map((dev, index) => (
											<span key={dev.id ?? index} className="font-bold text-wrap wrap-break-word">
												{dev.name}
												{index < developers.length - 1 && <span>, </span>}
											</span>
										))}
									</p>
								)}
								{publishers.length > 0 && (
									<p className="md:text-md max-w-full truncate font-body text-sm text-wrap wrap-break-word text-text-muted">
										Publisher:{" "}
										{publishers.map((pub, index) => (
											<span key={pub.id ?? index} className="font-bold text-wrap wrap-break-word">
												{pub.name}
												{index < publishers.length - 1 && <span>, </span>}
											</span>
										))}
									</p>
								)}
							</div>
							{!!game.id && game.slug && (
								<div className="order-1 md:order-2">
									<GameLibraryButtonPanel
										gameId={game.id}
										gameSlug={game.slug}
										isLoggedIn={Boolean(session?.user)}
										entry={owned}
										playlists={userPlaylistControls}
										logsHref={logsHref}
									/>
								</div>
							)}
							<div className="order-3 mt-1 w-full lg:hidden">
								<AverageRatingWidget game={game} gameStats={gameStats} />
							</div>
						</div>
					</div>
				</Container>
			</section>

			{/* INFO */}
			<section className="mt-5 w-full">
				<Container className="flex flex-col justify-between gap-10 lg:flex-row">
					<div className="min-w-0 flex-1">
						<section className="flex min-w-0 flex-col gap-10 md:flex-row">
							<div className="grid w-full min-w-0 grid-cols-1 items-start gap-x-10 gap-y-2 border-border pb-5 md:grid-cols-[auto_minmax(0,1fr)] md:gap-y-5 md:border-b md:pb-1.5">
								<p className="text-md border-b border-border p-1 text-start font-body md:border-none md:bg-bg md:p-0">Genres</p>
								<div className="text-md flex min-w-0 flex-row flex-wrap gap-x-2 gap-y-1 font-body">
									{genreTags.length
										? genreTags.map((tag, index) => (
												<span key={`${tag.facet}-${tag.id ?? tag.name}`} className="flex min-w-0 flex-row items-center gap-1">
													<Link
														href={`/filter?${tag.facet}=${tag.id}`}
														className="wrap-break-words md:text-md cursor-pointer text-sm transition-colors hover:text-primary"
													>
														{tag.name}
													</Link>
													<p className="select-none">{index < genreTags.length - 1 ? " • " : ""}</p>
												</span>
											))
										: "N/A"}
								</div>

								<p className="text-md border-b border-border p-1 text-start font-body md:border-none md:bg-bg md:p-0">Platforms</p>
								<div className="text-md flex min-w-0 flex-row flex-wrap gap-x-2 gap-y-1 font-body">
									{platforms?.length
										? platforms.map((platform, index) => (
												<span key={platform.id ?? platform.name} className="flex min-w-0 flex-row items-center gap-1">
													<Link
														href={`/filter?platforms=${platform.id}`}
														className="wrap-break-words md:text-md flex min-w-0 cursor-pointer items-center gap-2 text-sm transition-colors hover:text-primary"
													>
														{platformIcon(platform.name)}
														{platform.name}
													</Link>
													<p className="select-none">{index < game.platforms!.length - 1 ? " • " : ""}</p>
												</span>
											))
										: "N/A"}
								</div>
							</div>
						</section>

						{/* VERSION PARENT NOTICE */}
						{versionParentGame && (
							<section className="mt-4 flex min-w-0 flex-row flex-wrap items-center gap-2 rounded border border-border bg-bg-secondary p-4">
								<Library size={18} className="shrink-0 text-secondary" />
								<p className="text-md min-w-0 font-body text-text-muted">
									This is an edition of{" "}
									<Link href={`/game/${versionParentGame.slug}`} className="cursor-pointer font-bold text-primary transition-colors hover:text-primary-hover">
										{versionParentGame.name}
									</Link>
									.
								</p>
							</section>
						)}

						{/* MEDIA */}
						<section className="mt-4 flex flex-col">
							<div className="w-full min-w-0 overflow-hidden">
								<MediaGallary media={media} />
							</div>
						</section>

						{/* SUMMARY */}
						<section className="mt-4 flex flex-col pb-4">
							<div className="mb-5 flex min-w-0 flex-row flex-wrap items-center justify-between gap-2">
								<h2 className="text-xl font-bold text-text md:text-2xl">Summary</h2>
								<span className="min-w-8 flex-1 border-t border-border" aria-hidden="true" />
								<p className="text-md font-body text-text-muted">
									More info on{" "}
									<Link
										href={`https://www.igdb.com/games/${game.slug}`}
										target="_blank"
										rel="noopener noreferrer"
										className="cursor-pointer text-primary transition-colors hover:text-primary-hover"
									>
										IGDB
									</Link>
								</p>
							</div>
							<p className="text-md min-w-0 font-body text-text-muted">{game.summary}</p>
						</section>
					</div>

					{/* RIGHT COLUMN */}
					<div className="flex max-w-full min-w-0 shrink-0 flex-col gap-5 lg:w-80">
						<div className="hidden lg:block">
							<AverageRatingWidget game={game} gameStats={gameStats} />
						</div>

						{/* RELEASE DATE */}
						<section className="flex min-w-0 flex-row items-start justify-start gap-2 rounded bg-bg-secondary p-4">
							<h2 className="text-md ml-5 shrink-0 text-text">Released</h2>
							<p className="text-md ml-auto min-w-0 pr-5 text-right font-bold text-text-muted">
								{game.releaseDate ? game.releaseDate.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "N/A"}
							</p>
						</section>

						{/* LIBRARY STATS */}
						<section className="flex min-w-50 flex-col items-start justify-start gap-2 rounded bg-bg-secondary p-4">
							<LogStatFormat className="border-b border-border pr-5 pb-2" title="Plays" stat={gameStats.plays} Icon={Play} />
							<LogStatFormat className="border-b border-border pr-5 pb-2" title="Backlog" stat={gameStats.backlog} Icon={Library} />
							<LogStatFormat className="pr-5" title="Wishlists" stat={gameStats.wishlisted} Icon={Astroid} />
						</section>

						{/* PLAYLIST STATS */}
						<section className="flex min-w-0 flex-row items-start justify-start gap-2 rounded bg-bg-secondary p-4">
							<h2 className="text-md ml-5 shrink-0 text-text-muted">This entry is in</h2>
							<p className="text-md ml-auto min-w-0 pr-5 text-right font-bold text-text">{formatNumber(gameStats.publicPlaylistEntries)} playlists</p>
						</section>

						{/* ONLINE / MULTIPLAYER FEATURES */}
						{multiplayerFeatures.length > 0 && (
							<section className="flex min-w-0 flex-col gap-3 rounded bg-bg-secondary p-4">
								<h2 className="text-md ml-5 flex shrink-0 items-center gap-2 text-text-muted">Online features</h2>
								<div className="flex flex-row flex-wrap gap-2 px-5">
									{multiplayerFeatures.map((feature) => {
										// Link tags that map to a filterable mode; derived ones (e.g. "Up to 4 online") stay static.
										const modeKey = (Object.keys(MULTIPLAYER_FILTERS) as (keyof typeof MULTIPLAYER_FILTERS)[]).find(
											(key) => MULTIPLAYER_FILTERS[key] === feature,
										);

										return modeKey ? (
											<Link
												key={feature}
												href={`/filter?modes=${modeKey}`}
												className="text-md rounded bg-bg px-2 py-1 font-body text-text-muted transition-colors hover:text-primary"
											>
												{feature}
											</Link>
										) : (
											<span key={feature} className="text-md rounded bg-bg px-2 py-1 font-body text-text-muted">
												{feature}
											</span>
										);
									})}
								</div>
							</section>
						)}

						{/* TIME SPENT */}
						<section className="grid min-w-0 grid-cols-3 gap-3">
							<LogUserStatFormat title="Avg Time" stat={gameStats.averagePlaytime} Icon={Clock} />
							<LogUserStatFormat title="To Finish" stat={gameStats.averageCompletionTime} Icon={Flag} />
							<LogUserStatFormat title="To Master" stat={gameStats.averageMasteryTime} Icon={BadgeCheck} />
						</section>
					</div>
				</Container>
			</section>

			{/* RELATED GAMES */}
			<section className="mt-20 mb-10 w-full">
				<Container>
					<RelatedGamesTabs
						franchiseGames={franchiseGames}
						seriesGames={collectionsGames}
						similarGames={similarGames}
						dlcGames={dlcGames}
						expansionGames={expansionGames}
					/>
					<div className="mt-10">{!shouldHideComments(viewer) && <CommentSection targetType={InteractionTargetType.GAME} targetId={game.id!.toString()} />}</div>
				</Container>
			</section>
		</div>
	);
}

function AverageRatingWidget({ game, gameStats }: RenderAverageRatingWidgetProps) {
	const averageRating = typeof game.totalRating === "number" ? normalize.clamp(game.totalRating, 0, 100) : null;
	const ratingDistributionMax = Math.max(...gameStats.ratingDistribution.map((rating) => rating.count), 1);
	const ratingDistributionTotal = gameStats.ratingDistribution.reduce((total, rating) => total + rating.count, 0);

	return (
		<section className="rounded" aria-label={averageRating === null ? "Average rating unavailable" : `Average rating ${averageRating.toFixed(1)} out of 100`}>
			<div className="flex flex-row items-center gap-5 lg:flex-col lg:items-stretch">
				<div className="flex shrink-0 flex-col items-center justify-center rounded bg-bg-secondary pt-5 pr-6 pb-5 pl-6 md:order-1">
					<h2 className="text-sm text-text-muted">Avg. Rating</h2>
					<p className="text-2xl font-bold text-text">{averageRating === null ? "N/A" : ratingToFive(Number(averageRating.toFixed(1)))?.toFixed(2)}</p>
				</div>
				<div className="min-w-0 flex-1">
					<div className="flex h-18 min-w-36 items-end gap-1">
						{gameStats.ratingDistribution.map((rating) => {
							const percentage = ratingDistributionTotal ? (rating.count / ratingDistributionTotal) * 100 : 0;
							const label = `${rating.rating} ${rating.rating === 1 ? "star" : "stars"}`;

							return (
								<div
									key={rating.rating}
									className="flex h-full flex-1 items-end"
									title={`${label}: ${formatNumber(rating.count)} ${rating.count === 1 ? "vote" : "votes"} (${percentage.toFixed(1)}%)`}
								>
									<div
										className="w-full rounded-t bg-primary/75"
										style={{
											height: `${rating.count ? Math.max(10, (rating.count / ratingDistributionMax) * 100) : 0}%`,
										}}
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
								<Star size={14} className="fill-primary" />5
							</span>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

function LogStatFormat({ className, title, stat, Icon }: LogStatFormatProps) {
	return (
		<div className={joinClass("w-full", className)}>
			<div className="ml-5 flex min-w-0 flex-row items-center gap-2">
				<Icon className="rounded-2xl bg-bg/60 p-2 text-secondary" size={30} />
				<p className="text-md min-w-0 truncate text-text-muted">{title}</p>
				<p className="text-md ml-auto shrink-0 text-text">{formatNumber(stat!)}</p>
			</div>
		</div>
	);
}

function LogUserStatFormat({ title, stat, Icon }: LogStatFormatProps) {
	return (
		<div className="relative min-w-0 rounded border-2 border-primary/30 bg-primary/10 p-4 pt-7 text-center">
			<Icon className="absolute top-3 right-3 text-primary" size={18} />
			<p className="truncate text-xl font-bold text-text">{formatHours(stat)}</p>
			<p className="mt-1 truncate font-body text-xs text-text-muted">{title}</p>
		</div>
	);
}

function platformIcon(name: string) {
	const lower = name.toLowerCase();

	if (lower.includes("playstation")) return <GamepadDirectional size={16} />;
	if (lower.includes("xbox")) return <Gamepad2 size={16} />;
	if (lower.includes("nintendo")) return <ToggleRight size={16} />;
	if (lower.includes("pc") || lower.includes("windows") || lower.includes("steam") || lower.includes("epic") || lower.includes("gog")) return <Monitor size={16} />;
	if (lower.includes("mac")) return <Apple size={16} />;
	if (lower.includes("ios") || lower.includes("android") || lower.includes("mobile")) return <TabletSmartphone size={16} />;
}

function formatHours(value: number | null) {
	if (value === null) return "N/A";

	return `${Intl.NumberFormat("en", {
		maximumFractionDigits: value >= 10 ? 0 : 1,
	}).format(value)}h`;
}

async function fetchSubData(session: Session | null, game: Game, developerIds: number[], publisherIds: number[]) {
	return await Promise.all([
		session?.user?.id && game.id ? getUserGameEntry(session.user.id, game.id) : null,
		getUser(session?.user),
		getGameStats(game.id!),
		game.franchises ? getFranchise(game.franchises) : [],
		game.collections ? getCollection(game.collections) : [],
		getCompany(Array.from(developerIds.values())),
		getCompany(Array.from(publisherIds.values())),
		game.similarGames?.length ? getGame(game.similarGames) : [],
		game.genres?.length ? getGenre(game.genres) : [],
		game.themes?.length ? getTheme(game.themes) : [],
		game.platforms?.length ? getPlatform(game.platforms) : [],
		session?.user?.id ? getUserPlaylists(session.user.id) : [],
		game.id ? getMultiplayerFeatures(game.id) : [],
		game.dlcs?.length ? getMinifiedGame(game.dlcs) : [],
		[...(game.expansions ?? []), ...(game.standaloneExpansions ?? []), ...(game.expandedGames ?? [])].length
			? getMinifiedGame([...(game.expansions ?? []), ...(game.standaloneExpansions ?? []), ...(game.expandedGames ?? [])])
			: [],
		game.versionParent ? getMinifiedGame(game.versionParent) : null,
	]);
}

async function fetchGroupedData(franchises: Franchise[], collections: Collection[]) {
	return await Promise.all([franchises.length ? getGame(franchises[0].games) : [], collections.length ? getGame(collections[0].games) : []]);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
	const { slug } = await params;
	const game = await getGameBySlug(slug);
	const title = game?.name ?? "Game not found";
	const description = metadataDescription(
		game?.summary,
		game ? `Track ratings, playtime, playlists, and community activity for ${game.name}.` : "The requested game could not be found.",
	);
	const image = absoluteUrl(`/game/${encodeURIComponent(game?.slug ?? slug)}/opengraph-image`);
	const url = absoluteUrl(`/game/${game?.slug ?? slug}`);

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
		robots: game
			? undefined
			: {
					index: false,
					follow: false,
					googleBot: {
						index: false,
						follow: false,
					},
				},
	};
}
