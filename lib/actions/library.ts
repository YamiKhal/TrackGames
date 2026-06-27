"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "../auth";
import db from "../db";
import { ActivityType, GameStatus, InteractionTargetType } from "../generated/prisma/enums";
import { ratingToHundred } from "../util/rating";

const DEFAULT_LOG_NOTE = "No note.";

async function getCurrentUserId() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    return session.user.id;
}

function pastDateFromInput(value: string, label: string) {
    if (!value) return null;

    const date = new Date(`${value}T12:00:00`);

    if (Number.isNaN(date.getTime())) {
        throw new Error(`Invalid ${label} date.`);
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (date > today) {
        throw new Error(`${label} date cannot be in the future.`);
    }

    return date;
}

export async function addGameToLibrary(gameId: number, gameSlug: string) {
    const userId = await getCurrentUserId();

    const entry = await db.userGameEntry.upsert({
        where: {
            userId_gameId: {
                userId,
                gameId,
            },
        },
        update: {},
        create: {
            userId,
            gameId,
        },
        select: {
            id: true,
            status: true,
            rating: true,
        },
    });

    revalidatePath(`/game/${gameSlug}`);
    return entry;
}

export async function removeGameFromLibrary(gameId: number, gameSlug: string) {
    const userId = await getCurrentUserId();

    await db.userGameEntry.deleteMany({
        where: {
            userId,
            gameId,
        },
    });

    revalidatePath(`/game/${gameSlug}`);
    return { inLibrary: false };
}

export async function setGameLibraryStatus(gameId: number, gameSlug: string, status: GameStatus) {
    const userId = await getCurrentUserId();

    if (!Object.values(GameStatus).includes(status)) {
        throw new Error("Invalid game status.");
    }

    const current = await db.userGameEntry.findUnique({
        where: {
            userId_gameId: {
                userId,
                gameId,
            },
        },
        select: {
            timePlayed: true,
            timeFinished: true,
            finishedAt: true,
        },
    });

    const entry = await db.userGameEntry.upsert({
        where: {
            userId_gameId: {
                userId,
                gameId,
            },
        },
        update: {
            status,
            timeFinished: status === GameStatus.COMPLETED ? current?.timeFinished ?? current?.timePlayed ?? null : undefined,
            finishedAt: status === GameStatus.COMPLETED ? current?.finishedAt ?? new Date() : undefined,
        },
        create: {
            userId,
            gameId,
            status,
            finishedAt: status === GameStatus.COMPLETED ? new Date() : undefined,
        },
        select: {
            id: true,
            status: true,
            rating: true,
        },
    });

    revalidatePath(`/game/${gameSlug}`);
    return entry;
}

export async function updateGameQuickRating(gameId: number, gameSlug: string, value: number) {
    const userId = await getCurrentUserId();
    const rating = ratingToHundred(value) ?? null;

    const entry = await db.userGameEntry.upsert({
        where: {
            userId_gameId: {
                userId,
                gameId,
            },
        },
        update: {
            rating,
        },
        create: {
            userId,
            gameId,
            rating,
        },
        select: {
            id: true,
            status: true,
            rating: true,
        },
    });

    revalidatePath(`/game/${gameSlug}`);
    return entry;
}

export async function updateUserGameEntry(entryId: string, formData: FormData) {
    const userId = await getCurrentUserId();
    const status = String(formData.get("status"));
    const ratingValue = String(formData.get("rating") ?? "").trim();
    const timePlayedValue = String(formData.get("timeplayed") ?? "").trim();
    const timeFinishedValue = String(formData.get("timefinished") ?? "").trim();
    const timeMasteredValue = String(formData.get("timemastered") ?? "").trim();
    const finishedAtValue = String(formData.get("finishedat") ?? "").trim();
    const masteredAtValue = String(formData.get("masteredat") ?? "").trim();
    const timeMode = String(formData.get("timemode") ?? "manual") === "logs" ? "logs" : "manual";
    const notesValue = String(formData.get("notes") ?? "").trim();
    const finished = formData.get("finished") === "on";
    const mastered = formData.get("mastered") === "on";

    if (!Object.values(GameStatus).includes(status as GameStatus)) {
        throw new Error("Invalid game status.");
    }

    const rating = ratingValue ? ratingToHundred(Number(ratingValue)) ?? null : null;
    const manualTime = timePlayedValue ? Math.max(0, Number(timePlayedValue)) : null;
    const finishedTime = timeFinishedValue ? Math.max(0, Number(timeFinishedValue)) : null;
    const masteredTime = timeMasteredValue ? Math.max(0, Number(timeMasteredValue)) : null;
    const safeFinishedTime = Number.isFinite(finishedTime) ? finishedTime : null;
    const safeMasteredTime = Number.isFinite(masteredTime) ? masteredTime : null;
    const finishedAt = pastDateFromInput(finishedAtValue, "Finished");
    const masteredAt = pastDateFromInput(masteredAtValue, "Mastered");

    const current = await db.userGameEntry.findUnique({
        where: {
            id: entryId,
            userId,
        },
        select: {
            gameId: true,
            timeFinished: true,
            timeMastered: true,
            finishedAt: true,
            masteredAt: true,
            userGamePlayLogs: {
                select: {
                    hours: true,
                },
            },
        },
    });

    if (!current) {
        throw new Error("Library entry not found.");
    }

    const logTime = current.userGamePlayLogs.reduce((total, log) => total + log.hours, 0);
    const timePlayed = timeMode === "logs" ? logTime : manualTime;
    const hasTimePlayed = Number.isFinite(timePlayed) && timePlayed != null && timePlayed > 0;
    const hasFinishedTime = Number.isFinite(finishedTime) && finishedTime != null && finishedTime > 0;
    const hasMasteredTime = Number.isFinite(masteredTime) && masteredTime != null && masteredTime > 0;

    if (mastered && !hasTimePlayed && !hasMasteredTime) {
        throw new Error("Time played or mastered time is required before marking a game as mastered.");
    }

    const entry = await db.userGameEntry.update({
        where: {
            id: entryId,
            userId,
        },
        data: {
            status: status as GameStatus,
            rating: Number.isFinite(rating) ? rating : null,
            timeMode,
            timePlayed: hasTimePlayed ? timePlayed : null,
            timeFinished: finished ? safeFinishedTime ?? current.timeFinished ?? timePlayed : null,
            timeMastered: mastered ? safeMasteredTime ?? current.timeMastered ?? timePlayed : null,
            finishedAt: finished ? finishedAt ?? current.finishedAt ?? new Date() : null,
            masteredAt: mastered ? masteredAt ?? current.masteredAt ?? new Date() : null,
            notes: notesValue || null,
        },
        include: {
            game: true,
            userGamePlayLogs: {
                orderBy: {
                    createdAt: "desc",
                },
            },
        },
    });

    revalidatePath("/library/[slug]", "page");
    return entry;
}

export async function createUserGamePlayLog(entryId: string, formData: FormData) {
    const userId = await getCurrentUserId();
    const playedAtValue = String(formData.get("playedat") ?? "").trim();
    const hours = Math.max(0, Number(String(formData.get("hours") ?? "").trim()));
    const note = String(formData.get("note") ?? "").trim() || DEFAULT_LOG_NOTE;
    const skipRecap = formData.get("skipRecap") === "on";
    const finished = formData.get("finished") === "on";
    const mastered = formData.get("mastered") === "on";

    if (!Number.isFinite(hours) || hours <= 0) {
        throw new Error("Hours played must be greater than zero.");
    }

    const playedAt = playedAtValue ? new Date(`${playedAtValue}T12:00:00`) : new Date();

    if (Number.isNaN(playedAt.getTime())) {
        throw new Error("Invalid played date.");
    }

    const current = await db.userGameEntry.findUnique({
        where: {
            id: entryId,
            userId,
        },
        select: {
            id: true,
            gameId: true,
            timeMode: true,
            timePlayed: true,
            timeFinished: true,
            timeMastered: true,
            finishedAt: true,
            masteredAt: true,
        },
    });

    if (!current) {
        throw new Error("Library entry not found.");
    }

    const entry = await db.$transaction(async (tx) => {
        await tx.userGamePlayLog.create({
            data: {
                userId,
                entryId,
                gameId: current.gameId,
                hours,
                note,
                skipRecap,
                playedAt,
            },
        });

        const loggedTime = await tx.userGamePlayLog.aggregate({
            where: {
                entryId,
            },
            _sum: {
                hours: true,
            },
        });
        const totalTime = loggedTime._sum.hours ?? 0;
        const timePlayed = current.timeMode === "logs" ? totalTime : current.timePlayed;

        const updatedEntry = await tx.userGameEntry.update({
            where: {
                id: entryId,
                userId,
            },
            data: {
                timePlayed,
                status: finished || mastered ? GameStatus.COMPLETED : undefined,
                timeFinished: finished ? current.timeFinished ?? timePlayed ?? hours : undefined,
                timeMastered: mastered ? current.timeMastered ?? timePlayed ?? hours : undefined,
                finishedAt: finished ? current.finishedAt ?? playedAt : undefined,
                masteredAt: mastered ? current.masteredAt ?? playedAt : undefined,
            },
            include: {
                game: true,
                userGamePlayLogs: {
                    orderBy: {
                        createdAt: "desc",
                    },
                },
            },
        });

        await tx.activity.create({
            data: {
                userId,
                type: ActivityType.LOGGED_GAME_PLAY,
                targetType: InteractionTargetType.GAME,
                targetId: String(current.gameId),
                gameId: current.gameId,
                message: note,
            },
        });

        return updatedEntry;
    });

    revalidatePath("/library/[slug]", "page");
    revalidatePath("/u/[user]", "page");
    return entry;
}

export async function updateUserGamePlayLog(logId: string, formData: FormData) {
    const userId = await getCurrentUserId();
    const playedAtValue = String(formData.get("playedat") ?? "").trim();
    const hours = Math.max(0, Number(String(formData.get("hours") ?? "").trim()));
    const note = String(formData.get("note") ?? "").trim() || DEFAULT_LOG_NOTE;
    const skipRecap = formData.get("skipRecap") === "on";

    if (!Number.isFinite(hours) || hours <= 0) {
        throw new Error("Hours played must be greater than zero.");
    }

    const playedAt = playedAtValue ? new Date(`${playedAtValue}T12:00:00`) : new Date();

    if (Number.isNaN(playedAt.getTime())) {
        throw new Error("Invalid played date.");
    }

    const entry = await db.$transaction(async (tx) => {
        const log = await tx.userGamePlayLog.update({
            where: {
                id: logId,
                userId,
            },
            data: {
                playedAt,
                hours,
                note,
                skipRecap,
            },
            select: {
                entryId: true,
            },
        });

        const current = await tx.userGameEntry.findUnique({
            where: {
                id: log.entryId,
                userId,
            },
            select: {
                timeMode: true,
            },
        });

        if (!current) {
            throw new Error("Library entry not found.");
        }

        const loggedTime = await tx.userGamePlayLog.aggregate({
            where: {
                entryId: log.entryId,
            },
            _sum: {
                hours: true,
            },
        });

        return tx.userGameEntry.update({
            where: {
                id: log.entryId,
                userId,
            },
            data: {
                timePlayed: current.timeMode === "logs" ? loggedTime._sum.hours ?? null : undefined,
            },
            include: {
                game: true,
                userGamePlayLogs: {
                    orderBy: {
                        createdAt: "desc",
                    },
                },
            },
        });
    });

    revalidatePath("/library/[slug]", "page");
    revalidatePath("/u/[user]", "page");
    return entry;
}

export async function deleteUserGamePlayLog(logId: string) {
    const userId = await getCurrentUserId();
    const entry = await db.$transaction(async (tx) => {
        const log = await tx.userGamePlayLog.delete({
            where: {
                id: logId,
                userId,
            },
            select: {
                entryId: true,
            },
        });

        const current = await tx.userGameEntry.findUnique({
            where: {
                id: log.entryId,
                userId,
            },
            select: {
                timeMode: true,
            },
        });

        if (!current) {
            throw new Error("Library entry not found.");
        }

        const loggedTime = await tx.userGamePlayLog.aggregate({
            where: {
                entryId: log.entryId,
            },
            _sum: {
                hours: true,
            },
        });

        return tx.userGameEntry.update({
            where: {
                id: log.entryId,
                userId,
            },
            data: {
                timePlayed: current.timeMode === "logs" ? loggedTime._sum.hours ?? null : undefined,
            },
            include: {
                game: true,
                userGamePlayLogs: {
                    orderBy: {
                        createdAt: "desc",
                    },
                },
            },
        });
    });

    revalidatePath("/library/[slug]", "page");
    revalidatePath("/u/[user]", "page");
    return entry;
}
