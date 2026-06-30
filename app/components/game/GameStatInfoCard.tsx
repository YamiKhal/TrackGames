import type { Game } from "@/lib/types";
import GameCard from "./GameCard";
import { Star } from "lucide-react";
import { ratingToFive } from "@/lib/util/rating";
import Link from "next/link";

export default function GameStatInfoCard({ game }: Readonly<{ game: Game }>) {
	const releaseDate = game.releaseDate ? game.releaseDate.toISOString().slice(0, 10) : null;

	return (
		<div className="flex w-full max-w-full min-w-0 justify-center overflow-hidden sm:flex-row sm:justify-start sm:gap-5">
			<div className="shrink-0">
				<div className="relative flex w-fit items-center justify-center sm:hidden">
					<GameCard game={game} size={120} effect="ripple" hasLink={true} />
					<div className="absolute inset-x-0 bottom-0 overflow-hidden bg-bg/85 p-2 text-pretty">
						<p className="flex min-w-0 flex-row items-center justify-center gap-2 truncate text-center font-body text-sm font-bold text-text-muted">
							{releaseDate ? (
								<span>{releaseDate}</span>
							) : (
								<span className="flex flex-row items-center gap-1">
									Avg. {ratingToFive(Math.floor(game.totalRating!))?.toFixed(2)} <Star size={14} />
								</span>
							)}
						</p>
					</div>
				</div>
				<div className="hidden sm:block">
					<GameCard game={game} size={80} effect="ripple" hover="name" hasLink={true} />
				</div>
			</div>
			<div className="hidden min-w-0 flex-1 overflow-hidden text-pretty sm:block">
				<Link href={`/game/${game.slug}`}>
					<p className="hidden truncate font-body text-base font-medium transition-colors hover:text-primary sm:block" title={game.name}>
						{game.name}
					</p>
				</Link>
				<p className="flex min-w-0 flex-row items-center gap-2 truncate text-center font-body text-sm font-bold text-text-muted">
					{releaseDate ? (
						<span>{releaseDate}</span>
					) : (
						<span className="flex flex-row items-center gap-1">
							Avg. {ratingToFive(Math.floor(game.totalRating!))?.toFixed(2)} <Star size={14} />
						</span>
					)}
				</p>
			</div>
		</div>
	);
}
