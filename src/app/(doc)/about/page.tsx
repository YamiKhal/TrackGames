import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, Gamepad2, Heart, Import, ListChecks, Palette, Star, Users } from "lucide-react";
import { PrimaryButton } from "@/components/ui/control/Button";
import { absoluteUrl, DEFAULT_OG_IMAGE, metadataDescription, SITE_NAME } from "@/lib/util/metadata";

const description = metadataDescription("What TrackGames is, who builds it, and why it exists — a home for tracking, rating, and sharing the games you play.");

export const metadata: Metadata = {
	title: "About",
	description,
	alternates: {
		canonical: absoluteUrl("/about"),
	},
	openGraph: {
		title: `About | ${SITE_NAME}`,
		description,
		url: absoluteUrl("/about"),
		siteName: SITE_NAME,
		type: "website",
		images: [{ url: DEFAULT_OG_IMAGE, alt: SITE_NAME }],
	},
	twitter: {
		card: "summary_large_image",
		title: `About | ${SITE_NAME}`,
		description,
		images: [DEFAULT_OG_IMAGE],
	},
};

const features = [
	{ icon: Gamepad2, title: "Track everything", text: "Log every game you own, play, or wishlist. Statuses, playtime, and progress all in one library." },
	{ icon: Star, title: "Rate & review", text: "Score games your way, keep private notes, and write reviews you can share or keep to yourself." },
	{ icon: ListChecks, title: "Playlists & tier lists", text: "Build custom lists, rank games into tiers, and organize your backlog however makes sense to you." },
	{ icon: BarChart3, title: "Stats that matter", text: "See what you actually play — hours, genres, completion rates, and trends across your library." },
	{ icon: Palette, title: "Make it yours", text: "Customize your profile with colors, backgrounds, and widgets that show off your taste." },
	{ icon: Import, title: "Bring your history", text: "Import your existing collection from other trackers so you don't start from zero." },
];

// TODO(content): placeholder team — swap for real names, roles, and avatars.
const team = [
	{ name: "The Dev", role: "Design & Engineering" },
	{ name: "The Community", role: "Feedback & Bug Reports" },
	{ name: "You", role: "Player & Backer" },
];

export default function AboutPage() {
	return (
		<div className="flex flex-col gap-12">
			<header className="flex flex-col gap-5 overflow-hidden rounded border border-border bg-linear-to-b from-primary/10 to-transparent p-8">
				<h1 className="text-4xl font-bold">
					Track<span className="text-primary">Games</span>
				</h1>
				<p className="max-w-2xl text-lg text-text-muted">
					A home for your games — track what you play, rate what you finish, and build the collection you&apos;d actually want to show off. Built by a player, for
					players.
				</p>
				<div className="flex flex-wrap gap-3">
					<PrimaryButton href="/games">Browse games</PrimaryButton>
					<PrimaryButton href="/roadmap" variant="outline">
						See what&apos;s next
					</PrimaryButton>
				</div>
			</header>

			<section className="flex flex-col gap-4">
				<h2 className="text-2xl font-bold">Why it exists</h2>
				<div className="grid gap-4 md:grid-cols-2">
					<p className="text-text-muted">
						Most of us play far more games than we remember. TrackGames started as a simple itch: keep an honest record of everything played, without a spreadsheet and
						without the noise of a storefront trying to sell the next thing.
					</p>
					<p className="text-text-muted">
						The goal is a fast, personal, and genuinely fun place to log your games — one that respects your data, stays out of your way, and grows based on what the
						community actually asks for.
					</p>
				</div>
			</section>

			<section className="flex flex-col gap-5">
				<h2 className="text-2xl font-bold">What you can do</h2>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{features.map((feature) => {
						const Icon = feature.icon;
						return (
							<div key={feature.title} className="flex flex-col gap-3 rounded border border-border bg-bg-secondary/40 p-5">
								<span className="grid size-10 place-items-center rounded bg-primary/15 text-primary">
									<Icon size={20} aria-hidden="true" />
								</span>
								<h3 className="font-bold text-text">{feature.title}</h3>
								<p className="text-sm text-text-muted">{feature.text}</p>
							</div>
						);
					})}
				</div>
			</section>

			<section className="flex flex-col gap-5">
				<h2 className="text-2xl font-bold">A look inside</h2>
				<div className="grid gap-4 sm:grid-cols-2">
					{["Your library", "Game pages", "Profile & widgets", "Playlists & tiers"].map((label) => (
						<div
							key={label}
							className="relative grid aspect-video place-items-center overflow-hidden rounded border border-border bg-linear-to-br from-bg-secondary to-bg text-sm font-bold text-text-faint"
						>
							{label}
						</div>
					))}
				</div>
			</section>

			<section className="flex flex-col gap-5">
				<h2 className="flex items-center gap-2 text-2xl font-bold">
					<Users size={22} className="text-primary" aria-hidden="true" /> The team
				</h2>
				<div className="grid gap-4 sm:grid-cols-3">
					{team.map((member) => (
						<div key={member.name} className="flex flex-col items-center gap-3 rounded border border-border bg-bg-secondary/40 p-6 text-center">
							<span className="grid size-16 place-items-center rounded-full bg-primary/15 text-xl font-bold text-primary">{member.name.charAt(0)}</span>
							<div>
								<p className="font-bold text-text">{member.name}</p>
								<p className="text-sm text-text-muted">{member.role}</p>
							</div>
						</div>
					))}
				</div>
			</section>

			<section className="flex flex-col items-start gap-4 rounded border border-primary/40 bg-primary/5 p-8">
				<h2 className="flex items-center gap-2 text-2xl font-bold">
					<Heart size={22} className="text-primary" aria-hidden="true" /> Keep it going
				</h2>
				<p className="max-w-2xl text-text-muted">
					TrackGames is free to use. If you want to help cover hosting and fund new features, backing the project is the best way to do it — and you get a few perks for
					it.
				</p>
				<PrimaryButton href="/backing">Support the project</PrimaryButton>
			</section>

			<p className="text-xs text-text-faint">
				Game data and imagery are provided by IGDB. Questions or feedback? Reach out from the{" "}
				<Link href="/contact" className="text-primary hover:underline">
					contact page
				</Link>
				.
			</p>
		</div>
	);
}
