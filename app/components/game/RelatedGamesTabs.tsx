"use client";

import { useState } from "react";
import { DisplayGame } from "@/lib/types";
import GameCard from "./GameCard";
import HorizontalScroller from "../layout/HorizontalScroller";
import SubTabs from "../layout/SubTabs";

export default function RelatedGamesTabs({ franchiesGames, seriesGames, similarGames }: { franchiesGames: DisplayGame[]; seriesGames: DisplayGame[]; similarGames: DisplayGame[] }) {
    const tabs = [
        { id: "series" as const, label: "Series", games: seriesGames },
        { id: "franchies" as const, label: "Franchise", games: franchiesGames },
        { id: "similar" as const, label: "Similar Games", games: similarGames },
    ].filter((tab) => tab.games.length > 0);

    const [activeTab, setActiveTab] = useState<"series" | "franchies" | "similar">(tabs[0].id);
    const activeGames = tabs.find((tab) => tab.id === activeTab)?.games ?? tabs[0]?.games ?? [];

    if (!tabs.length) {
        return null;
    }

    return (
        <SubTabs tabs={tabs} active={activeTab} setter={setActiveTab} viewAll={activeTab !== "similar"}>
            <HorizontalScroller className="rounded-md overflow-clip gap-5 mt-4 max-w-full">
                {activeGames.map((game) => (
                    <GameCard key={game.id} game={game} size={160} effect="ripple" hover="name" slugged={true} />
                ))}
            </HorizontalScroller>
        </SubTabs>
    );
}
