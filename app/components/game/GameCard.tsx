"use client";

import Image from "next/image";
import { useCallback, useRef } from "react";
import { Game } from "@/lib/types";
import { ImageIdToURL } from "@/lib/igdb/util";
import { rippleEffect } from "@/lib/util/effects";
import Link from "next/link";

export default function GameCard({ game, size = 140, effect, hover, slugged = false }: { game: Game; size?: number | "full"; effect?: "ripple", hover?: "name", slugged?: boolean }) {
    const cardRef = useRef<HTMLDivElement>(null);
    const src = ImageIdToURL(game.cover);
    const isFullSize = size === "full";
    const height = isFullSize ? "100%" : Math.round(size * 1.4);
    const imageSizes = isFullSize ? "100vw" : `${size}px`;

    const createRipple = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        if (!effect) return;

        if (effect == "ripple") {
            rippleEffect(cardRef, event);
        }
    }, []);

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
