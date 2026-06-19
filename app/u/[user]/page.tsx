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

export default async function Page({ params, searchParams }: { params: Promise<{ user: string }>; searchParams: Promise<{ tab?: string; activityPage?: string; activityFilter?: string }>; }) {
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
    const bio = profile.bio ?? "No bio yet."
    const socials = parseSocials(profile.socials);
    const savedWidgets = parseWidgets(profile.widgets);
    const profileWidgets = savedWidgets.length > 0 ? savedWidgets : [];
    const [socialState, badges] = await Promise.all([
        getProfileSocialState(profile.id, session?.user?.id),
        getUserBadges(profile.id),
    ]);
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
                <ProfileHeader owned={isOwnProfile} profileImage={profile.image} displayName={profile.name ?? "Unknown"} socials={socials} bio={bio} roles={profile.roles} followUserId={profile.id} isFollowing={socialState.isFollowing} loggedIn={Boolean(session?.user?.id)} />

                {/* INFO SETION */}
                <section className="relative z-10 pt-5 pb-10 bg-bg/95">
                    <Container className="flex flex-col-reverse gap-5 lg:flex-row lg:items-start">
                        {/* LEFT SIDE */}
                        <aside className="flex w-full flex-col gap-5 lg:w-60 lg:shrink-0">
                            <FollowerPreviewPanel title="Following" profiles={socialState.following} count={socialState.followingCount} />
                            <FollowerPreviewPanel title="Followers" profiles={socialState.followers} count={socialState.followerCount} />

                            {/* BADGES */}
                            <div className="w-full rounded bg-bg-secondary/80 p-4">
                                <h2 className="mb-3 text-sm border-b border-border pb-2">Badges</h2>
                                <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 rounded p-2">
                                    {badges.length ? badges.map((userBadge) => (
                                        <BadgeView key={userBadge.id} badge={userBadge.badge} />
                                    )) : (
                                        <p className="col-span-full rounded p-3 text-sm text-text-muted">No badges yet.</p>
                                    )}
                                </div>
                            </div>
                        </aside>
                        {/* RIGHT SIDE */}
                        <div className="min-w-0 flex-1">
                            <ProfileSwitcherPanel user={displayName} defaultTab={activeTab}>
                                {activeTab === "profile" && canViewProfile && (
                                    <div className="flex flex-col gap-2 w-full justify-center">
                                        {profileWidgets &&
                                            profileWidgets.map((widget, index) => (
                                                <UserWidget key={index} widget={widget} userId={profile.id} />
                                            ))
                                        }
                                        {!profile.commentsHidden && !shouldHideComments(viewer) && <CommentSection targetType={InteractionTargetType.USER_PROFILE} targetId={profile.id} />}
                                    </div>

                                )}
                                {activeTab === "profile" && !canViewProfile && (
                                    <p className="rounded border border-border bg-bg p-4 text-sm text-text-muted">This profile is private.</p>
                                )}
                                {activeTab === "activity" && canViewActivity &&
                                    (
                                        <ActivityList user={displayName} activities={activity?.activities ?? []} page={activity?.page ?? 1} totalPages={activity?.totalPages ?? 1} filter={safeActivityFilter} canViewLogs={canViewLogs} />
                                    )
                                }
                                {activeTab === "activity" && !canViewActivity && (
                                    <p className="rounded border border-border bg-bg p-4 text-sm text-text-muted">Activity is private.</p>
                                )}
                                {activeTab === "playlists" && canViewLibrary &&
                                    (
                                        <ProfilePlaylists playlists={playlists} canCreate={isOwnProfile} />
                                    )
                                }
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
