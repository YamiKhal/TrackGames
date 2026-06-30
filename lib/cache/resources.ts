import CachedResource from "./cachedResource";
import {
	calculateTrendingGames,
	calculateYearlyHitGames,
	calculateHiddenGems,
	calculateMostAnticipated,
	calculateComingSoon,
	calculateRecentlyReleased,
} from "../external/igdb/games";
import { getSiteStats } from "../data/stats";
import { getTopPlaylists } from "../data/playlists";

export const trendingGames = new CachedResource({
	name: "trending-games",
	ttlMs: 1000 * 60 * 60,
	fallback: [],
	fetcher: calculateTrendingGames,
});

export const yearlyGames = new CachedResource({
	name: "yearly-games",
	ttlMs: 1000 * 60 * 60 * 24,
	fallback: [],
	fetcher: calculateYearlyHitGames,
});

export const hiddenGames = new CachedResource({
	name: "hidden-games",
	ttlMs: 1000 * 60 * 60 * 24,
	fallback: [],
	fetcher: calculateHiddenGems,
});

export const mostAnticipated = new CachedResource({
	name: "mostanticipated-games",
	ttlMs: 1000 * 60 * 60 * 24,
	fallback: [],
	fetcher: calculateMostAnticipated,
});

export const comingSoon = new CachedResource({
	name: "comingsoon-games",
	ttlMs: 1000 * 60 * 60,
	fallback: [],
	fetcher: calculateComingSoon,
});

export const recentReleases = new CachedResource({
	name: "recentreleases-games",
	ttlMs: 1000 * 60 * 60,
	fallback: [],
	fetcher: calculateRecentlyReleased,
});

export const siteStats = new CachedResource({
	name: "site-stats",
	ttlMs: 1000 * 60 * 5,
	fallback: {
		games: 0,
		users: 0,
		libraries: 0,
		playlists: 0,
	},
	fetcher: getSiteStats,
});

export const topPlaylists = new CachedResource({
	name: "top-playlists",
	ttlMs: 1000 * 60 * 10,
	fallback: [],
	fetcher: getTopPlaylists,
});

export const cachedResources = [trendingGames, yearlyGames, hiddenGames, mostAnticipated, comingSoon, recentReleases, siteStats, topPlaylists];
