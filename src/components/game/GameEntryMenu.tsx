"use client";

import type { CSSProperties } from "react";
import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ExternalLink } from "lucide-react";
import { type EditorTab, EntryEditorProvider } from "@/components/gamelist/_entry-editor/context";
import EntryEditorTabs from "@/components/gamelist/_entry-editor/EntryEditorTabs";
import PlaylistTab from "@/components/gamelist/_entry-editor/PlaylistTab";
import { timeModeLabel } from "@/components/gamelist/_entry-editor/shared";
import Tabs from "@/components/layout/Tabs";
import ConfirmAction from "@/components/ui/ConfirmAction";
import { DangerButton, GhostButton, PrimaryButton } from "@/components/ui/control/Button";
import MenuPanel from "@/components/ui/MenuPanel";
import {
	createUserGamePlayLog,
	deleteUserGamePlayLog,
	fetchUserGameEntry,
	removeGameFromLibrary,
	setGameLibraryStatus,
	updateUserGameEntry,
	updateUserGamePlayLog,
} from "@/lib/actions/gamelist/library";
import { removeGameFromPlaylist, updatePlaylistEntry } from "@/lib/actions/gamelist/lists";
import type { UserLibraryEntryWithTags, ViewerGameEntry } from "@/lib/data/gamelist/library";
import { ImageIdToURL } from "@/lib/external/igdb/util";
import { GameStatus } from "@/lib/generated/prisma/enums";
import { joinClass } from "@/lib/util/client/func";
import { GAME_STATUS_META, gameStatusColorClasses } from "@/lib/util/format/gameStatus";
import { ratingToFive } from "@/lib/util/format/rating";
import { formDataString } from "@/lib/util/parse/formData";

type LibraryEntry = UserLibraryEntryWithTags | ViewerGameEntry;

type PlaylistEditorContext = Readonly<{
	listId: string;
	entryId: string;
	position: number | null;
	tier: string | null;
	tiers: string[];
}>;

type GameEntryMenuProps = Readonly<{
	gameId: number;
	gameSlug: string;
	gameName: string;
	gameCover?: string | null;
	isLoggedIn: boolean;
	libraryEntry: LibraryEntry | null;
	onLibraryChange?: (entry: UserLibraryEntryWithTags | null) => void;
	onRemoved?: () => void;
	playlistEditor?: PlaylistEditorContext | null;
	themeStyle?: CSSProperties;
	children: (ctrl: { onTileClick: (event: React.MouseEvent) => void }) => React.ReactNode;
}>;

const quickAddStatuses = [GameStatus.PLAYING, GameStatus.BACKLOG, GameStatus.WISHLIST, GameStatus.COMPLETED, GameStatus.PAUSED, GameStatus.DROPPED];

function isFullEntry(entry: LibraryEntry): entry is UserLibraryEntryWithTags {
	return "logs" in entry;
}

export default function GameEntryMenu({
	gameId,
	gameSlug,
	gameName,
	gameCover,
	isLoggedIn,
	libraryEntry,
	onLibraryChange,
	onRemoved,
	playlistEditor,
	themeStyle,
	children,
}: GameEntryMenuProps) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [override, setOverride] = useState<UserLibraryEntryWithTags | null>(null);
	const [loadingFull, setLoadingFull] = useState(false);
	const [confirmingRemove, setConfirmingRemove] = useState(false);
	const [confirmingClose, setConfirmingClose] = useState(false);
	const [dirty, setDirty] = useState(false);
	const [quickTab, setQuickTab] = useState<"add" | "playlist">("add");
	const [error, setError] = useState("");
	const [pending, startTransition] = useTransition();

	const [activeTab, setActiveTab] = useState<EditorTab>("entry");
	const [selectedLogId, setSelectedLogId] = useState("");
	const [logDate, setLogDate] = useState("");
	const [timeMode, setTimeMode] = useState("manual");
	const [entryStatus, setEntryStatus] = useState<GameStatus>(GameStatus.BACKLOG);
	const [isFinished, setIsFinished] = useState(false);
	const [tags, setTags] = useState<string[]>([]);
	const [isAddingTag, setAddingTag] = useState(false);
	const [tagInput, setTagInput] = useState("");
	const [rating, setRating] = useState(0);

	const src = ImageIdToURL(gameCover ?? undefined);
	const entry = override ?? libraryEntry;

	function syncEntry(updated: UserLibraryEntryWithTags | null) {
		setOverride(updated);
		if (onLibraryChange) onLibraryChange(updated);
		else router.refresh();
	}

	// Single gate for every close path (backdrop, Esc, Cancel): confirm when editing dirty.
	function requestClose() {
		if (fullEntry && dirty) {
			setConfirmingClose(true);
			return;
		}
		closeNow();
	}

	function closeNow() {
		setConfirmingClose(false);
		setDirty(false);
		setOpen(false);
	}

	function resetFormFromEntry(full: UserLibraryEntryWithTags) {
		setDirty(false);
		setActiveTab("entry");
		setSelectedLogId("");
		setLogDate("");
		setTimeMode(timeModeLabel(full.timeMode));
		setEntryStatus(full.status);
		setIsFinished(Boolean(full.finishedAt || full.timeFinished != null));
		setTags(full.tags.map((tag) => tag.name));
		setAddingTag(false);
		setTagInput("");
		setRating(ratingToFive(full.rating) ?? 0);
	}

	function onTileClick(event: React.MouseEvent) {
		if (!isLoggedIn) return;

		event.preventDefault();
		setError("");
		setOpen(true);
		setQuickTab("add");

		if (entry && isFullEntry(entry)) {
			resetFormFromEntry(entry);
		} else if (entry && !isFullEntry(entry)) {
			setLoadingFull(true);
			startTransition(async () => {
				const full = await fetchUserGameEntry(gameId);
				setLoadingFull(false);
				if (full) {
					setOverride(full);
					resetFormFromEntry(full);
				}
			});
		}
	}

	function addWithStatus(status: GameStatus) {
		setError("");
		startTransition(async () => {
			const result = await setGameLibraryStatus(gameId, gameSlug, status);
			if ("error" in result) {
				setError(result.error);
				return;
			}

			syncEntry(result);
			resetFormFromEntry(result);
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

	function save(formData: FormData) {
		if (!entry || !isFullEntry(entry)) return;

		const timePlayed = formDataString(formData.get("timeplayed")).trim();
		const timeMastered = formDataString(formData.get("timemastered")).trim();
		const mode = formDataString(formData.get("timemode"), "manual");
		const mastered = formData.get("mastered") === "on";

		if (mastered && !timeMastered && mode === "manual" && !timePlayed) {
			setError("Add time played or mastered time before marking a game as mastered.");
			return;
		}

		setError("");
		startTransition(async () => {
			const updated = await updateUserGameEntry(entry.id, formData);
			if ("error" in updated) {
				setError(updated.error);
				return;
			}

			syncEntry(updated);
			closeNow();
		});
	}

	function saveLog(formData: FormData) {
		if (!entry || !isFullEntry(entry)) return;

		setError("");
		startTransition(async () => {
			const updated = await createUserGamePlayLog(entry.id, formData);
			if ("error" in updated) {
				setError(updated.error);
				return;
			}

			syncEntry(updated);
			closeNow();
		});
	}

	function saveHistoryLog(formData: FormData) {
		if (!selectedLogId) return;

		setError("");
		startTransition(async () => {
			const updated = await updateUserGamePlayLog(selectedLogId, formData);
			if ("error" in updated) {
				setError(updated.error);
				return;
			}

			syncEntry(updated);
			setSelectedLogId("");
		});
	}

	function deleteHistoryLog(logId: string) {
		setError("");
		startTransition(async () => {
			const updated = await deleteUserGamePlayLog(logId);
			if ("error" in updated) {
				setError(updated.error);
				return;
			}

			syncEntry(updated);
			setSelectedLogId("");
		});
	}

	function removeEntry() {
		setError("");
		startTransition(async () => {
			await removeGameFromLibrary(gameId, gameSlug);
			setConfirmingRemove(false);
			setOpen(false);
			syncEntry(null);
			onRemoved?.();
		});
	}

	function savePlaylistEntry(formData: FormData) {
		if (!playlistEditor) return;

		startTransition(async () => {
			await updatePlaylistEntry(playlistEditor.listId, playlistEditor.entryId, formData);
			router.refresh();
		});
	}

	function removeFromPlaylist() {
		if (!playlistEditor) return;

		startTransition(async () => {
			await removeGameFromPlaylist(playlistEditor.listId, playlistEditor.entryId);
			router.refresh();
			setOpen(false);
		});
	}

	const now = new Date();
	const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
	const fullEntry = entry && isFullEntry(entry) ? entry : null;
	const logs = fullEntry ? [...fullEntry.logs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [];
	const filteredLogs = logDate ? logs.filter((log) => new Date(log.playedAt).toISOString().slice(0, 10) === logDate) : logs;
	const selectedLog = logs.find((log) => log.id === selectedLogId);
	const finishedAtValue = fullEntry?.finishedAt ? new Date(fullEntry.finishedAt).toISOString().slice(0, 10) : "";
	const masteredAtValue = fullEntry?.masteredAt ? new Date(fullEntry.masteredAt).toISOString().slice(0, 10) : "";
	const isEditorView = Boolean(fullEntry);

	return (
		<>
			{children({ onTileClick })}

			<MenuPanel
				open={open}
				onClose={requestClose}
				shouldShowClose={false}
				width={isEditorView ? "42rem" : "26rem"}
				panelClassName={
					isEditorView
						? "flex h-[min(42rem,calc(100dvh-1rem))] w-[calc(100vw-1rem)] flex-col overflow-hidden bg-bg p-4 md:h-[min(36rem,calc(100vh-2rem))] md:w-[min(var(--menu-panel-width,42rem),calc(100vw-2rem))] md:p-5"
						: "flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] flex-col gap-4 overflow-hidden bg-bg p-4 md:w-[min(var(--menu-panel-width,26rem),calc(100vw-2rem))]"
				}
				style={themeStyle}
			>
				<div className={joinClass("flex min-h-0 flex-1 flex-col gap-4", isEditorView && "md:flex-row")}>
					{isEditorView && (
						<Link href={`/game/${gameSlug}`} className="relative hidden h-44 w-32 shrink-0 overflow-hidden rounded md:block">
							{src && <Image src={src} alt={gameName} fill sizes="128px" className="object-cover" />}
						</Link>
					)}
					<div className="flex min-h-0 min-w-0 flex-1 flex-col" onInput={isEditorView ? () => setDirty(true) : undefined}>
						<div
							className={joinClass(
								"mb-3 grid shrink-0 grid-cols-[3.75rem_minmax(0,1fr)_auto] items-center gap-3",
								isEditorView && "md:mb-4 md:grid-cols-[minmax(0,1fr)_auto]",
							)}
						>
							<Link href={`/game/${gameSlug}`} className={joinClass("relative h-20 overflow-hidden rounded bg-bg", isEditorView && "md:hidden")}>
								{src && <Image src={src} alt={gameName} fill sizes="60px" className="object-cover" />}
							</Link>
							<Link href={`/game/${gameSlug}`}>
								<h3 className="min-w-0 truncate text-base font-bold text-text md:text-lg">{gameName}</h3>
							</Link>
							<GhostButton variant="text" href={`/game/${gameSlug}`} target="_blank" rel="noreferrer noopener" aria-label="Visit game">
								<ExternalLink size={18} aria-hidden="true" />
							</GhostButton>
						</div>

						{fullEntry ? (
							<EntryEditorProvider
								value={{
									entry: fullEntry,
									pending,
									today,
									onClose: requestClose,
									save,
									saveLog,
									saveHistoryLog,
									deleteHistoryLog,
									entryStatus,
									setEntryStatus,
									isFinished,
									setEntryFinished: setIsFinished,
									tags,
									setTags,
									isAddingTag,
									setAddingTag,
									tagInput,
									setTagInput,
									addTag,
									rating,
									setRating,
									timeMode,
									setTimeMode,
									finishedAtValue,
									masteredAtValue,
									logDate,
									setLogDate,
									logs,
									filteredLogs,
									selectedLog,
									selectedLogId,
									setSelectedLogId,
									playlist: playlistEditor
										? {
												position: playlistEditor.position,
												tier: playlistEditor.tier,
												tiers: playlistEditor.tiers,
												save: savePlaylistEntry,
												onRemove: removeFromPlaylist,
											}
										: null,
								}}
							>
								<EntryEditorTabs activeTab={activeTab} setActiveTab={setActiveTab} error={error} />
							</EntryEditorProvider>
						) : entry && loadingFull ? (
							<p className="text-sm text-text-muted">Loading...</p>
						) : (
							<>
								{error && <p className="mb-3 shrink-0 rounded border border-error/50 bg-error/15 p-2 text-sm text-error">{error}</p>}
								{playlistEditor && (
									<Tabs
										tabs={[
											{ id: "add", label: "Add to library" },
											{ id: "playlist", label: "Playlist" },
										]}
										active={quickTab}
										onSelect={(id) => setQuickTab(id as "add" | "playlist")}
										responsive="compact"
									/>
								)}
								{quickTab === "playlist" && playlistEditor ? (
									<PlaylistTab
										position={playlistEditor.position}
										tier={playlistEditor.tier}
										tiers={playlistEditor.tiers}
										save={savePlaylistEntry}
										onRemove={removeFromPlaylist}
										onClose={() => setOpen(false)}
										pending={pending}
									/>
								) : (
									<div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
										<p className="text-sm text-text-muted">Not in your library yet. Add it with a status:</p>
										<div className="flex flex-col gap-2">
											{quickAddStatuses.map((status) => {
												const meta = GAME_STATUS_META[status];
												const Icon = meta.icon;
												const colors = gameStatusColorClasses(status);

												return (
													<button
														key={status}
														type="button"
														disabled={pending}
														onClick={() => addWithStatus(status)}
														className={joinClass(
															"flex cursor-pointer items-center gap-3 rounded border p-3 text-sm font-bold transition hover:bg-bg-secondary disabled:cursor-wait disabled:opacity-60",
															colors.className,
														)}
													>
														<Icon size={17} />
														{meta.label}
													</button>
												);
											})}
										</div>
										<div className="border-t border-border pt-3">
											<GhostButton variant="outline" href={`/game/${gameSlug}`} className="w-full justify-center px-4 py-2">
												<ArrowUpRight size={16} aria-hidden="true" />
												Visit game
											</GhostButton>
										</div>
									</div>
								)}
							</>
						)}
					</div>
				</div>

				{/* Panel-level footer: spans full panel width so Remove hugs the panel's left edge,
				    not the content column's. History has no single form to submit; playlist has its own. */}
				{fullEntry && activeTab !== "playlist" && (
					<div className="mt-4 flex shrink-0 items-center justify-between gap-2 border-t border-border pt-4">
						<DangerButton variant="outline" onClick={() => setConfirmingRemove(true)} disabled={pending}>
							Remove
						</DangerButton>
						<div className="flex items-center gap-2">
							<GhostButton variant="outline" onClick={requestClose}>
								Cancel
							</GhostButton>
							{activeTab !== "history" && (
								<PrimaryButton type="submit" form={`entry-editor-${activeTab}-form`} disabled={pending}>
									{pending ? "Saving..." : activeTab === "log" ? "Add log" : activeTab === "time" ? "Save time" : "Save"}
								</PrimaryButton>
							)}
						</div>
					</div>
				)}
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

			<ConfirmAction
				open={confirmingClose}
				title="Discard changes?"
				message="You have unsaved changes. Closing will lose them."
				confirmLabel="Discard"
				onClose={() => setConfirmingClose(false)}
				onConfirm={closeNow}
			/>
		</>
	);
}
