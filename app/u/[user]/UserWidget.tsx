import GameCard from "@/app/components/game/GameCard";
import HorizontalScroller from "@/app/components/layout/HorizontalScroller";
import { Game, Widget } from "@/lib/types";
import { MarkdownBlocks } from "../../components/markdown/MarkdownBlocks";
import { WidgetType } from "@/lib/enums";
import { parseMarkdownBlocks } from "@/lib/markdown";
import { getMinifiedGame } from "@/lib/data/games";
import { getUserGameStats } from "@/lib/data/library";


function GameList({ widget, games }: { widget: Widget; games: Game[] }) {
    return (
        <div className="p-5 w-full bg-bg rounded">
            {widget.games ?
                <div>
                    <p className="font-bold text-xl mb-3 border-b border-border pb-3">
                        {widget.title}
                    </p>
                    <HorizontalScroller className="overflow-clip gap-1 md:gap-5 max-w-full p-2 md:p-6">
                        {games.length > 0 ? games.map((game) => (
                            <div key={game.id}>
                                <div className="flex md:hidden">
                                    <GameCard game={game} size={100} effect="ripple" slugged={true} />
                                </div>
                                <div className="hidden md:flex">
                                    <GameCard game={game} size={160} effect="ripple" hover="name" slugged={true} />
                                </div>
                            </div>
                        )) : (
                            <p className="text-sm text-text-muted">No games selected.</p>
                        )}
                    </HorizontalScroller>
                </div>
                : <p className="font-bold p-5 bg-error/30 border-2 border-error/50 rounded text-center">Data Not Found - Favorites widget failed</p>}
        </div>
    )
}


function StatsBlock({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-primary/10 p-10 border-2 border-primary/40 flex flex-col gap-2 justify-center items-center text-center font-bold text-2xl rounded-md w-full h-16 md:h-32">

            <p className="flex-1 flex items-center">{value}</p>
            <p className="text-sm h-6">{label}</p>
        </div>
    )
}

function Stats({ widget, stats }: { widget: Widget; stats: Awaited<ReturnType<typeof getUserGameStats>> }) {
    return (
        <div>
            {widget.stats ?
                <div className="grid grid-cols-2 items-center bg-bg md:flex md:flex-row md:justify-between gap-2">
                    {
                        widget.stats.map((stat, index) => {
                            const name = stat === "reviews" ? "dropped" : stat;
                            let label = stat;
                            let value;

                            if (name === "played") {
                                label = "Played";
                                value = stats.played;
                            } else if (name === "completed") {
                                label = "Completed";
                                value = stats.completed;
                            } else if (name === "backlog") {
                                label = "Backlog";
                                value = stats.backlog;
                            } else if (name === "wishlist" || name === "wishlisted") {
                                label = "Wishlist";
                                value = stats.wishlist;
                            } else if (name === "hours") {
                                label = "Hours";
                                value = Math.round(stats.hours * 10) / 10 + "h";
                            } else if (name === "dropped") {
                                label = "Dropped";
                                value = stats.dropped;
                            } else if (name === "playing") {
                                label = "Playing";
                                value = stats.playing;
                            } else if (name === "paused") {
                                label = "Paused";
                                value = stats.paused;
                            } else if (name === "total") {
                                label = "Total";
                                value = stats.total;
                            }

                            return <StatsBlock key={`${stat}-${index}`} label={label} value={value?.toLocaleString("en", { maximumFractionDigits: 1 }) ?? "0"} />;
                        })
                    }
                </div>
                : <p className="font-bold p-5 bg-error/30 border-2 border-error/50 rounded text-center">Data Not Found - Stats widget failed</p>
            }
        </div>
    )
}


function Markdown({ widget }: { widget: Widget }) {
    const blocks = (widget.type === WidgetType.MARKDOWN && widget.content) ? parseMarkdownBlocks(widget.content) : [];

    return (
        <div className="p-5 w-full bg-bg rounded overflow-hidden wrap-break-word">
            {blocks.length > 0 ?
                <div className="space-y-4 text-sm leading-6 text-text md:text-base">
                    <MarkdownBlocks blocks={blocks} />
                </div>

                : <p className="font-bold p-5 bg-error/30 border-2 border-error/50 rounded text-center">Data Not Found - Markdown widget failed</p>}
        </div>
    )
}


export default async function UserWidget({ widget, userId }: { widget: Widget; userId: string }) {
    if (!widget.visible) return null;

    const games = widget.type === WidgetType.GAMELIST && widget.games.length ? await getMinifiedGame(widget.games) : [];
    const stats = widget.type === WidgetType.STATS ? await getUserGameStats(userId) : null;

    return (
        <div className="w-full md:p-5">
            {widget.type === WidgetType.GAMELIST &&
                <GameList widget={widget} games={games} />
            }
            {widget.type === WidgetType.MARKDOWN &&
                <Markdown widget={widget} />
            }
            {widget.type === WidgetType.STATS &&
                stats && <Stats widget={widget} stats={stats} />
            }
        </div>
    )
}
