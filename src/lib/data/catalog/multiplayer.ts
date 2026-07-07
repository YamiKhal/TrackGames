import { cache } from "react";
import db from "@/lib/db";
import { fetchAPI } from "@/lib/external/igdb/igdb-api";
import type { RawMultiplayerMode } from "@/lib/external/igdb/types";
import { formatRawMultiplayerMode } from "@/lib/external/igdb/util";
import type { MultiplayerModeModel } from "@/lib/generated/prisma/models/MultiplayerMode";
import { logger } from "@/lib/logger";

export type MultiplayerMode = Pick<
	MultiplayerModeModel,
	"campaignCoop" | "dropIn" | "lanCoop" | "offlineCoop" | "offlineCoopMax" | "offlineMax" | "onlineCoop" | "onlineCoopMax" | "onlineMax" | "splitscreen"
>;

const select = {
	campaignCoop: true,
	dropIn: true,
	lanCoop: true,
	offlineCoop: true,
	offlineCoopMax: true,
	offlineMax: true,
	onlineCoop: true,
	onlineCoopMax: true,
	onlineMax: true,
	splitscreen: true,
};

/**
 * Fetches every multiplayer mode row for a game and folds them into a flat, deduped list of
 * feature tags (a game can have one row per platform). Falls back to IGDB (upserting) when the
 * local DB has no rows for the game.
 */
export const getMultiplayerFeatures = cache(async (gameId: number): Promise<string[]> => {
	let modes = (await db.multiplayerMode.findMany({ where: { game: gameId }, select })) as MultiplayerMode[];

	if (!modes.length) {
		const raw = await fetchAPI<RawMultiplayerMode[]>(
			"multiplayer_modes",
			`fields campaigncoop, dropin, lancoop, offlinecoop, offlinecoopmax, offlinemax, onlinecoop, onlinecoopmax, onlinemax, splitscreen, game, platform; where game = ${gameId} & platform != null; limit 50;`,
		);

		const saved = await Promise.all(
			raw.map((mode) => {
				// A malformed row (e.g. missing platform) must not take down the whole page, so skip it.
				let data;
				try {
					data = formatRawMultiplayerMode(mode);
				} catch (error) {
					logger.warn("multiplayer", "Skipping malformed multiplayer mode", { error, mode });
					return null;
				}
				return db.multiplayerMode.upsert({ where: { id: data.id }, update: data, create: data, select });
			}),
		);
		modes = saved.filter((mode): mode is MultiplayerMode => mode !== null);
	}

	const onlineMax = Math.max(0, ...modes.map((mode) => mode.onlineMax));
	const offlineMax = Math.max(0, ...modes.map((mode) => mode.offlineMax));
	const tags = [
		modes.some((mode) => mode.onlineCoop) && "Online co-op",
		modes.some((mode) => mode.offlineCoop) && "Offline co-op",
		modes.some((mode) => mode.lanCoop) && "LAN co-op",
		modes.some((mode) => mode.campaignCoop) && "Campaign co-op",
		modes.some((mode) => mode.dropIn) && "Drop-in / drop-out",
		modes.some((mode) => mode.splitscreen) && "Split screen",
		onlineMax > 1 && `Up to ${onlineMax} online`,
		offlineMax > 1 && `Up to ${offlineMax} offline`,
	].filter((tag): tag is string => Boolean(tag));

	return tags;
});
