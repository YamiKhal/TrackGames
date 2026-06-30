"use client";

import { GameStatus } from "@/lib/generated/prisma/enums";
import type { UserLibraryEntryWithTags } from "@/lib/data/library";
import { ratingToFive } from "@/lib/util/rating";
import { Check, CircleHelp, Clock, Crown, Plus, Trash2, X } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import StarRating from "../game/StarRating";
import SubTabs from "../layout/SubTabs";
import { GhostButton, PrimaryButton } from "../ui/Buttons";
import { Checkbox, Input, Select, SuffixedInput, Textarea } from "../ui/Inputs";
import { statusLabel } from "./PlaylistCardPreview";

type PlaylistCardEditorTabsProps = Readonly<{
	entry: UserLibraryEntryWithTags;
	activeTab: string;
	setActiveTab: Dispatch<SetStateAction<string>>;
	error: string;
	save: (formData: FormData) => void;
	saveLog: (formData: FormData) => void;
	saveHistoryLog: (formData: FormData) => void;
	deleteHistoryLog: (logId: string) => void;
	onClose: () => void;
	pending: boolean;
	timeMode: string;
	setTimeMode: (mode: string) => void;
	entryStatus: GameStatus;
	setEntryStatus: (status: GameStatus) => void;
	isFinished: boolean;
	setEntryFinished: (finished: boolean) => void;
	tags: string[];
	setTags: Dispatch<SetStateAction<string[]>>;
	isAddingTag: boolean;
	setAddingTag: (adding: boolean) => void;
	tagInput: string;
	setTagInput: (value: string) => void;
	addTag: () => void;
	rating: number;
	setRating: (rating: number) => void;
	today: string;
	logDate: string;
	setLogDate: (date: string) => void;
	logs: NonNullable<UserLibraryEntryWithTags["userGamePlayLogs"]>;
	filteredLogs: NonNullable<UserLibraryEntryWithTags["userGamePlayLogs"]>;
	selectedLog: NonNullable<UserLibraryEntryWithTags["userGamePlayLogs"]>[number] | undefined;
	selectedLogId: string;
	setSelectedLogId: (id: string) => void;
	finishedAtValue: string;
	masteredAtValue: string;
}>;

function playlistItemsfilter(current: string[], notValue: string): string[] {
	return current.filter((item) => item !== notValue);
}

export function timeModeLabel(mode: string | undefined) {
	return mode === "manual" ? "manual" : "logs";
}

export default function PlaylistCardEditorTabs({
	entry,
	activeTab,
	setActiveTab,
	error,
	save,
	saveLog,
	saveHistoryLog,
	deleteHistoryLog,
	onClose,
	pending,
	timeMode,
	setTimeMode,
	entryStatus,
	setEntryStatus,
	isFinished,
	setEntryFinished,
	tags,
	setTags,
	isAddingTag,
	setAddingTag,
	tagInput,
	setTagInput,
	addTag,
	rating,
	setRating,
	today,
	logDate,
	setLogDate,
	logs,
	filteredLogs,
	selectedLog,
	selectedLogId,
	setSelectedLogId,
	finishedAtValue,
	masteredAtValue,
}: PlaylistCardEditorTabsProps) {
	return (
		<>
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
							onClick={() => setActiveTab(tab.id as EditorTab)}
							className={`min-w-0 rounded px-2 py-2 text-xs font-bold transition ${activeTab === tab.id ? "bg-primary text-text-inverse" : "border border-border bg-bg-secondary/50 text-text-muted hover:bg-bg-secondary hover:text-text"}`}
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
			{error && <p className="mb-3 shrink-0 rounded border border-error/50 bg-error/15 p-2 text-sm text-error">{error}</p>}
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
						<Select
							name="status"
							value={entryStatus}
							onChange={(event) => {
								const status = event.target.value as GameStatus;
								setEntryStatus(status);
								if (status === GameStatus.COMPLETED) setEntryFinished(true);
							}}
							className="w-full capitalize"
						>
							{Object.values(GameStatus).map((status) => (
								<option key={status} value={status}>
									{statusLabel(status)}
								</option>
							))}
						</Select>
					</label>
					<div className="grid gap-2 text-sm font-bold text-text-muted sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
						<StarRating rating={rating} size={28} isInteractive shouldShowValue name="rating" onChange={setRating} />
						<label className="flex cursor-pointer items-center gap-2 rounded border border-border p-2">
							<Checkbox name="finished" checked={isFinished} onChange={(event) => setEntryFinished(event.target.checked)} />
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
									<button
										type="button"
										onClick={() => setTags((current) => playlistItemsfilter(current, tag))}
										className="grid size-4 shrink-0 cursor-pointer place-items-center rounded text-text-muted hover:text-error"
										aria-label={`Remove ${tag}`}
									>
										<X size={12} aria-hidden="true" />
									</button>
								</span>
							))}
							{isAddingTag ? (
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
								<button
									type="button"
									onClick={() => setAddingTag(true)}
									className="grid size-7 cursor-pointer place-items-center rounded border border-border text-text-muted hover:border-primary hover:text-primary"
									aria-label="Add tag"
								>
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
						<GhostButton type="button" className="md:text-md text-sm" onClick={() => setActiveTab("log")}>
							Create Log
						</GhostButton>
						<GhostButton type="button" className="md:text-md text-sm" onClick={onClose}>
							Cancel
						</GhostButton>
						<PrimaryButton type="submit" className="md:text-md text-sm" disabled={pending}>
							{pending ? "Saving..." : "Save"}
						</PrimaryButton>
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
								<Checkbox
									name="finished"
									defaultChecked={Boolean(entry.finishedAt || entry.timeFinished != null)}
									disabled={Boolean(entry.finishedAt || entry.timeFinished != null)}
								/>
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
									<CircleHelp
										size={15}
										className="text-text-faint"
										aria-label="This log still counts toward your game time. It will only be left out of recap features."
									/>
								</span>
							</label>
						</div>
						<div className="mt-auto flex justify-end gap-2 pt-2">
							<GhostButton type="button" onClick={onClose}>
								Cancel
							</GhostButton>
							<PrimaryButton type="submit" disabled={pending}>
								{pending ? "Saving..." : "Add log"}
							</PrimaryButton>
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
							{filteredLogs.length ? (
								filteredLogs.map((log) => (
									<button
										key={log.id}
										type="button"
										onClick={() => setSelectedLogId(log.id)}
										className={`cursor-pointer rounded border p-3 text-left text-xs transition ${selectedLogId === log.id ? "border-primary bg-primary/10" : "border-border bg-bg/60 hover:border-primary"}`}
									>
										<span className="block font-bold text-text">
											{new Date(log.playedAt).toLocaleDateString()} - {log.hours}h
										</span>
										{log.skipRecap && <span className="mt-1 block text-text-faint">skipped in recaps</span>}
										<span className="mt-1 line-clamp-2 whitespace-pre-wrap text-text-muted">{log.note}</span>
									</button>
								))
							) : (
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
									<GhostButton
										type="button"
										onClick={() => deleteHistoryLog(selectedLog.id)}
										disabled={pending}
										className="px-3 py-2 text-error hover:border-error hover:text-error"
									>
										<Trash2 size={16} aria-hidden="true" />
									</GhostButton>
									<PrimaryButton type="submit" disabled={pending}>
										{pending ? "Saving..." : "Save log"}
									</PrimaryButton>
								</div>
							</form>
						) : (
							<div className=""></div>
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
								<p className="text-xs font-light text-text-muted">The method used to calculate your total game time</p>
							</span>
							<label className="flex cursor-pointer items-center gap-3 bg-bg/60">
								<input name="timemode" type="radio" value="logs" checked={timeMode === "logs"} onChange={() => setTimeMode("logs")} className="peer sr-only" />
								<span className="size-4 rounded-full border border-border peer-checked:border-primary peer-checked:bg-primary" />
								<span className="block text-text">Calculate total from play logs</span>
							</label>
							<label className="flex cursor-pointer items-center gap-3 bg-bg/60">
								<input
									name="timemode"
									type="radio"
									value="manual"
									checked={timeMode === "manual"}
									onChange={() => setTimeMode("manual")}
									className="peer sr-only"
								/>
								<span className="size-4 rounded-full border border-border peer-checked:border-primary peer-checked:bg-primary" />
								<span className="block text-text">Use manual time</span>
							</label>
						</div>
						<div className="grid gap-2 rounded bg-bg/60 p-3 text-sm text-text-muted">
							<div className="grid gap-2 font-bold text-text sm:grid-cols-[8rem_minmax(0,1fr)_minmax(0,1fr)] sm:items-center">
								<span className="flex items-center gap-2 font-medium text-text-muted">
									<Clock size={15} aria-hidden="true" />
									Current total
								</span>
								<SuffixedInput
									name="timeplayed"
									type="number"
									min={0}
									step={0.1}
									defaultValue={entry.timePlayed ?? "0"}
									suffix="h"
									disabled={timeMode !== "manual"}
									aria-label="Current total time"
								/>
								<span className="hidden sm:block" aria-hidden="true" />
							</div>
							{Boolean(entry.finishedAt || entry.timeFinished != null) && (
								<div className="grid gap-2 font-bold text-text sm:grid-cols-[8rem_minmax(0,1fr)_minmax(0,1fr)] sm:items-center">
									<span className="flex items-center gap-2 font-medium text-text-muted">
										<Check size={15} aria-hidden="true" />
										Finished
									</span>
									<SuffixedInput
										name="timefinished"
										type="number"
										min={0}
										step={0.1}
										defaultValue={entry.timeFinished ?? entry.timePlayed ?? 0}
										suffix="h"
										aria-label="Finished time"
									/>
									<Input name="finishedat" type="date" max={today} defaultValue={finishedAtValue || today} aria-label="Finished date" />
								</div>
							)}
							{entry.timeMastered != null && (
								<div className="grid gap-2 font-bold text-text sm:grid-cols-[8rem_minmax(0,1fr)_minmax(0,1fr)] sm:items-center">
									<span className="flex items-center gap-2 font-medium text-text-muted">
										<Crown size={15} aria-hidden="true" />
										Mastered
									</span>
									<SuffixedInput name="timemastered" type="number" min={0} step={0.1} defaultValue={entry.timeMastered} suffix="h" aria-label="Mastered time" />
									<Input name="masteredat" type="date" max={today} defaultValue={masteredAtValue || today} aria-label="Mastered date" />
								</div>
							)}
						</div>
						<div className="mt-auto flex justify-end gap-2 pt-2">
							<GhostButton type="button" onClick={onClose}>
								Cancel
							</GhostButton>
							<PrimaryButton type="submit" disabled={pending}>
								{pending ? "Saving..." : "Save time"}
							</PrimaryButton>
						</div>
					</form>
				)}
			</div>
		</>
	);
}

export type EditorTab = "entry" | "log" | "history" | "time";
