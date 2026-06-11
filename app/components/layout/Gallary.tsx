"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Children, ReactNode, useEffect, useRef, useState } from "react";

type GallaryMode = "slide" | "fade";

type GallaryProps = {
    children: ReactNode;
    mode?: GallaryMode;
    autoRotate?: boolean;
    autoRotateMs?: number;
    idleMs?: number;
};

export default function Gallary({
    children,
    mode = "slide",
    autoRotate = false,
    autoRotateMs = 6000,
    idleMs = 8000,
}: GallaryProps) {
    const items = Children.toArray(children);
    const [index, setIndex] = useState(0);
    const hoveredRef = useRef(false);
    const lastInteractionRef = useRef(0);

    useEffect(() => {
        if (!autoRotate || items.length < 2) return;

        const timer = window.setInterval(() => {
            const isIdle = Date.now() - lastInteractionRef.current > idleMs;

            if (!hoveredRef.current && isIdle) {
                setIndex((current) => (current + 1) % items.length);
            }
        }, autoRotateMs);

        return () => window.clearInterval(timer);
    }, [autoRotate, autoRotateMs, idleMs, items.length]);

    function markInteraction() {
        lastInteractionRef.current = Date.now();
    }

    function move(direction: -1 | 1) {
        markInteraction();
        setIndex((current) => (current + direction + items.length) % items.length);
    }

    if (!items.length) return null;

    return (
        <div
            className="relative w-full pb-9"
            onPointerEnter={() => {
                hoveredRef.current = true;
            }}
            onPointerLeave={() => {
                hoveredRef.current = false;
            }}
        >
            <button
                type="button"
                aria-label="Previous item"
                onClick={() => move(-1)}
                className="absolute bottom-9 left-0 top-0 z-20 grid w-14 place-items-center rounded border-border/70 bg-bg text-text backdrop-blur hover:bg-bg-secondary/50 hover:border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
                <ChevronLeft size={28} />
            </button>

            <div className="overflow-hidden px-14">
                {mode === "fade" ? (
                    <div className="grid">
                        {items.map((child, itemIndex) => (
                            <div
                                key={itemIndex}
                                className={`col-start-1 row-start-1 transition-opacity duration-300 ease-out ${itemIndex === index ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"}`}
                            >
                                {child}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div
                        className="flex transition-transform duration-300 ease-out"
                        style={{ transform: `translateX(-${index * 100}%)` }}
                    >
                        {items.map((child, itemIndex) => (
                            <div key={itemIndex} className="w-full flex-none">
                                {child}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <button
                type="button"
                aria-label="Next item"
                onClick={() => move(1)}
                className="absolute bottom-9 right-0 top-0 z-20 grid w-14 place-items-center rounded border-border/70 bg-bg text-text backdrop-blur hover:bg-bg-secondary/50 hover:border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
                <ChevronRight size={28} />
            </button>

            <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 gap-2">
                {items.map((_, itemIndex) => (
                    <button
                        key={itemIndex}
                        type="button"
                        aria-label={`Show item ${itemIndex + 1}`}
                        onClick={() => {
                            markInteraction();
                            setIndex(itemIndex);
                        }}
                        className={`size-3.5 w-4 h-2.5 rounded transition ${itemIndex === index ? "bg-secondary" : "bg-border hover:bg-border-strong"}`}
                    />
                ))}
            </div>
        </div>
    );
}
