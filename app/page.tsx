import { PrimaryButton, GhostButton } from "./components/ui/Buttons";
import StatBlock from "./components/StatBlock";
import Container from "./components/layout/Container";
import { trendingGames, yearlyGames, hiddenGames, mostAnticipated, comingSoon, recentReleases, siteStats, topPlaylists } from "@/lib/cache/resources";
import GameCard from "./components/game/GameCard";
import HorizontalScroller from "./components/layout/HorizontalScroller";
import GameFeature from "./components/game/GameFeature";
import Gallary from "./components/layout/Gallery";
import GamePlaylistDisplay from "./components/game/GamePlaylistDisplay";
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
		recentReleases.get(),
		siteStats.get(),
		topPlaylists.get(),
		getUser(session?.user),
	]);

	return (
		<div style={viewer ? viewerThemeStyle(viewer) : undefined}>
			{/* HERO */}
			<section className="relative flex items-center justify-center overflow-hidden p-20">
				<div className="pointer-events-none absolute inset-0 bg-[url('/assets/lucid-games-bg.webp')] mask-[radial-gradient(ellipse_at_center,black_48%,transparent_78%)] bg-cover bg-center mask-size-[120%_120%] mask-no-repeat before:absolute before:inset-0 before:bg-bg/92 before:content-['']" />
				<Container className="relative z-1 flex flex-col items-center justify-between gap-10 lg:flex-row">
					<div className="flex max-w-100 min-w-100 flex-col items-center justify-center gap-6 text-center text-text md:items-start md:justify-start md:text-start">
						<div className="mb-5 rounded">
							<h1 className="text-4xl font-bold text-nowrap md:text-5xl">
								Build Your <span className="text-shadow-lg text-shadow-primary/50">Library</span>
							</h1>
							<p className="text-md mt-5 font-body text-text-muted md:text-xl">
								Rate, track and categorize your games into lists. Customize your page and share it among friends.
							</p>
						</div>
						<div className="hidden grid-cols-2 gap-3 text-text md:grid md:grid-cols-4">
							<StatBlock color="var(--primary)" title="Games" value={stats.games} />
							<StatBlock color="var(--secondary)" title="Users" value={stats.users} />
							<StatBlock color="var(--success)" title="Libraries" value={stats.libraries} />
							<StatBlock color="var(--error)" title="Playlists" value={stats.playlists} />
						</div>
						<div className="mt-5 flex flex-row items-center gap-5">
							{session ? (
								<>
									<PrimaryButton href={`/library/${session.user.name}`}>Check Library</PrimaryButton>
									<GhostButton href={`/u/${session.user.name}`}>Your Profile</GhostButton>
								</>
							) : (
								<>
									<PrimaryButton href="/login?mode=register">Join</PrimaryButton>
									<p>or</p>
									<GhostButton href="/login?mode=login">Log into your account</GhostButton>
								</>
							)}
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
					<div className="flex flex-col items-start rounded border-b-2 border-primary/30 pb-10">
						<h1 className="flex flex-row items-center gap-2 text-xl font-bold text-text-muted">Trending Today</h1>
						<HorizontalScroller className="mt-4 max-w-full gap-5 overflow-clip rounded-md">
							{trendingDataList.map((game) => (
								<GameCard key={game.id} game={formatRawGame(game)} effect="ripple" hover="name" hasLink={true} />
							))}
						</HorizontalScroller>
					</div>
				</Container>
			</section>

			{/* YEARLY HITS */}
			<section className="mt-10">
				<Container>
					<div className="rounded border-b-2 border-primary/30 pb-10">
						<h1 className="mb-5 flex flex-row items-center gap-2 text-xl font-bold text-text-muted">Hits of the Year</h1>
						<Gallary mode="fade" shouldAutoRotate autoRotateMs={20000} idleMs={8000}>
							{yearlyDataList.map((game) => (
								<GameFeature key={game.id} game={formatRawGame(game)} />
							))}
						</Gallary>
					</div>
				</Container>
			</section>

			{/* PLAYLISTS */}
			<section className="mt-10">
				<Container>
					<div className="rounded border-b-2 border-primary/30 pb-20">
						<h1 className="mb-5 flex flex-row items-center gap-2 text-xl font-bold text-text-muted">Playlists</h1>
						{playlists.length ? (
							<div className="grid grid-cols-2 items-center justify-between gap-5 md:grid-cols-4">
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
							<h1 className="mb-5 text-center text-xl font-bold text-nowrap text-text-muted sm:text-start">Recent Releases</h1>
							{recentReleasesList.slice(0, 4).map((game) => (
								<GameStatInfoCard key={game.id} game={formatRawGame(game)} />
							))}
						</div>
						<div className="flex min-w-0 flex-col gap-2">
							<h1 className="mb-5 text-center text-xl font-bold text-nowrap text-text-muted sm:text-start">Coming Soon</h1>
							{comingSoonList.slice(0, 4).map((game) => (
								<GameStatInfoCard key={game.id} game={formatRawGame(game)} />
							))}
						</div>
						<div className="flex min-w-0 flex-col gap-2">
							<h1 className="mb-5 text-center text-xl font-bold text-nowrap text-text-muted sm:text-start">Most Anticipated</h1>
							{mostAnticipatedList.slice(0, 4).map((game) => (
								<GameStatInfoCard key={game.id} game={formatRawGame(game)} />
							))}
						</div>
						<div className="flex min-w-0 flex-col gap-2">
							<h1 className="mb-5 text-center text-xl font-bold text-nowrap text-text-muted sm:text-start">Hidden Gems</h1>
							{hiddenDataList.slice(0, 4).map((game) => (
								<GameStatInfoCard key={game.id} game={formatRawGame(game)} />
							))}
						</div>
					</div>
				</Container>
			</section>
		</div>
	);
}
