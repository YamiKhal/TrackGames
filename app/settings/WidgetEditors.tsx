"use client";

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Eye, EyeOff, Plus, Search, Trash2, X } from "lucide-react";
import MarkdownWidgetEditor from "./MarkdownWidgetEditor";
import GameCard from "@/app/components/game/GameCard";
import type { Game, Widget } from "@/lib/types";
import { WidgetType } from "@/lib/enums";
import * as normalize from "@/lib/util/normalize";
import { deferEffect } from "@/lib/util/effects";
import { Input, Select } from "@/app/components/ui/Inputs";
import { useEffect, useState } from "react";

type WidgetHeaderProps = Readonly<{
	widget: Widget;
	onChange: (patch: Partial<Widget>) => void;
	onRemove: () => void;
	onMoveUp: () => void;
	onMoveDown: () => void;
	isFirst: boolean;
	isLast: boolean;
}>;

type StatsEditor = Readonly<{
	widget: Widget;
	onChange: (patch: Partial<Widget>) => void;
}>;

type GameListEditor = Readonly<{
	widget: Widget;
	onChange: (patch: Partial<Widget>) => void;
}>;

type WidgetEditorProps = Readonly<{
	widget: Widget;
	index: number;
	total: number;
	onChange: (patch: Partial<Widget>) => void;
	onRemove: () => void;
	onMoveUp: () => void;
	onMoveDown: () => void;
}>;

const statOptions = [
	{ value: "played", label: "Played" },
	{ value: "completed", label: "Completed" },
	{ value: "backlog", label: "Backlog" },
	{ value: "wishlisted", label: "Wishlist" },
	{ value: "playing", label: "Playing" },
	{ value: "paused", label: "Paused" },
	{ value: "dropped", label: "Dropped" },
	{ value: "hours", label: "Hours" },
	{ value: "total", label: "Total" },
];

function WidgetHeader({ widget, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast }: WidgetHeaderProps) {
	return (
		<div className="flex flex-col gap-3 pb-3 md:flex-row md:items-center md:justify-between">
			<button
				type="button"
				onClick={() => onChange({ visible: !widget.visible })}
				className="flex cursor-pointer flex-row items-center gap-2 rounded p-2 text-text-muted hover:text-primary"
				aria-label={widget.visible ? "Hide widget" : "Show widget"}
				title={widget.visible ? "Hide widget" : "Show widget"}
			>
				{widget.visible ? <Eye size={18} /> : <EyeOff size={18} />}
				<span>{widget.visible ? "Visible" : "Hidden"}</span>
			</button>
			<div className="flex items-center gap-1">
				<button
					type="button"
					onClick={onMoveUp}
					disabled={isFirst}
					className="cursor-pointer rounded p-2 text-text-muted hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
					aria-label="Move widget up"
					title="Move widget up"
				>
					<ChevronUp size={18} />
				</button>
				<button
					type="button"
					onClick={onMoveDown}
					disabled={isLast}
					className="cursor-pointer rounded p-2 text-text-muted hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
					aria-label="Move widget down"
					title="Move widget down"
				>
					<ChevronDown size={18} />
				</button>
				<button type="button" onClick={onRemove} className="cursor-pointer rounded p-2 text-text-muted hover:text-error" aria-label="Remove widget" title="Remove widget">
					<Trash2 size={18} />
				</button>
			</div>
		</div>
	);
}

function StatsEditor({ widget, onChange }: StatsEditor) {
	const selectedStats = widget.stats;
	const availableStats = statOptions.filter((stat) => !selectedStats.includes(stat.value));

	return (
		<div className="mt-3 flex flex-col gap-3">
			<Select
				value=""
				onChange={(event) => {
					const value = event.target.value;
					if (!value) return;
					onChange({ stats: [...selectedStats, value] });
				}}
				className="max-w-36 rounded border border-border p-1 pl-2"
			>
				<option value="" disabled>
					Add stat
				</option>
				{availableStats.map((stat) => (
					<option key={stat.value} value={stat.value}>
						{stat.label}
					</option>
				))}
			</Select>
			{selectedStats.length === 0 ? (
				<p className="text-sm text-text-muted">No stats selected.</p>
			) : (
				<div className="grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]">
					{selectedStats.map((stat, index) => (
						<div key={stat} className="flex min-h-28 min-w-0 flex-col items-center justify-center gap-3 rounded border border-primary/80 bg-primary/5 p-3">
							<p className="mt-2 truncate text-2xl leading-tight font-semibold text-text">000</p>
							<p className="text-md mt-2 truncate leading-tight font-semibold text-text-muted">{normalize.label(statOptions, "value", "label", stat, stat)}</p>
							<div className="flex items-center justify-end gap-1 pt-2">
								<button
									type="button"
									onClick={() => onChange({ stats: moveItem(selectedStats, index, -1) })}
									disabled={index === 0}
									className="cursor-pointer rounded p-1.5 text-text-muted hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
									aria-label="Move stat left"
									title="Move stat left"
								>
									<ChevronLeft size={17} />
								</button>
								<button
									type="button"
									onClick={() => onChange({ stats: moveItem(selectedStats, index, 1) })}
									disabled={index === selectedStats.length - 1}
									className="cursor-pointer rounded p-1.5 text-text-muted hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
									aria-label="Move stat right"
									title="Move stat right"
								>
									<ChevronRight size={17} />
								</button>
								<button
									type="button"
									onClick={() => onChange({ stats: selectedStats.filter((item) => item !== stat) })}
									className="cursor-pointer rounded p-1.5 text-text-muted hover:text-error"
									aria-label="Remove stat"
									title="Remove stat"
								>
									<Trash2 size={17} />
								</button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

function GameListEditor({ widget, onChange }: GameListEditor) {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<Game[]>([]);
	const [selectedGames, setSelectedGames] = useState<Game[]>([]);
	const [loading, setLoading] = useState(false);
	const selectedKey = widget.games.join(",");

	useEffect(() => {
		if (!widget.games.length) {
			return deferEffect(() => {
				setSelectedGames([]);
			});
		}

		const controller = new AbortController();

		fetch(`/api/games/library?ids=${selectedKey}`, { signal: controller.signal })
			.then((response) => (response.ok ? response.json() : []))
			.then((games: Game[]) => {
				if (!controller.signal.aborted) setSelectedGames(games);
			})
			.catch(() => {
				if (!controller.signal.aborted) setSelectedGames([]);
			});

		return () => controller.abort();
	}, [selectedKey, widget.games.length]);

	useEffect(() => {
		const search = query.trim();

		if (search.length < 2) {
			return deferEffect(() => {
				setResults([]);
				setLoading(false);
			});
		}

		const controller = new AbortController();
		const timer = globalThis.setTimeout(async () => {
			setLoading(true);

			try {
				const response = await fetch(`/api/games/library?q=${encodeURIComponent(search)}`, {
					signal: controller.signal,
				});

				setResults(response.ok ? await response.json() : []);
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
	}, [query]);

	return (
		<div className="mt-3 flex flex-col gap-3">
			<label>
				<span className="text-sm font-bold text-text-muted">Title</span>
				<Input value={widget.title} onChange={(event) => onChange({ title: event.target.value })} />
			</label>
			<div>
				<span className="text-sm font-bold text-text-muted">Games</span>
				<div className="mt-2 flex flex-col gap-3">
					<div className="relative">
						<Search className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-faint" size={17} aria-hidden="true" />
						<Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Add game from your library" className="pr-9 pl-9" />
						{query && (
							<button
								type="button"
								onClick={() => {
									setQuery("");
									setResults([]);
								}}
								className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 cursor-pointer place-items-center rounded text-text-faint hover:text-primary"
								aria-label="Clear game search"
								title="Clear game search"
							>
								<X size={16} />
							</button>
						)}
					</div>
					{query.trim().length >= 2 && (
						<div className="overflow-hidden rounded border border-border bg-bg-secondary">
							{loading && <p className="p-3 text-sm text-text-muted">Searching...</p>}
							{!loading && results.length === 0 && <p className="p-3 text-sm text-text-muted">No library games found.</p>}
							{!loading &&
								results.map((game) => {
									const added = Boolean(game.id && widget.games.includes(game.id));

									return (
										<button
											key={game.id}
											type="button"
											disabled={added}
											onClick={() => {
												if (!game.id) return;

												onChange({ games: [...widget.games, game.id] });
												setSelectedGames((games) => selectedGamesConFilter(games, game));
												setQuery("");
												setResults([]);
											}}
											className="flex w-full cursor-pointer items-center justify-between gap-3 border-b border-border px-3 py-2 text-left last:border-b-0 hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
										>
											<span className="min-w-0">
												<span className="block truncate text-sm font-bold text-text">{game.name}</span>
												<span className="text-xs text-text-muted">{game.releaseDate ? new Date(game.releaseDate).getFullYear() : "Unknown release"}</span>
											</span>
											<span className="flex shrink-0 items-center gap-1 text-xs font-bold text-primary">
												<Plus size={14} />
												{added ? "Added" : "Add"}
											</span>
										</button>
									);
								})}
						</div>
					)}
					{selectedGames.length === 0 ? (
						<p className="text-sm text-text-muted">No games selected.</p>
					) : (
						<div className="grid gap-3 sm:grid-cols-[repeat(auto-fill,7rem)]">
							{selectedGames.map((game, index) => (
								<div key={game.id} className="flex min-w-0 flex-col gap-2 rounded border border-border bg-bg-secondary p-2">
									<GameCard game={game} size={96} hover="name" />
									<div className="flex items-center justify-center gap-1">
										<button
											type="button"
											onClick={() => {
												onChange({ games: moveItem(widget.games, index, -1) });
												setSelectedGames((games) => moveItem(games, index, -1));
											}}
											disabled={index === 0}
											className="cursor-pointer rounded p-1.5 text-text-muted hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
											aria-label="Move game left"
											title="Move game left"
										>
											<ChevronLeft size={16} />
										</button>
										<button
											type="button"
											onClick={() => {
												onChange({ games: moveItem(widget.games, index, 1) });
												setSelectedGames((games) => moveItem(games, index, 1));
											}}
											disabled={index === selectedGames.length - 1}
											className="cursor-pointer rounded p-1.5 text-text-muted hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
											aria-label="Move game right"
											title="Move game right"
										>
											<ChevronRight size={16} />
										</button>
										<button
											type="button"
											onClick={() => {
												onChange({ games: widget.games.filter((id) => id !== game.id) });
												setSelectedGames((games) => selectedGamesFilter(games, game));
											}}
											className="cursor-pointer rounded p-1.5 text-text-muted hover:text-error"
											aria-label="Remove game"
											title="Remove game"
										>
											<Trash2 size={16} />
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
	const targetIndex = index + direction;

	if (targetIndex < 0 || targetIndex >= items.length) return items;

	const next = [...items];
	[next[index], next[targetIndex]] = [next[targetIndex], next[index]];
	return next;
}

function selectedGamesConFilter(games: Game[], game: Game) {
	return games.some((item) => item.id === game.id) ? games : [...games, game];
}

function selectedGamesFilter(games: Game[], game: Game) {
	return games.filter((item) => item.id !== game.id);
}

export function WidgetEditor({ widget, index, total, onChange, onRemove, onMoveUp, onMoveDown }: WidgetEditorProps) {
	return (
		<div className="border-b border-border p-3 pb-6">
			<WidgetHeader widget={widget} onChange={onChange} onRemove={onRemove} onMoveUp={onMoveUp} onMoveDown={onMoveDown} isFirst={index === 0} isLast={index === total - 1} />
			{widget.type === WidgetType.STATS && <StatsEditor widget={widget} onChange={onChange} />}
			{widget.type === WidgetType.GAMELIST && <GameListEditor widget={widget} onChange={onChange} />}
			{widget.type === WidgetType.MARKDOWN && <MarkdownWidgetEditor value={widget.content} onChange={(content) => onChange({ content })} />}
		</div>
	);
}
