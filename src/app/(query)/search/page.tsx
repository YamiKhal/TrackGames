import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { GameCard } from "@/components/game/GameDisplay";
import Container from "@/components/layout/Container";
import EmptyState from "@/components/ui/EmptyState";
import Loading from "@/components/ui/Loading";
import LoadMoreButton from "@/components/ui/LoadMoreButton";
import { searchGames } from "@/lib/data/catalog/games";
import { absoluteUrl, DEFAULT_OG_IMAGE, metadataDescription, SITE_NAME } from "@/lib/util/metadata";

type SearchPageProps = Readonly<{ searchParams: Promise<{ q?: string | string[]; page?: string | string[] }> }>;

const description = metadataDescription("Search TrackGames for games to rate, track, and add to your library.");

const RESULTS_PER_PAGE = 32;

export const metadata: Metadata = {
	title: "Search",
	description,
	alternates: {
		canonical: absoluteUrl("/search"),
	},
	openGraph: {
		title: `Search | ${SITE_NAME}`,
		description,
		url: absoluteUrl("/search"),
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
		title: `Search | ${SITE_NAME}`,
		description,
		images: [DEFAULT_OG_IMAGE],
	},
	robots: {
		index: false,
		follow: true,
	},
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
	const params = await searchParams;
	const query = (Array.isArray(params.q) ? params.q[0] : (params.q ?? "")).trim();
	const requestedPage = Number(Array.isArray(params.page) ? params.page[0] : (params.page ?? "1"));
	const page = Number.isInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 10) : 1;

	return (
		<main className="flex-1 bg-bg py-10 text-text">
			<Container className="flex flex-col gap-8">
				<header className="flex flex-col gap-2">
					<h1 className="text-3xl font-bold">Search</h1>
					{query.length >= 2 ? (
						<p className="text-sm text-text-muted">Results for &quot;{query}&quot;</p>
					) : (
						<p className="text-sm text-text-muted">Enter at least two characters to search games.</p>
					)}
				</header>

				{/* Stream the results: the parent paints the header immediately while the query runs. */}
				<Suspense key={`${query}:${page}`} fallback={<Loading />}>
					<SearchResults query={query} page={page} />
				</Suspense>
			</Container>
		</main>
	);
}

async function SearchResults({ query, page }: Readonly<{ query: string; page: number }>) {
	const resultLimit = page * RESULTS_PER_PAGE;
	const results = query.length >= 2 ? await searchGames(query, resultLimit + 1) : [];
	const games = results.slice(0, resultLimit);
	const hasMore = results.length > resultLimit;
	const nextParams = new URLSearchParams({ q: query, page: String(page + 1) });

	if (query.length >= 2 && games.length === 0) return <EmptyState icon={SearchX} message="No games found." />;
	if (games.length === 0) return null;

	return (
		<>
			<div className="grid grid-cols-2 justify-items-center gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
				{games.map((game) => (
					<div key={game.id} className="min-w-0">
						<GameCard game={game} size={140} effect="ripple" hover="name" hasHref={true} />
					</div>
				))}
			</div>

			<div className="flex flex-wrap items-center justify-center gap-3">{hasMore ? <LoadMoreButton href={`/search?${nextParams}`} /> : null}</div>
		</>
	);
}
