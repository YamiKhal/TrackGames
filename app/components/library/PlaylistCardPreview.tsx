"use client";

import { GameStatus } from "@/lib/generated/prisma/enums";
import { ImageIdToURL } from "@/lib/external/igdb/util";
import type { UserLibraryEntryWithTags } from "@/lib/data/library";
import { ratingToFive } from "@/lib/util/rating";
import { Edit3, NotebookText } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import StarRating from "../game/StarRating";
import { GhostButton } from "../ui/Buttons";

type PlaylistCardPreviewProps = Readonly<{
	entry: UserLibraryEntryWithTags;
	mode: "grid" | "list";
	canEdit: boolean;
	onOpenInfo: () => void;
	onOpenNotes: () => void;
	onOpenEditor: () => void;
}>;

export function statusLabel(status: string) {
	return status.toLowerCase().replace("_", " ");
}

export function statusColor(status: GameStatus) {
	if (status === GameStatus.PLAYING) return "bg-primary";
	if (status === GameStatus.COMPLETED) return "bg-success";
	if (status === GameStatus.DROPPED) return "bg-error";
	if (status === GameStatus.PAUSED) return "bg-warning";
	if (status === GameStatus.WISHLIST) return "bg-secondary";
	return "bg-text-faint";
}

export default function PlaylistCardPreview({ entry, mode, canEdit, onOpenInfo, onOpenNotes, onOpenEditor }: PlaylistCardPreviewProps) {
	const game = entry.game;
	const src = ImageIdToURL(game.cover ?? undefined);
	const hasNotes = Boolean(entry.notes?.trim());

	if (mode === "grid") {
		return (
			<div className="group relative min-w-0 overflow-hidden rounded border border-border bg-bg-secondary">
				<button type="button" onClick={onOpenInfo} className="block w-full cursor-pointer md:hidden">
					<div className="relative aspect-5/7 bg-bg">{src && <Image src={src} alt={game.name ?? "game cover"} fill sizes="160px" className="object-cover" />}</div>
				</button>
				<Link href={`/game/${game.slug}`} className="hidden md:block">
					<div className="relative aspect-5/7 bg-bg">
						{src && <Image src={src} alt={game.name ?? "game cover"} fill sizes="160px" className="object-cover" />}
						<span className="absolute top-2 left-2 z-10 hidden max-w-[calc(100%-1rem)] items-center gap-2 rounded bg-bg-secondary/90 px-2 py-1 text-xs font-bold text-text capitalize opacity-0 transition-opacity group-hover:opacity-100 md:flex">
							<span className={`size-2 shrink-0 rounded-full ${statusColor(entry.status)}`} aria-hidden="true" />
							<span className="truncate">{statusLabel(entry.status)}</span>
						</span>
						<div className="absolute inset-0 flex flex-col justify-end bg-bg/85 p-3 opacity-0 transition-opacity group-hover:opacity-100">
							{hasNotes && (
								<button
									type="button"
									onClick={(event) => {
										event.preventDefault();
										onOpenNotes();
									}}
									className="grid size-8 cursor-pointer rounded text-text-muted transition hover:text-primary"
									aria-label="View notes"
								>
									<NotebookText size={16} aria-hidden="true" />
								</button>
							)}
							<p className="truncate text-sm font-bold text-text">{game.name}</p>
							<div className="mt-2 flex flex-col gap-2 text-xs text-text-muted">
								<StarRating rating={ratingToFive(entry.rating)} />
								<span>{entry.timePlayed === null ? "" : `${entry.timePlayed}h`}</span>
							</div>
						</div>
					</div>
				</Link>
				{canEdit && (
					<button
						type="button"
						onClick={onOpenEditor}
						className="absolute right-2 bottom-2 hidden size-8 cursor-pointer place-items-center rounded bg-bg-secondary/90 text-text-muted opacity-0 transition group-hover:opacity-100 hover:text-primary md:grid"
						aria-label="Edit library entry"
					>
						<Edit3 size={16} aria-hidden="true" />
					</button>
				)}
			</div>
		);
	}

	return (
		<div className="flex min-w-0 flex-row items-center gap-2 border-border p-2 not-last:border-b md:gap-4">
			<Link href={`/game/${game.slug}`} className="relative h-18 w-12 shrink-0 overflow-hidden rounded bg-bg md:h-20 md:w-14">
				{src && <Image src={src} alt={game.name ?? "game cover"} fill sizes="56px" className="object-cover" />}
			</Link>
			<div className="min-w-0 flex-1">
				<div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-2 text-xs text-text-muted md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-4">
					<p className="hidden truncate text-sm font-bold text-text md:block">{game.name}</p>
					<span className="flex min-w-0 items-center gap-2 capitalize md:justify-end">
						<span className={`size-2 rounded-full ${statusColor(entry.status)}`} aria-hidden="true" />
						<span className="truncate">{statusLabel(entry.status)}</span>
					</span>
					<span className="hidden min-w-18 justify-end md:flex">
						<StarRating rating={ratingToFive(entry.rating ?? 0)} />
					</span>
					<span className="justify-self-end font-bold text-text md:hidden">{(ratingToFive(entry.rating ?? 0) ?? 0).toFixed(1)}/5</span>
					<span className="justify-self-end text-right md:hidden">{entry.timePlayed === null ? "No time" : `${entry.timePlayed}h`}</span>
					<span className="grid size-7 place-items-center justify-self-end md:size-8">
						{hasNotes && (
							<button
								type="button"
								onClick={onOpenNotes}
								className="grid size-7 cursor-pointer place-items-center rounded text-text-muted transition hover:text-primary md:size-8"
								aria-label="View notes"
							>
								<NotebookText size={16} aria-hidden="true" />
							</button>
						)}
					</span>
					<span className="hidden min-w-16 text-right md:block">{entry.timePlayed === null ? "No time" : `${entry.timePlayed}h`}</span>
				</div>
			</div>
			{canEdit && (
				<>
					<button
						type="button"
						onClick={onOpenEditor}
						className="grid size-8 shrink-0 cursor-pointer place-items-center rounded border border-text-faint text-text-muted transition-colors hover:border-primary hover:text-primary md:hidden"
						aria-label="Edit library entry"
					>
						<Edit3 size={14} aria-hidden="true" />
					</button>
					<GhostButton type="button" onClick={onOpenEditor} className="hidden px-3 py-2 md:flex">
						<Edit3 size={16} aria-hidden="true" />
					</GhostButton>
				</>
			)}
		</div>
	);
}
