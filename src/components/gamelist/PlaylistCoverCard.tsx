import Link from "next/link";
import { GameCard } from "@/components/game/GameDisplay";
import { type PlaylistDisplayData } from "@/lib/data/gamelist/lists";

type PlaylistCoverCardProps = Readonly<{
	playlist: PlaylistDisplayData;
	rank?: number;
	hasHref?: boolean;
}>;

export default function PlaylistCoverCard({ playlist, rank, hasHref }: PlaylistCoverCardProps) {
	const game = playlist.entries.at(0)?.game;
	const games = playlist.entries.slice(0, 4).map((entry) => entry.game);
	const title = playlist.name;
	const by = playlist.user?.name ?? undefined;
	const itemsList = game ? [game, game, game, game] : [];
	const items = games?.length ? games : itemsList;
	const card = (
		<div className="flex w-full max-w-82 flex-col">
			<div className="relative aspect-80/49 w-full [--stack-offset:18.75%] [--stack-width:calc(100%-var(--stack-offset)*3)]">
				{[0, 1, 2, 3].map((index) => (
					<div key={index} className="absolute top-0 h-full w-(--stack-width)" style={{ left: `calc(var(--stack-offset)*${index})`, zIndex: 40 - index * 10 }}>
						{items[index] ? <GameCard game={items[index]} size="full" /> : <div className="h-full w-full rounded border border-border bg-bg-secondary" />}
					</div>
				))}
			</div>
			<h1 className="text-text-muted">
				{!!rank && <span className="text-secondary">#{rank}</span>} {title ?? game?.name ?? "Featured game"}
			</h1>
			{by && <p className="text-sm text-text-faint">By {by}</p>}
		</div>
	);

	if (hasHref) {
		return (
			<Link href={`/playlist/${playlist.id}`} className="block w-full max-w-82">
				{card}
			</Link>
		);
	}

	return card;
}
