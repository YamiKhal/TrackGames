import Container from "@/components/layout/Container";
import FollowButton from "@/components/social/FollowButton";
import { GhostButton, PrimaryButton } from "@/components/ui/control/Button";
import AvatarPreview from "@/components/user/AvatarView";
import ReportButton from "@/components/user/ReportButton";
import RoleTags from "@/components/user/RoleTags";
import SocialIconLinks from "@/components/user/SocialIconLinks";
import { ReportTargetType } from "@/lib/generated/prisma/enums";
import type { PublicUser } from "@/lib/types";
import { parseSocials } from "@/lib/util/parse/socials";

type ProfileHeaderProps = Readonly<{
	isOwned?: boolean;
	isSettings?: boolean;
	profile: PublicUser;
	isFollowing?: boolean;
	isLoggedIn?: boolean;
}>;

type ControlsSectionProps = Readonly<{
	displayName: string;
	followUserId: string | undefined;
	isFollowing?: boolean;
	isLoggedIn?: boolean;
	isSettings?: boolean;
	isOwned?: boolean;
}>;

export default function ProfileHeader({ isOwned, isSettings, profile, isFollowing = false, isLoggedIn = false }: ProfileHeaderProps) {
	const profileImage = profile.image;
	const displayName = profile.name ?? "Unknown";
	const socials = parseSocials(profile.socials);
	const bio = profile.bio ?? "No bio yet.";
	const roles = profile.roles;
	const followUserId = profile.id;

	return (
		<section className="relative z-elevated w-full border-b border-border bg-bg/95">
			<Container className="relative z-raised flex flex-row items-end justify-start gap-10 pt-5 md:pt-5">
				<div className="relative z-raised mx-5 mb-3 flex min-h-max w-full min-w-0 flex-col items-center gap-3 text-center text-text md:flex-row md:items-end md:gap-6 md:text-left">
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
							<ControlsSection
								displayName={displayName}
								followUserId={followUserId}
								isFollowing={isFollowing}
								isLoggedIn={isLoggedIn}
								isSettings={isSettings}
								isOwned={isOwned}
							/>
						</div>
					</div>
				</div>
			</Container>
			<div className="mb-3 flex shrink-0 flex-row flex-wrap justify-center gap-3 px-5 md:hidden">
				<ControlsSection
					displayName={displayName}
					followUserId={followUserId}
					isFollowing={isFollowing}
					isLoggedIn={isLoggedIn}
					isSettings={isSettings}
					isOwned={isOwned}
				/>
			</div>
		</section>
	);
}

function ControlsSection({ displayName, followUserId, isFollowing, isLoggedIn, isSettings, isOwned }: ControlsSectionProps) {
	const followerButton = followUserId ? <FollowButton userId={followUserId} hasFollowedState={isFollowing} isLoggedIn={isLoggedIn} /> : <PrimaryButton>Follow</PrimaryButton>;

	return isSettings ? (
		<GhostButton variant="outline" href={`/u/${encodeURIComponent(displayName)}?tab=profile`}>
			View profile
		</GhostButton>
	) : (
		<>
			{!isOwned && isLoggedIn && followUserId && (
				<ReportButton
					targetType={ReportTargetType.USER_PROFILE}
					targetId={followUserId}
					reportedUserId={followUserId}
					context={{ profile: displayName }}
					display="button"
					label={`Report ${displayName}`}
				/>
			)}
			{isOwned ? (
				<GhostButton variant="outline" href="/settings">
					Settings
				</GhostButton>
			) : (
				followerButton
			)}
			<PrimaryButton href={`/library/${displayName}`}>Library</PrimaryButton>
		</>
	);
}
