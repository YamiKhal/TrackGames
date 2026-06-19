import Image from "next/image";
import { PrimaryButton, GhostButton } from "./components/ui/Buttons";
import { Bolt, Star } from "lucide-react";
import StatBlock from "./components/StatBlock";
import Container from "./components/layout/Container";
import { trendingGames, yearlyGames, hiddenGames, mostAnticipated, comingSoon, recentreleases, siteStats } from "@/lib/cache/resources";
import GameCard from "./components/game/GameCard";
import HorizontalScroller from "./components/layout/HorizontalScroller";
import GameFeature from "./components/game/GameFeature";
import Gallary from "./components/layout/Gallary";
import GamePlaylistDisplay from "./components/game/GamePlaylistDispaly";
import { Hero } from "./components/SVG";
import GameStatInfoCard from "./components/game/GameStatInfoCard";
import { formatRawGame } from "@/lib/external/igdb/util";
import { auth } from "@/lib/auth";
import { getUser } from "@/lib/account/user";
import { viewerThemeStyle } from "@/lib/account/preferences";

export default async function Home() {
  const session = await auth();
  const [trendingDataList, yearlyDataList, hiddenDataList, mostAnticipatedList, comingSoonList, recentReleasesList, stats, viewer] = await Promise.all([
    trendingGames.get(),
    yearlyGames.get(),
    hiddenGames.get(),
    mostAnticipated.get(),
    comingSoon.get(),
    recentreleases.get(),
    siteStats.get(),
    getUser(session?.user),
  ]);

  return (
    <div style={viewer ? viewerThemeStyle(viewer) : undefined}>
      {/* HERO */}
      <section className="relative overflow-hidden flex justify-center p-20 items-center">
        <div className="pointer-events-none absolute inset-0 bg-[url('/assets/lucid-games-bg.webp')] bg-cover bg-center mask-[radial-gradient(ellipse_at_center,black_48%,transparent_78%)] mask-size-[120%_120%] mask-no-repeat before:absolute before:inset-0 before:bg-bg/92 before:content-['']" />
        <Container className="relative z-1 flex justify-between gap-10 items-center flex-col lg:flex-row">

          <div className="text-text min-w-100 max-w-100 flex gap-6">
            <div>
              <div className="rounded pb-5 pr-5">
                <h1 className="text-5xl font-bold text-nowrap">Build Your <span className="text-shadow-primary/50 text-shadow-lg">Library</span></h1>
                <p className="text-xl text-text-muted font-body mt-5">Rate, track and categorize your games into lists. Customize your page and share it among friends.</p>
              </div>
              <div className="grid grid-cols-4 gap-3 border-blue-800 text-text min-w-100 max-w-100">
                <StatBlock color="var(--primary)" title="Games" value={stats.games} />
                <StatBlock color="var(--secondary)" title="Users" value={stats.users} />
                <StatBlock color="var(--success)" title="Libraries" value={stats.libraries} />
                <StatBlock color="var(--error)" title="Playlists" value={stats.playlists} />
              </div>
              <div className="flex flex-row gap-5 items-center mt-5">
                <PrimaryButton href="/login?mode=register">Join</PrimaryButton>
                <p>or</p>
                <GhostButton href="/login?mode=login">Log into your account</GhostButton>
              </div>
            </div>
          </div>


          <div className="relative z-1 hidden w-82 sm:block sm:w-115">
            <Hero className="text-text dark:text-primary" />
          </div>
        </Container>
      </section>

      {/* TRENDING */}
      <section className="mt-10">
        <Container>
          <div className="flex flex-col items-start pb-10 border-b-2 border-primary/30 rounded">
            <h1 className="flex flex-row items-center gap-2 text-xl font-bold text-text-muted">
              Trending Today
            </h1>
            <HorizontalScroller className="rounded-md overflow-clip gap-5 mt-4 max-w-full">
              {
                trendingDataList.map((game) => (
                  <GameCard key={game.id} game={formatRawGame(game)} size={160} effect="ripple" hover="name" slugged={true} />
                ))
              }
            </HorizontalScroller>
          </div>
        </Container>
      </section>

      {/* YEARLY HITS */}
      <section className="mt-10">
        <Container>
          <div className="pb-10 border-b-2 border-primary/30 rounded">
            <h1 className="flex flex-row items-center gap-2 text-xl font-bold text-text-muted mb-5">
              Hits of the Year
            </h1>
            <Gallary mode="fade" autoRotate autoRotateMs={20000} idleMs={8000}>
              {
                yearlyDataList.map((game) => (
                  <GameFeature key={game.id} game={formatRawGame(game)} />
                ))
              }
            </Gallary>
          </div>
        </Container>
      </section>

      {/* PLAYLISTS */}
      <section className="mt-10">
        <Container>
          <div className="pb-20 border-b-2 border-primary/30 rounded">
            <h1 className="flex flex-row items-center gap-2 text-xl font-bold text-text-muted mb-5">
              Playlists
            </h1>
            <div className="flex flex-row justify-between items-center gap-5">
              <GamePlaylistDisplay game={formatRawGame(trendingDataList[0])} rank={1} />
              <GamePlaylistDisplay game={formatRawGame(trendingDataList[1])} rank={2} />
              <GamePlaylistDisplay game={formatRawGame(trendingDataList[2])} rank={3} />
              <GamePlaylistDisplay game={formatRawGame(trendingDataList[3])} rank={4} />
            </div>
          </div>
        </Container>
      </section>

      {/* OTHER GAME QUERIES */}
      <section className="mt-10 mb-10">
        <Container>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex min-w-0 flex-col gap-2">
              <h1 className="flex flex-row items-center gap-2 text-xl font-bold text-text-muted mb-5">
                Recent Releases
              </h1>
              {
                recentReleasesList.slice(0, 4).map((game) => (
                  <GameStatInfoCard key={game.id} game={formatRawGame(game)} />
                ))
              }
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <h1 className="flex flex-row items-center gap-2 text-xl font-bold text-text-muted mb-5">
                Coming Soon
              </h1>
              {
                comingSoonList.slice(0, 4).map((game) => (
                  <GameStatInfoCard key={game.id} game={formatRawGame(game)} />
                ))
              }
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <h1 className="flex flex-row items-center gap-2 text-xl font-bold text-text-muted mb-5">
                Most Anticipated
              </h1>
              {
                mostAnticipatedList.slice(0, 4).map((game) => (
                  <GameStatInfoCard key={game.id} game={formatRawGame(game)} />
                ))
              }
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <h1 className="flex flex-row items-center gap-2 text-xl font-bold text-text-muted mb-5">
                Hidden Gems
              </h1>
              {
                hiddenDataList.slice(0, 4).map((game) => (
                  <GameStatInfoCard key={game.id} game={formatRawGame(game)} />
                ))
              }
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
