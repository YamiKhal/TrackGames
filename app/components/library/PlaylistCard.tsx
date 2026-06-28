"use client";

import {
	createUserGamePlayLog,
	deleteUserGamePlayLog,
	removeGameFromLibrary,
	updateUserGameEntry,
	updateUserGamePlayLog,
} from "@/lib/actions/library";
import type { UserLibraryEntryWithTags } from "@/lib/data/library";
import { ImageIdToURL } from "@/lib/external/igdb/util";
import { ratingToFive } from "@/lib/util/rating";
import { X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { useState, useTransition } from "react";
import StarRating from "../game/StarRating";
import { GhostButton, PrimaryButton } from "../ui/Buttons";
import ConfirmAction from "../ui/ConfirmAction";
import MenuPanel from "../ui/MenuPanel";
import PlaylistCardEditorTabs, { type EditorTab, timeModeLabel } from "./PlaylistCardEditorTabs";
import PlaylistCardPreview, { statusColor, statusLabel } from "./PlaylistCardPreview";

type PlayListCardProps = Readonly<{
	entry: UserLibraryEntryWithTags;
	mode: "grid" | "list";
	canEdit: boolean;
	onUpdate: (entry: UserLibraryEntryWithTags) => void;
	onRemove: (entryId: string) => void;
	themeStyle?: CSSProperties;
}>;

export default function PlaylistCard({ entry, mode, canEdit, onUpdate, onRemove, themeStyle }: PlayListCardProps) {
	const [editing, setEditing] = useState(false);
	const [showInfo, setShowInfo] = useState(false);
	const [showNotes, setShowNotes] = useState(false);
	const [confirmingRemove, setConfirmingRemove] = useState(false);
	const [activeTab, setActiveTab] = useState<EditorTab>("entry");
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
			await removeGameFromLibrary(entry.gameId, game.slug);
			setConfirmingRemove(false);
			setEditing(false);
			onRemove(entry.id);
		});
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
			<PlaylistCardPreview
				entry={entry}
				mode={mode}
				canEdit={canEdit}
				onOpenInfo={() => setShowInfo(true)}
				onOpenNotes={() => setShowNotes(true)}
				onOpenEditor={openEditor}
			/>

			<MenuPanel
				open={showInfo}
				onClose={() => setShowInfo(false)}
				title={game.name}
				closeLabel="Close game info"
				panelClassName="md:hidden"
				style={themeStyle}
			>
				<div className="flex gap-4">
					<Link href={`/game/${game.slug}`} className="relative h-32 w-22 shrink-0 overflow-hidden rounded bg-bg">
						{src && <Image src={src} alt={game.name ?? "game cover"} fill sizes="88px" className="object-cover" />}
					</Link>
					<div className="flex min-w-0 flex-1 flex-col gap-2 text-sm text-text-muted">
						<p className="flex items-center gap-2 capitalize">
							<span className={`size-2 rounded-full ${statusColor(entry.status)}`} aria-hidden="true" />
							{statusLabel(entry.status)}
						</p>
						<p className="flex flex-row items-center gap-2">
							<span className="font-bold text-text">Rating:</span>{" "}
							<StarRating rating={ratingToFive(entry.rating ?? 0) ?? 0} size={15} />
						</p>
						<p>
							<span className="font-bold text-text">Time:</span>{" "}
							{entry.timePlayed == null ? "No time" : `${entry.timePlayed}h`}
						</p>
						{hasNotes && (
							<button
								type="button"
								onClick={() => {
									setShowInfo(false);
									setShowNotes(true);
								}}
								className="w-fit cursor-pointer font-bold text-primary hover:text-primary-hover"
							>
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

			<MenuPanel
				open={showNotes}
				onClose={() => setShowNotes(false)}
				title={`Notes for: ${game.name}`}
				closeLabel="Close notes"
				style={themeStyle}
			>
				<p className="whitespace-pre-wrap text-sm text-text-muted">{entry.notes}</p>
			</MenuPanel>

			<MenuPanel
				open={editing}
				onClose={() => setEditing(false)}
				showClose={false}
				width="42rem"
				panelClassName="flex h-[min(42rem,calc(100dvh-1rem))] w-[calc(100vw-1rem)] flex-col gap-4 overflow-hidden bg-bg p-4 md:h-[min(36rem,calc(100vh-2rem))] md:w-[min(var(--menu-panel-width,42rem),calc(100vw-2rem))] md:flex-row md:p-5"
				style={themeStyle}
			>
				<div className="hidden w-32 shrink-0 flex-col gap-3 md:flex">
					<div className="relative h-44 overflow-hidden rounded bg-bg">
						{src && <Image src={src} alt={game.name ?? "game cover"} fill sizes="128px" className="object-cover" />}
					</div>
					<GhostButton
						type="button"
						onClick={() => setConfirmingRemove(true)}
						disabled={pending || !game.slug}
						className="px-3 py-2 text-error hover:border-error hover:text-error"
					>
						Remove
					</GhostButton>
				</div>
				<div className="flex min-h-0 min-w-0 flex-1 flex-col">
					<div className="mb-3 grid shrink-0 grid-cols-[3.75rem_minmax(0,1fr)_auto] items-center gap-3 md:mb-4 md:flex md:justify-between">
						<div className="relative h-20 overflow-hidden rounded bg-bg md:hidden">
							{src && <Image src={src} alt={game.name ?? "game cover"} fill sizes="60px" className="object-cover" />}
						</div>
						<h3 className="min-w-0 truncate text-base font-bold md:text-lg">{game.name}</h3>
						<button
							type="button"
							onClick={() => setEditing(false)}
							className="grid size-8 shrink-0 cursor-pointer place-items-center rounded text-text-muted hover:text-primary"
							aria-label="Close"
						>
							<X size={18} aria-hidden="true" />
						</button>
					</div>
					<PlaylistCardEditorTabs
						entry={entry}
						activeTab={activeTab}
						setActiveTab={setActiveTab}
						error={error}
						save={save}
						saveLog={saveLog}
						saveHistoryLog={saveHistoryLog}
						deleteHistoryLog={deleteHistoryLog}
						onClose={() => setEditing(false)}
						pending={pending}
						timeMode={timeMode}
						setTimeMode={setTimeMode}
						entryStatus={entryStatus}
						setEntryStatus={setEntryStatus}
						entryFinished={entryFinished}
						setEntryFinished={setEntryFinished}
						tags={tags}
						setTags={setTags}
						addingTag={addingTag}
						setAddingTag={setAddingTag}
						tagInput={tagInput}
						setTagInput={setTagInput}
						addTag={addTag}
						rating={rating}
						setRating={setRating}
						today={today}
						logDate={logDate}
						setLogDate={setLogDate}
						logs={logs}
						filteredLogs={filteredLogs}
						selectedLog={selectedLog}
						selectedLogId={selectedLogId}
						setSelectedLogId={setSelectedLogId}
						finishedAtValue={finishedAtValue}
						masteredAtValue={masteredAtValue}
					/>
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
