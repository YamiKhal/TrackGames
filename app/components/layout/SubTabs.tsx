"use client";

import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Dispatch, ReactNode, useEffect, useState } from "react";
import HighLevelIsland from "../ui/HighLevelIsland";

export default function SubTabs({ tabs, active, setter, viewAll, viewAllHref, compact, children }: { tabs: { id: string; label: string; }[]; active: any; setter: Dispatch<any> | Function; viewAll?: boolean; viewAllHref?: string; compact?: boolean; children?: ReactNode }) {
    const [compactOpen, setCompactOpen] = useState(false);
    const [compactRendered, setCompactRendered] = useState(false);
    const activeLabel = tabs.find((tab) => tab.id === active)?.label ?? tabs[0]?.label;

    useEffect(() => {
        if (!compactOpen) return;

        const frame = window.requestAnimationFrame(() => setCompactRendered(true));
        return () => window.cancelAnimationFrame(frame);
    }, [compactOpen]);

    useEffect(() => {
        if (!compactRendered) return;

        function closeOnEscape(event: KeyboardEvent) {
            if (event.key === "Escape") setCompactOpen(false);
        }

        document.addEventListener("keydown", closeOnEscape);
        return () => document.removeEventListener("keydown", closeOnEscape);
    }, [compactRendered]);

    if (!tabs.length) {
        return null;
    }

    return (
        <div className="min-w-0">
            {compact && (
                <div className="mb-5 flex min-w-0 items-center gap-2 border-b border-border md:hidden">
                    <button
                        type="button"
                        onClick={() => setCompactOpen(true)}
                        className="flex min-w-0 items-center gap-2 rounded-t border-b-2 border-primary bg-linear-to-b from-transparent to-primary/25 bg-no-repeat px-4 py-3 text-xl font-bold text-text transition-colors"
                        aria-haspopup="menu"
                        aria-expanded={compactOpen}
                    >
                        <span className="truncate">{activeLabel}</span>
                        <ChevronRight size={18} className="shrink-0" aria-hidden="true" />
                    </button>
                    {viewAll && (
                        <button
                            type="button"
                            className="group ml-auto cursor-pointer flex shrink-0 items-center gap-2 px-1 py-2 text-sm font-bold text-text-muted transition-colors hover:text-text"
                        >
                            View all
                            <span className="grid size-7 place-items-center border border-border bg-bg-secondary rounded-2xl text-text-muted transition-colors group-hover:border-primary/50 group-hover:text-primary">
                                <ArrowRight size={14} />
                            </span>
                        </button>
                    )}
                </div>
            )}

            <nav className={`mb-5 min-w-0 flex-row items-center gap-2 border-b border-border ${compact ? "hidden md:flex" : "flex"}`} aria-label="Tabs">
                {tabs.map((tab) => {
                    const isActive = tab.id === active;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setter(tab.id)}
                            className={`rounded-t border-b-2 px-4 py-3 text-xl font-bold transition-colors ${isActive
                                ? "border-primary text-text bg-linear-to-b from-transparent to-primary/25 bg-no-repeat"
                                : "border-transparent text-text-muted hover:bg-bg-secondary/60 hover:text-text"
                                }`}
                            aria-pressed={isActive}
                        >
                            {tab.label}
                        </button>
                    );
                })}
                {viewAll && (
                    <button
                        type="button"
                        className="group ml-auto  cursor-pointer flex shrink-0 items-center gap-2 px-1 py-2 text-sm font-bold text-text-muted transition-colors hover:text-text"
                    >
                        View all
                        <span className="grid size-7 place-items-center border border-border bg-bg-secondary rounded-2xl text-text-muted transition-colors group-hover:border-primary/50 group-hover:text-primary">
                            <ArrowRight size={14} />
                        </span>
                    </button>
                )}
            </nav>

            {compactRendered && (
                <HighLevelIsland className="md:hidden">
                    <div
                        className={`pointer-events-auto fixed inset-0 bg-overlay ${compactOpen ? "animate-menu-overlay-in" : "animate-menu-overlay-out"}`}
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) setCompactOpen(false);
                        }}
                    >
                        <div
                            role="menu"
                            onAnimationEnd={() => {
                                if (!compactOpen) setCompactRendered(false);
                            }}
                            className={`fixed bottom-0 left-0 top-0 flex w-[min(18rem,calc(100vw-2rem))] flex-col border-r border-border bg-bg p-3 shadow-main ${compactOpen ? "animate-menu-drawer-left-in" : "animate-menu-drawer-left-out"}`}
                        >
                            <div className="flex flex-row pb-5 mb-2 border-b border-border items-center">
                                <button
                                    onClick={() => {
                                        setCompactOpen(false);
                                    }}
                                    className="cursor-pointer"
                                >
                                    <ChevronLeft size={20} strokeWidth={3} aria-hidden="true" />
                                </button>
                                <p className="w-full text-center">Tabs</p>
                            </div>
                            <nav className="flex flex-col gap-1" aria-label="Tabs">
                                {tabs.map((tab) => {
                                    const isActive = tab.id === active;

                                    return (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => {
                                                setter(tab.id);
                                                setCompactOpen(false);
                                            }}
                                            className={`border-l-2 px-4 py-3 text-left text-xl font-bold transition-colors ${isActive
                                                ? "border-primary text-text bg-linear-to-r from-primary/25 to-transparent bg-no-repeat"
                                                : "border-transparent text-text-muted hover:bg-bg-secondary/60 hover:text-text"
                                                }`}
                                            role="menuitem"
                                            aria-pressed={isActive}
                                        >
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>
                </HighLevelIsland>
            )}

            {children}
        </div>
    )
}
