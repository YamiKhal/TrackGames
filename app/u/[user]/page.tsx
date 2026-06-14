import Container from "@/app/components/layout/Container";
import { getPublicUser, profileThemeStyle } from "@/lib/account/user";
import { redirect } from "next/navigation";
import { Badge } from "lucide-react";
import { auth } from "@/lib/auth";
import FollowerPreviewPanel from "./FollowerPreviewPanel";
import ProfileBackground from "../../components/user/BackgroundView";
import ProfileSwitcherPanel from "./ProfileSwitcherPanel";
import UserWidget from "./UserWidget";
import { parseSocials } from "@/lib/account/socials";
import { parseWidgets } from "@/lib/account/widget";
import ProfileHeader from "@/app/components/user/ProfileHeader";

export default async function Page({ params, searchParams }: { params: Promise<{ user: string }>; searchParams: Promise<{ tab?: string }>; }) {
    const { user } = await params;
    const { tab = "profile" } = await searchParams;
    const [profile, session] = await Promise.all([getPublicUser(user), auth()]);

    if (!profile) {
        redirect("/not-found");
    }

    const isOwnProfile = profile.id === session?.user?.id;
    const displayName = profile.name ?? user;
    const background = profile.background ?? "https://cdn.pixabay.com/video/2020/06/16/42197-429661458_large.mp4";
    const bio = profile.bio ?? "No bio yet."
    const socials = parseSocials(profile.socials);
    const savedWidgets = parseWidgets(profile.widgets);
    const profileWidgets = savedWidgets.length > 0 ? savedWidgets : [];

    return (
        <main className="relative z-0 flex-1" style={profileThemeStyle(profile.profileColor, profile.accentColor)}>
            <ProfileBackground src={background} />
            <Container>
                {/* BANNER PROFILE */}
                <ProfileHeader owned={isOwnProfile} profileImage={profile.image} displayName={profile.name ?? "Unknown"} socials={socials} bio={bio} />

                {/* INFO SETION */}
                <section className="relative z-10 pt-5 pb-10 bg-bg/95">
                    <Container className="flex flex-col-reverse gap-5 lg:flex-row lg:items-start">
                        {/* LEFT SIDE */}
                        <aside className="flex w-full flex-col gap-5 lg:w-60 lg:shrink-0">
                            <FollowerPreviewPanel title="Following" profiles={[]} />
                            <FollowerPreviewPanel title="Followers" profiles={[]} />

                            {/* BADGES */}
                            <div className="w-full rounded bg-bg-secondary p-4">
                                <h2 className="mb-3 text-sm">Badges</h2>
                                <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 bg-surface rounded p-2">
                                    <div className="flex items-center justify-center">
                                        <Badge size={24} />
                                    </div>
                                    <div className="flex items-center justify-center">
                                        <Badge size={24} />
                                    </div>
                                    <div className="flex items-center justify-center">
                                        <Badge size={24} />
                                    </div>
                                </div>
                            </div>
                        </aside>
                        {/* RIGHT SIDE */}
                        <div className="min-w-0 flex-1">
                            <ProfileSwitcherPanel user={displayName} defaultTab={tab}>
                                {tab === "profile" && (
                                    <div className="flex flex-col gap-2 w-full justify-center">
                                        {profileWidgets &&
                                            profileWidgets.map((widget, index) => (
                                                <UserWidget key={index} widget={widget} />
                                            ))
                                        }
                                    </div>

                                )}
                                {tab === "activity" &&
                                    (
                                        <p>Activity</p>
                                    )
                                }
                                {tab === "playlists" &&
                                    (
                                        <p>Playlists</p>
                                    )
                                }

                            </ProfileSwitcherPanel>
                        </div>
                    </Container>
                </section>
            </Container>
        </main>
    );
}
