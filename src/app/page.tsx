import { Suspense } from "react";
import { ListMusic } from "lucide-react";
import { GameCard, StatInfoCard } from "@/components/game/GameDisplay";
import GameFeature from "@/components/game/GameFeature";
import PlaylistCoverCard from "@/components/gamelist/PlaylistCoverCard";
import Container from "@/components/layout/Container";
import Gallery from "@/components/layout/Gallery";
import HorizontalScroller from "@/components/layout/HorizontalScroller";
import { GhostButton, PrimaryButton } from "@/components/ui/control/Button";
import EmptyState from "@/components/ui/EmptyState";
import Loading from "@/components/ui/Loading";
import StatBlock from "@/components/ui/StatBlock";
import { HeroImage } from "@/components/ui/SVG";
import { auth } from "@/lib/auth";
import { comingSoon, hiddenGames, mostAnticipated, recentReleases, siteStats, topPlaylists, trendingGames, yearlyGames } from "@/lib/cache/resources";
import { getUser } from "@/lib/data/social/user";
import { formatRawGame } from "@/lib/external/igdb/util";
import { viewerThemeStyle } from "@/lib/util/client/theme";

export default async function Home() {
	const session = await auth();
	const viewer = await getUser(session?.user);
	const [trendingDataList, yearlyDataList, hiddenDataList, mostAnticipatedList, comingSoonList, recentReleasesList, stats, playlists] = await Promise.all([
		trendingGames.get(),
		yearlyGames.get(),
		hiddenGames.get(),
		mostAnticipated.get(),
		comingSoon.get(),
		recentReleases.get(),
		siteStats.get(),
		topPlaylists.get(),
	]);

	return (
		<div style={viewer ? viewerThemeStyle(viewer) : undefined}>
			<section className="relative flex items-center justify-center overflow-hidden p-20">
				<div className="pointer-events-none absolute inset-0 bg-[url('/assets/lucid-games-bg.webp')] mask-[radial-gradient(ellipse_at_center,black_48%,transparent_78%)] bg-cover bg-center mask-size-[120%_120%] mask-no-repeat before:absolute before:inset-0 before:bg-bg/92 before:content-['']" />
				<Container className="relative z-raised flex flex-col items-center justify-between gap-10 lg:flex-row">
					<div className="flex max-w-100 min-w-100 flex-col items-center justify-center gap-6 text-center text-text md:items-start md:justify-start md:text-start">
						<div className="mb-5 rounded">
							<h1 className="text-4xl font-bold text-nowrap md:text-5xl">
								Build Your <span className="text-shadow-lg text-shadow-primary/50">Library</span>
							</h1>
							<p className="text-md mt-5 mr-10 ml-10 font-body text-text-muted md:mr-0 md:ml-0 md:text-xl">
								Rate, track and categorize your games into lists. Customize your page and share it among friends.
							</p>
						</div>
						<div className="hidden grid-cols-2 gap-3 text-text md:grid md:grid-cols-4">
							<StatBlock color="var(--primary)" title="Games" value={stats.games} />
							<StatBlock color="var(--secondary)" title="Users" value={stats.users} />
							<StatBlock color="var(--success)" title="Libraries" value={stats.libraries} />
							<StatBlock color="var(--error)" title="Playlists" value={stats.playlists} />
						</div>
						<div className="mt-5 flex flex-col items-center md:flex-row md:gap-5">
							{session ? (
								<>
									<PrimaryButton href={`/library/${session.user.name}`}>Check Library</PrimaryButton>
									<GhostButton variant="outline" href={`/u/${session.user.name}?tab=profile`}>
										Your Profile
									</GhostButton>
								</>
							) : (
								<>
									<PrimaryButton href="/login?mode=register">Register</PrimaryButton>
									<p>or</p>
									<GhostButton variant="outline" href="/login?mode=login">
										Log into your account
									</GhostButton>
								</>
							)}
						</div>
					</div>

					<div className="relative z-raised hidden w-82 lg:block lg:w-115">
						<HeroImage className="text-text dark:text-primary" />
					</div>
				</Container>
			</section>

			<Suspense fallback={<Loading />}>
				<section className="mt-10">
					<Container>
						<div className="flex flex-col items-start rounded border-b-2 border-primary/30 pb-10">
							<h1 className="flex flex-row items-center gap-2 text-xl font-bold text-text-muted">Trending Today</h1>
							<HorizontalScroller className="animate-content-in mt-4 max-w-full gap-5 overflow-clip rounded">
								{trendingDataList.map((game) => (
									<GameCard key={game.id} game={formatRawGame(game)} effect="ripple" hover="name" hasHref={true} />
								))}
							</HorizontalScroller>
						</div>
					</Container>
				</section>

				<section className="animate-content-in mt-10">
					<Container>
						<div className="rounded border-b-2 border-primary/30 pb-10">
							<h1 className="mb-5 flex flex-row items-center gap-2 text-xl font-bold text-text-muted">Hits of the Year</h1>
							<Gallery mode="fade" shouldAutoRotate autoRotateMs={20000} idleMs={8000}>
								{yearlyDataList.map((game) => (
									<GameFeature key={game.id} game={formatRawGame(game)} />
								))}
							</Gallery>
						</div>
					</Container>
				</section>

				<section className="animate-content-in mt-10">
					<Container>
						<div className="rounded border-b-2 border-primary/30 pb-20">
							<h1 className="mb-5 flex flex-row items-center gap-2 text-xl font-bold text-text-muted">Playlists</h1>
							{playlists.length ? (
								<div className="grid grid-cols-2 items-center justify-between gap-5 md:grid-cols-4">
									{playlists.map((playlist, index) => (
										<PlaylistCoverCard key={playlist.id} playlist={playlist} rank={index + 1} hasHref />
									))}
								</div>
							) : (
								<EmptyState icon={ListMusic} message="No public playlists yet." />
							)}
						</div>
					</Container>
				</section>

				<section className="animate-content-in mt-10 mb-10">
					<Container>
						<div className="grid grid-cols-2 gap-10 sm:grid-cols-2 lg:grid-cols-4">
							<div className="flex min-w-0 flex-col gap-2">
								<h1 className="mb-5 text-center text-xl font-bold text-nowrap text-text-muted sm:text-start">Recent Releases</h1>
								{recentReleasesList.slice(0, 4).map((game) => (
									<StatInfoCard key={game.id} game={formatRawGame(game)} />
								))}
							</div>
							<div className="flex min-w-0 flex-col gap-2">
								<h1 className="mb-5 text-center text-xl font-bold text-nowrap text-text-muted sm:text-start">Coming Soon</h1>
								{comingSoonList.slice(0, 4).map((game) => (
									<StatInfoCard key={game.id} game={formatRawGame(game)} />
								))}
							</div>
							<div className="flex min-w-0 flex-col gap-2">
								<h1 className="mb-5 text-center text-xl font-bold text-nowrap text-text-muted sm:text-start">Most Anticipated</h1>
								{mostAnticipatedList.slice(0, 4).map((game) => (
									<StatInfoCard key={game.id} game={formatRawGame(game)} />
								))}
							</div>
							<div className="flex min-w-0 flex-col gap-2">
								<h1 className="mb-5 text-center text-xl font-bold text-nowrap text-text-muted sm:text-start">Hidden Gems</h1>
								{hiddenDataList.slice(0, 4).map((game) => (
									<StatInfoCard key={game.id} game={formatRawGame(game)} />
								))}
							</div>
						</div>
					</Container>
				</section>
			</Suspense>
		</div>
	);
}
