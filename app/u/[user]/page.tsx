import Container from "@/app/components/layout/Container";
import { canViewPrivacy, getPublicUser, getUser, profileThemeStyle } from "@/lib/account/user";
import { defaultActivityFilter, shouldHideComments } from "@/lib/account/preferences";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import FollowerPreviewPanel from "./FollowerPreviewPanel";
import BackgroundView from "../../components/user/BackgroundView";
import ProfileSwitcherPanel from "./ProfileSwitcherPanel";
import UserWidget from "./UserWidget";
import { parseSocials } from "@/lib/account/socials";
import { parseWidgets } from "@/lib/account/widget";
import ProfileHeader from "@/app/components/user/ProfileHeader";
import { getUserPlaylists } from "@/lib/data/playlists";
import ProfilePlaylists from "./ProfilePlaylists";
import CommentSection from "@/app/components/comments/CommentSection";
import { InteractionTargetType } from "@/lib/generated/prisma/enums";
import { getProfileSocialState, getUserActivities, getUserBadges } from "@/lib/data/social";
import BadgeView from "@/app/components/social/BadgeView";
import ActivityList from "./ActivityList";
import type { Metadata } from "next";
import { absoluteUrl, metadataDescription, robotsForPrivacy, SITE_NAME } from "@/lib/metadata";

type UserPageProps = Readonly<{
	params: Promise<{ user: string }>;
	searchParams: Promise<{ tab?: string; activityPage?: string; activityFilter?: string }>;
}>;

export async function generateMetadata({ params }: { params: Promise<{ user: string }> }): Promise<Metadata> {
	const { user } = await params;
	const profile = await getPublicUser(user);
	const name = profile?.name ?? user;
	const title = profile ? `${name}'s Profile` : "Profile not found";
	const description = metadataDescription(profile?.bio, profile ? `View ${name}'s TrackGames profile, playlists and activity.` : "The requested profile could not be found.");
	const image = absoluteUrl(`/u/${encodeURIComponent(name)}/opengraph-image`);
	const url = absoluteUrl(`/u/${encodeURIComponent(name)}`);

	return {
		title,
		description,
		alternates: {
			canonical: url,
		},
		openGraph: {
			title: `${title} | ${SITE_NAME}`,
			description,
			url,
			siteName: SITE_NAME,
			type: "profile",
			username: profile?.name ?? undefined,
			images: [
				{
					url: image,
					alt: title,
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title: `${title} | ${SITE_NAME}`,
			description,
			images: [image],
		},
		robots: robotsForPrivacy(profile?.privacy),
	};
}

export default async function Page({ params, searchParams }: UserPageProps) {
	const { user } = await params;
	const { tab = "profile", activityPage = "1", activityFilter } = await searchParams;
	const activeTab = tab === "logs" ? "activity" : tab;
	const [profile, session] = await Promise.all([getPublicUser(user), auth()]);

	if (!profile) {
		redirect("/not-found");
	}

	const isOwnProfile = profile.id === session?.user?.id;
	const displayName = profile.name ?? user;
	const background = profile.background ?? null;
	const bio = profile.bio ?? "No bio yet.";
	const socials = parseSocials(profile.socials);
	const savedWidgets = parseWidgets(profile.widgets);
	const profileWidgets = savedWidgets.length > 0 ? savedWidgets : [];
	const [socialState, badges] = await Promise.all([getProfileSocialState(profile.id, session?.user?.id), getUserBadges(profile.id)]);
	const canViewProfile = canViewPrivacy(profile.privacy, isOwnProfile, socialState.isFollowing);
	const canViewLibrary = canViewPrivacy(profile.libraryPrivacy, isOwnProfile, socialState.isFollowing);
	const canViewActivity = canViewPrivacy(profile.activityPrivacy, isOwnProfile, socialState.isFollowing);
	const viewer = await getUser(session?.user);
	const canViewLogs = canViewActivity;
	const selectedActivityFilter = activityFilter ?? (viewer ? defaultActivityFilter(viewer) : "all");
	const safeActivityFilter = selectedActivityFilter === "logs" && !canViewLogs ? "all" : selectedActivityFilter;
	const [playlists, activity] = await Promise.all([
		activeTab === "playlists" && canViewLibrary ? getUserPlaylists(profile.id) : [],
		activeTab === "activity" && canViewActivity ? getUserActivities(profile.id, Number(activityPage), safeActivityFilter, canViewLogs) : null,
	]);

	return (
		<main className="relative z-0 flex-1" style={profileThemeStyle(profile.profileColor, profile.accentColor)}>
			<BackgroundView src={background} />
			<Container>
				{/* BANNER PROFILE */}
				<ProfileHeader
					isOwned={isOwnProfile}
					profileImage={profile.image}
					displayName={profile.name ?? "Unknown"}
					socials={socials}
					bio={bio}
					roles={profile.roles}
					followUserId={profile.id}
					isFollowing={socialState.isFollowing}
					isLoggedIn={Boolean(session?.user?.id)}
				/>

				{/* INFO SETION */}
				<section className="relative z-10 bg-bg/95 pt-5 pb-10">
					<Container className="flex flex-col-reverse gap-5 lg:flex-row lg:items-start">
						{/* LEFT SIDE */}
						<aside className="flex w-full flex-col gap-5 lg:w-60 lg:shrink-0">
							<FollowerPreviewPanel title="Following" profiles={socialState.following} count={socialState.followingCount} />
							<FollowerPreviewPanel title="Followers" profiles={socialState.followers} count={socialState.followerCount} />

							{/* BADGES */}
							<div className="w-full rounded bg-bg-secondary/80 p-4">
								<h2 className="mb-3 border-b border-border pb-2 text-sm">Badges</h2>
								<div className="grid w-full grid-cols-2 gap-2 rounded p-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
									{badges.length ? (
										badges.map((userBadge) => <BadgeView key={userBadge.id} badge={userBadge.badge} />)
									) : (
										<p className="col-span-full rounded p-3 text-sm text-text-muted">No badges yet.</p>
									)}
								</div>
							</div>
						</aside>
						{/* RIGHT SIDE */}
						<div className="min-w-0 flex-1">
							<ProfileSwitcherPanel user={displayName} defaultTab={activeTab}>
								{activeTab === "profile" && canViewProfile && (
									<div className="flex w-full flex-col justify-center md:gap-2">
										{profileWidgets?.map((widget) => (
											<UserWidget key={widget.id} widget={widget} userId={profile.id} />
										))}
										{!profile.commentsHidden && !shouldHideComments(viewer) && (
											<CommentSection targetType={InteractionTargetType.USER_PROFILE} targetId={profile.id} />
										)}
									</div>
								)}
								{activeTab === "profile" && !canViewProfile && (
									<p className="rounded border border-border bg-bg p-4 text-sm text-text-muted">This profile is private.</p>
								)}
								{activeTab === "activity" && canViewActivity && (
									<ActivityList
										user={displayName}
										activities={activity?.activities ?? []}
										page={activity?.page ?? 1}
										totalPages={activity?.totalPages ?? 1}
										filter={safeActivityFilter}
										canViewLogs={canViewLogs}
									/>
								)}
								{activeTab === "activity" && !canViewActivity && (
									<p className="rounded border border-border bg-bg p-4 text-sm text-text-muted">Activity is private.</p>
								)}
								{activeTab === "playlists" && canViewLibrary && <ProfilePlaylists playlists={playlists} canCreate={isOwnProfile} />}
								{activeTab === "playlists" && !canViewLibrary && (
									<p className="rounded border border-border bg-bg p-4 text-sm text-text-muted">Library and playlists are private.</p>
								)}
							</ProfileSwitcherPanel>
						</div>
					</Container>
				</section>
			</Container>
		</main>
	);
}
