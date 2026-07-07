import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import ActivityList from "@/app/(user)/u/[user]/ActivityList";
import FollowerPreviewPanel from "@/app/(user)/u/[user]/FollowerPreviewPanel";
import ProfilePlaylists from "@/app/(user)/u/[user]/ProfilePlaylists";
import ProfileSwitcherPanel from "@/app/(user)/u/[user]/ProfileSwitcherPanel";
import UserWidget from "@/app/(user)/u/[user]/UserWidget";
import CommentSection from "@/components/comments/CommentSection";
import Container from "@/components/layout/Container";
import BadgeView from "@/components/social/BadgeView";
import Loading from "@/components/ui/Loading";
import PrivateDisplay from "@/components/ui/PrivateDisplay";
import BackgroundView from "@/components/user/BackgroundView";
import ProfileHeader from "@/components/user/ProfileHeader";
import { auth } from "@/lib/auth";
import { getProfileSocialState, getUserBadges } from "@/lib/data/social/social";
import { getPublicUser, getUser, isFollower } from "@/lib/data/social/user";
import { InteractionTargetType } from "@/lib/generated/prisma/enums";
import { profileThemeStyle } from "@/lib/util/client/theme";
import { absoluteUrl, metadataDescription, robotsForPrivacy, SITE_NAME } from "@/lib/util/metadata";
import { parseWidgets } from "@/lib/util/parse/widgets";
import { checkPublicPrivacy, shouldHideComments } from "@/lib/util/privacy";

type UserPageProps = Readonly<{
	params: Promise<{ user: string }>;
	searchParams: Promise<{ tab?: string; activityPage?: string; activityFilter?: string }>;
}>;

export default async function Page({ params, searchParams }: UserPageProps) {
	const { user } = await params;
	const [profile, session] = await Promise.all([getPublicUser(user), auth()]);
	if (!profile) notFound();

	const { tab, activityPage = "1", activityFilter } = await searchParams;
	if (!tab) redirect(`/u/${profile.name}?tab=profile`);

	const isOwnProfile = profile.id === session?.user?.id;
	const isFollowingOwner = await isFollower(session?.user.id, profile.id);
	const canViewProfile = checkPublicPrivacy(profile.privacy, isOwnProfile, isFollowingOwner);

	if (!canViewProfile) return <PrivateDisplay canBackOption message={`${profile.name}'s profile is private`} />;

	const [socialState, badges, viewer] = await Promise.all([getProfileSocialState(profile.id), getUserBadges(profile.id), getUser(session?.user)]);
	const profileWidgets = parseWidgets(profile.widgets);

	const canViewActivity = checkPublicPrivacy(profile.activityPrivacy, isOwnProfile, isFollowingOwner);

	return (
		<main className="relative z-0 flex-1" style={profileThemeStyle(profile.profileColor, profile.accentColor)}>
			<BackgroundView src={profile.background} />
			<Container>
				{/* BANNER PROFILE */}
				<ProfileHeader isOwned={isOwnProfile} profile={profile} isFollowing={isFollowingOwner} isLoggedIn={Boolean(session?.user?.id)} />

				{/* INFO SETION */}
				<section className="relative z-elevated bg-bg/95 pt-5 pb-10">
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
							<ProfileSwitcherPanel user={profile.name} defaultTab={tab}>
								<Suspense fallback={<Loading />}>
									<div className="animate-content-in">
										{tab === "profile" && (
											<div className="flex w-full flex-col justify-center md:gap-2">
												{profileWidgets.map((widget) => (
													<UserWidget key={widget.id} widget={widget} userId={profile.id} />
												))}
											</div>
										)}
										{tab === "activity" && (
											<ActivityList
												profile={profile}
												isVisible={canViewActivity}
												activityFilter={activityFilter}
												activityPage={activityPage}
												viewer={viewer}
											/>
										)}
										{tab === "playlists" && (
											<ProfilePlaylists userId={profile.id} canCreate={isOwnProfile} isFollower={isFollowingOwner} isOwner={isOwnProfile} />
										)}
									</div>
								</Suspense>
							</ProfileSwitcherPanel>
						</div>
					</Container>
					{!profile.commentsHidden && !shouldHideComments(viewer) && <CommentSection targetType={InteractionTargetType.USER_PROFILE} targetId={profile.id} />}
				</section>
			</Container>
		</main>
	);
}

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
