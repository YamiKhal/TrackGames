"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { ReactNode, useRef, useState, Children, useEffect } from "react";

export default function HorizontalScroller({ children, className = "" }: { children: ReactNode, className?: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const didDragRef = useRef(false);
    const isPointerDownRef = useRef(false);
    const startXRef = useRef(0);
    const startScrollLeftRef = useRef(0);
    const [isDragging, setIsDragging] = useState(false);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    useEffect(() => {
        update();

        const element = containerRef.current;
        if (element) element.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);

        const observer = (typeof ResizeObserver !== 'undefined') ? new ResizeObserver(update) : null;
        if (observer && element) observer.observe(element);

        return () => {
            if (element) element.removeEventListener('scroll', update);

            window.removeEventListener('resize', update);

            if (observer) observer.disconnect();
        };
    }, []);


    function update() {
        const container = containerRef.current;
        if (!container) return;
        
        // add small tolerance to avoid off-by-one issues
        setCanScrollLeft(container.scrollLeft > 1);
        setCanScrollRight(container.scrollLeft + container.clientWidth < container.scrollWidth - 1);
    };


    function scroll(direction: "left" | "right") {
        const container = containerRef.current;
        if (!container) return;

        container.scrollBy({
            left: direction === "left" ? -container.offsetWidth * 0.8 : container.offsetWidth * 0.8,
            behavior: "smooth",
        });
    }


    function handlePointerDown(e: any) {
        const container = containerRef.current;
        if (!container) return;

        const offsetLeft = (e.currentTarget && e.currentTarget.offsetLeft) || 0;
        isPointerDownRef.current = true;
        didDragRef.current = false;
        startXRef.current = e.clientX - offsetLeft;
        startScrollLeftRef.current = container.scrollLeft;
    }


    function handlePointerMove(e: any) {
        const container = containerRef.current;
        if (!container) return;
        if (!isPointerDownRef.current) return;

        const offsetLeft = (e.currentTarget && e.currentTarget.offsetLeft) || 0;
        const x = e.clientX - offsetLeft;
        const distance = x - startXRef.current;

        if (!isDragging && Math.abs(distance) < 5) return;

        if (!isDragging) {
            didDragRef.current = true;
            setIsDragging(true);
            try {
                e.currentTarget.setPointerCapture?.(e.pointerId);
            } catch {}
        }

        container.scrollLeft = startScrollLeftRef.current - distance * 1.5;
        e.preventDefault();
    }


    function handlePointerUp(e: any) {
        isPointerDownRef.current = false;
        setIsDragging(false);
        try {
            e.currentTarget.releasePointerCapture?.(e.pointerId);
        } catch {}
    }

    return (
        <div className={`relative w-full min-w-0 max-w-full no-scrollbar ${className}`}>
            {canScrollLeft && (
                <button
                    type="button"
                    aria-label={"Scroll left"}
                    onClick={() => scroll("left")}
                    className="absolute left-1 top-1/2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-surface/85 text-text shadow-lg backdrop-blur transition hover:bg-background">
                    <ChevronLeft size={18} />
                </button>
            )}

            <div
                ref={containerRef}
                className="no-scrollbar flex w-full min-w-0 items-start cursor-grab snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth active:cursor-grabbing"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onPointerLeave={handlePointerUp}
                onClickCapture={(e) => {
                    if (!didDragRef.current) return;
                    didDragRef.current = false;
                    e.preventDefault();
                    e.stopPropagation();
                }}
            >
                {Children.map(children, (child, i) => (
                    <div key={i} className="flex-none">
                        {child}
                    </div>
                ))}

            </div>

            {canScrollRight && (
                <button
                    type="button"
                    aria-label={"Scroll right"}
                    onClick={() => scroll("right")}
                    className="absolute right-1 top-1/2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-surface/85 text-text shadow-lg backdrop-blur transition hover:bg-background"
                >
                    <ChevronRight size={18} />
                </button>
            )}
        </div>
    )
}
