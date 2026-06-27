"use client";

import Image from "next/image";
import { useState } from "react";
import type { Game } from "@/lib/types";
import { ImageIdToURL } from "@/lib/external/igdb/util";
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
        <article className="relative mx-auto grid min-h-82 max-w-5xl overflow-hidden rounded bg-bg-secondary md:min-h-0 md:grid-cols-[minmax(240px,0.62fr)_minmax(0,1.38fr)]">
            {heroSrc ? (
                <div className="absolute inset-0 md:hidden">
                    <Image
                        src={heroSrc}
                        alt=""
                        fill
                        sizes="calc(100vw - 4rem)"
                        className="scale-105 object-cover object-center opacity-60 blur-[1px] select-none"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-bg-secondary/90 via-bg-secondary/55 to-bg-secondary/20" />
                </div>
            ) : null}

            <div className="relative z-1 order-2 flex min-h-96 flex-col justify-between gap-0 bg-transparent md:order-1 md:h-96 md:min-h-0 md:justify-between md:bg-bg-secondary/80 md:p-5">
                <div className="flex flex-1 flex-col items-center justify-center p-5 text-center md:flex-none md:items-stretch md:justify-start md:p-0 md:text-start">
                    <Link href={`/game/${game.slug}`} className="relative block aspect-3/4 w-44 shrink-0 overflow-hidden rounded border border-border bg-bg shadow-main md:hidden">
                        {coverSrc ? (
                            <Image
                                src={coverSrc}
                                alt={game.name ?? "Game cover"}
                                fill
                                sizes="176px"
                                className="object-cover object-center select-none"
                            />
                        ) : null}
                    </Link>
                </div>

                <div className="bg-bg-secondary/95 p-5 md:bg-transparent md:p-0">
                    <div className="flex min-w-0 flex-col gap-2 text-center md:gap-3 md:text-start">
                        <Link href={`/game/${game.slug}`}><h2 className="line-clamp-3 text-2xl font-bold leading-tight text-text transition-colors hover:text-primary md:line-clamp-2 md:text-lg">{game.name}</h2></Link>

                        {game.summary ? (
                            <p className="line-clamp-4 text-sm leading-6 text-text-muted md:line-clamp-5">{game.summary}</p>
                        ) : (
                            <p className="text-sm leading-6 text-text-muted">A standout release from this year&apos;s best-rated games.</p>
                        )}
                    </div>
                </div>

                {screenshots.length ? (
                    <div className="hidden flex-col gap-2 md:flex">
                        <p className="text-xs font-bold text-text-faint">Screenshots</p>
                        <div className="flex gap-2">
                            {screenshots.map((screenshot, index) => {
                                const src = ImageIdToURL(screenshot, "screenshot_big");
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

            <Link href={`/game/${game.slug}`} className="order-1 relative h-72 overflow-hidden bg-bg-secondary/60 lg:bg-bg sm:h-80 md:order-2 md:h-96 rounded hidden md:flex">
                {heroSrc ? (
                    <Image
                        src={heroSrc}
                        alt={game.name ?? "Game cover"}
                        fill
                        sizes="(min-width: 1024px) 620px, 58vw"
                        className="object-contain object-center select-none"
                    />
                ) : null}

                
                {coverSrc ? (
                    <div className="absolute bottom-4 right-4 aspect-3/4 w-22 overflow-hidden rounded border border-border bg-bg-secondary sm:w-26">
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
