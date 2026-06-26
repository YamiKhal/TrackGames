"use client";

import { GameStatus } from "@/lib/generated/prisma/enums";
import type { UserLibraryEntry } from "@/lib/data/library";
import { Grid2X2, List } from "lucide-react";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import PaginatedList from "../layout/PaginatedList";
import { FilterBar } from "../ui/FilterBar";
import PlaylistCard from "./PlaylistCard";

function statusLabel(status: string) {
    return status.toLowerCase().replace("_", " ");
}

export default function LibraryEntriesPanel({ entries, canEdit, themeStyle, defaults }: { entries: UserLibraryEntry[]; canEdit: boolean; themeStyle?: CSSProperties; defaults?: { status: string; sort: string; mode: "grid" | "list" } }) {
    const [items, setItems] = useState(entries);
    const [mode, setMode] = useState<"grid" | "list">(defaults?.mode ?? "grid");
    const [status, setStatus] = useState(defaults?.status ?? "all");
    const [sort, setSort] = useState(defaults?.sort ?? "added");
    const [query, setQuery] = useState("");
    const filtered = useMemo(() => {
        const search = query.trim().toLowerCase();

        return items.filter((entry) => {
            if (status !== "all" && entry.status !== status) return false;
            if (search && !(entry.game.name ?? "").toLowerCase().includes(search)) return false;
            return true;
        }).sort((a, b) => {
            if (sort === "rating") return (b.rating ?? -1) - (a.rating ?? -1);
            if (sort === "time") return (b.timePlayed ?? -1) - (a.timePlayed ?? -1);
            if (sort === "name") return (a.game.name ?? "").localeCompare(b.game.name ?? "");
            if (sort === "release") return Number(b.game.releaseDate ?? 0) - Number(a.game.releaseDate ?? 0);
            if (sort === "notes") return (b.notes ?? "").localeCompare(a.notes ?? "")
            return Number(b.addedAt ?? 0) - Number(a.addedAt ?? 0);
        });
    }, [items, query, sort, status]);

    function updateEntry(updated: UserLibraryEntry) {
        setItems((current) => current.map((entry) => entry.id === updated.id ? updated : entry));
    }

    function removeEntry(entryId: string) {
        setItems((current) => current.filter((entry) => entry.id !== entryId));
    }

    return (
        <div className="flex w-full flex-col gap-5">
            <div className="mb-2">
                <FilterBar
                    filters={[
                        { type: "search", value: query, onChange: setQuery, placeholder: "Search library" },
                        {
                            type: "select",
                            label: "Filter by status",
                            value: status,
                            onChange: setStatus,
                            options: [
                                { value: "all", label: "All statuses" },
                                ...Object.values(GameStatus).map((value) => ({ value, label: statusLabel(value) })),
                            ],
                        },
                        {
                            type: "select",
                            label: "Sort library",
                            value: sort,
                            onChange: setSort,
                            options: [
                                { value: "added", label: "Recently added" },
                                { value: "rating", label: "Rating" },
                                { value: "time", label: "Time played" },
                                { value: "name", label: "Name" },
                                { value: "release", label: "Release date" },
                                { value: "notes", label: "Has notes" },
                            ],
                        },
                    ]}
                    actions={<div className="flex flex-row justify-end gap-2">
                        <button type="button" onClick={() => setMode("grid")} className={`grid size-9 cursor-pointer place-items-center rounded border ${mode === "grid" ? "border-primary text-primary" : "border-border text-text-muted"}`} aria-label="Grid view">
                            <Grid2X2 size={18} aria-hidden="true" />
                        </button>
                        <button type="button" onClick={() => setMode("list")} className={`grid size-9 cursor-pointer place-items-center rounded border ${mode === "list" ? "border-primary text-primary" : "border-border text-text-muted"}`} aria-label="List view">
                            <List size={18} aria-hidden="true" />
                        </button>
                    </div>}
                />
            </div>
            {filtered.length ? (
                <PaginatedList
                    pageSize={mode === "grid" ? 32 : 12}
                    className={mode === "grid" ? "w-full grid gap-2 grid-cols-[repeat(auto-fill,5rem)] justify-center items-center md:gap-4 md:grid-cols-[repeat(auto-fill,8rem)]" : "flex w-full flex-col gap-3"}
                >
                    {filtered.map((entry) => (
                        <PlaylistCard key={entry.id} entry={entry} mode={mode} canEdit={canEdit} onUpdate={updateEntry} onRemove={removeEntry} themeStyle={themeStyle} />
                    ))}
                </PaginatedList>
            ) : (
                <p className="text-text-muted">No games found.</p>
            )}
        </div>
    );
}
