import { cache } from "react";
import { getViewerEntriesForGames, type ViewerGameEntry } from "@/lib/data/gamelist/library";
import db from "@/lib/db";
import { GameListType } from "@/lib/generated/prisma/enums";
import type { GameListDefaultArgs, GameListGetPayload } from "@/lib/generated/prisma/models/GameList";

export type PlaylistUserEntry = ViewerGameEntry;

export type PlaylistEntry = PlaylistDisplayData["entries"][number] & {
	userEntry?: PlaylistUserEntry | null;
};

export type PlaylistData = Omit<PlaylistDisplayData, "entries"> & {
	entries: PlaylistEntry[];
};

export type PlaylistDisplayData = GameListGetPayload<typeof playlistInclude>;

const playlistInclude = {
	include: {
		user: {
			select: {
				id: true,
				name: true,
				image: true,
			},
		},
		entries: {
			include: {
				game: true,
			},
			orderBy: [{ position: "asc" }, { addedAt: "asc" }],
		},
	},
} satisfies GameListDefaultArgs;

export async function getUserPlaylists(userId: string, privacy: "public" | "followers" | "private" | "all" = "all") {
	const followerFilter = privacy === "followers" ? { in: ["public", "followers"] } : privacy;
	const allFilter = privacy === "all" ? { in: ["public", "followers", "private"] } : followerFilter;

	return await db.gameList.findMany({
		where: {
			userId,
			type: GameListType.PLAYLIST,
			privacy: allFilter,
		},
		...playlistInclude,
		orderBy: {
			updatedAt: "desc",
		},
	});
}

export async function getTopLikedPlaylists() {
	const playlists = await db.gameList.findMany({
		...playlistInclude,
		take: 10,
		where: {
			type: GameListType.PLAYLIST,
			privacy: "public",
		},
		orderBy: {
			likes: {
				_count: "desc",
			},
		},
	});

	return playlists as PlaylistDisplayData[];
}

export const getPlaylist = cache(async (id: string, viewerId?: string): Promise<PlaylistData | null> => {
	const playlist = await db.gameList.findFirst({
		where: {
			id,
			type: GameListType.PLAYLIST,
		},
		...playlistInclude,
	});

	if (!playlist || !viewerId || !playlist.entries.length) return playlist;

	const entriesByGame = await getViewerEntriesForGames(
		viewerId,
		playlist.entries.map((entry) => entry.gameId),
	);

	return {
		...playlist,
		entries: playlist.entries.map((entry) => ({
			...entry,
			userEntry: entriesByGame.get(entry.gameId) ?? null,
		})),
	};
});

export async function getPlaylistLibraryCount(userId: string | undefined, gameIds: number[]) {
	if (!userId || !gameIds.length) return 0;

	return await db.userGameEntry.count({
		where: {
			userId,
			gameId: {
				in: gameIds,
			},
		},
	});
}
