import { Game, RawGame } from "@/lib/types";
import GameCard from "./GameCard";
import { Star } from "lucide-react";
import { ratingToFive } from "@/lib/util/rating";

export default function GameStatInfoCard({game}: {game: Game}) {
    const releaseDate = game.releaseDate
        ? game.releaseDate.toISOString().slice(0, 10)
        : null;

    return (
        <div className="flex w-full min-w-0 max-w-full flex-row gap-5 overflow-hidden">
            <div className="shrink-0">
                <GameCard game={game} size={80} effect="ripple" hover="name" slugged={true} />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden text-pretty">
                <p className="truncate font-body text-base font-medium" title={game.name}>{game.name}</p>
                <p className="flex min-w-0 flex-row items-center gap-2 truncate text-center font-body text-sm font-bold text-text-muted">
                    {
                        releaseDate ? <span>{releaseDate}</span> : <span className="flex flex-row gap-1 items-center">Avg. {ratingToFive(Math.floor(game.totalRating!))?.toFixed(2)} <Star size={14} /></span>
                    }
                </p>
            </div>
        </div>
    )
}
