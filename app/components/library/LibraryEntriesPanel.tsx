"use client";

import { GameStatus } from "@/lib/generated/prisma/enums";
import { UserGameEntry } from "@/lib/types";
import { Grid2X2, List } from "lucide-react";
import { useState } from "react";
import PaginatedList from "../layout/PaginatedList";
import { Select } from "../ui/Inputs";
import PlaylistCard from "./PlaylistCard";

function statusLabel(status: string) {
    return status.toLowerCase().replace("_", " ");
}

export default function LibraryEntriesPanel({ entries, canEdit }: { entries: UserGameEntry[]; canEdit: boolean }) {
    const [items, setItems] = useState(entries);
    const [mode, setMode] = useState<"grid" | "list">("grid");
    const [status, setStatus] = useState("all");
    const [sort, setSort] = useState("added");
    const filtered = items.filter((entry) => {
        if (status !== "all" && entry.status !== status) return false;
        return true;
    }).sort((a, b) => {
        if (sort === "rating") return (b.rating ?? -1) - (a.rating ?? -1);
        if (sort === "time") return (b.timePlayed ?? -1) - (a.timePlayed ?? -1);
        if (sort === "name") return (a.game.name ?? "").localeCompare(b.game.name ?? "");
        if (sort === "release") return Number(b.game.releaseDate ?? 0) - Number(a.game.releaseDate ?? 0);
        if (sort === "notes") return (b.notes ?? "").localeCompare(a.notes ?? "")
        return Number(b.addedAt ?? 0) - Number(a.addedAt ?? 0);
    });

    function updateEntry(updated: UserGameEntry) {
        setItems((current) => current.map((entry) => entry.id === updated.id ? updated : entry));
    }

    return (
        <div className="flex w-full flex-col gap-5">
            <div className="flex flex-col gap-3 mb-2 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-row flex-wrap gap-3">
                    <Select className="border-t-0 border-l-0 border-r-0 rounded-none" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">
                        <option value="all">All statuses</option>
                        {Object.values(GameStatus).map((value) => (
                            <option key={value} value={value}>{statusLabel(value)}</option>
                        ))}
                    </Select>
                    <Select className="border-t-0 border-l-0 border-r-0 rounded-none" value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort library">
                        <option value="added">Recently added</option>
                        <option value="rating">Rating</option>
                        <option value="time">Time played</option>
                        <option value="name">Name</option>
                        <option value="release">Release date</option>
                        <option value="notes">Has notes</option>
                    </Select>
                </div>
                <div className="flex flex-row gap-2">
                    <button type="button" onClick={() => setMode("grid")} className={`grid size-9 cursor-pointer place-items-center rounded border ${mode === "grid" ? "border-primary text-primary" : "border-border text-text-muted"}`} aria-label="Grid view">
                        <Grid2X2 size={18} aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => setMode("list")} className={`grid size-9 cursor-pointer place-items-center rounded border ${mode === "list" ? "border-primary text-primary" : "border-border text-text-muted"}`} aria-label="List view">
                        <List size={18} aria-hidden="true" />
                    </button>
                </div>
            </div>
            {filtered.length ? (
                <PaginatedList
                    pageSize={mode === "grid" ? 32 : 12}
                    className={mode === "grid" ? "w-full grid gap-4 grid-cols-[repeat(auto-fill,8rem)]" : "flex w-full flex-col gap-3"}
                >
                    {filtered.map((entry) => (
                        <PlaylistCard key={entry.id} entry={entry} mode={mode} canEdit={canEdit} onUpdate={updateEntry} />
                    ))}
                </PaginatedList>
            ) : (
                <p className="text-text-muted">No games found.</p>
            )}
        </div>
    );
}
