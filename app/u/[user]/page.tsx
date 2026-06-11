import Container from "@/app/components/layout/Container";
import { GhostButton, PrimaryButton } from "@/app/components/ui/Buttons";
import { getPublicUser } from "@/lib/account/user";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Badge, UserIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import FollowerPreviewPanel from "./FollowerPreviewPanel";
import ProfileBackground from "../../components/user/ProfileBackground";
import ProfileSwitcherPanel from "./ProfileSwitcherPanel";
import UserWidget from "./UserWidget";
import { parseSocials } from "@/lib/account/socials";
import { SocialIconLinks } from "./SocialIconLinks";
import { parseWidgets } from "@/lib/account/widget";

export default async function Page({ params, searchParams }: { params: Promise<{ user: string }>; searchParams: Promise<{ tab?: string }>; }) {
    const { user } = await params;
    const { tab = "profile" } = await searchParams;
    const [profile, session] = await Promise.all([getPublicUser(user), auth()]);
    const isOwnProfile = user == session?.user?.name

    if (!profile) {
        redirect("/not-found");
    }

    const displayName = profile.name ?? user;
    const image = profile.image ?? null;
    const background = profile.background ?? "https://cdn.pixabay.com/video/2020/06/16/42197-429661458_large.mp4";
    const bio = profile.bio ?? "No bio yet."
    const socials = parseSocials(profile.socials);
    const savedWidgets = parseWidgets(profile.widgets);
    const profileWidgets = savedWidgets.length > 0 ? savedWidgets : [];
    const joinedDate = profile.createdAt.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
    });

    return (
        <main className="relative z-0 flex-1">
            <ProfileBackground src={background} />

            <Container>
                {/* BANNER PROFILE */}
                <section className="relative z-10 w-full bg-bg/95 border-b border-border">
                    <Container className="relative z-1 flex flex-row items-end justify-start gap-10 pt-5">
                        <div className="relative z-1 mb-3 flex min-h-max w-full min-w-0 gap-4 text-text md:gap-6 mr-5 ml-5">
                            <div className="relative flex aspect-square h-24 w-24 md:h-34 md:w-34 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg">
                                {image ?
                                    <Image
                                        src={image}
                                        alt={`${displayName} profile image`}
                                        fill
                                        priority
                                        sizes="160px"
                                        className="pointer-events-none select-none object-cover object-center"
                                    />
                                    :
                                    <UserIcon size={48} aria-hidden="true" />
                                }
                            </div>

                            <div className="flex min-w-0 flex-1 flex-col justify-end gap-3 md:flex-row md:items-end md:justify-between md:gap-5">
                                <div className="min-w-0 flex-1 flex-col justify-between">
                                    <div className="mb-5 flex min-w-0 flex-col gap-2 md:flex-row md:items-center md:gap-3">
                                        <h1 className="max-w-full wrap-break-word text-3xl md:text-4xl font-bold">{displayName}</h1>
                                        <SocialIconLinks socials={socials} />
                                    </div>
                                    <p className="max-w-full wrap-break-word text-sm md:text-md fony-body">{bio}</p>
                                </div>
                                <div className="flex shrink-0 flex-row flex-wrap justify-end gap-3 md:gap-5">
                                    {isOwnProfile ?
                                      <GhostButton href="/settings">Settings</GhostButton>
                                    : <PrimaryButton>Follow</PrimaryButton>
                                    }
                                    <PrimaryButton>Library</PrimaryButton>
                                </div>
                            </div>
                        </div>
                    </Container>
                </section>

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
                            <ProfileSwitcherPanel user={displayName}>
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
