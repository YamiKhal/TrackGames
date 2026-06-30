"use server";

import { revalidatePath } from "next/cache";
import { auth } from "../auth";
import { getTagsForEntries } from "../data/library";
import db from "../db";
import { getOwnedGames, getSteamProfile } from "../external/steam/api";
import { ActivityType, GameStatus, InteractionTargetType } from "../generated/prisma/enums";

type TgLibraryEntry = {
	game?: {
		id?: number;
		slug?: string | null;
	};
	status?: string;
	rating?: number | null;
	timePlayed?: number | null;
	timeMode?: string | null;
	timeFinished?: number | null;
	timeMastered?: number | null;
	notes?: string | null;
	favorite?: boolean;
	addedAt?: string | null;
	startedAt?: string | null;
	finishedAt?: string | null;
	masteredAt?: string | null;
	tags?: string[];
	logs?: {
		hours?: number;
		note?: string;
		skipRecap?: boolean;
		playedAt?: string | null;
		createdAt?: string | null;
	}[];
};

function gameSlug(name: string) {
	return name
		.trim()
		.toLowerCase()
		.replace(/[^\w]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

function gameSlugs(name: string) {
	return Array.from(new Set([gameSlug(name), gameSlug(name.replace(/['’]/g, ""))].filter(Boolean)));
}

async function getCurrentUserId() {
	const session = await auth();

	if (!session?.user?.id) {
		throw new Error("You must be logged in.");
	}

	return session.user.id;
}

function dateFromBackup(value: string | null | undefined) {
	if (!value) return null;

	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

function numberFromBackup(value: number | null | undefined) {
	return Number.isFinite(value) ? value : null;
}

function getGameObject(item: TgLibraryEntry, gamesBySlug: Map<string, { slug: string; id: number }>, gamesById: Map<number, { id: number; slug: string }>) {
	const sluggedHolder = item.game?.slug ? gamesBySlug.get(item.game.slug) : null;
	return item.game?.id ? gamesById.get(item.game.id) : sluggedHolder;
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
		avatar: profile.avatarfull,
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
		foundGames.push(
			...(await db.game.findMany({
				where: {
					slug: {
						in: slugs.slice(index, index + 100),
					},
				},
				select: {
					id: true,
					slug: true,
				},
			})),
		);
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

				const entry =
					current ??
					(await tx.userGameEntry.create({
						data: {
							userId,
							gameId: game.id,
							timePlayed: game.hours,
						},
						select: {
							id: true,
						},
					}));

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

export async function exportTgLibrary() {
	const userId = await getCurrentUserId();
	const user = await db.user.findUnique({
		where: {
			id: userId,
		},
		select: {
			name: true,
		},
	});

	const entries = await db.userGameEntry.findMany({
		where: {
			userId,
		},
		select: {
			id: true,
			game: {
				select: {
					id: true,
					slug: true,
				},
			},
			status: true,
			rating: true,
			timePlayed: true,
			timeMode: true,
			timeFinished: true,
			timeMastered: true,
			notes: true,
			favorite: true,
			addedAt: true,
			startedAt: true,
			finishedAt: true,
			masteredAt: true,
			userGamePlayLogs: {
				orderBy: {
					playedAt: "asc",
				},
				select: {
					hours: true,
					note: true,
					skipRecap: true,
					playedAt: true,
					createdAt: true,
				},
			},
		},
		orderBy: {
			addedAt: "asc",
		},
	});
	const entryTags = await getTagsForEntries(entries.map((entry) => entry.id));

	const now = new Date();
	const day = String(now.getDate()).padStart(2, "0");
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const year = now.getFullYear();
	const name =
		(user?.name ?? "TrackGames")
			.trim()
			.replace(/[^a-z0-9_-]+/gi, "-")
			.replace(/^-|-$/g, "") || "TrackGames";

	return {
		filename: `${name}-Library-${day}-${month}-${year}.tg`,
		data: JSON.stringify({
			version: 1,
			exportedAt: now.toISOString(),
			entries: entries.map((entry) => ({
				game: entry.game,
				status: entry.status,
				rating: entry.rating,
				timePlayed: entry.timePlayed,
				timeMode: entry.timeMode,
				timeFinished: entry.timeFinished,
				timeMastered: entry.timeMastered,
				notes: entry.notes,
				favorite: entry.favorite,
				addedAt: entry.addedAt.toISOString(),
				startedAt: entry.startedAt?.toISOString() ?? null,
				finishedAt: entry.finishedAt?.toISOString() ?? null,
				masteredAt: entry.masteredAt?.toISOString() ?? null,
				tags: (entryTags.get(entry.id) ?? []).map((tag) => tag.name),
				logs: entry.userGamePlayLogs.map((log) => ({
					hours: log.hours,
					note: log.note,
					skipRecap: log.skipRecap,
					playedAt: log.playedAt.toISOString(),
					createdAt: log.createdAt.toISOString(),
				})),
			})),
		}),
	};
}

export async function importTgLibrary(contents: string) {
	const userId = await getCurrentUserId();
	let backup: { version?: number; entries?: TgLibraryEntry[] };

	try {
		backup = JSON.parse(contents);
	} catch {
		throw new Error("Invalid .tg file.");
	}

	if (backup.version !== 1 || !Array.isArray(backup.entries)) {
		throw new Error("Unsupported .tg file.");
	}

	const gameIds = Array.from(new Set(backup.entries.map((entry) => entry.game?.id).filter((id): id is number => Number.isInteger(id))));
	const slugs = Array.from(new Set(backup.entries.map((entry) => entry.game?.slug).filter((slug): slug is string => Boolean(slug))));
	const games = await db.game.findMany({
		where: {
			OR: [{ id: { in: gameIds } }, { slug: { in: slugs } }],
		},
		select: {
			id: true,
			slug: true,
		},
	});
	const gamesById = new Map(games.map((game) => [game.id, game]));
	const gamesBySlug = new Map(games.map((game) => [game.slug, game]));
	let imported = 0;
	let logs = 0;
	let skipped = 0;

	for (let index = 0; index < backup.entries.length; index += 50) {
		await db.$transaction(async (tx) => {
			for (const item of backup.entries!.slice(index, index + 50)) {
				const game = getGameObject(item, gamesBySlug, gamesById);
				const status = Object.values(GameStatus).includes(item.status as GameStatus) ? (item.status as GameStatus) : null;

				if (!game || !status) {
					skipped += 1;
					continue;
				}

				item.timeMode = item.timeMode === "manual" ? "manual" : "logs";

				const entry = await tx.userGameEntry.upsert({
					where: {
						userId_gameId: {
							userId,
							gameId: game.id,
						},
					},
					update: {
						status,
						rating: numberFromBackup(item.rating),
						timePlayed: numberFromBackup(item.timePlayed),
						timeMode: item.timeMode,
						timeFinished: numberFromBackup(item.timeFinished),
						timeMastered: numberFromBackup(item.timeMastered),
						notes: item.notes?.trim() || null,
						favorite: Boolean(item.favorite),
						addedAt: dateFromBackup(item.addedAt) ?? undefined,
						startedAt: dateFromBackup(item.startedAt),
						finishedAt: dateFromBackup(item.finishedAt),
						masteredAt: dateFromBackup(item.masteredAt),
					},
					create: {
						userId,
						gameId: game.id,
						status,
						rating: numberFromBackup(item.rating),
						timePlayed: numberFromBackup(item.timePlayed),
						timeMode: item.timeMode,
						timeFinished: numberFromBackup(item.timeFinished),
						timeMastered: numberFromBackup(item.timeMastered),
						notes: item.notes?.trim() || null,
						favorite: Boolean(item.favorite),
						addedAt: dateFromBackup(item.addedAt) ?? undefined,
						startedAt: dateFromBackup(item.startedAt),
						finishedAt: dateFromBackup(item.finishedAt),
						masteredAt: dateFromBackup(item.masteredAt),
					},
					select: {
						id: true,
					},
				});

				await tx.userGamePlayLog.deleteMany({
					where: {
						userId,
						entryId: entry.id,
					},
				});

				await tx.userGameEntryTag.deleteMany({
					where: {
						entryId: entry.id,
					},
				});

				for (const name of Array.from(
					new Set(
						(item.tags ?? [])
							.map((tag) => tag.trim())
							.filter(Boolean)
							.map((tag) => tag.slice(0, 40)),
					),
				)) {
					const normalized = name.toLowerCase();
					const tag = await tx.userTag.upsert({
						where: {
							userId_normalized: {
								userId,
								normalized,
							},
						},
						update: {
							name,
						},
						create: {
							userId,
							name,
							normalized,
						},
						select: {
							id: true,
						},
					});

					await tx.userGameEntryTag.createMany({
						data: [
							{
								entryId: entry.id,
								tagId: tag.id,
							},
						],
						skipDuplicates: true,
					});
				}

				const importedLogs = (item.logs ?? [])
					.filter((log) => Number.isFinite(log.hours) && log.hours! > 0)
					.map((log) => ({
						userId,
						entryId: entry.id,
						gameId: game.id,
						hours: log.hours!,
						note: log.note?.trim() || "Imported from .tg backup.",
						skipRecap: Boolean(log.skipRecap),
						playedAt: dateFromBackup(log.playedAt) ?? new Date(),
						createdAt: dateFromBackup(log.createdAt) ?? new Date(),
					}));

				if (importedLogs.length) {
					await tx.userGamePlayLog.createMany({
						data: importedLogs,
					});
				}

				imported += 1;
				logs += importedLogs.length;
			}
		});
	}

	revalidatePath("/library/[slug]", "page");
	revalidatePath("/u/[user]", "page");
	return { imported, logs, skipped };
}
