"use client";

import { createUserGamePlayLog, deleteUserGamePlayLog, removeGameFromLibrary, updateUserGameEntry, updateUserGamePlayLog } from "@/lib/actions/library";
import { GameStatus } from "@/lib/generated/prisma/enums";
import { ImageIdToURL } from "@/lib/external/igdb/util";
import type { UserLibraryEntryWithTags } from "@/lib/data/library";
import { ratingToFive } from "@/lib/util/rating";
import { Check, CircleHelp, Clock, Crown, Edit3, NotebookText, Plus, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { useState, useTransition } from "react";
import StarRating from "../game/StarRating";
import SubTabs from "../layout/SubTabs";
import { GhostButton, PrimaryButton } from "../ui/Buttons";
import ConfirmAction from "../ui/ConfirmAction";
import { Checkbox, Input, Select, SuffixedInput, Textarea } from "../ui/Inputs";
import MenuPanel from "../ui/MenuPanel";

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

export default function PlaylistCard({ entry, mode, canEdit, onUpdate, onRemove, themeStyle }: { entry: UserLibraryEntryWithTags; mode: "grid" | "list"; canEdit: boolean; onUpdate: (entry: UserLibraryEntryWithTags) => void; onRemove: (entryId: string) => void; themeStyle?: CSSProperties }) {
    const [editing, setEditing] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [confirmingRemove, setConfirmingRemove] = useState(false);
    const [activeTab, setActiveTab] = useState<"entry" | "log" | "history" | "time">("entry");
    const [selectedLogId, setSelectedLogId] = useState("");
    const [logDate, setLogDate] = useState("");
    const [timeMode, setTimeMode] = useState(timeModeLabel(entry.timeMode));
    const [entryStatus, setEntryStatus] = useState(entry.status);
    const [entryFinished, setEntryFinished] = useState(Boolean(entry.finishedAt || entry.timeFinished != null));
    const [tags, setTags] = useState(entry.tags.map((tag) => tag.name));
    const [addingTag, setAddingTag] = useState(false);
    const [tagInput, setTagInput] = useState("");
    const [rating, setRating] = useState(ratingToFive(entry.rating) ?? 0);
    const [error, setError] = useState("");
    const [pending, startTransition] = useTransition();
    const game = entry.game;
    const src = ImageIdToURL(game.cover ?? undefined);
    const hasNotes = Boolean(entry.notes?.trim());
    const logs = [...(entry.userGamePlayLogs ?? [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const filteredLogs = logDate ? logs.filter((log) => new Date(log.playedAt).toISOString().slice(0, 10) === logDate) : logs;
    const selectedLog = logs.find((log) => log.id === selectedLogId);
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const finishedAtValue = entry.finishedAt ? new Date(entry.finishedAt).toISOString().slice(0, 10) : "";
    const masteredAtValue = entry.masteredAt ? new Date(entry.masteredAt).toISOString().slice(0, 10) : "";

    function save(formData: FormData) {
        const timePlayed = String(formData.get("timeplayed") ?? "").trim();
        const timeMastered = String(formData.get("timemastered") ?? "").trim();
        const timeMode = String(formData.get("timemode") ?? "manual");
        const mastered = formData.get("mastered") === "on";

        if (mastered && !timeMastered && timeMode === "manual" && !timePlayed) {
            setError("Add time played or mastered time before marking a game as mastered.");
            return;
        }

        setError("");
        startTransition(async () => {
            const updated = await updateUserGameEntry(entry.id, formData);
            onUpdate(updated);
            setEditing(false);
        });
    }

    function saveLog(formData: FormData) {
        setError("");
        startTransition(async () => {
            const updated = await createUserGamePlayLog(entry.id, formData);
            onUpdate(updated);
            setEditing(false);
        });
    }

    function saveHistoryLog(formData: FormData) {
        if (!selectedLogId) return;

        setError("");
        startTransition(async () => {
            const updated = await updateUserGamePlayLog(selectedLogId, formData);
            onUpdate(updated);
            setSelectedLogId("");
        });
    }

    function deleteHistoryLog(logId: string) {
        setError("");
        startTransition(async () => {
            const updated = await deleteUserGamePlayLog(logId);
            onUpdate(updated);
            setSelectedLogId("");
        });
    }

    function removeEntry() {
        if (!game.slug) return;

        setError("");
        startTransition(async () => {
            await removeGameFromLibrary(entry.gameId, game.slug!);
            setConfirmingRemove(false);
            setEditing(false);
            onRemove(entry.id);
        });
    }

    function timeModeLabel(mode: string | undefined) {
        return mode === "manual" ? "manual" : "logs";
    }

    function addTag() {
        const name = tagInput.trim().slice(0, 40);
        if (name && !tags.some((tag) => tag.toLowerCase() === name.toLowerCase())) {
            setTags((current) => [...current, name]);
        }
        setTagInput("");
        setAddingTag(false);
    }

    function openEditor() {
        setShowInfo(false);
        setActiveTab("entry");
        setSelectedLogId("");
        setLogDate("");
        setTimeMode(timeModeLabel(entry.timeMode));
        setEntryStatus(entry.status);
        setEntryFinished(Boolean(entry.finishedAt || entry.timeFinished != null));
        setTags(entry.tags.map((tag) => tag.name));
        setAddingTag(false);
        setTagInput("");
        setRating(ratingToFive(entry.rating) ?? 0);
        setEditing(true);
    }

    return (
        <>
            {mode === "grid" ? (
                <div className="group relative min-w-0 overflow-hidden rounded border border-border bg-bg-secondary">
                    <button type="button" onClick={() => setShowInfo(true)} className="block w-full cursor-pointer md:hidden">
                        <div className="relative aspect-5/7 bg-bg">
                            {src && <Image src={src} alt={game.name ?? "game cover"} fill sizes="160px" className="object-cover" />}
                        </div>
                    </button>
                    <Link href={`/game/${game.slug}`} className="hidden md:block">
                        <div className="relative aspect-5/7 bg-bg">
                            {src && <Image src={src} alt={game.name ?? "game cover"} fill sizes="160px" className="object-cover" />}
                            <span className="absolute left-2 top-2 z-10 hidden max-w-[calc(100%-1rem)] items-center gap-2 rounded bg-bg-secondary/90 px-2 py-1 text-xs font-bold capitalize text-text opacity-0 transition-opacity group-hover:opacity-100 md:flex">
                                <span className={`size-2 shrink-0 rounded-full ${statusColor(entry.status)}`} aria-hidden="true" />
                                <span className="truncate">{statusLabel(entry.status)}</span>
                            </span>
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
                                    <StarRating rating={ratingToFive(entry.rating)} />
                                    <span>{entry.timePlayed != null ? `${entry.timePlayed}h` : ""}</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                    {canEdit && (
                        <button
                            type="button"
                            onClick={openEditor}
                            className="absolute bottom-2 right-2 hidden size-8 cursor-pointer place-items-center rounded bg-bg-secondary/90 text-text-muted opacity-0 transition hover:text-primary group-hover:opacity-100 md:grid"
                            aria-label="Edit library entry"
                        >
                            <Edit3 size={16} aria-hidden="true" />
                        </button>
                    )}
                </div>
            ) : (
                <div className="flex min-w-0 flex-row items-center gap-2 border-border p-2 not-last:border-b md:gap-4">
                    <Link href={`/game/${game.slug}`} className="relative h-18 w-12 shrink-0 overflow-hidden rounded bg-bg md:h-20 md:w-14">
                        {src && <Image src={src} alt={game.name ?? "game cover"} fill sizes="56px" className="object-cover" />}
                    </Link>
                    <div className="min-w-0 flex-1">
                        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-2 text-xs text-text-muted md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-4">
                            <p className="hidden truncate text-sm font-bold text-text md:block">{game.name}</p>
                            <span className="flex min-w-0 items-center gap-2 capitalize md:justify-end">
                                <span className={`size-2 rounded-full ${statusColor(entry.status)}`} aria-hidden="true" />
                                <span className="truncate">{statusLabel(entry.status)}</span>
                            </span>
                            <span className="hidden min-w-18 justify-end md:flex">
                                <StarRating rating={ratingToFive(entry.rating ?? 0)} />
                            </span>
                            <span className="justify-self-end font-bold text-text md:hidden">{(ratingToFive(entry.rating ?? 0) ?? 0).toFixed(1)}/5</span>
                            <span className="justify-self-end text-right md:hidden">{entry.timePlayed != null ? `${entry.timePlayed}h` : "No time"}</span>
                            <span className="grid size-7 place-items-center justify-self-end md:size-8">
                                {hasNotes && (
                                    <button
                                        type="button"
                                        onClick={() => setShowNotes(true)}
                                        className="grid size-7 cursor-pointer place-items-center rounded text-text-muted transition hover:text-primary md:size-8"
                                        aria-label="View notes"
                                    >
                                        <NotebookText size={16} aria-hidden="true" />
                                    </button>
                                )}
                            </span>
                            <span className="hidden min-w-16 text-right md:block">{entry.timePlayed != null ? `${entry.timePlayed}h` : "No time"}</span>
                        </div>
                    </div>
                    {canEdit && (
                        <>
                            <button type="button" onClick={openEditor} className="grid size-8 shrink-0 cursor-pointer place-items-center rounded border border-text-faint text-text-muted transition-colors hover:border-primary hover:text-primary md:hidden" aria-label="Edit library entry">
                                <Edit3 size={14} aria-hidden="true" />
                            </button>
                            <GhostButton type="button" onClick={openEditor} className="hidden px-3 py-2 md:flex">
                                <Edit3 size={16} aria-hidden="true" />
                            </GhostButton>
                        </>
                    )}
                </div>
            )}

            <MenuPanel open={showInfo} onClose={() => setShowInfo(false)} title={game.name} closeLabel="Close game info" panelClassName="md:hidden" style={themeStyle}>
                <div className="flex gap-4">
                    <Link href={`/game/${game.slug}`} className="relative h-32 w-22 shrink-0 overflow-hidden rounded bg-bg">
                        {src && <Image src={src} alt={game.name ?? "game cover"} fill sizes="88px" className="object-cover" />}
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col gap-2 text-sm text-text-muted">
                        <p className="flex items-center gap-2 capitalize">
                            <span className={`size-2 rounded-full ${statusColor(entry.status)}`} aria-hidden="true" />
                            {statusLabel(entry.status)}
                        </p>
                        <p className="flex flex-row gap-2 items-center"><span className="font-bold text-text">Rating:</span> <StarRating rating={(ratingToFive(entry.rating ?? 0) ?? 0)} size={15} /></p>
                        <p><span className="font-bold text-text">Time:</span> {entry.timePlayed != null ? `${entry.timePlayed}h` : "No time"}</p>
                        {hasNotes && (
                            <button type="button" onClick={() => {
                                setShowInfo(false);
                                setShowNotes(true);
                            }} className="w-fit cursor-pointer font-bold text-primary hover:text-primary-hover">
                                View notes
                            </button>
                        )}
                    </div>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                    <GhostButton href={`/game/${game.slug}`} className="px-4 py-2">
                        Visit game
                    </GhostButton>
                    {canEdit && (
                        <PrimaryButton type="button" onClick={openEditor} className="px-4 py-2">
                            Edit
                        </PrimaryButton>
                    )}
                </div>
            </MenuPanel>

            <MenuPanel open={showNotes} onClose={() => setShowNotes(false)} title={`Notes for: ${game.name}`} closeLabel="Close notes" style={themeStyle}>
                <p className="whitespace-pre-wrap text-sm text-text-muted">{entry.notes}</p>
            </MenuPanel>

            <MenuPanel open={editing} onClose={() => setEditing(false)} showClose={false} width="42rem" panelClassName="flex h-[min(42rem,calc(100dvh-1rem))] w-[calc(100vw-1rem)] flex-col gap-4 overflow-hidden bg-bg p-4 md:h-[min(36rem,calc(100vh-2rem))] md:w-[min(var(--menu-panel-width,42rem),calc(100vw-2rem))] md:flex-row md:p-5" style={themeStyle}>
                <div className="hidden w-32 shrink-0 flex-col gap-3 md:flex">
                    <div className="relative h-44 overflow-hidden rounded bg-bg">
                        {src && <Image src={src} alt={game.name ?? "game cover"} fill sizes="128px" className="object-cover" />}
                    </div>
                    <GhostButton type="button" onClick={() => setConfirmingRemove(true)} disabled={pending || !game.slug} className="px-3 py-2 text-error hover:border-error hover:text-error">
                        Remove
                    </GhostButton>
                </div>
                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                    <div className="mb-3 grid shrink-0 grid-cols-[3.75rem_minmax(0,1fr)_auto] items-center gap-3 md:mb-4 md:flex md:justify-between">
                        <div className="relative h-20 overflow-hidden rounded bg-bg md:hidden">
                            {src && <Image src={src} alt={game.name ?? "game cover"} fill sizes="60px" className="object-cover" />}
                        </div>
                        <h3 className="min-w-0 truncate text-base font-bold md:text-lg">{game.name}</h3>
                        <button type="button" onClick={() => setEditing(false)} className="grid size-8 shrink-0 cursor-pointer place-items-center rounded text-text-muted hover:text-primary" aria-label="Close">
                            <X size={18} aria-hidden="true" />
                        </button>
                    </div>
                    <div className="shrink-0">
                        <div className="mb-4 grid grid-cols-4 gap-1 p-1 md:hidden">
                            {[
                                { id: "entry", label: "Entry" },
                                { id: "log", label: "Log" },
                                { id: "history", label: "History" },
                                { id: "time", label: "Time" },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                    className={`min-w-0 rounded px-2 py-2 text-xs font-bold transition ${activeTab === tab.id ? "bg-primary text-text-inverse" : "text-text-muted bg-bg-secondary/50 border border-border hover:bg-bg-secondary hover:text-text"}`}
                                    aria-pressed={activeTab === tab.id}
                                >
                                    <span className="block truncate">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                        <div className="hidden md:block">
                            <SubTabs
                                tabs={[
                                    { id: "entry", label: "Entry" },
                                    { id: "log", label: "Log" },
                                    { id: "history", label: "History" },
                                    { id: "time", label: "Time" },
                                ]}
                                active={activeTab}
                                setter={setActiveTab}
                            />
                        </div>
                    </div>
                    {error && (
                        <p className="mb-3 shrink-0 rounded border border-error/50 bg-error/15 p-2 text-sm text-error">
                            {error}
                        </p>
                    )}
                    <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                        <form action={save} className={activeTab === "entry" ? "flex min-h-full flex-col gap-3" : "hidden"}>
                            <input type="hidden" name="timemode" value={timeModeLabel(entry.timeMode)} />
                            <input type="hidden" name="timeplayed" value={entry.timePlayed ?? ""} />
                            <input type="hidden" name="tagsTouched" value="1" />
                            {tags.map((tag) => (
                                <input key={tag} type="hidden" name="tags" value={tag} />
                            ))}
                            <label className="text-sm font-bold text-text-muted">
                                Status
                                <Select name="status" value={entryStatus} onChange={(event) => {
                                    const status = event.target.value as GameStatus;
                                    setEntryStatus(status);
                                    if (status === GameStatus.COMPLETED) setEntryFinished(true);
                                }} className="w-full capitalize">
                                    {Object.values(GameStatus).map((status) => (
                                        <option key={status} value={status}>{statusLabel(status)}</option>
                                    ))}
                                </Select>
                            </label>
                            <div className="grid gap-2 text-sm font-bold text-text-muted sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                                <StarRating rating={rating} size={28} interactive showValue name="rating" onChange={setRating} />
                                <label className="flex cursor-pointer items-center gap-2 rounded border border-border p-2">
                                    <Checkbox name="finished" checked={entryFinished} onChange={(event) => setEntryFinished(event.target.checked)} />
                                    Finished
                                </label>
                                <label className="flex cursor-pointer items-center gap-2 rounded border border-border p-2">
                                    <Checkbox name="mastered" defaultChecked={entry.timeMastered != null} />
                                    Mastered
                                </label>
                            </div>
                            <div className="text-sm font-bold text-text-muted">
                                Tags
                                <div className="mt-1 flex min-h-10 flex-wrap items-center gap-2">
                                    {tags.map((tag) => (
                                        <span key={tag} className="flex max-w-full items-center gap-1 rounded border border-border bg-bg px-2 py-1 text-xs text-text">
                                            <span className="truncate">{tag}</span>
                                            <button type="button" onClick={() => setTags((current) => current.filter((item) => item !== tag))} className="grid size-4 shrink-0 cursor-pointer place-items-center rounded text-text-muted hover:text-error" aria-label={`Remove ${tag}`}>
                                                <X size={12} aria-hidden="true" />
                                            </button>
                                        </span>
                                    ))}
                                    {addingTag ? (
                                        <input
                                            name="tags"
                                            autoFocus
                                            value={tagInput}
                                            onChange={(event) => setTagInput(event.target.value)}
                                            onBlur={addTag}
                                            onKeyDown={(event) => {
                                                if (event.key === "Enter") {
                                                    event.preventDefault();
                                                    addTag();
                                                }
                                            }}
                                            className="rounded border border-border bg-bg px-2 py-1 text-xs text-text outline-none"
                                            maxLength={40}
                                        />
                                    ) : (
                                        <button type="button" onClick={() => setAddingTag(true)} className="grid size-7 cursor-pointer place-items-center rounded border border-border text-text-muted hover:border-primary hover:text-primary" aria-label="Add tag">
                                            <Plus size={14} aria-hidden="true" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <label className="text-sm font-bold text-text-muted">
                                Notes
                                <Textarea name="notes" rows={3} defaultValue={entry.notes ?? ""} />
                            </label>
                            <div className="mt-auto grid grid-cols-3 gap-2 pt-2 md:flex md:justify-end">
                                <GhostButton type="button" className="text-sm md:text-md" onClick={() => setActiveTab("log")}>Create Log</GhostButton>
                                <GhostButton type="button" className="text-sm md:text-md" onClick={() => setEditing(false)}>Cancel</GhostButton>
                                <PrimaryButton type="submit" className="text-sm md:text-md" disabled={pending}>{pending ? "Saving..." : "Save"}</PrimaryButton>
                            </div>
                        </form>
                        {activeTab === "log" && (
                            <form action={saveLog} className="flex min-h-full flex-col gap-3">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <label className="text-sm font-bold text-text-muted">
                                        Date played
                                        <Input name="playedat" type="date" max={today} defaultValue={today} />
                                    </label>
                                    <label className="text-sm font-bold text-text-muted">
                                        Hours played
                                        <SuffixedInput name="hours" type="number" min={0.1} step={0.1} suffix="h" />
                                    </label>
                                </div>
                                <label className="text-sm font-bold text-text-muted">
                                    Log note
                                    <Textarea name="note" rows={4} />
                                </label>
                                <div className="grid gap-2 text-sm font-bold text-text-muted sm:grid-cols-3">
                                    <label className="flex cursor-pointer items-center gap-2 rounded border border-border p-2">
                                        <Checkbox name="finished" defaultChecked={Boolean(entry.finishedAt || entry.timeFinished != null)} disabled={Boolean(entry.finishedAt || entry.timeFinished != null)} />
                                        Finished
                                    </label>
                                    <label className="flex cursor-pointer items-center gap-2 rounded border border-border p-2">
                                        <Checkbox name="mastered" defaultChecked={entry.timeMastered != null} disabled={entry.timeMastered != null} />
                                        Mastered
                                    </label>
                                    <label className="flex cursor-pointer items-center gap-2 rounded border border-border p-2">
                                        <Checkbox name="skipRecap" />
                                        Skip recap
                                        <span title="This log still counts toward your game time. It will only be left out of recap features.">
                                            <CircleHelp size={15} className="text-text-faint" aria-label="This log still counts toward your game time. It will only be left out of recap features." />
                                        </span>
                                    </label>
                                </div>
                                <div className="mt-auto flex justify-end gap-2 pt-2">
                                    <GhostButton type="button" onClick={() => setEditing(false)}>Cancel</GhostButton>
                                    <PrimaryButton type="submit" disabled={pending}>{pending ? "Saving..." : "Add log"}</PrimaryButton>
                                </div>
                            </form>
                        )}
                        {activeTab === "history" && (
                            <div className="grid min-h-full gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                                <div className="flex max-h-112 flex-col gap-2 overflow-y-auto pr-1">
                                    <label className="text-sm font-bold text-text-muted">
                                        Filter
                                        <Input name="logdate" type="date" max={today} value={logDate} onChange={(event) => setLogDate(event.target.value)} />
                                    </label>
                                    {logDate && (
                                        <GhostButton type="button" onClick={() => setLogDate("")} className="justify-center py-2">
                                            Clear
                                        </GhostButton>
                                    )}
                                    {filteredLogs.length ? filteredLogs.map((log) => (
                                        <button
                                            key={log.id}
                                            type="button"
                                            onClick={() => setSelectedLogId(log.id)}
                                            className={`cursor-pointer rounded border p-3 text-left text-xs transition ${selectedLogId === log.id ? "border-primary bg-primary/10" : "border-border bg-bg/60 hover:border-primary"}`}
                                        >
                                            <span className="block font-bold text-text">{new Date(log.playedAt).toLocaleDateString()} - {log.hours}h</span>
                                            {log.skipRecap && <span className="mt-1 block text-text-faint">skipped in recaps</span>}
                                            <span className="mt-1 line-clamp-2 whitespace-pre-wrap text-text-muted">{log.note}</span>
                                        </button>
                                    )) : (
                                        <p className="bg-bg/60 p-3 text-sm text-text-muted">{logs.length ? "No logs on this date." : "No logs yet."}</p>
                                    )}
                                </div>
                                {selectedLog ? (
                                    <form key={selectedLog.id} action={saveHistoryLog} className="flex flex-col gap-3">
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <label className="text-sm font-bold text-text-muted">
                                                Date played
                                                <Input name="playedat" type="date" max={today} defaultValue={new Date(selectedLog.playedAt).toISOString().slice(0, 10)} />
                                            </label>
                                            <label className="text-sm font-bold text-text-muted">
                                                Hours played
                                                <SuffixedInput name="hours" type="number" min={0.1} step={0.1} defaultValue={selectedLog.hours} suffix="h" />
                                            </label>
                                        </div>
                                        <label className="text-sm font-bold text-text-muted">
                                            Log note
                                            <Textarea name="note" rows={4} defaultValue={selectedLog.note} />
                                        </label>
                                        <label className="flex cursor-pointer items-center gap-2 rounded border border-border p-2 text-sm font-bold text-text-muted">
                                            <Checkbox name="skipRecap" defaultChecked={selectedLog.skipRecap} />
                                            Skip recap
                                        </label>
                                        <div className="mt-2 flex justify-end gap-2">
                                            <GhostButton type="button" onClick={() => deleteHistoryLog(selectedLog.id)} disabled={pending} className="px-3 py-2 text-error hover:border-error hover:text-error">
                                                <Trash2 size={16} aria-hidden="true" />
                                            </GhostButton>
                                            <PrimaryButton type="submit" disabled={pending}>{pending ? "Saving..." : "Save log"}</PrimaryButton>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="">
                                    </div>
                                )}
                            </div>
                        )}
                        {activeTab === "time" && (
                            <form action={save} className="flex min-h-full flex-col gap-3">
                                <input type="hidden" name="status" value={entry.status} />
                                <input type="hidden" name="rating" value={ratingToFive(entry.rating) ?? ""} />
                                <input type="hidden" name="notes" value={entry.notes ?? ""} />
                                {Boolean(entry.finishedAt || entry.timeFinished != null) && <input type="hidden" name="finished" value="on" />}
                                {entry.timeMastered != null && <input type="hidden" name="mastered" value="on" />}
                                <div className="flex flex-col gap-2 text-sm font-bold text-text-muted">
                                    <span>
                                        <p>Time source</p>
                                        <p className="text-xs text-text-muted font-light">The method used to calculate your total game time</p>
                                    </span>
                                    <label className="flex cursor-pointer items-center gap-3 bg-bg/60">
                                        <input name="timemode" type="radio" value="logs" checked={timeMode === "logs"} onChange={() => setTimeMode("logs")} className="peer sr-only" />
                                        <span className="size-4 rounded-full border border-border peer-checked:border-primary peer-checked:bg-primary" />
                                        <span>
                                            <span className="block text-text">Calculate total from play logs</span>
                                        </span>
                                    </label>
                                    <label className="flex cursor-pointer items-center gap-3 bg-bg/60">
                                        <input name="timemode" type="radio" value="manual" checked={timeMode === "manual"} onChange={() => setTimeMode("manual")} className="peer sr-only" />
                                        <span className="size-4 rounded-full border border-border peer-checked:border-primary peer-checked:bg-primary" />
                                        <span>
                                            <span className="block text-text">Use manual time</span>
                                        </span>
                                    </label>
                                </div>
                                <div className="grid gap-2 rounded bg-bg/60 p-3 text-sm text-text-muted">
                                    <div className="grid gap-2 font-bold text-text sm:grid-cols-[8rem_minmax(0,1fr)_minmax(0,1fr)] sm:items-center">
                                        <span className="flex items-center gap-2 text-text-muted font-medium">
                                            <Clock size={15} aria-hidden="true" />
                                            Current total
                                        </span>
                                        <SuffixedInput name="timeplayed" type="number" min={0} step={0.1} defaultValue={entry.timePlayed ?? "0"} suffix="h" disabled={timeMode !== "manual"} aria-label="Current total time" />
                                        <span className="hidden sm:block" aria-hidden="true" />
                                    </div>
                                    {Boolean(entry.finishedAt || entry.timeFinished != null) && <div className="grid gap-2 font-bold text-text sm:grid-cols-[8rem_minmax(0,1fr)_minmax(0,1fr)] sm:items-center">
                                        <span className="flex items-center gap-2 text-text-muted font-medium">
                                            <Check size={15} aria-hidden="true" />
                                            Finished
                                        </span>
                                        <SuffixedInput name="timefinished" type="number" min={0} step={0.1} defaultValue={entry.timeFinished ?? entry.timePlayed ?? 0} suffix="h" aria-label="Finished time" />
                                        <Input name="finishedat" type="date" max={today} defaultValue={finishedAtValue || today} aria-label="Finished date" />
                                    </div>}
                                    {entry.timeMastered != null && <div className="grid gap-2 font-bold text-text sm:grid-cols-[8rem_minmax(0,1fr)_minmax(0,1fr)] sm:items-center">
                                        <span className="flex items-center gap-2 text-text-muted font-medium">
                                            <Crown size={15} aria-hidden="true" />
                                            Mastered
                                        </span>
                                        <SuffixedInput name="timemastered" type="number" min={0} step={0.1} defaultValue={entry.timeMastered} suffix="h" aria-label="Mastered time" />
                                        <Input name="masteredat" type="date" max={today} defaultValue={masteredAtValue || today} aria-label="Mastered date" />
                                    </div>}
                                </div>
                                <div className="mt-auto flex justify-end gap-2 pt-2">
                                    <GhostButton type="button" onClick={() => setEditing(false)}>Cancel</GhostButton>
                                    <PrimaryButton type="submit" disabled={pending}>{pending ? "Saving..." : "Save time"}</PrimaryButton>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </MenuPanel>
            <ConfirmAction
                open={confirmingRemove}
                title="Remove from library?"
                message="This will delete this library entry, including all play logs and related data for it."
                confirmLabel="Remove"
                pending={pending}
                onClose={() => setConfirmingRemove(false)}
                onConfirm={removeEntry}
            />
        </>
    );
}
