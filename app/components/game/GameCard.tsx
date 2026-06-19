"use client";

import Image from "next/image";
import { useCallback, useRef } from "react";
import { ImageIdToURL } from "@/lib/external/igdb/util";
import { rippleEffect } from "@/lib/util/effects";
import Link from "next/link";

type GameCardGame = {
    cover?: string | null;
    name?: string | null;
    slug?: string | null;
};

export default function GameCard({ game, size = 140, effect, hover, slugged = false, preload = false }: { game: GameCardGame; size?: number | "full"; effect?: "ripple", hover?: "name", slugged?: boolean; preload?: boolean }) {
    const cardRef = useRef<HTMLDivElement>(null);
    const isFullSize = size === "full";
    const height = isFullSize ? "100%" : Math.round(size * 1.4);
    const imageSizes = isFullSize ? "(max-width: 640px) 42vw, 140px" : `${size}px`;
    const src = ImageIdToURL(game.cover ?? undefined, "cover_big");

    const createRipple = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        if (!effect) return;

        if (effect == "ripple") {
            rippleEffect(cardRef, event);
        }
    }, [effect]);

    let imageClass = "object-cover object-center select-none";

    if (hover == "name") {
        imageClass += " " + "hover:opacity-15 transition-opacity"
    }

    const card = (
        <div
            ref={cardRef}
            className="relative overflow-hidden rounded-md border border-border bg-bg shadow-sm shrink-0"
            style={{ width: isFullSize ? "100%" : size, height }}
            onPointerDown={createRipple}
        >
            {src ?
                <Image
                    src={src ? src : "/assets/no_cover.png"}
                    alt={game.slug ?? "game cover"}
                    fill
                    sizes={imageSizes}
                    preload={preload}
                    className={imageClass}
                />
                : null}
            {hover == "name" ?
                <p className="bg-bg/80 h-full flex items-center justify-center text-md font-bold text-center select-none">{game.name}</p>
                : null
            }
        </div>
    );

    if (slugged && game.slug) {
        return (
            <Link href={`/game/${game.slug}`} className="block cursor-pointer">
                {card}
            </Link>
        );
    }

    return card;
}
