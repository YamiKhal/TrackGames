import { Game } from "@/lib/types";
import GameCard from "./GameCard";

export default function GamePlaylistDisplay({ game, rank }: { game: Game; rank: number }) {
    return (
        <div className="w-full max-w-82 flex flex-col">
            <div className="relative w-full aspect-80/49 [--stack-offset:18.75%] [--stack-width:calc(100%-var(--stack-offset)*3)]">
                <div className="absolute left-0 top-0 z-40 h-full w-(--stack-width)">
                    <GameCard game={game} size="full" />
                </div>
                <div className="absolute left-(--stack-offset) top-0 z-30 h-full w-(--stack-width)">
                    <GameCard game={game} size="full" />
                </div>
                <div className="absolute left-[calc(var(--stack-offset)*2)] top-0 z-20 h-full w-(--stack-width)">
                    <GameCard game={game} size="full" />
                </div>
                <div className="absolute left-[calc(var(--stack-offset)*3)] top-0 z-10 h-full w-(--stack-width)">
                    <GameCard game={game} size="full" />
                </div>
            </div>
            <h1 className="text-text-muted"><span className="text-secondary">#{rank}</span> Name of Playlist</h1>
            <p className="text-text-faint text-sm">By "Username"</p>
        </div>
    )
}
