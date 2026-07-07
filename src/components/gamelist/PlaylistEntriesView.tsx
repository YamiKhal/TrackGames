"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { GameCard } from "@/components/game/GameDisplay";
import GameEntryMenu from "@/components/game/GameEntryMenu";
import { GameEntryHoverOverlay, GameEntryStatusBadge } from "@/components/game/GameEntryStats";
import StarRating from "@/components/game/StarRating";
import AdvancedLibraryFilterPanel, { emptyAdvancedLibraryFilters } from "@/components/gamelist/AdvancedListFilter";
import { AdvancedFilterButton } from "@/components/ui/control/Button";
import EmptyState from "@/components/ui/EmptyState";
import FilterBar from "@/components/ui/FilterBar";
import { type UserLibraryEntryWithTags } from "@/lib/data/gamelist/library";
import type { PlaylistEntry } from "@/lib/data/gamelist/lists";
import { advancedFilterCount, matchesAdvancedFilters } from "@/lib/util/filtering";
import { ratingToFive } from "@/lib/util/format/rating";

type PlaylistEntriesViewProps = Readonly<{
	listId: string;
	entries: PlaylistEntry[];
	mode: string;
	canEdit: boolean;
	isLoggedIn: boolean;
	tiers: string[];
	tierColors: string[];
}>;

export default function PlaylistEntriesView({ listId, entries, mode, canEdit, isLoggedIn, tiers, tierColors }: PlaylistEntriesViewProps) {
	const [query, setQuery] = useState("");
	const [sort, setSort] = useState("position");
	const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
	const [advancedFilters, setAdvancedFilters] = useState(emptyAdvancedLibraryFilters);
	const ordered = useMemo(() => [...entries].sort((a, b) => (a.position ?? 999999) - (b.position ?? 999999) || Number(a.addedAt ?? 0) - Number(b.addedAt ?? 0)), [entries]);
	const allTags = useMemo(
		() => Array.from(new Set(entries.flatMap((entry) => entry.userEntry?.tags.map((tag) => tag.name) ?? []))).sort((a, b) => a.localeCompare(b)),
		[entries],
	);
	const filterCount = advancedFilterCount(advancedFilters);
	const filtered = useMemo(() => {
		const search = query.trim().toLowerCase();

		return entries
			.filter((entry) => {
				if (search && !(entry.game.name ?? "").toLowerCase().includes(search)) return false;

				if (!filterCount) return true;

				const userEntry = entry.userEntry;
				if (!userEntry) return false;

				return matchesAdvancedFilters(userEntry as UserLibraryEntryWithTags, advancedFilters);
			})
			.sort((a, b) => {
				if (sort === "name") return (a.game.name ?? "").localeCompare(b.game.name ?? "");
				if (sort === "release") return Number(b.game.releaseDate ?? 0) - Number(a.game.releaseDate ?? 0);
				if (sort === "added") return Number(b.addedAt ?? 0) - Number(a.addedAt ?? 0);
				return (a.position ?? 0) - (b.position ?? 0);
			});
	}, [filterCount, advancedFilters, entries, query, sort]);

	function playlistEditorFor(entry: PlaylistEntry) {
		return canEdit ? { listId, entryId: entry.id, position: entry.position, tier: entry.tier, tiers } : null;
	}

	if (!entries.length) {
		return <p className="rounded bg-bg p-4 text-text-muted">No games in this playlist yet.</p>;
	}

	if (mode === "RANKING") {
		return (
			<div className="flex flex-col gap-2">
				{ordered.map((entry, index) => (
					<GameEntryMenu
						key={entry.id}
						gameId={entry.game.id}
						gameSlug={entry.game.slug}
						gameName={entry.game.name}
						gameCover={entry.game.cover}
						isLoggedIn={isLoggedIn}
						libraryEntry={entry.userEntry ?? null}
						playlistEditor={playlistEditorFor(entry)}
					>
						{(ctrl) => (
							<Link
								href={`/game/${entry.game.slug}`}
								onClick={ctrl.onTileClick}
								className="grid grid-cols-[3rem_4rem_minmax(0,1fr)] items-center gap-4 border-b border-border bg-bg p-3 hover:border-primary"
							>
								<p className="text-center text-2xl font-bold text-primary">#{index + 1}</p>
								<GameCard game={entry.game} size={56} />
								<div className="min-w-0 pr-10">
									<p className="truncate font-bold">{entry.game.name}</p>
									<div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-text-muted">
										<span>{entry.game.releaseDate ? new Date(entry.game.releaseDate).getFullYear() : "Unknown release"}</span>
										{entry.userEntry && (
											<>
												<GameEntryStatusBadge entry={entry.userEntry} />
												<StarRating rating={ratingToFive(entry.userEntry.rating)} size={13} />
												{entry.userEntry.timePlayed != null && <span>{entry.userEntry.timePlayed}h</span>}
											</>
										)}
									</div>
								</div>
							</Link>
						)}
					</GameEntryMenu>
				))}
			</div>
		);
	}

	if (mode === "TIER") {
		return (
			<div className="flex flex-col">
				{tiers.map((tier, index) => {
					const tierEntries = ordered.filter((entry) => (entry.tier ?? tiers[0] ?? "A") === tier);

					return (
						<div key={tier} className="grid grid-cols-[4rem_minmax(0,1fr)] overflow-hidden border-border bg-bg not-last:border-b">
							<div
								className="flex items-center justify-center text-2xl font-bold"
								style={{ backgroundColor: tierColors[index] ?? "var(--primary)", color: "var(--text)" }}
							>
								{tier}
							</div>
							<div className="grid min-h-38 grid-cols-[repeat(auto-fill,7rem)] p-3">
								{tierEntries.map((entry) => (
									<GameEntryMenu
										key={entry.id}
										gameId={entry.game.id}
										gameSlug={entry.game.slug}
										gameName={entry.game.name}
										gameCover={entry.game.cover}
										isLoggedIn={isLoggedIn}
										libraryEntry={entry.userEntry ?? null}
										playlistEditor={playlistEditorFor(entry)}
									>
										{(ctrl) => (
											<Link href={`/game/${entry.game.slug}`} onClick={ctrl.onTileClick} className="group relative inline-block overflow-hidden rounded">
												<GameCard game={entry.game} size={96} />
												<GameEntryHoverOverlay name={entry.game.name ?? ""} entry={entry.userEntry ?? null} />
											</Link>
										)}
									</GameEntryMenu>
								))}
							</div>
						</div>
					);
				})}
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<FilterBar
				filters={[
					{ type: "search", value: query, onChange: setQuery, placeholder: "Search playlist" },
					{
						type: "select",
						label: "Sort playlist",
						value: sort,
						onChange: setSort,
						options: [
							{ value: "position", label: "Playlist order" },
							{ value: "added", label: "Recently added" },
							{ value: "name", label: "Name" },
							{ value: "release", label: "Release date" },
						],
					},
				]}
				actions={<AdvancedFilterButton onClick={() => setShowAdvancedFilters(true)} filterCount={filterCount} />}
			/>
			<AdvancedLibraryFilterPanel
				open={showAdvancedFilters}
				onClose={() => setShowAdvancedFilters(false)}
				filters={advancedFilters}
				onChange={setAdvancedFilters}
				tags={allTags}
				onReset={() => setAdvancedFilters(emptyAdvancedLibraryFilters)}
			/>
			{filtered.length ? (
				<div className="grid w-full grid-cols-[repeat(auto-fill,5rem)] items-center justify-center gap-2 md:grid-cols-[repeat(auto-fill,8rem)] md:gap-4">
					{filtered.map((entry) => (
						<GameEntryMenu
							key={entry.id}
							gameId={entry.game.id}
							gameSlug={entry.game.slug}
							gameName={entry.game.name}
							gameCover={entry.game.cover}
							isLoggedIn={isLoggedIn}
							libraryEntry={entry.userEntry ?? null}
							playlistEditor={playlistEditorFor(entry)}
						>
							{(ctrl) => (
								<Link href={`/game/${entry.game.slug}`} onClick={ctrl.onTileClick} className="group relative inline-block overflow-hidden rounded">
									<div className="hidden md:block">
										<GameCard game={entry.game} size={130} />
									</div>
									<div className="block md:hidden">
										<GameCard game={entry.game} size={80} />
									</div>
									<GameEntryHoverOverlay name={entry.game.name ?? ""} entry={entry.userEntry ?? null} />
								</Link>
							)}
						</GameEntryMenu>
					))}
				</div>
			) : (
				<EmptyState icon={SearchX} message="No games found." />
			)}
		</div>
	);
}
