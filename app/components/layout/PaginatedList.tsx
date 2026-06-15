"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Children, ReactNode, useState } from "react";
import { GhostButton } from "../ui/Buttons";

export default function PaginatedList({
    children,
    pageSize,
    className,
}: {
    children: ReactNode;
    pageSize: number;
    className?: string;
}) {
    const [page, setPage] = useState(1);
    const items = Children.toArray(children);
    const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
    const start = (page - 1) * pageSize;
    const pageItems = items.slice(start, start + pageSize);
    const pageNumbers = pageCount > 7 ? [1, 2, 3, 4, 5, 6] : Array.from({ length: pageCount }, (_, index) => index + 1);

    function goToPage(value: number) {
        setPage(Math.min(pageCount, Math.max(1, value)));
    }

    return (
        <div className="flex w-full flex-col gap-5">
            <div className={className}>
                {pageItems}
            </div>
            {pageCount > 1 && (
                <div className="flex flex-row items-center justify-center gap-3">
                    <GhostButton
                        type="button"
                        disabled={page === 1}
                        onClick={() => goToPage(page - 1)}
                        className="px-3 py-2 disabled:cursor-default disabled:opacity-50"
                        aria-label="Previous page"
                    >
                        <ChevronLeft size={18} aria-hidden="true" />
                    </GhostButton>
                    <p className="text-sm font-bold text-text-muted sm:hidden">
                        {page} / {pageCount}
                    </p>
                    <div className="hidden flex-row items-center gap-2 sm:flex">
                        {pageNumbers.map((number) => (
                            <button
                                key={number}
                                type="button"
                                onClick={() => goToPage(number)}
                                className={`grid size-9 cursor-pointer place-items-center rounded border text-sm font-bold transition-colors ${page === number
                                    ? "border-primary bg-primary text-text"
                                    : "border-border text-text-muted hover:border-primary hover:text-primary"}`}
                                aria-label={`Page ${number}`}
                                aria-current={page === number ? "page" : undefined}
                            >
                                {number}
                            </button>
                        ))}
                        {pageCount > 7 && (
                            <>
                                <input
                                    type="number"
                                    min={1}
                                    max={pageCount}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                            goToPage(Number(event.currentTarget.value));
                                            event.currentTarget.value = "";
                                        }
                                    }}
                                    className="h-9 w-14 rounded border border-border bg-bg-secondary px-2 text-center text-sm text-text outline-none transition-colors focus:border-primary"
                                    aria-label="Jump to page"
                                />
                                <button
                                    type="button"
                                    onClick={() => goToPage(pageCount)}
                                    className={`grid size-9 cursor-pointer place-items-center rounded border text-sm font-bold transition-colors ${page === pageCount
                                        ? "border-primary bg-primary text-text"
                                        : "border-border text-text-muted hover:border-primary hover:text-primary"}`}
                                    aria-label={`Page ${pageCount}`}
                                    aria-current={page === pageCount ? "page" : undefined}
                                >
                                    {pageCount}
                                </button>
                            </>
                        )}
                    </div>
                    <GhostButton
                        type="button"
                        disabled={page === pageCount}
                        onClick={() => goToPage(page + 1)}
                        className="px-3 py-2 disabled:cursor-default disabled:opacity-50"
                        aria-label="Next page"
                    >
                        <ChevronRight size={18} aria-hidden="true" />
                    </GhostButton>
                </div>
            )}
        </div>
    );
}
