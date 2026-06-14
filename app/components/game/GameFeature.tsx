"use client";

import Image from "next/image";
import { useState } from "react";
import { Game, RawGame } from "@/lib/types";
import { ImageIdToURL } from "@/lib/igdb/util";
import Link from "next/link";

export default function GameFeature({ game }: { game: Game }) {
    const coverSrc = ImageIdToURL(game.cover, "cover_big");
    const screenshots = game.screenshots?.slice(0, 4) ?? [];
    const defaultHeroSrc = ImageIdToURL(screenshots[0] ?? game.cover, screenshots[0] ? "1080" : "720");
    const [heroSrc, setHeroSrc] = useState(defaultHeroSrc ?? coverSrc);
    const [activeScreenshot, setActiveScreenshot] = useState(0);

    function selectScreenshot(src: string, index: number) {
        setHeroSrc(src);
        setActiveScreenshot(index);
    }

    return (
        <article className="mx-auto grid max-w-5xl overflow-hidden rounded bg-bg-secondary shadow-main md:grid-cols-[minmax(240px,0.62fr)_minmax(0,1.38fr)]">
            <div className="order-2 flex flex-col justify-between gap-4 border border-border bg-bg-secondary/80 p-4 md:order-1 md:h-96 md:p-5">
                <div className="flex flex-col gap-3">
                    <Link href={`/game/${game.slug}`}><h2 className="line-clamp-2 text-lg font-bold leading-tight text-text hover:text-primary transition-colors">{game.name}</h2></Link>

                    {game.summary ? (
                        <p className="line-clamp-5 text-sm leading-6 text-text-muted">{game.summary}</p>
                    ) : (
                        <p className="text-sm leading-6 text-text-muted">A standout release from this year&apos;s best-rated games.</p>
                    )}
                </div>

                {screenshots.length ? (
                    <div className="flex flex-col gap-2">
                        <p className="text-xs font-bold text-text-faint">Screenshots</p>
                        <div className="flex gap-2">
                        {screenshots.map((screenshot, index) => {
                            const src = ImageIdToURL(screenshot, "1080");
                            const isActive = index === activeScreenshot;
                            if (!src) return null;

                            return (
                                <button
                                    key={screenshot}
                                    type="button"
                                    aria-label={`Show ${game.name ?? "game"} screenshot ${index + 1}`}
                                    aria-pressed={isActive}
                                    className={`relative h-12 flex-1 overflow-hidden rounded bg-bg ring-primary transition hover:ring-2 focus-visible:outline-none focus-visible:ring-2 ${isActive ? "ring-2" : ""}`}
                                    onClick={() => selectScreenshot(src, index)}
                                    onFocus={() => selectScreenshot(src, index)}
                                >
                                    <Image
                                        src={src}
                                        alt={`${game.name ?? "Game"} screenshot ${index + 1}`}
                                        fill
                                        sizes="(max-width: 768px) 25vw, 72px"
                                        className={`object-cover object-center select-none transition ${isActive ? "opacity-100" : "opacity-65"}`}
                                    />
                                </button>
                            );
                        })}
                        </div>
                    </div>
                ) : null}
            </div>

            <Link href={`/game/${game.slug}`} className="order-1 relative h-72 overflow-hidden bg-bg sm:h-80 md:order-2 md:h-96 rounded">
                {heroSrc ? (
                    <Image
                        src={heroSrc}
                        alt={game.name ?? "Game cover"}
                        fill
                        sizes="(max-width: 768px) 100vw, 68vw"
                        className="object-contain object-center select-none"
                    />
                ) : null}

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_20%,rgba(255,255,255,0.18),transparent_30%),linear-gradient(120deg,rgba(25,27,35,0.45),transparent_42%,rgba(25,27,35,0.22))]" />

                {coverSrc ? (
                    <div className="absolute bottom-4 right-4 aspect-3/4 w-22 overflow-hidden rounded border border-border bg-bg-secondary shadow-main sm:w-26">
                        <Image
                            src={coverSrc}
                            alt={`${game.name ?? "Game"} cover`}
                            fill
                            sizes="(max-width: 640px) 88px, 104px"
                            className="object-contain object-center select-none"
                        />
                    </div>
                ) : null}
            </Link>
        </article>
    );
}
