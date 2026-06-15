"use client";

import { updateUserGameEntry } from "@/lib/actions/library";
import { GameStatus } from "@/lib/generated/prisma/enums";
import { ImageIdToURL } from "@/lib/external/igdb/util";
import { UserGameEntry } from "@/lib/types";
import { ratingToFive } from "@/lib/util/rating";
import { Edit3, NotebookText, Star, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { GhostButton, PrimaryButton } from "../ui/Buttons";
import { Input, Select, Textarea } from "../ui/Inputs";

function statusLabel(status: string) {
    return status.toLowerCase().replace("_", " ");
}

function statusColor(status: GameStatus) {
    if (status === GameStatus.PLAYING) return "bg-primary";
    if (status === GameStatus.COMPLETED) return "bg-success";
    if (status === GameStatus.DROPPED) return "bg-error";
    if (status === GameStatus.PAUSED) return "bg-warning";
    if (status === GameStatus.WISHLIST) return "bg-secondary";
    return "bg-text-faint";
}

function RatingStars({ rating }: { rating?: number }) {
    const value = rating ?? 0;

    return (
        <div className="flex flex-row gap-0.5" aria-label={rating != null ? `Rating ${rating} out of 5` : "No rating"}>
            {Array.from({ length: 5 }, (_, index) => {
                const fill = Math.min(1, Math.max(0, value - index)) * 100;

                return (
                    <span key={index} className="relative size-3 text-text-faint">
                        <Star size={12} aria-hidden="true" />
                        <span className="absolute inset-0 overflow-hidden text-primary" style={{ width: `${fill}%` }}>
                            <Star size={12} className="fill-primary" aria-hidden="true" />
                        </span>
                    </span>
                );
            })}
        </div>
    );
}

export default function PlaylistCard({ entry, mode, canEdit, onUpdate }: { entry: UserGameEntry; mode: "grid" | "list"; canEdit: boolean; onUpdate: (entry: UserGameEntry) => void }) {
    const [editing, setEditing] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [error, setError] = useState("");
    const [pending, startTransition] = useTransition();
    const game = entry.game;
    const src = ImageIdToURL(game.cover);
    const hasNotes = Boolean(entry.notes?.trim());

    function save(formData: FormData) {
        const timePlayed = String(formData.get("timeplayed") ?? "").trim();
        const finished = formData.get("finished") === "on";
        const mastered = formData.get("mastered") === "on";

        if ((finished || mastered) && !timePlayed) {
            setError("Add time played before marking a game as finished or mastered.");
            return;
        }

        setError("");
        startTransition(async () => {
            const updated = await updateUserGameEntry(entry.id, formData);
            onUpdate(updated as unknown as UserGameEntry);
            setEditing(false);
        });
    }

    return (
        <>
            {mode === "grid" ? (
                <div className="group relative min-w-0 overflow-hidden rounded border border-border bg-bg-secondary">
                    <span className={`absolute select-none left-2 top-2 z-10 rounded px-2 py-1 text-[0.65rem] font-bold uppercase text-text opacity-0 group-hover:opacity-100 ${statusColor(entry.status)}/50`}>
                        {statusLabel(entry.status)}
                    </span>
                    <Link href={`/game/${game.slug}`} className="block">
                        <div className="relative aspect-5/7 bg-bg">
                            {src && <Image src={src} alt={game.name ?? "game cover"} fill sizes="160px" className="object-cover" />}
                            <div className="absolute inset-0 flex flex-col justify-end bg-bg/85 p-3 opacity-0 transition-opacity group-hover:opacity-100">
                                {hasNotes && (
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.preventDefault();
                                            setShowNotes(true);
                                        }}
                                        className="grid size-8 cursor-pointer rounded text-text-muted transition hover:text-primary"
                                        aria-label="View notes"
                                    >
                                        <NotebookText size={16} aria-hidden="true" />
                                    </button>
                                )}
                                <p className="truncate text-sm font-bold text-text">{game.name}</p>
                                <div className="mt-2 flex flex-col gap-2 text-xs text-text-muted">
                                    <RatingStars rating={ratingToFive(entry.rating)} />
                                    <span>{entry.timePlayed != null ? `${entry.timePlayed}h` : ""}</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                    {canEdit && (
                        <button
                            type="button"
                            onClick={() => setEditing(true)}
                            className="absolute right-2 top-2 grid size-8 cursor-pointer place-items-center rounded bg-bg-secondary/90 text-text-muted opacity-0 transition hover:text-primary group-hover:opacity-100"
                            aria-label="Edit library entry"
                        >
                            <Edit3 size={16} aria-hidden="true" />
                        </button>
                    )}
                </div>
            ) : (
                <div className="flex min-w-0 flex-row items-center gap-4 not-last:border-b border-border p-2">
                    <Link href={`/game/${game.slug}`} className="relative h-20 w-14 shrink-0 overflow-hidden rounded bg-bg">
                        {src && <Image src={src} alt={game.name ?? "game cover"} fill sizes="56px" className="object-cover" />}
                    </Link>
                    <div className="min-w-0 flex-1">
                        <div className="grid min-w-0 grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 text-xs text-text-muted">
                            <p className="truncate text-sm font-bold text-text">{game.name}</p>
                            <span className="flex items-center justify-end gap-2 capitalize">
                                <span className={`size-2 rounded-full ${statusColor(entry.status)}`} aria-hidden="true" />
                                {statusLabel(entry.status)}
                            </span>
                            <span className="flex min-w-18 justify-end">
                                <RatingStars rating={ratingToFive(entry.rating ?? 0)} />
                            </span>
                            <span className="grid size-8 place-items-center justify-self-end">
                                {hasNotes && (
                                <button
                                    type="button"
                                    onClick={() => setShowNotes(true)}
                                    className="grid size-8 cursor-pointer place-items-center rounded text-text-muted transition hover:text-primary"
                                    aria-label="View notes"
                                >
                                    <NotebookText size={16} aria-hidden="true" />
                                </button>
                                )}
                            </span>
                            <span className="min-w-16 text-right">{entry.timePlayed != null ? `${entry.timePlayed}h` : "No time"}</span>
                        </div>
                    </div>
                    {canEdit && (
                        <GhostButton type="button" onClick={() => setEditing(true)} className="px-3 py-2">
                            <Edit3 size={16} aria-hidden="true" />
                        </GhostButton>
                    )}
                </div>
            )}

            {showNotes && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay px-4">
                    <div className="w-full max-w-md rounded bg-bg-secondary p-5 shadow-main">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <h3 className="truncate text-lg font-bold">Notes for: {game.name}</h3>
                            <button type="button" onClick={() => setShowNotes(false)} className="cursor-pointer rounded p-1 text-text-muted hover:text-primary" aria-label="Close notes">
                                <X size={18} aria-hidden="true" />
                            </button>
                        </div>
                        <p className="whitespace-pre-wrap text-sm text-text-muted">{entry.notes}</p>
                    </div>
                </div>
            )}

            {editing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay px-4">
                    <div className="w-full max-w-lg rounded bg-bg-secondary p-5 flex flex-row gap-4">
                        <div className="relative h-40 w-28 shrink-0 overflow-hidden rounded bg-bg">
                            {src && <Image src={src} alt={game.name ?? "game cover"} fill sizes="100wv" className="object-cover" />}
                        </div>
                        <div>
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <h3 className="truncate text-lg font-bold">{game.name}</h3>
                                <button type="button" onClick={() => setEditing(false)} className="cursor-pointer rounded p-1 text-text-muted hover:text-primary" aria-label="Close">
                                    <X size={18} aria-hidden="true" />
                                </button>
                            </div>
                            <form action={save} className="flex flex-col gap-3">
                                {error && (
                                    <p className="rounded border border-error/50 bg-error/15 p-2 text-sm text-error">
                                        {error}
                                    </p>
                                )}
                                <label className="text-sm font-bold text-text-muted">
                                    Status
                                    <Select name="status" defaultValue={entry.status} className="w-full">
                                        {Object.values(GameStatus).map((status) => (
                                            <option key={status} value={status} className="capitalize">{statusLabel(status)}</option>
                                        ))}
                                    </Select>
                                </label>
                                <div className="flex flex-row gap-2 justify-between">
                                    <label className="text-sm font-bold text-text-muted">
                                        Rating
                                        <Input name="rating" type="number" min={0} max={5} step={0.5} defaultValue={ratingToFive(entry.rating) ?? ""} />
                                    </label>
                                    <label className="text-sm font-bold text-text-muted">
                                        Time played
                                        <Input name="timeplayed" type="number" min={0} step={0.1} defaultValue={entry.timePlayed ?? ""} />
                                    </label>
                                </div>
                                <label className="text-sm font-bold text-text-muted">
                                    Notes
                                    <Textarea name="notes" rows={1} defaultValue={entry.notes ?? ""} />
                                </label>
                                <div className="grid grid-cols-2 gap-2 text-sm font-bold text-text-muted">
                                    <label className="flex cursor-pointer items-center gap-2 rounded border border-border p-2">
                                        <input name="finished" type="checkbox" defaultChecked={entry.timeFinished != null} className="size-4 accent-primary" />
                                        Finished
                                    </label>
                                    <label className="flex cursor-pointer items-center gap-2 rounded border border-border p-2">
                                        <input name="mastered" type="checkbox" defaultChecked={entry.timeMastered != null} className="size-4 accent-primary" />
                                        Mastered
                                    </label>
                                </div>
                                <div className="mt-2 flex justify-end gap-2">
                                    <GhostButton type="button" onClick={() => setEditing(false)}>Cancel</GhostButton>
                                    <PrimaryButton type="submit" disabled={pending}>{pending ? "Saving..." : "Save"}</PrimaryButton>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
