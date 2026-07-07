"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth";
import { getTagsForEntries, syncEntryTags } from "@/lib/data/gamelist/library";
import db from "@/lib/db";
import { getOwnedGames, getSteamProfile } from "@/lib/external/steam/api";
import type { Prisma } from "@/lib/generated/prisma/client";
import { ActivityType, GameStatus, InteractionTargetType } from "@/lib/generated/prisma/enums";
import { inputError } from "@/lib/logger";
import { chunked } from "@/lib/util/format/numbers";

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

function resolveBackupEntryItem(item: TgLibraryEntry, gamesBySlug: Map<string, { slug: string; id: number }>, gamesById: Map<number, { id: number; slug: string }>) {
	const game = getGameObject(item, gamesBySlug, gamesById);
	const status = Object.values(GameStatus).includes(item.status as GameStatus) ? (item.status as GameStatus) : null;

	if (!game || !status) return null;

	item.timeMode = item.timeMode === "manual" ? "manual" : "logs";

	return {
		gameId: game.id,
		entryData: {
			status,
			rating: numberFromBackup(item.rating),
			timePlayed: numberFromBackup(item.timePlayed),
			timeMode: item.timeMode,
			timeFinished: numberFromBackup(item.timeFinished),
			timeMastered: numberFromBackup(item.timeMastered),
			notes: item.notes?.trim() || null,
			favorite: Boolean(item.favorite),
			addedAt: dateFromBackup(item.addedAt),
			startedAt: dateFromBackup(item.startedAt),
			finishedAt: dateFromBackup(item.finishedAt),
			masteredAt: dateFromBackup(item.masteredAt),
		},
		tagNames: Array.from(
			new Set(
				(item.tags ?? [])
					.map((tag) => tag.trim())
					.filter(Boolean)
					.map((tag) => tag.slice(0, 40)),
			),
		),
		logs: (item.logs ?? [])
			.filter((log) => Number.isFinite(log.hours) && log.hours! > 0)
			.map((log) => ({
				gameId: game.id,
				hours: log.hours!,
				note: log.note?.trim() || "Imported from .tg backup.",
				skipRecap: Boolean(log.skipRecap),
				playedAt: dateFromBackup(log.playedAt) ?? new Date(),
				createdAt: dateFromBackup(log.createdAt) ?? new Date(),
			})),
	};
}

async function importBackupEntryChunk(
	tx: Prisma.TransactionClient,
	userId: string,
	itemsChunk: TgLibraryEntry[],
	gamesBySlug: Map<string, { slug: string; id: number }>,
	gamesById: Map<number, { id: number; slug: string }>,
) {
	const resolvedByGameId = new Map<number, NonNullable<ReturnType<typeof resolveBackupEntryItem>>>();
	let skipped = 0;

	for (const item of itemsChunk) {
		const resolved = resolveBackupEntryItem(item, gamesBySlug, gamesById);
		if (!resolved) {
			skipped += 1;
			continue;
		}

		resolvedByGameId.set(resolved.gameId, resolved);
	}

	const resolved = Array.from(resolvedByGameId.values());
	const existing = await tx.userGameEntry.findMany({
		where: {
			userId,
			gameId: { in: resolved.map((entry) => entry.gameId) },
		},
		select: {
			id: true,
			gameId: true,
			addedAt: true,
		},
	});
	const existingByGameId = new Map(existing.map((entry) => [entry.gameId, entry]));

	const toCreate = resolved.filter((entry) => !existingByGameId.has(entry.gameId));
	const created = toCreate.length
		? await tx.userGameEntry.createManyAndReturn({
				data: toCreate.map((entry) => ({
					userId,
					gameId: entry.gameId,
					...entry.entryData,
					addedAt: entry.entryData.addedAt ?? new Date(),
				})),
				select: {
					id: true,
					gameId: true,
				},
			})
		: [];
	const entryIdByGameId = new Map([...existingByGameId, ...created.map((entry) => [entry.gameId, entry] as const)].map(([gameId, entry]) => [gameId, entry.id]));

	const toUpdate = resolved
		.filter((entry) => existingByGameId.has(entry.gameId))
		.map((entry) => ({
			id: entryIdByGameId.get(entry.gameId)!,
			...entry.entryData,
			addedAt: entry.entryData.addedAt ?? existingByGameId.get(entry.gameId)!.addedAt,
		}));

	if (toUpdate.length) {
		await tx.$executeRaw`
			UPDATE "UserGameEntry" AS entry
			SET
				"status" = data."status",
				"rating" = data."rating",
				"timePlayed" = data."timePlayed",
				"timeMode" = data."timeMode",
				"timeFinished" = data."timeFinished",
				"timeMastered" = data."timeMastered",
				"notes" = data."notes",
				"favorite" = data."favorite",
				"addedAt" = data."addedAt",
				"startedAt" = data."startedAt",
				"finishedAt" = data."finishedAt",
				"masteredAt" = data."masteredAt"
			FROM (
				SELECT *
				FROM UNNEST(
					${toUpdate.map((entry) => entry.id)}::text[],
					${toUpdate.map((entry) => entry.status)}::"GameStatus"[],
					${toUpdate.map((entry) => entry.rating)}::float8[],
					${toUpdate.map((entry) => entry.timePlayed)}::float8[],
					${toUpdate.map((entry) => entry.timeMode)}::text[],
					${toUpdate.map((entry) => entry.timeFinished)}::float8[],
					${toUpdate.map((entry) => entry.timeMastered)}::float8[],
					${toUpdate.map((entry) => entry.notes)}::text[],
					${toUpdate.map((entry) => entry.favorite)}::bool[],
					${toUpdate.map((entry) => entry.addedAt)}::timestamp[],
					${toUpdate.map((entry) => entry.startedAt)}::timestamp[],
					${toUpdate.map((entry) => entry.finishedAt)}::timestamp[],
					${toUpdate.map((entry) => entry.masteredAt)}::timestamp[]
				) AS data("id", "status", "rating", "timePlayed", "timeMode", "timeFinished", "timeMastered", "notes", "favorite", "addedAt", "startedAt", "finishedAt", "masteredAt")
			) AS data
			WHERE entry.id = data."id"
		`;

		const updatedEntryIds = toUpdate.map((entry) => entry.id);
		await tx.userGamePlayLog.deleteMany({
			where: {
				userId,
				entryId: { in: updatedEntryIds },
			},
		});
		await tx.userGameEntryTag.deleteMany({
			where: {
				entryId: { in: updatedEntryIds },
			},
		});
	}

	const importedLogs = resolved.flatMap((entry) => entry.logs.map((log) => ({ ...log, entryId: entryIdByGameId.get(entry.gameId)! })));

	if (importedLogs.length) {
		await tx.userGamePlayLog.createMany({
			data: importedLogs.map((log) => ({
				userId,
				...log,
			})),
		});
	}

	const entryTagNames = new Map<string, string[]>();
	for (const entry of resolved) {
		if (entry.tagNames.length === 0) continue;
		entryTagNames.set(entryIdByGameId.get(entry.gameId)!, entry.tagNames);
	}

	return { imported: resolved.length, logCount: importedLogs.length, skipped, entryTagNames };
}

async function importSteamGameChunk(tx: Prisma.TransactionClient, userId: string, games: { id: number; hours: number }[], playedAt: Date, skipImportedLogsRecap: boolean) {
	const existing = await tx.userGameEntry.findMany({
		where: {
			userId,
			gameId: { in: games.map((game) => game.id) },
		},
		select: {
			id: true,
			gameId: true,
			timePlayed: true,
		},
	});
	const existingByGameId = new Map(existing.map((entry) => [entry.gameId, entry]));

	const toCreate = games.filter((game) => !existingByGameId.has(game.id));
	const created = toCreate.length
		? await tx.userGameEntry.createManyAndReturn({
				data: toCreate.map((game) => ({
					userId,
					gameId: game.id,
					timePlayed: game.hours,
				})),
				select: {
					id: true,
					gameId: true,
				},
			})
		: [];
	const createdByGameId = new Map(created.map((entry) => [entry.gameId, entry]));

	const updates = games
		.map((game) => {
			const current = existingByGameId.get(game.id);
			if (!current) return null;

			const hours = Math.round((game.hours - (current.timePlayed ?? 0)) * 10) / 10;
			return { entryId: current.id, gameId: game.id, hours, timePlayed: game.hours };
		})
		.filter((update): update is { entryId: string; gameId: number; hours: number; timePlayed: number } => update !== null);
	const toUpdate = updates.filter((update) => update.hours > 0);

	if (toUpdate.length) {
		await tx.$executeRaw`
			UPDATE "UserGameEntry" AS entry
			SET "timePlayed" = data."timePlayed"
			FROM (
				SELECT * FROM UNNEST(${toUpdate.map((update) => update.entryId)}::text[], ${toUpdate.map((update) => update.timePlayed)}::float8[])
				AS data("entryId", "timePlayed")
			) AS data
			WHERE entry.id = data."entryId"
		`;
	}

	const importedLogs = [
		...toCreate.map((game) => ({ gameId: game.id, entryId: createdByGameId.get(game.id)!.id, hours: game.hours })),
		...toUpdate.map((update) => ({ gameId: update.gameId, entryId: update.entryId, hours: update.hours })),
	].filter((log) => log.hours > 0);

	if (importedLogs.length) {
		await tx.userGamePlayLog.createMany({
			data: importedLogs.map((log) => ({
				userId,
				entryId: log.entryId,
				gameId: log.gameId,
				hours: log.hours,
				note: "Imported from Steam.",
				skipRecap: skipImportedLogsRecap,
				playedAt,
			})),
		});

		await tx.activity.createMany({
			data: importedLogs.map((log) => ({
				userId,
				type: ActivityType.LOGGED_GAME_PLAY,
				targetType: InteractionTargetType.GAME,
				targetId: String(log.gameId),
				gameId: log.gameId,
				message: "Imported from Steam.",
			})),
		});
	}

	return toCreate.length + toUpdate.length;
}

export async function getSteamProfileImportPreview(steamId: string) {
	const id = steamId.trim();

	if (!/^\d{17}$/.test(id)) {
		return inputError("Enter a valid Steam profile ID.");
	}

	let profile;

	try {
		profile = await getSteamProfile(id);
	} catch {
		return inputError("Could not reach Steam. Try again later.");
	}

	if (!profile?.personaname) {
		return inputError("No Steam profile found for that ID.");
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
		return inputError("Enter a valid Steam profile ID.");
	}

	const userId = await getCurrentUserId();
	let ownedGames;

	try {
		ownedGames = await getOwnedGames(id);
	} catch {
		return inputError("Could not reach Steam. Try again later.");
	}

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

	await chunked(slugs, 100, async (slugsChunk) => {
		foundGames.push(
			...(await db.game.findMany({
				where: {
					slug: {
						in: slugsChunk,
					},
				},
				select: {
					id: true,
					slug: true,
				},
			})),
		);
	});

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

	await chunked(matched, 50, async (matchedChunk) => {
		await db.$transaction(async (tx) => {
			imported += await importSteamGameChunk(tx, userId, matchedChunk, playedAt, skipImportedLogsRecap);
		});
	});

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
			logs: {
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
				logs: entry.logs.map((log) => ({
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
		return inputError("Invalid .tg file.");
	}

	if (backup.version !== 1 || !Array.isArray(backup.entries)) {
		return inputError("Unsupported .tg file.");
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
	const entries = backup.entries;
	let imported = 0;
	let logs = 0;
	let skipped = 0;

	await chunked(entries, 50, async (entriesChunk) => {
		await db.$transaction(async (tx) => {
			const result = await importBackupEntryChunk(tx, userId, entriesChunk, gamesBySlug, gamesById);

			imported += result.imported;
			logs += result.logCount;
			skipped += result.skipped;

			await syncEntryTags(tx, userId, result.entryTagNames);
		});
	});

	revalidatePath("/library/[slug]", "page");
	revalidatePath("/u/[user]", "page");
	return { imported, logs, skipped };
}
