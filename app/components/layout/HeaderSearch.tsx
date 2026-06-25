"use client";

import { Game } from "@/lib/types";
import { ArrowRight, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import HighLevelIsland from "../ui/HighLevelIsland";

function SearchBox({ autoFocus = false, onPick }: { autoFocus?: boolean; onPick?: () => void }) {
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
            return;
        }

        const controller = new AbortController();
        const timer = window.setTimeout(async () => {
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
            window.clearTimeout(timer);
        };
    }, [query]);

    return (
        <div ref={boxRef} className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" size={18} aria-hidden="true" />
            <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => {
                    if (query.trim().length >= 2) setOpen(true);
                }}
                placeholder="Search games"
                className="h-11 w-full rounded border border-border bg-bg-secondary px-10 text-sm text-text outline-none transition-colors placeholder:text-text-faint focus:border-primary"
            />
            {query && (
                <button
                    type="button"
                    onClick={() => {
                        setQuery("");
                        setResults([]);
                        setOpen(false);
                    }}
                    className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 cursor-pointer place-items-center rounded text-text-faint transition-colors hover:text-primary"
                    aria-label="Clear search"
                >
                    <X size={16} aria-hidden="true" />
                </button>
            )}

            {open && query.trim().length >= 2 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded border border-border bg-bg-secondary shadow-main">
                    {loading && <p className="p-3 text-sm text-text-muted">Searching...</p>}
                    {!loading && results.length === 0 && <p className="p-3 text-sm text-text-muted">No games found.</p>}
                    {!loading && results.map((game) => (
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
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="grid size-11 cursor-pointer place-items-center text-text-muted transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:hidden"
                aria-label="Search games"
            >
                <Search size={20} aria-hidden="true" />
            </button>
            <HighLevelIsland className="md:hidden">
                <div className={`pointer-events-auto fixed inset-0 bg-overlay transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}>
                    <div className={`fixed inset-y-0 right-0 w-full bg-bg p-4 shadow-main transition-transform duration-200 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}>
                        <div className="flex items-center gap-3">
                            <SearchBox autoFocus={open} onPick={() => setOpen(false)} />
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="grid size-11 shrink-0 cursor-pointer place-items-center rounded border border-border bg-bg-secondary text-text-muted transition-colors hover:border-primary hover:text-primary"
                                aria-label="Close search"
                            >
                                <ArrowRight size={20} aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                </div>
            </HighLevelIsland>
        </>
    );
}
