"use client";

import { useState, useTransition } from "react";
import { Bookmark, CheckCircle2, CirclePause, Heart, Library, ListPlus, NotebookText, Trophy, XCircle } from "lucide-react";
import StarRating from "@/components/game/StarRating";
import ManageListsPanel from "@/components/library/ManageListsPanel";
import { FloatedSquareButton, GhostButton, PrimaryButton } from "@/components/ui/Buttons";
import ConfirmAction from "@/components/ui/ConfirmAction";
import MenuPanel from "@/components/ui/MenuPanel";
import { addGameToLibrary, removeGameFromLibrary, setGameLibraryStatus, updateGameQuickRating } from "@/lib/actions/library";
import { addGameToPlaylist, removeGameFromPlaylist } from "@/lib/actions/playlists";
import { GameStatus } from "@/lib/generated/prisma/enums";
import { joinClass } from "@/lib/util/client/func";
import { ratingToFive } from "@/lib/util/format/rating";

type UserPlaylist = {
	id: string;
	name: string;
	entries: {
		id: string;
		gameId: number;
	}[];
};

type EntryState = {
	id: string;
	status: GameStatus;
	rating: number | null;
} | null;

type GameLibraryButtonPanelProps = Readonly<{
	gameId: number;
	gameSlug: string;
	isLoggedIn: boolean;
	entry: EntryState;
	playlists: UserPlaylist[];
	logsHref?: string;
}>;

const statusOptions = [
	{
		status: GameStatus.PLAYING,
		label: "Playing",
		icon: CheckCircle2,
		className: "border-primary text-primary",
		activeClassName: "border-primary bg-primary text-text-inverse",
	},
	{
		status: GameStatus.COMPLETED,
		label: "Completed",
		icon: Trophy,
		className: "border-success text-success",
		activeClassName: "border-success bg-success text-text-inverse",
	},
	{
		status: GameStatus.PAUSED,
		label: "Paused",
		icon: CirclePause,
		className: "border-warning text-warning",
		activeClassName: "border-warning bg-warning text-text-inverse",
	},
	{
		status: GameStatus.DROPPED,
		label: "Dropped",
		icon: XCircle,
		className: "border-error text-error",
		activeClassName: "border-error bg-error text-text-inverse",
	},
];

function removeGameEntryFromPlaylists(current: UserPlaylist[], listId: string, entryId: string) {
	const next: UserPlaylist[] = [];

	for (const playlist of current) {
		if (playlist.id !== listId) {
			next.push(playlist);
			continue;
		}

		const entries: { id: string; gameId: number }[] = [];
		for (const playlistEntry of playlist.entries) {
			if (playlistEntry.id !== entryId) {
				entries.push(playlistEntry);
			}
		}

		next.push({ ...playlist, entries });
	}

	return next;
}

function addGameEntryToPlaylists(current: UserPlaylist[], listId: string, entryId: string, gameId: number) {
	const next: UserPlaylist[] = [];

	for (const playlist of current) {
		if (playlist.id !== listId) {
			next.push(playlist);
			continue;
		}

		const entries: { id: string; gameId: number }[] = [];
		for (const playlistEntry of playlist.entries) {
			if (playlistEntry.gameId !== gameId) {
				entries.push(playlistEntry);
			}
		}

		entries.push({ id: entryId, gameId });
		next.push({ ...playlist, entries });
	}

	return next;
}

export default function GameLibraryButtonPanel({ gameId, gameSlug, isLoggedIn, entry, playlists, logsHref }: GameLibraryButtonPanelProps) {
	const [currentEntry, setCurrentEntry] = useState(entry);
	const [rating, setRating] = useState(ratingToFive(entry?.rating) ?? 0);
	const [userPlaylists, setUserPlaylists] = useState(playlists);
	const [confirming, setConfirming] = useState(false);
	const [managingStatus, setManagingStatus] = useState(false);
	const [managingLists, setManagingLists] = useState(false);
	const [error, setError] = useState("");
	const [pending, startTransition] = useTransition();
	const isInLibrary = Boolean(currentEntry);
	const currentStatus = statusOptions.find((option) => option.status === currentEntry?.status);
	const CurrentStatusIcon = currentStatus?.icon ?? Library;

	if (!isLoggedIn) {
		return (
			<div className="flex flex-row">
				<PrimaryButton href="/login">Log in to add</PrimaryButton>
			</div>
		);
	}

	function setStatus(status: GameStatus) {
		setError("");
		startTransition(async () => {
			const result = await setGameLibraryStatus(gameId, gameSlug, status);
			if ("error" in result) {
				setError(result.error);
				return;
			}

			setCurrentEntry(result);
			setManagingStatus(false);
		});
	}

	function saveRating(value: number) {
		setError("");
		const previousRating = rating;
		setRating(value);
		startTransition(async () => {
			try {
				const result = await updateGameQuickRating(gameId, gameSlug, value);
				setCurrentEntry(result);
			} catch {
				setRating(previousRating);
				setError("Could not save rating. Try again.");
			}
		});
	}

	function togglePlaylist(listId: string, entryId?: string) {
		setError("");
		startTransition(async () => {
			if (entryId) {
				const result = await removeGameFromPlaylist(listId, entryId);
				if (result && "error" in result) {
					setError(result.error);
					return;
				}

				setUserPlaylists((current) => removeGameEntryFromPlaylists(current, listId, entryId));
				return;
			}

			const formData = new FormData();
			formData.set("gameId", String(gameId));
			const entry = await addGameToPlaylist(listId, formData);
			if ("error" in entry) {
				setError(entry.error);
				return;
			}

			setUserPlaylists((current) => addGameEntryToPlaylists(current, listId, entry.id, gameId));
		});
	}

	const inLibrary = isInLibrary ? "border-primary bg-primary text-text-inverse" : "border-text-faint text-text-muted hover:border-primary hover:text-primary";

	return (
		<div className="flex flex-col gap-3 md:grid md:max-w-xl md:grid-cols-[auto_auto_auto_auto_auto] md:items-start md:gap-x-4 md:gap-y-4">
			<div className="flex w-full flex-row flex-wrap items-center justify-center gap-3 md:col-span-full md:justify-start">
				<div className="flex flex-row items-center justify-center p-1 md:w-fit md:justify-start">
					<StarRating rating={rating} size={32} isInteractive onChange={saveRating} />
				</div>
			</div>
			{error && <p className="rounded border border-error/40 bg-error/10 p-3 text-sm font-bold text-error md:col-span-full">{error}</p>}
			<div className="mb-5 flex flex-row flex-wrap justify-center gap-x-5 gap-y-3 md:contents">
				<FloatedSquareButton
					type="button"
					title={isInLibrary ? "Manage library status" : "Add to library"}
					aria-label={isInLibrary ? "Manage library status" : "Add to library"}
					label={currentStatus?.label ?? (isInLibrary ? "Library" : "Add")}
					labelClassName="max-w-18 truncate"
					disabled={pending}
					onClick={() =>
						isInLibrary
							? setManagingStatus(true)
							: startTransition(async () => {
									setError("");
									try {
										const result = await addGameToLibrary(gameId, gameSlug);
										setCurrentEntry(result);
									} catch {
										setError("Could not add game to library. Try again.");
									}
								})
					}
					className={currentStatus ? currentStatus.activeClassName : inLibrary}
				>
					<CurrentStatusIcon size={21} />
				</FloatedSquareButton>
				<FloatedSquareButton
					type="button"
					title="Backlog"
					aria-label="Backlog"
					label="Backlog"
					disabled={pending}
					onClick={() => setStatus(GameStatus.BACKLOG)}
					className={
						currentEntry?.status === GameStatus.BACKLOG
							? "border-secondary bg-secondary text-text-inverse"
							: "border-text-faint text-text-muted hover:border-secondary hover:text-secondary"
					}
				>
					<Bookmark size={21} />
				</FloatedSquareButton>
				<FloatedSquareButton
					type="button"
					title="Wishlist"
					aria-label="Wishlist"
					label="Wishlist"
					disabled={pending}
					onClick={() => setStatus(GameStatus.WISHLIST)}
					className={
						currentEntry?.status === GameStatus.WISHLIST
							? "border-secondary bg-secondary text-text-inverse"
							: "border-text-faint text-text-muted hover:border-secondary hover:text-secondary"
					}
				>
					<Heart size={21} />
				</FloatedSquareButton>
				<ConfirmAction
					open={confirming}
					title="Remove from library?"
					message="This will delete this library entry, including all play logs and related data for it."
					confirmLabel="Remove"
					pending={pending}
					onClose={() => setConfirming(false)}
					onConfirm={() =>
						startTransition(async () => {
							setError("");
							try {
								const result = await removeGameFromLibrary(gameId, gameSlug);
								setCurrentEntry(result.inLibrary ? currentEntry : null);
								if (!result.inLibrary) setRating(0);
								setConfirming(false);
							} catch {
								setError("Could not remove game from library. Try again.");
							}
						})
					}
				/>
				<MenuPanel open={managingStatus} onClose={() => setManagingStatus(false)} title="Library status" width="26rem">
					<div className="flex flex-col gap-3">
						<div className="flex flex-col gap-2">
							{statusOptions.map((option) => {
								const Icon = option.icon;

								return (
									<button
										key={option.status}
										type="button"
										disabled={pending}
										onClick={() => setStatus(option.status)}
										className={joinClass(
											"flex cursor-pointer items-center gap-3 rounded border p-3 text-sm font-bold transition hover:bg-bg-secondary disabled:cursor-wait disabled:opacity-60",
											option.className,
											currentEntry?.status === option.status && "bg-bg-secondary",
										)}
									>
										<Icon size={17} />
										{option.label}
									</button>
								);
							})}
						</div>
						<div className="border-t border-border pt-3">
							<GhostButton
								type="button"
								disabled={pending}
								onClick={() => {
									setManagingStatus(false);
									setConfirming(true);
								}}
								className="w-full justify-center border-error text-error hover:border-error hover:text-error disabled:cursor-wait disabled:opacity-60"
							>
								Remove from library
							</GhostButton>
						</div>
					</div>
				</MenuPanel>
			</div>
			<div className="flex flex-row flex-wrap justify-center gap-3 md:contents">
				{logsHref && (
					<GhostButton href={logsHref} className="h-12 px-5">
						<NotebookText size={18} />
						Logs
					</GhostButton>
				)}
				<GhostButton type="button" disabled={pending} onClick={() => setManagingLists(true)} className="h-12 px-5 disabled:cursor-wait disabled:opacity-60">
					<ListPlus size={18} />
					Manage lists
				</GhostButton>
			</div>
			<ManageListsPanel
				open={managingLists}
				onClose={() => setManagingLists(false)}
				gameId={gameId}
				playlists={userPlaylists}
				pending={pending}
				onTogglePlaylist={togglePlaylist}
			/>
		</div>
	);
}
