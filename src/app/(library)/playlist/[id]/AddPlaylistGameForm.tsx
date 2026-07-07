"use client";

import { useEffect, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { PrimaryButton } from "@/components/ui/control/Button";
import { Select } from "@/components/ui/control/Select";
import { TextInput } from "@/components/ui/control/TextInput";
import { addGameToPlaylist } from "@/lib/actions/gamelist/lists";
import type { Game } from "@/lib/data/catalog/games";
import { deferHook } from "@/lib/util/client/func";

type AddPlaylistGameFormProps = Readonly<{ playlistId: string; mode: string; tiers: string[]; existingGameIds: number[] }>;

export default function AddPlaylistGameForm({ playlistId, mode, tiers, existingGameIds }: AddPlaylistGameFormProps) {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<Game[]>([]);
	const [game, setGame] = useState<Game | null>(null);
	const [loading, setLoading] = useState(false);
	const action = async (formData: FormData) => {
		await addGameToPlaylist(playlistId, formData);
	};

	useEffect(() => {
		const search = query.trim();

		if (search.length < 2) {
			return deferHook(() => {
				setResults([]);
				setLoading(false);
			});
		}

		const controller = new AbortController();
		const timer = globalThis.setTimeout(async () => {
			setLoading(true);

			try {
				const response = await fetch(`/api/games/search?q=${encodeURIComponent(search)}`, {
					signal: controller.signal,
				});

				const games = response.ok ? ((await response.json()) as Game[]) : [];

				setResults(games.filter((game) => game.id && !existingGameIds.includes(game.id)));
			} catch {
				if (!controller.signal.aborted) setResults([]);
			} finally {
				if (!controller.signal.aborted) setLoading(false);
			}
		}, 180);

		return () => {
			controller.abort();
			globalThis.clearTimeout(timer);
		};
	}, [existingGameIds, query]);

	return (
		<form action={action} className="rounded bg-bg p-4">
			<h2 className="mb-2 border-b border-border pb-2 text-sm font-bold">Add games</h2>
			<input type="hidden" name="gameId" value={game?.id ?? ""} />
			<div className="flex flex-col gap-3">
				<div className="relative">
					<Search className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-faint" size={17} />
					<TextInput
						value={game?.name ?? query}
						onChange={(event) => {
							setGame(null);
							setQuery(event.target.value);
						}}
						placeholder="Search games"
						className="pr-9 pl-9"
					/>
					{(query || game) && (
						<button
							type="button"
							onClick={() => {
								setQuery("");
								setResults([]);
								setGame(null);
							}}
							className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 cursor-pointer place-items-center rounded text-text-faint hover:text-primary"
							aria-label="Clear game"
						>
							<X size={16} />
						</button>
					)}
				</div>

				{!game && query.trim().length >= 2 && (
					<div className="overflow-hidden rounded border border-border bg-bg-secondary">
						{loading && <p className="p-3 text-sm text-text-muted">Searching...</p>}
						{!loading && results.length === 0 && <p className="p-3 text-sm text-text-muted">No games found.</p>}
						{!loading &&
							results.map((result) => (
								<button
									key={result.id}
									type="button"
									onClick={() => {
										setGame(result);
										setQuery("");
										setResults([]);
									}}
									className="flex w-full cursor-pointer items-center justify-between gap-3 border-b border-border px-3 py-2 text-left last:border-b-0 hover:bg-surface"
								>
									<span className="truncate text-sm font-bold">{result.name}</span>
									<Plus size={14} className="text-primary" />
								</button>
							))}
					</div>
				)}

				{mode === "TIER" && (
					<Select label="Tier" name="tier" defaultValue="A" className="w-full">
						{tiers.map((tier) => (
							<option key={tier} value={tier}>
								{tier}
							</option>
						))}
					</Select>
				)}

				<PrimaryButton type="submit" disabled={!game} className="w-fit px-4">
					<Plus size={16} />
					Add game
				</PrimaryButton>
			</div>
		</form>
	);
}
