import { PrimaryButton, GhostButton } from "./components/ui/Buttons";
import StatBlock from "./components/StatBlock";
import Container from "./components/layout/Container";
import { trendingGames, yearlyGames, hiddenGames, mostAnticipated, comingSoon, recentreleases, siteStats, topPlaylists } from "@/lib/cache/resources";
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
  const [trendingDataList, yearlyDataList, hiddenDataList, mostAnticipatedList, comingSoonList, recentReleasesList, stats, playlists, viewer] = await Promise.all([
    trendingGames.get(),
    yearlyGames.get(),
    hiddenGames.get(),
    mostAnticipated.get(),
    comingSoon.get(),
    recentreleases.get(),
    siteStats.get(),
    topPlaylists.get(),
    getUser(session?.user),
  ]);

  return (
    <div style={viewer ? viewerThemeStyle(viewer) : undefined}>
      {/* HERO */}
      <section className="relative overflow-hidden flex justify-center p-20 items-center">
        <div className="pointer-events-none absolute inset-0 bg-[url('/assets/lucid-games-bg.webp')] bg-cover bg-center mask-[radial-gradient(ellipse_at_center,black_48%,transparent_78%)] mask-size-[120%_120%] mask-no-repeat before:absolute before:inset-0 before:bg-bg/92 before:content-['']" />
        <Container className="relative z-1 flex justify-between gap-10 items-center flex-col lg:flex-row">

          <div className="text-text min-w-100 max-w-100 flex flex-col gap-6 items-center justify-center text-center md:text-start md:justify-start md:items-start">
            <div className="rounded mb-5">
              <h1 className="text-4xl md:text-5xl font-bold text-nowrap">Build Your <span className="text-shadow-primary/50 text-shadow-lg">Library</span></h1>
              <p className="text-md md:text-xl text-text-muted font-body mt-5">Rate, track and categorize your games into lists. Customize your page and share it among friends.</p>
            </div>
            <div className="grid-cols-2 md:grid-cols-4 gap-3 text-text hidden md:grid">
              <StatBlock color="var(--primary)" title="Games" value={stats.games} />
              <StatBlock color="var(--secondary)" title="Users" value={stats.users} />
              <StatBlock color="var(--success)" title="Libraries" value={stats.libraries} />
              <StatBlock color="var(--error)" title="Playlists" value={stats.playlists} />
            </div>
            <div className="flex flex-row gap-5 items-center mt-5">
              {session ?
                <>
                  <PrimaryButton href={`/library/${session.user.name}`}>Check Library</PrimaryButton>
                  <GhostButton href={`/u/${session.user.name}`}>Your Profile</GhostButton>
                </>
                :
                <>
                  <PrimaryButton href="/login?mode=register">Join</PrimaryButton>
                  <p>or</p>
                  <GhostButton href="/login?mode=login">Log into your account</GhostButton>
                </>
              }
            </div>
          </div>


          <div className="relative z-1 hidden w-82 lg:block lg:w-115">
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
                  <GameCard key={game.id} game={formatRawGame(game)} effect="ripple" hover="name" slugged={true} />
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
            {playlists.length ? (
              <div className="grid grid-cols-2 md:grid-cols-4 justify-between items-center gap-5">
                {playlists.map((playlist, index) => (
                  <GamePlaylistDisplay
                    key={playlist.id}
                    games={playlist.entries.slice(0, 4).map((entry) => entry.game)}
                    rank={index + 1}
                    title={playlist.name}
                    by={playlist.user?.name ?? undefined}
                    href={`/playlist/${playlist.id}`}
                  />
                ))}
              </div>
            ) : (
              <p className="p-4 text-sm text-text-muted">No public playlists yet.</p>
            )}
          </div>
        </Container>
      </section>

      {/* OTHER GAME QUERIES */}
      <section className="mt-10 mb-10">
        <Container>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex min-w-0 flex-col gap-2">
              <h1 className="text-xl font-bold text-text-muted mb-5 text-nowrap text-center sm:text-start">
                Recent Releases
              </h1>
              {
                recentReleasesList.slice(0, 4).map((game) => (
                  <GameStatInfoCard key={game.id} game={formatRawGame(game)} />
                ))
              }
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <h1 className="text-xl font-bold text-text-muted mb-5 text-nowrap text-center sm:text-start">
                Coming Soon
              </h1>
              {
                comingSoonList.slice(0, 4).map((game) => (
                  <GameStatInfoCard key={game.id} game={formatRawGame(game)} />
                ))
              }
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <h1 className="text-xl font-bold text-text-muted mb-5 text-nowrap text-center sm:text-start">
                Most Anticipated
              </h1>
              {
                mostAnticipatedList.slice(0, 4).map((game) => (
                  <GameStatInfoCard key={game.id} game={formatRawGame(game)} />
                ))
              }
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <h1 className="text-xl font-bold text-text-muted mb-5 text-nowrap text-center sm:text-start">
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
