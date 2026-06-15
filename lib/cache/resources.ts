import CachedResource from "./CachedResource";
import { calculateTrendingGames, calculateYearlyHitGames, calculateHiddenGems, calculateMostAnticipated, calculateComingSoon, calculateRecentlyReleased } from "../external/igdb/games";

export const trendingGames = new CachedResource({
    name: "trending-games",
    ttlMs: 1000 * 60 * 60,
    fallback: [],
    fetcher: calculateTrendingGames
})


export const yearlyGames = new CachedResource({
    name: "yearly-games",
    ttlMs: 1000 * 60 * 60 * 24,
    fallback: [],
    fetcher: calculateYearlyHitGames
})


export const hiddenGames = new CachedResource({
    name: "hidden-games",
    ttlMs: 1000 * 60 * 60 * 24,
    fallback: [],
    fetcher: calculateHiddenGems
})

export const mostAnticipated = new CachedResource({
    name: "mostanticipated-games",
    ttlMs: 1000 * 60 * 60 * 24,
    fallback: [],
    fetcher: calculateMostAnticipated
})

export const comingSoon = new CachedResource({
    name: "comingsoon-games",
    ttlMs: 1000 * 60 * 60,
    fallback: [],
    fetcher: calculateComingSoon
})

export const recentreleases = new CachedResource({
    name: "recentreleases-games",
    ttlMs: 1000 * 60 * 60,
    fallback: [],
    fetcher: calculateRecentlyReleased
})


export const cachedResources = [
    trendingGames,
    yearlyGames,
    hiddenGames,
    mostAnticipated,
    comingSoon,
    recentreleases
]