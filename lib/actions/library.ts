"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "../auth";
import db from "../db";
import { GameStatus } from "../generated/prisma/enums";
import { ratingToHundred } from "../util/rating";

async function getCurrentUserId() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    return session.user.id;
}

export async function addGameToLibrary(gameId: number, gameSlug: string) {
    const userId = await getCurrentUserId();

    await db.userGameEntry.upsert({
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
    });

    revalidatePath(`/game/${gameSlug}`);
    return { inLibrary: true };
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

export async function updateUserGameEntry(entryId: string, formData: FormData) {
    const userId = await getCurrentUserId();
    const status = String(formData.get("status"));
    const ratingValue = String(formData.get("rating") ?? "").trim();
    const timePlayedValue = String(formData.get("timeplayed") ?? "").trim();
    const notesValue = String(formData.get("notes") ?? "").trim();
    const finished = formData.get("finished") === "on";
    const mastered = formData.get("mastered") === "on";

    if (!Object.values(GameStatus).includes(status as GameStatus)) {
        throw new Error("Invalid game status.");
    }

    const rating = ratingValue ? ratingToHundred(Number(ratingValue)) ?? null : null;
    const timePlayed = timePlayedValue ? Math.max(0, Number(timePlayedValue)) : null;
    const hasTimePlayed = Number.isFinite(timePlayed);

    if ((finished || mastered) && !hasTimePlayed) {
        throw new Error("Time played is required before marking a game as finished or mastered.");
    }

    const current = await db.userGameEntry.findUnique({
        where: {
            id: entryId,
            userId,
        },
        select: {
            timeFinished: true,
            timeMastered: true,
            finishedAt: true,
            masteredAt: true,
        },
    });

    if (!current) {
        throw new Error("Library entry not found.");
    }

    const entry = await db.userGameEntry.update({
        where: {
            id: entryId,
            userId,
        },
        data: {
            status: status as GameStatus,
            rating: Number.isFinite(rating) ? rating : null,
            timePlayed: hasTimePlayed ? timePlayed : null,
            timeFinished: finished ? current.timeFinished ?? (hasTimePlayed ? timePlayed : null) : null,
            timeMastered: mastered ? current.timeMastered ?? (hasTimePlayed ? timePlayed : null) : null,
            finishedAt: finished ? current.finishedAt ?? (hasTimePlayed ? new Date() : null) : null,
            masteredAt: mastered ? current.masteredAt ?? (hasTimePlayed ? new Date() : null) : null,
            notes: notesValue || null,
        },
        include: {
            game: true,
        },
    });

    revalidatePath("/library/[slug]", "page");
    return entry;
}
