"use client";

import type { Dispatch, SetStateAction } from "react";
import { createContext, useContext } from "react";
import type { UserLibraryEntryWithTags } from "@/lib/data/gamelist/library";
import type { GameStatus } from "@/lib/generated/prisma/enums";

export type EditorTab = "entry" | "log" | "history" | "time" | "playlist";

export type PlaylistEditorState = Readonly<{
	position: number | null;
	tier: string | null;
	tiers: string[];
	save: (formData: FormData) => void;
	onRemove: () => void;
}>;

/**
 * Everything the entry-editor tabs need. GameEntryMenu owns the state and
 * provides it once; tabs read via useEntryEditor() instead of being drilled
 * ~15 props each.
 */
export type EntryEditorValue = Readonly<{
	entry: UserLibraryEntryWithTags;
	pending: boolean;
	today: string;
	onClose: () => void;

	// form actions
	save: (formData: FormData) => void;
	saveLog: (formData: FormData) => void;
	saveHistoryLog: (formData: FormData) => void;
	deleteHistoryLog: (logId: string) => void;

	// entry-tab form state
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

	// time-tab state
	timeMode: string;
	setTimeMode: (mode: string) => void;
	finishedAtValue: string;
	masteredAtValue: string;

	// history-tab state
	logDate: string;
	setLogDate: (date: string) => void;
	logs: NonNullable<UserLibraryEntryWithTags["logs"]>;
	filteredLogs: NonNullable<UserLibraryEntryWithTags["logs"]>;
	selectedLog: NonNullable<UserLibraryEntryWithTags["logs"]>[number] | undefined;
	selectedLogId: string;
	setSelectedLogId: (id: string) => void;

	// optional playlist tab
	playlist: PlaylistEditorState | null;
}>;

const EntryEditorContext = createContext<EntryEditorValue | null>(null);

export const EntryEditorProvider = EntryEditorContext.Provider;

export function useEntryEditor() {
	const value = useContext(EntryEditorContext);
	if (!value) throw new Error("useEntryEditor must be used inside GameEntryMenu");
	return value;
}
