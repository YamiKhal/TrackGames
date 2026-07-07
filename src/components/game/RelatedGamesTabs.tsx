"use client";

import { useState } from "react";
import { GameCard } from "@/components/game/GameDisplay";
import HorizontalScroller from "@/components/layout/HorizontalScroller";
import Tabs from "@/components/layout/Tabs";
import type { Game } from "@/lib/data/catalog/games";
import * as lookup from "@/lib/util/validate/normalize";

type RelatedGamesTabsProps = Readonly<{ franchiseGames: Game[]; seriesGames: Game[]; similarGames: Game[]; dlcGames: Game[]; expansionGames: Game[] }>;

export default function RelatedGamesTabs({ franchiseGames, seriesGames, similarGames, dlcGames, expansionGames }: RelatedGamesTabsProps) {
	const tabs = [
		{ id: "series" as const, label: "Series", games: seriesGames },
		{ id: "dlcs" as const, label: "DLCs", games: dlcGames },
		{ id: "expansions" as const, label: "Expansions", games: expansionGames },
		{ id: "franchies" as const, label: "Franchise", games: franchiseGames },
		{ id: "similar" as const, label: "Similar Games", games: similarGames },
	].filter((tab) => tab.games.length > 0);

	const [activeTab, setActiveTab] = useState<string>(tabs[0]?.id ?? "similar");
	const activeGames = lookup.byKey(tabs, "id", activeTab)?.games ?? tabs[0]?.games ?? [];

	if (!tabs.length) {
		return null;
	}

	return (
		<Tabs tabs={tabs} active={activeTab} onSelect={setActiveTab} hasViewAll={activeTab !== "similar"} responsive="compact">
			<HorizontalScroller className="mt-4 max-w-full gap-5 overflow-clip rounded">
				{activeGames.map((game) => (
					<GameCard key={game.id} game={game} size={160} effect="ripple" hover="name" hasHref={true} />
				))}
			</HorizontalScroller>
		</Tabs>
	);
}
