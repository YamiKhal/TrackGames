import { SocialIconLinks } from "@/app/components/user/SocialIconLinks";
import Container from "@/app/components/layout/Container";
import type { SocialLink } from "@/lib/types";
import { GhostButton, PrimaryButton } from "../ui/Buttons";
import AvatarPreview from "./AvatarView";
import FollowButton from "../social/FollowButton";
import RoleTags from "./RoleTags";
import { UserRole } from "@/lib/generated/prisma/enums";

type ProfileHeaderProps = Readonly<{
	isOwned?: boolean;
	isSettings?: boolean;
	profileImage: string | null | undefined;
	displayName: string;
	socials?: SocialLink[];
	bio?: string;
	roles?: UserRole[];
	followUserId?: string;
	isFollowing?: boolean;
	isLoggedIn?: boolean;
}>;

function FollowerButton({ followUserId, isFollowing, isLoggedIn }: { followUserId: string | undefined; isFollowing: boolean; isLoggedIn: boolean }) {
	return followUserId ? <FollowButton userId={followUserId} hasFollowedState={isFollowing} isLoggedIn={isLoggedIn} /> : <PrimaryButton>Follow</PrimaryButton>;
}

export default function ProfileHeader({
	isOwned,
	isSettings,
	profileImage,
	displayName,
	socials = [],
	bio,
	roles = [],
	followUserId,
	isFollowing = false,
	isLoggedIn = false,
}: ProfileHeaderProps) {
	return (
		<section className="relative z-10 w-full border-b border-border bg-bg/95">
			<Container className="relative z-1 flex flex-row items-end justify-start gap-10 pt-5 md:pt-5">
				<div className="relative z-1 mx-5 mb-3 flex min-h-max w-full min-w-0 flex-col items-center gap-3 text-center text-text md:flex-row md:items-end md:gap-6 md:text-left">
					<AvatarPreview image={profileImage} size={20} priority alt={`${displayName} profile image`} />

					<div className="flex min-w-0 flex-1 flex-col justify-end gap-3 md:flex-row md:items-end md:justify-between md:gap-5">
						<div className="min-w-0 flex-1 flex-col justify-between">
							<div className="mb-2 flex min-w-0 flex-col items-center gap-2 md:mb-5 md:flex-row md:items-center md:gap-3">
								<div className="flex flex-col items-center gap-1 md:flex-row md:gap-2">
									<h1 className="max-w-full text-xl font-bold wrap-break-word md:text-4xl">{displayName}</h1>
									<RoleTags roles={roles} />
								</div>
								<SocialIconLinks socials={socials} />
							</div>
							{bio && <p className="md:text-md max-w-full font-body text-sm wrap-break-word">{bio}</p>}
						</div>
						<div className="hidden shrink-0 flex-row flex-wrap justify-end gap-3 md:flex md:gap-5">
							{isSettings ? (
								<GhostButton href={`/u/${encodeURIComponent(displayName)}`}>View profile</GhostButton>
							) : (
								<>
									{isOwned ? (
										<GhostButton href="/settings">Settings</GhostButton>
									) : (
										<FollowerButton followUserId={followUserId} isFollowing={isFollowing} isLoggedIn={isLoggedIn} />
									)}
									<PrimaryButton href={`/library/${displayName}`}>Library</PrimaryButton>
								</>
							)}
						</div>
					</div>
				</div>
			</Container>
			<div className="mb-3 flex shrink-0 flex-row flex-wrap justify-center gap-3 px-5 md:hidden">
				{isSettings ? (
					<GhostButton href={`/u/${encodeURIComponent(displayName)}`}>View profile</GhostButton>
				) : (
					<>
						{isOwned ? <GhostButton href="/settings">Settings</GhostButton> : <FollowerButton followUserId={followUserId} isFollowing isLoggedIn />}
						<PrimaryButton href={`/library/${displayName}`}>Library</PrimaryButton>
					</>
				)}
			</div>
		</section>
	);
}
