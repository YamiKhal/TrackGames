"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, X } from "lucide-react";
import { IconButton } from "@/components/ui/Buttons";
import { Input } from "@/components/ui/Inputs";
import MenuPanel from "@/components/ui/MenuPanel";
import type { Game } from "@/lib/data/games";
import { deferHook } from "@/lib/util/client/func";

function SearchBox({ autoFocus = false, onPick }: Readonly<{ autoFocus?: boolean; onPick?: () => void }>) {
	const router = useRouter();
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<Game[]>([]);
	const [loading, setLoading] = useState(false);
	const [open, setOpen] = useState(false);
	const boxRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (autoFocus) inputRef.current?.focus();
	}, [autoFocus]);

	useEffect(() => {
		if (!open) return;

		function closeOnEscape(event: KeyboardEvent) {
			if (event.key === "Escape") {
				setOpen(false);
			}
		}

		function closeOnOutsideClick(event: PointerEvent) {
			if (!boxRef.current?.contains(event.target as Node)) {
				setOpen(false);
			}
		}

		document.addEventListener("keydown", closeOnEscape);
		document.addEventListener("pointerdown", closeOnOutsideClick);

		return () => {
			document.removeEventListener("keydown", closeOnEscape);
			document.removeEventListener("pointerdown", closeOnOutsideClick);
		};
	}, [open]);

	useEffect(() => {
		const search = query.trim();

		if (search.length < 2) {
			return deferHook(() => {
				setResults([]);
				setOpen(false);
			});
		}

		const controller = new AbortController();
		const timer = globalThis.setTimeout(async () => {
			setLoading(true);

			try {
				const response = await fetch(`/api/games/search?q=${encodeURIComponent(search)}`, {
					signal: controller.signal,
				});

				if (response.ok) {
					setResults(await response.json());
					setOpen(true);
				}
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

	const search = query.trim();
	const searchHref = `/search?q=${encodeURIComponent(search)}`;

	return (
		<div ref={boxRef} className="relative w-full">
			<Search className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-faint" size={18} aria-hidden="true" />
			<Input
				ref={inputRef}
				value={query}
				onChange={(event) => {
					setQuery(event.target.value);
					setOpen(event.target.value.trim().length >= 2);
				}}
				onKeyDown={(event) => {
					if (event.key === "Enter" && search.length >= 2) {
						event.preventDefault();
						setOpen(false);
						onPick?.();
						router.push(searchHref);
					}
				}}
				onFocus={() => {
					if (query.trim().length >= 2) setOpen(true);
				}}
				placeholder="Search games"
				className="mt-0 h-11 bg-bg-secondary pl-10 pr-10 text-sm focus:border-primary"
			/>
			{query && (
				<IconButton
					onClick={() => {
						setQuery("");
						setResults([]);
						setOpen(false);
					}}
					label="Clear search"
					icon={<X size={16} aria-hidden="true" />}
					className="absolute top-1/2 right-2 -translate-y-1/2"
				/>
			)}

			{open && search.length >= 2 && (
				<div className="absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded border border-border bg-bg-secondary shadow-main">
					<Link
						href={searchHref}
						prefetch={false}
						onClick={() => {
							setOpen(false);
							onPick?.();
						}}
						className="flex min-w-0 items-center gap-2 border-b border-border px-3 py-2 text-sm font-bold text-primary transition-colors hover:bg-surface"
					>
						<Search size={15} aria-hidden="true" />
						<span className="truncate">Search all for &quot;{search}&quot;</span>
					</Link>
					{loading && <p className="p-3 text-sm text-text-muted">Searching...</p>}
					{!loading && results.length === 0 && <p className="p-3 text-sm text-text-muted">No games found.</p>}
					{!loading &&
						results.map((game) => (
							<Link
								key={game.id}
								href={`/game/${game.slug}`}
								onClick={() => {
									setOpen(false);
									onPick?.();
								}}
								className="block min-w-0 border-b border-border px-3 py-2 transition-colors last:border-b-0 hover:bg-surface"
							>
								<p className="truncate text-sm font-bold text-text">{game.name}</p>
								<p className="text-xs text-text-muted">{game.releaseDate ? new Date(game.releaseDate).getFullYear() : "Unknown release"}</p>
							</Link>
						))}
				</div>
			)}
		</div>
	);
}

export default function HeaderSearch() {
	const [open, setOpen] = useState(false);

	return (
		<>
			<div className="hidden w-full max-w-md md:block">
				<SearchBox />
			</div>
			<IconButton
				onClick={() => setOpen(true)}
				label="Search games"
				icon={<Search size={20} aria-hidden="true" />}
				className="size-11 text-text-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none md:hidden"
			/>
			<MenuPanel open={open} onClose={() => setOpen(false)} variant="drawer-right" width="100%" shouldShowClose={false} panelClassName="md:hidden" className="md:hidden">
				<div className="flex items-center gap-3">
					<SearchBox autoFocus={open} onPick={() => setOpen(false)} />
					<IconButton
						onClick={() => setOpen(false)}
						label="Close search"
						icon={<ArrowRight size={20} aria-hidden="true" />}
						className="size-11 shrink-0 border border-border bg-bg-secondary text-text-muted"
					/>
				</div>
			</MenuPanel>
		</>
	);
}
