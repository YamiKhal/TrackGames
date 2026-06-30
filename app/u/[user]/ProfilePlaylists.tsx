"use client";

import GamePlaylistDisplay from "@/app/components/game/GamePlaylistDisplay";
import MenuPanel from "@/app/components/ui/MenuPanel";
import { createPlaylist } from "@/lib/actions/playlists";
import type { Playlist } from "@/lib/data/playlists";
import { Plus } from "lucide-react";
import { useState } from "react";
import { GhostButton, PrimaryButton } from "../../components/ui/Buttons";
import { Input, Textarea } from "../../components/ui/Inputs";

export default function ProfilePlaylists({ playlists, canCreate }: Readonly<{ playlists: Playlist[]; canCreate: boolean }>) {
	const [open, setOpen] = useState(false);

	return (
		<div className="flex flex-col gap-4">
			<div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
				{playlists.map((playlist) => (
					<GamePlaylistDisplay
						key={playlist.id}
						games={playlist.entries.slice(0, 4).map((entry) => entry.game)}
						title={playlist.name}
						href={`/playlist/${playlist.id}`}
					/>
				))}
				{canCreate && (
					<button
						type="button"
						onClick={() => setOpen(true)}
						className="flex aspect-80/49 w-full max-w-82 cursor-pointer flex-col items-center justify-center rounded border border-border text-text-muted transition-colors hover:border-primary hover:text-primary"
					>
						<Plus size={48} />
						<span className="mt-2 text-sm font-bold">Create playlist</span>
					</button>
				)}
				{!playlists.length && !canCreate && <p className="rounded border border-border bg-bg p-4 text-sm text-text-muted">No playlists yet.</p>}
			</div>

			<MenuPanel open={open} onClose={() => setOpen(false)} title="Create playlist" panelClassName="max-w-lg bg-bg">
				<form action={createPlaylist} className="flex flex-col gap-3">
					<label className="w-full text-sm font-bold text-text-muted">
						Name
						<Input name="name" required maxLength={80} />
					</label>
					<label className="text-sm font-bold text-text-muted">
						Description
						<Textarea name="description" rows={1} maxLength={500} />
					</label>
					<div className="mt-2 flex justify-end gap-2">
						<GhostButton type="button" onClick={() => setOpen(false)}>
							Cancel
						</GhostButton>
						<PrimaryButton type="submit">Create</PrimaryButton>
					</div>
				</form>
			</MenuPanel>
		</div>
	);
}
