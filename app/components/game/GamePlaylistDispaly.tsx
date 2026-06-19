import GameCard from "./GameCard";
import Link from "next/link";

type PlaylistDisplayGame = {
    cover?: string | null;
    name?: string | null;
    slug?: string | null;
};

export default function GamePlaylistDisplay({ game, games, rank, title, by, href }: { game?: PlaylistDisplayGame; games?: PlaylistDisplayGame[]; rank?: number; title?: string; by?: string; href?: string }) {
    const items = games?.length ? games : game ? [game, game, game, game] : [];
    const card = (
        <div className="w-full max-w-82 flex flex-col">
            <div className="relative w-full aspect-80/49 [--stack-offset:18.75%] [--stack-width:calc(100%-var(--stack-offset)*3)]">
                {[0, 1, 2, 3].map((index) => (
                    <div key={index} className="absolute top-0 h-full w-(--stack-width)" style={{ left: `calc(var(--stack-offset)*${index})`, zIndex: 40 - index * 10 }}>
                        {items[index] ? (
                            <GameCard game={items[index]} size="full" />
                        ) : (
                            <div className="h-full w-full rounded-md border border-border bg-bg-secondary" />
                        )}
                    </div>
                ))}
            </div>
            <h1 className="text-text-muted">{rank && <span className="text-secondary">#{rank}</span>} {title ?? game?.name ?? "Featured game"}</h1>
            {by && <p className="text-text-faint text-sm">By {by}</p>}
        </div>
    );

    if (href) {
        return <Link href={href} className="block w-full max-w-82">{card}</Link>;
    }

    return card;
}
