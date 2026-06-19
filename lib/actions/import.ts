"use server";

import { revalidatePath } from "next/cache";
import { auth } from "../auth";
import db from "../db";
import { getOwnedGames, getSteamProfile } from "../external/steam/api";
import { ActivityType, InteractionTargetType } from "../generated/prisma/enums";

function gameSlug(name: string) {
    return name
        .trim()
        .toLowerCase()
        .replace(/[^\w]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

function gameSlugs(name: string) {
    return Array.from(new Set([
        gameSlug(name),
        gameSlug(name.replace(/['’]/g, "")),
    ].filter(Boolean)));
}

async function getCurrentUserId() {
    const session = await auth();

    if (!session?.user?.id) {
        throw new Error("You must be logged in.");
    }

    return session.user.id;
}

export async function getSteamProfileImportPreview(steamId: string) {
    const id = steamId.trim();

    if (!/^\d{17}$/.test(id)) {
        return { error: "Enter a valid Steam profile ID." };
    }

    const profile = await getSteamProfile(id).catch(() => null);

    if (!profile?.personaname) {
        return { error: "No Steam profile found for that ID." };
    }

    return {
        steamId: id,
        personaname: String(profile.personaname),
        profileurl: profile.profileurl,
        avatar: profile.avatarfull
    };
}

export async function importSteamLibrary(steamId: string, skipImportedLogsRecap = true) {
    const id = steamId.trim();

    if (!/^\d{17}$/.test(id)) {
        throw new Error("Enter a valid Steam profile ID.");
    }

    const userId = await getCurrentUserId();
    const ownedGames = await getOwnedGames(id);

    if (!Array.isArray(ownedGames) || ownedGames.length === 0) {
        return { imported: 0, failed: [] as string[] };
    }

    const steamGames = new Map<string, { name: string; hours: number; slugs: string[] }>();

    for (const game of ownedGames as { name?: string; playtime_forever?: number }[]) {
        if (!game.name) continue;

        const slugs = gameSlugs(game.name);
        if (!slugs.length) continue;

        const hours = Math.round(((game.playtime_forever ?? 0) / 60) * 10) / 10;
        const existing = steamGames.get(slugs[0]);
        steamGames.set(slugs[0], {
            name: game.name,
            hours: Math.max(existing?.hours ?? 0, hours),
            slugs,
        });
    }

    const slugs = Array.from(new Set(Array.from(steamGames.values()).flatMap((game) => game.slugs)));
    const foundGames: { id: number; slug: string }[] = [];

    for (let index = 0; index < slugs.length; index += 100) {
        foundGames.push(...await db.game.findMany({
            where: {
                slug: {
                    in: slugs.slice(index, index + 100),
                },
            },
            select: {
                id: true,
                slug: true,
            },
        }));
    }

    const foundBySlug = new Map(foundGames.map((game) => [game.slug, game]));
    const failed: string[] = [];
    const matchedGames = new Map<number, { id: number; hours: number }>();

    for (const steamGame of steamGames.values()) {
        const match = steamGame.slugs.map((slug) => foundBySlug.get(slug)).find(Boolean);

        if (!match) {
            failed.push(`${steamGame.name} (${steamGame.hours})`);
            continue;
        }

        const existing = matchedGames.get(match.id);
        matchedGames.set(match.id, {
            id: match.id,
            hours: Math.max(existing?.hours ?? 0, steamGame.hours),
        });
    }

    const matched = Array.from(matchedGames.values());
    const playedAt = new Date();
    let imported = 0;

    for (let index = 0; index < matched.length; index += 50) {
        await db.$transaction(async (tx) => {
            for (const game of matched.slice(index, index + 50)) {
                const current = await tx.userGameEntry.findUnique({
                    where: {
                        userId_gameId: {
                            userId,
                            gameId: game.id,
                        },
                    },
                    select: {
                        id: true,
                        timePlayed: true,
                    },
                });
                const currentHours = current?.timePlayed ?? 0;
                const hours = Math.round((game.hours - currentHours) * 10) / 10;

                const entry = current ?? await tx.userGameEntry.create({
                    data: {
                        userId,
                        gameId: game.id,
                        timePlayed: game.hours,
                    },
                    select: {
                        id: true,
                    },
                });

                if (hours <= 0) {
                    if (!current) imported += 1;
                    continue;
                }

                if (current) {
                    await tx.userGameEntry.update({
                        where: {
                            id: current.id,
                        },
                        data: {
                            timePlayed: game.hours,
                        },
                    });
                }

                await tx.userGamePlayLog.create({
                    data: {
                        userId,
                        entryId: entry.id,
                        gameId: game.id,
                        hours,
                        note: "Imported from Steam.",
                        skipRecap: skipImportedLogsRecap,
                        playedAt,
                    },
                });

                await tx.activity.create({
                    data: {
                        userId,
                        type: ActivityType.LOGGED_GAME_PLAY,
                        targetType: InteractionTargetType.GAME,
                        targetId: String(game.id),
                        gameId: game.id,
                        message: "Imported from Steam.",
                    },
                });

                imported += 1;
            }
        });
    }

    revalidatePath("/library/[slug]", "page");
    revalidatePath("/u/[user]", "page");
    return { imported, failed };
}
