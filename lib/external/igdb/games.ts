"use server";

import { Unix, UnixElapseMeasure } from "../../util/Unix";
import { RawGame, PopScoreEntry } from "../../types";
import { fetchAPI } from "./IGDBAPI";


export async function fetchDisplayGames(fields: string | null = null, body: string = ""): Promise<RawGame[]> {
    fields = fields ? ", " + fields : "";

    return await fetchAPI<RawGame[]>("games",
        `
        fields slug, name, cover.image_id, total_rating${fields};
        ${body}
        `
    )
}

export async function fetchGameDataBySlug(slug: string) {
    const data = await fetchAPI<RawGame[]>("games",
        `
        fields slug, name, summary, total_rating, first_release_date, cover.image_id, screenshots.image_id, videos.video_id, platforms.name, platforms.slug, involved_companies.company, involved_companies.developer, involved_companies.publisher, genres.name, genres.slug, franchises.name, franchises.slug, franchises.games, similar_games, collections.name, collections.slug, collections.games;
        where slug = ${JSON.stringify(slug)};
        limit 1;
        `
    )

    const game = data[0] ?? null;
    return game;
}


export async function calculateTrendingGames() {
    const unixGamesLimit = new Unix().elapse(UnixElapseMeasure.MONTHS, -2);
    const weightedGames: { game: any; score: number }[] = [];

    const games = await fetchDisplayGames(null, `
        where first_release_date >= ${unixGamesLimit}
        & first_release_date <= ${Unix.now()}
        & game_type = 0;
        sort total_rating_count desc;
        limit 500;
    `);

    for (const game of games) {
        const primitives = await
            fetchAPI<PopScoreEntry[]>(
                "popularity_primitives",
                `
                fields game_id, value, popularity_type, created_at;
                where popularity_type = (1, 2)
                & game_id = ${game.id};
                sort created_at desc;
                limit 500;
                `
            )

        const type1 = primitives.find(p => p.popularity_type === 1)?.value ?? 0;
        const type2 = primitives.find(p => p.popularity_type === 2)?.value ?? 0;

        const weightedScore = type1 * 0.6 + type2 * 0.4;

        weightedGames.push({ game, score: weightedScore });
    }

    return weightedGames
        .sort((a, b) => b.score - a.score)
        .map(item => item.game)
        .slice(0, 19);
}


export async function calculateYearlyHitGames() {
    const startOfYear = Math.floor(
        new Date(new Date().getFullYear(), 0, 1).getTime() / 1000);

    const games = await fetchDisplayGames("summary, screenshots.image_id, platforms.name", `
        where first_release_date >= ${startOfYear}
        & first_release_date <= ${Unix.now()}
        & hypes >= 80
        & total_rating_count >= 10
        & game_type = 0;
        sort total_rating desc;
        limit 20;
    `);

    return games.filter((game) => game.screenshots?.length);
}


export async function calculateHiddenGems() {
    const unixGamesLimit = new Unix().elapse(UnixElapseMeasure.MONTHS, -4);

    const games = await fetchDisplayGames(null, `
        where first_release_date >= ${unixGamesLimit}
        & first_release_date <= ${Unix.now()}
        & hypes <= 10
        & total_rating <= 75
        & total_rating_count >= 5
        & total_rating_count <= 20
        & game_type = 0;
        sort total_rating desc;
        limit 4;
    `);

    return games;
}


export async function calculateMostAnticipated() {
    const games = await fetchDisplayGames(`first_release_date`, `
        where first_release_date > ${Unix.now()}
        & game_type = 0;
        sort hypes desc;
        limit 4;
    `);

    return games;
}

export async function calculateComingSoon() {
    const games = await fetchDisplayGames(`first_release_date`, `
        where first_release_date > ${Unix.now()}
        & game_type = 0;
        sort first_release_date asc;
        limit 100;
    `);

    return games;
}

export async function calculateRecentlyReleased() {
    const games = await fetchDisplayGames(`first_release_date`, `
        where first_release_date <= ${Unix.now()}
        & game_type = 0;
        sort first_release_date desc;
        limit 100;
    `);

    return games;
}