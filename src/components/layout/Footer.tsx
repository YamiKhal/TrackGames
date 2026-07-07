import Link from "next/link";
import CookiePreferencesButton from "@/components/analytics/CookiePreferencesButton";
import Container from "@/components/layout/Container";

export default function Footer() {
	const groups = [
		{
			title: "Project",
			links: [
				{ href: "/roadmap", label: "Roadmap" },
				{ href: "/changelog", label: "Changelog" },
				{ href: "/backing", label: "Backing" },
			],
		},
		{
			title: "Us",
			links: [
				{ href: "/about", label: "About" },
				{ href: "/privacy", label: "Privacy" },
				{ href: "/terms", label: "Terms" },
			],
		},
	];

	return (
		<footer className="relative z-nav border-t border-border bg-bg">
			<Container className="flex min-h-20 flex-col gap-8 py-10 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex flex-col gap-2">
					<h1 className="text-2xl font-bold text-text">
						Track<span className="text-primary">Games</span>
					</h1>
					<p className="max-w-xs text-xs text-text-faint">Track, rate and share the games you play. Game data and imagery provided by IGDB.</p>
				</div>
				<nav aria-label="Footer" className="grid grid-cols-2 gap-x-10 gap-y-6 sm:grid-cols-3">
					{groups.map((group) => (
						<div key={group.title} className="flex flex-col gap-3">
							<p className="text-xs font-bold tracking-wide text-text uppercase">{group.title}</p>
							<div className="flex flex-col gap-2 text-sm font-medium text-text-muted">
								{group.links.map((link) => (
									<Link key={link.href} href={link.href} className="transition-colors hover:text-text">
										{link.label}
									</Link>
								))}
							</div>
						</div>
					))}
				</nav>
			</Container>
			<div className="flex items-center justify-center gap-3 border-t border-border p-5 text-xs text-text-faint">
				<p>
					@ 2026 TrackGames - <span className="text-bold">v1.0</span>
				</p>
				<span aria-hidden="true">·</span>
				<CookiePreferencesButton />
			</div>
		</footer>
	);
}
