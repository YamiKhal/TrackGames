import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { GameCard } from "@/components/game/GameDisplay";
import Container from "@/components/layout/Container";
import EmptyState from "@/components/ui/EmptyState";
import Loading from "@/components/ui/Loading";
import LoadMoreButton from "@/components/ui/LoadMoreButton";
import { filterGames } from "@/lib/data/catalog/games";
import { getGenre } from "@/lib/data/catalog/genre";
import { getPlatform } from "@/lib/data/catalog/platforms";
import { getTheme } from "@/lib/data/catalog/themes";
import { MULTIPLAYER_FILTERS, type MultiplayerFilterKey } from "@/lib/data/filters";
import { PlayerPerspective } from "@/lib/generated/prisma/enums";
import { absoluteUrl, DEFAULT_OG_IMAGE, metadataDescription, SITE_NAME } from "@/lib/util/metadata";
import FilterPanel from "./FilterPanel";

type SearchParams = Record<string, string | string[] | undefined>;
type ParamValue = string | string[] | undefined;

type FilterPageProps = Readonly<{
	searchParams: Promise<SearchParams>;
}>;

const description = metadataDescription("Filter TrackGames by genre, theme, platform, perspective, and multiplayer mode.");

const RESULTS_PER_PAGE = 32;

export const metadata: Metadata = {
	title: "Filter",
	description,
	alternates: {
		canonical: absoluteUrl("/filter"),
	},
	openGraph: {
		title: `Filter | ${SITE_NAME}`,
		description,
		url: absoluteUrl("/filter"),
		siteName: SITE_NAME,
		type: "website",
		images: [{ url: DEFAULT_OG_IMAGE, alt: SITE_NAME }],
	},
	twitter: {
		card: "summary_large_image",
		title: `Filter | ${SITE_NAME}`,
		description,
		images: [DEFAULT_OG_IMAGE],
	},
	robots: {
		index: false,
		follow: true,
	},
};

export default async function FilterPage({ searchParams }: FilterPageProps) {
	const params = await searchParams;
	const filters = parseFilters(params);

	const requestedPage = Number(Array.isArray(params.page) ? params.page[0] : (params.page ?? "1"));
	const page = Number.isInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 10) : 1;

	const hasFilters = Boolean(
		filters.genres.length ||
		filters.themes.length ||
		filters.platforms.length ||
		filters.perspectives.length ||
		filters.multiplayerModes.length ||
		filters.from ||
		filters.till,
	);

	return (
		<main className="flex-1 bg-bg py-10 text-text">
			<Container className="flex flex-col gap-8">
				<header className="flex flex-col gap-2">
					<h1 className="text-3xl font-bold">Filter</h1>
				</header>

				<Suspense key={serialiseFilters(filters).toString() + page} fallback={<Loading />}>
					<FilterResults filters={filters} page={page} hasFilters={hasFilters} />
				</Suspense>
			</Container>
		</main>
	);
}

async function FilterResults({ filters, page, hasFilters }: Readonly<{ filters: ReturnType<typeof parseFilters>; page: number; hasFilters: boolean }>) {
	const { genres, themes, platforms, perspectives, multiplayerModes, from, till } = filters;
	const resultLimit = page * RESULTS_PER_PAGE;

	// Resolve selected ids to their names so the panel can render labelled chips without an extra fetch.
	const [genreOptions, themeOptions, platformOptions, results] = await Promise.all([
		genres.length ? getGenre(genres) : [],
		themes.length ? getTheme(themes) : [],
		platforms.length ? getPlatform(platforms) : [],
		hasFilters ? filterGames({ genres, themes, platforms, perspectives, multiplayerModes, releaseFrom: from, releaseTill: till }, resultLimit + 1) : Promise.resolve([]),
	]);

	const games = results.slice(0, resultLimit);
	const hasMore = results.length > resultLimit;

	const nextParams = serialiseFilters(filters);
	nextParams.set("page", String(page + 1));

	return (
		<>
			<FilterPanel
				key={nextParams.toString()}
				selectedGenres={genreOptions.map((genre) => ({ id: genre.id, name: genre.name }))}
				selectedThemes={themeOptions.map((theme) => ({ id: theme.id, name: theme.name }))}
				selectedPlatforms={platformOptions.map((platform) => ({ id: platform.id, name: platform.name }))}
				selectedPerspectives={perspectives}
				selectedModes={multiplayerModes}
				selectedFrom={from ?? ""}
				selectedTill={till ?? ""}
			/>

			{hasFilters && games.length === 0 ? <EmptyState icon={SearchX} message="No games match these filters." /> : null}

			{games.length > 0 ? (
				<>
					<div className="grid grid-cols-2 justify-items-center gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
						{games.map((game) => (
							<div key={game.id} className="min-w-0">
								<GameCard game={game} size={140} effect="ripple" hover="name" hasHref={true} />
							</div>
						))}
					</div>

					<div className="flex flex-wrap items-center justify-center gap-3">{hasMore ? <LoadMoreButton href={`/filter?${nextParams}`} /> : null}</div>
				</>
			) : null}
		</>
	);
}

function parseIds(value: ParamValue): number[] {
	const raw = Array.isArray(value) ? value[0] : value;
	if (!raw) return [];

	return Array.from(
		new Set(
			raw
				.split(",")
				.map((part) => Number(part.trim()))
				.filter((id) => Number.isInteger(id) && id > 0),
		),
	);
}

/** Parses a comma-separated list of allowed string values from a query param. */
function parseValues<T extends string>(value: ParamValue, allowed: readonly T[]): T[] {
	const raw = Array.isArray(value) ? value[0] : value;
	if (!raw) return [];

	return Array.from(
		new Set(
			raw
				.split(",")
				.map((part) => part.trim())
				.filter((part): part is T => (allowed as readonly string[]).includes(part)),
		),
	);
}

/** Parses a `YYYY-MM-DD` date param, ignoring anything malformed. */
function parseDate(value: ParamValue): string | undefined {
	const raw = Array.isArray(value) ? value[0] : value;
	if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw) || Number.isNaN(Date.parse(raw))) return undefined;

	return raw;
}

/** Reads every filter facet off the raw search params. */
function parseFilters(params: SearchParams) {
	return {
		genres: parseIds(params.genres),
		themes: parseIds(params.themes),
		platforms: parseIds(params.platforms),
		perspectives: parseValues(params.perspectives, Object.values(PlayerPerspective)),
		multiplayerModes: parseValues(params.modes, Object.keys(MULTIPLAYER_FILTERS) as MultiplayerFilterKey[]),
		from: parseDate(params.from),
		till: parseDate(params.till),
	};
}

/** Serialises filters back to a query string (without a page), for building "load more" links. */
function serialiseFilters(filters: ReturnType<typeof parseFilters>) {
	const params = new URLSearchParams();
	const setList = (key: string, values: (number | string)[]) => values.length && params.set(key, values.join(","));

	setList("genres", filters.genres);
	setList("themes", filters.themes);
	setList("platforms", filters.platforms);
	setList("perspectives", filters.perspectives);
	setList("modes", filters.multiplayerModes);
	if (filters.from) params.set("from", filters.from);
	if (filters.till) params.set("till", filters.till);

	return params;
}
