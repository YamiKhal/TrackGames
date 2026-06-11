import GameCard from "@/app/components/game/GameCard";
import HorizontalScroller from "@/app/components/layout/HorizontalScroller";
import { Widget } from "@/lib/types";
import { MarkdownBlocks } from "../../components/markdown/MarkdownBlocks";
import { WidgetType } from "@/lib/enums";
import { parseMarkdownBlocks } from "@/lib/markdown";


function GameList({ widget }: { widget: Widget }) {
    return (
        <div className="p-5 w-full bg-bg-secondary/60 rounded">
            {widget.games ?
                <div>
                    <p className="font-bold text-xl mb-3">
                        {widget.title}
                    </p>
                    <div className="bg-bg/60 rounded-md">
                        <HorizontalScroller className="rounded-md overflow-clip gap-5 max-w-full p-6">
                            {
                                <div>EMPTY FOR NOW! WAITING FOR LOCAL DATABASE SUPPORT</div>
                                //widget.games.map((game) => (
                                //    <GameCard key={game.id} game={game} size={160} effect="ripple" hover="name" slugged={true} />
                                //))
                            }
                        </HorizontalScroller>
                    </div>
                </div>
                : <p className="font-bold p-5 bg-error/30 border-2 border-error/50 rounded text-center">Data Not Found - Favorites widget failed</p>}
        </div>
    )
}


function StatsBlock({ widget, stat }: { widget: Widget; stat: string }) {
    return (
        <div className="bg-primary/10 p-10 border-2 border-primary/40 flex flex-col gap-2 justify-start items-center text-center font-bold text-2xl rounded-md w-full h-32">

            <p className="flex-1 flex items-center">000</p>
            <p className="text-sm h-6">{stat}</p>
        </div>
    )
}

function Stats({ widget }: { widget: Widget }) {
    return (
        <div>
            {widget.stats ?
                <div className="flex flex-col items-center md:flex-row md:justify-between gap-2">
                    {
                        widget.stats.map((stat, index) => (
                            <StatsBlock key={index} widget={widget} stat={stat} />
                        ))
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
        <div className="p-5 w-full bg-bg-secondary/60 rounded overflow-hidden wrap-break-word">
            {blocks.length > 0 ?
                <div className="space-y-4 text-sm leading-6 text-text md:text-base">
                    <MarkdownBlocks blocks={blocks} />
                </div>

                : <p className="font-bold p-5 bg-error/30 border-2 border-error/50 rounded text-center">Data Not Found - Markdown widget failed</p>}
        </div>
    )
}


export default function UserWidget({ widget }: { widget: Widget }) {
    return (
        <div className="w-full p-5">
            {widget.type === WidgetType.GAMELIST &&
                <GameList widget={widget} />
            }
            {widget.type === WidgetType.MARKDOWN &&
                <Markdown widget={widget} />
            }
            {widget.type === WidgetType.STATS &&
                <Stats widget={widget} />
            }
        </div>
    )
}
