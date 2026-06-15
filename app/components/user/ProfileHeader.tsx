import { SocialIconLinks } from "@/app/components/user/SocialIconLinks";
import Container from "@/app/components/layout/Container";
import { SocialLink } from "@/lib/types";
import { GhostButton, PrimaryButton } from "../ui/Buttons";
import AvatarPreview from "./AvatarView";

export default function ProfileHeader({ owned, isSettings, profileImage, displayName, socials = [], bio }: { owned?: boolean; isSettings?: boolean; profileImage: string | null | undefined; displayName: string; socials?: SocialLink[]; bio?: string; }) {
    return (
        <section className="relative z-10 w-full bg-bg/95 border-b border-border">
            <Container className="relative z-1 flex flex-row items-end justify-start gap-10 pt-5">
                <div className="relative z-1 mb-3 flex min-h-max w-full min-w-0 gap-4 text-text md:gap-6 mr-5 ml-5">
                    <AvatarPreview image={profileImage} size={22} priority alt={`${displayName} profile image`} />

                    <div className="flex min-w-0 flex-1 flex-col justify-end gap-3 md:flex-row md:items-end md:justify-between md:gap-5">
                        <div className="min-w-0 flex-1 flex-col justify-between">
                            <div className="mb-5 flex min-w-0 flex-col gap-2 md:flex-row md:items-center md:gap-3">
                                <h1 className="max-w-full wrap-break-word text-3xl md:text-4xl font-bold">{displayName}</h1>
                                {!isSettings && <SocialIconLinks socials={socials} />}
                            </div>
                            {bio && <p className="max-w-full wrap-break-word text-sm md:text-md font-body">{bio}</p>}
                        </div>
                        <div className="flex shrink-0 flex-row flex-wrap justify-end gap-3 md:gap-5">
                            {isSettings ? (
                                <GhostButton href={`/u/${encodeURIComponent(displayName)}`}>View profile</GhostButton>
                            ) : (
                                <>
                                    {owned ? (
                                        <GhostButton href="/settings">Settings</GhostButton>
                                    ) : (
                                        <PrimaryButton>Follow</PrimaryButton>
                                    )}
                                    <PrimaryButton href={`/library/${displayName}`}>Library</PrimaryButton>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </Container>
        </section>
    )
}
