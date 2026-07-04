"use client";

import Link from "next/link";
import { Plus, X } from "lucide-react";
import MenuPanel from "@/components/ui/MenuPanel";
import { joinClass } from "@/lib/util/client/func";

type UserPlaylist = {
	id: string;
	name: string;
	entries: {
		id: string;
		gameId: number;
	}[];
};

type ManageListsPanelProps = Readonly<{
	open: boolean;
	onClose: () => void;
	gameId: number;
	playlists: UserPlaylist[];
	pending: boolean;
	onTogglePlaylist: (listId: string, entryId?: string) => void;
}>;

export default function ManageListsPanel({ open, onClose, gameId, playlists, pending, onTogglePlaylist }: ManageListsPanelProps) {
	return (
		<MenuPanel open={open} onClose={onClose} title="Manage lists" width="30rem">
			<div className="flex flex-col gap-2">
				{playlists.length ? (
					playlists.map((playlist) => {
						const existing = playlist.entries.find((entry) => entry.gameId === gameId);

						return (
							<div key={playlist.id} className="flex min-w-0 items-center gap-3 rounded border border-border bg-bg-secondary p-3">
								<Link href={`/playlist/${playlist.id}`} className="min-w-0 flex-1 truncate font-bold text-text hover:text-primary">
									{playlist.name}
								</Link>
								<button
									type="button"
									disabled={pending}
									onClick={() => onTogglePlaylist(playlist.id, existing?.id)}
									className={joinClass(
										"grid size-8 shrink-0 cursor-pointer place-items-center rounded border transition disabled:cursor-wait disabled:opacity-60",
										existing ? "border-error text-error hover:bg-error/10" : "border-primary text-primary hover:bg-primary/10",
									)}
									aria-label={existing ? `Remove from ${playlist.name}` : `Add to ${playlist.name}`}
								>
									{existing ? <X size={16} /> : <Plus size={16} />}
								</button>
							</div>
						);
					})
				) : (
					<p className="rounded border border-border bg-bg-secondary p-3 text-sm text-text-muted">No playlists yet.</p>
				)}
			</div>
		</MenuPanel>
	);
}
