"use client";

import { useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import type { Game } from "@/lib/data/catalog/games";
import { ImageIdToURL } from "@/lib/external/igdb/util";
import { rippleEffect } from "@/lib/util/client/effects";
import { joinClass } from "@/lib/util/client/func";
import { ratingToFive } from "@/lib/util/format/rating";

type GameCardGame = {
	cover?: string | null;
	name?: string | null;
	slug?: string | null;
};

type GameCardProps = Readonly<{
	game: GameCardGame;
	size?: number | "full";
	effect?: "ripple";
	hover?: "name";
	hasHref?: boolean;
	priority?: boolean;
}>;

/**
 * Used to display game data in the form of a card.
 * @param hasLink is required to be set to true if the card needs to href to its target game page.
 */
export function GameCard({ game, size = 140, effect, hover, hasHref = false, priority = false }: GameCardProps) {
	const cardRef = useRef<HTMLDivElement>(null);
	const isFullSize = size === "full";
	const height = isFullSize ? "100%" : Math.round(size * 1.4);
	const imageSizes = isFullSize ? "(max-width: 640px) 42vw, 140px" : `${size}px`;
	const src = ImageIdToURL(game.cover ?? undefined, "cover_big") ?? "/assets/no_cover.png";

	const createRipple = useCallback(
		(event: React.PointerEvent<HTMLDivElement>) => {
			if (!effect) return;

			if (effect === "ripple") {
				rippleEffect(cardRef, event);
			}
		},
		[effect],
	);

	const imageClass = joinClass("object-cover object-center select-none", hover === "name" && "hover:opacity-15 transition-opacity");

	const card = (
		<div
			ref={cardRef}
			className="relative shrink-0 overflow-hidden rounded border border-border bg-bg shadow-sm"
			style={{ width: isFullSize ? "100%" : size, height }}
			onPointerDown={createRipple}
		>
			<Image src={src} alt={game.slug ?? "game cover"} fill sizes={imageSizes} priority={priority} className={imageClass} />
			{hover === "name" ? <p className="text-md flex h-full items-center justify-center bg-bg/80 text-center font-bold select-none">{game.name}</p> : null}
		</div>
	);

	if (hasHref && game.slug) {
		return (
			<Link href={`/game/${game.slug}`} className="block cursor-pointer">
				{card}
			</Link>
		);
	}

	return card;
}

export function StatInfoCard({ game }: Readonly<{ game: Game }>) {
	const releaseDate = game.releaseDate ? game.releaseDate.toISOString().slice(0, 10) : null;
	let metaLine: React.ReactNode = null;
	if (releaseDate) {
		metaLine = <span>{releaseDate}</span>;
	} else if (game.totalRating != null) {
		metaLine = (
			<span className="flex flex-row items-center gap-1">
				Avg. {ratingToFive(Math.floor(game.totalRating))?.toFixed(2)} <Star size={14} />
			</span>
		);
	}

	return (
		<div className="flex w-full max-w-full min-w-0 justify-center overflow-hidden sm:flex-row sm:justify-start sm:gap-5">
			<div className="shrink-0">
				<div className="relative flex w-fit items-center justify-center sm:hidden">
					<GameCard game={game} size={120} effect="ripple" hasHref={true} />
					<div className="absolute inset-x-0 bottom-0 overflow-hidden bg-bg/85 p-2 text-pretty">
						<p className="flex min-w-0 flex-row items-center justify-center gap-2 truncate text-center font-body text-sm font-bold text-text-muted">{metaLine}</p>
					</div>
				</div>
				<div className="hidden sm:block">
					<GameCard game={game} size={80} effect="ripple" hover="name" hasHref={true} />
				</div>
			</div>
			<div className="hidden min-w-0 flex-1 overflow-hidden text-pretty sm:block">
				<Link href={`/game/${game.slug}`}>
					<p className="hidden truncate font-body text-base font-medium transition-colors hover:text-primary sm:block" title={game.name}>
						{game.name}
					</p>
				</Link>
				<p className="flex min-w-0 flex-row items-center gap-2 truncate text-center font-body text-sm font-bold text-text-muted">{metaLine}</p>
			</div>
		</div>
	);
}
