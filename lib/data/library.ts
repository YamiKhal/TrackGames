import db from "../db";
import { UserGameEntry } from "../types";

export async function getUserGameEntries(userId: string): Promise<UserGameEntry[]> {
    return await db.userGameEntry.findMany({
        where: {
            userId,
        },
        include: {
            game: true,
        },
        orderBy: {
            addedAt: "desc",
        },
    }) as unknown[] as UserGameEntry[]
}

export async function getUserGameEntry(userId: string, gameId: number) {
    return await db.userGameEntry.findUnique({
        where: {
            userId_gameId: {
                userId,
                gameId,
            },
        },
        select: {
            id: true,
        },
    });
}
