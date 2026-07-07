"use client";

import Tabs from "@/components/layout/Tabs";
import { type EditorTab, useEntryEditor } from "./context";
import EntryTab from "./EntryTab";
import HistoryTab from "./HistoryTab";
import LogTab from "./LogTab";
import PlaylistTab from "./PlaylistTab";
import TimeTab from "./TimeTab";

type EntryEditorTabsProps = Readonly<{
	activeTab: string;
	setActiveTab: (tab: EditorTab) => void;
	error: string;
}>;

export default function EntryEditorTabs({ activeTab, setActiveTab, error }: EntryEditorTabsProps) {
	const { pending, onClose, playlist } = useEntryEditor();

	const tabs = [
		{ id: "entry", label: "Entry" },
		{ id: "log", label: "Log" },
		{ id: "history", label: "History" },
		{ id: "time", label: "Time" },
		...(playlist ? [{ id: "playlist", label: "Playlist" }] : []),
	];

	return (
		<>
			<Tabs tabs={tabs} active={activeTab} onSelect={(id) => setActiveTab(id as EditorTab)} responsive="compact" />
			{error && <p className="mb-3 shrink-0 rounded border border-error/50 bg-error/15 p-2 text-sm text-error">{error}</p>}
			<div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
				<div className={activeTab === "entry" ? "animate-content-in" : "hidden"}>
					<EntryTab isActive={activeTab === "entry"} />
				</div>
				{activeTab === "log" && (
					<div key="log" className="animate-content-in">
						<LogTab />
					</div>
				)}
				{activeTab === "history" && (
					<div key="history" className="animate-content-in">
						<HistoryTab />
					</div>
				)}
				{activeTab === "time" && (
					<div key="time" className="animate-content-in">
						<TimeTab />
					</div>
				)}
				{activeTab === "playlist" && playlist && (
					<div key="playlist" className="animate-content-in">
						<PlaylistTab
							position={playlist.position}
							tier={playlist.tier}
							tiers={playlist.tiers}
							save={playlist.save}
							onRemove={playlist.onRemove}
							onClose={onClose}
							pending={pending}
						/>
					</div>
				)}
			</div>
		</>
	);
}
