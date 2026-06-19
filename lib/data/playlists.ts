import db from "../db";
import { GameListType } from "../generated/prisma/enums";
import type { GameListDefaultArgs, GameListGetPayload } from "../generated/prisma/models/GameList";

const playlistArgs = {
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
            orderBy: [
                { position: "asc" },
                { addedAt: "asc" },
            ],
        },
    },
} satisfies GameListDefaultArgs;

export type Playlist = GameListGetPayload<typeof playlistArgs>;
export type PlaylistEntry = Playlist["entries"][number];

type PlaylistAccess = {
    id: string;
    userId: string;
    privacy: string;
};

export async function getUserPlaylists(userId: string) {
    return await db.gameList.findMany({
        where: {
            userId,
            type: GameListType.PLAYLIST,
        },
        ...playlistArgs,
        orderBy: {
            updatedAt: "desc",
        },
    });
}

export async function getPlaylistAccess(id: string): Promise<PlaylistAccess | null> {
    return await db.gameList.findFirst({
        where: {
            id,
            type: GameListType.PLAYLIST,
        },
        select: {
            id: true,
            userId: true,
            privacy: true,
        },
    });
}

export async function getPlaylist(id: string) {
    return await db.gameList.findFirst({
        where: {
            id,
            type: GameListType.PLAYLIST,
        },
        ...playlistArgs,
    });
}

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
