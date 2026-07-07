import Link from "next/link";
import PaginationControls from "@/components/layout/PaginationControls";
import FilterBar from "@/components/ui/FilterBar";
import PrivateDisplay from "@/components/ui/PrivateDisplay";
import { getUserActivities } from "@/lib/data/social/social";
import { type SecuredUser } from "@/lib/data/social/user";
import { ActivityType, InteractionTargetType } from "@/lib/generated/prisma/enums";
import { type PublicUser } from "@/lib/types";
import { defaultActivityFilter } from "@/lib/util/preferences";

type ActivityListProps = Readonly<{
	profile: PublicUser;
	isVisible: boolean;
	activityFilter?: string;
	activityPage?: string;
	viewer?: SecuredUser | null;
}>;

export default async function ActivityList({ profile, isVisible, activityFilter, activityPage, viewer }: ActivityListProps) {
	if (!isVisible) return <PrivateDisplay message={`Activity is private`} />;

	const selectedActivityFilter = activityFilter ?? (viewer ? defaultActivityFilter(viewer) : "all");
	const filter = selectedActivityFilter === "logs" && !isVisible ? "all" : selectedActivityFilter;

	const activity = isVisible ? await getUserActivities(profile.id, Number(activityPage), filter, isVisible) : null;
	const totalPages = activity?.totalPages ?? 1;
	const page = activity?.page ?? 1;

	const filters = [
		{ id: "all", label: "All" },
		{ id: "logs", label: "Game logs" },
		{ id: "games", label: "Games" },
		{ id: "playlists", label: "Playlists" },
		{ id: "comments", label: "Comments" },
		{ id: "social", label: "Social" },
	].filter((item): item is { id: string; label: string } => Boolean(item));

	return (
		<div className="flex flex-col">
			<FilterBar
				className="mb-2"
				filters={[
					{
						type: "linkSelect",
						label: "Filter activity",
						value: filter,
						options: filters.map((item) => ({
							value: item.id,
							label: item.label,
							href: `/u/${profile.name}?tab=activity&activityFilter=${item.id}`,
						})),
					},
				]}
			/>

			{activity?.activities.length ? (
				activity.activities.map((activity) => {
					const message = activityMessage(activity);
					const spacer = message.after.startsWith(".") || message.after.startsWith("'") ? "" : " ";

					return activity.targetHref ? (
						<Link
							key={activity.id}
							href={activity.targetHref}
							className="flex flex-row justify-between border-b border-border bg-bg p-4 transition-colors hover:border-primary hover:bg-bg-secondary/20"
						>
							<p className="text-sm font-bold text-text">
								{message.before} {message.name && <span className="text-primary">{message.name}</span>}
								{spacer}
								{message.after}
							</p>
							<p className="mt-1 text-xs text-text-faint">{new Date(activity.createdAt).toLocaleDateString()}</p>
						</Link>
					) : (
						<div
							key={activity.id}
							className="flex flex-row justify-between border-b border-border bg-bg p-4 transition-colors hover:border-primary hover:bg-bg-secondary/20"
						>
							<span className="text-primary">{message.name ?? "Error loading activity"}</span>
							<p className="mt-1 text-xs text-text-faint">{new Date(activity.createdAt).toLocaleDateString()}</p>
						</div>
					);
				})
			) : (
				<p className="rounded border border-border bg-bg p-4 text-sm text-text-muted">No activity yet.</p>
			)}

			{totalPages > 1 && (
				<div className="mt-2 flex justify-center">
					<PaginationControls
						page={page}
						pageCount={totalPages}
						href={(nextPage) => `/u/${profile.name}?tab=activity&activityFilter=${filter}&activityPage=${nextPage}`}
					/>
				</div>
			)}
		</div>
	);
}

function activityMessage(activity: { type: ActivityType; targetType: InteractionTargetType | null; targetName: string | null; targetHref: string | null }) {
	const name = activity.targetName;

	switch (activity.type) {
		case ActivityType.ADDED_GAME_TO_LIBRARY:
			return { before: "Added", name, after: "to their library." };
		case ActivityType.RATED_GAME:
			return { before: "Rated", name, after: "." };
		case ActivityType.LOGGED_GAME_PLAY:
			return { before: "Logged time in", name, after: "." };
		case ActivityType.CREATED_PLAYLIST:
			return { before: "Created the playlist", name, after: "." };
		case ActivityType.ADDED_GAME_TO_PLAYLIST:
			return { before: "Added", name, after: "to a playlist." };
		case ActivityType.LIKED_GAME_LIST:
			return { before: "Liked the playlist", name, after: "." };
		case ActivityType.COMMENTED_ON_GAME_LIST:
			return name ? { before: "Commented on the playlist", name, after: "." } : { before: "Commented on a playlist", name: null, after: "." };
		case ActivityType.COMMENTED_ON_PROFILE:
			return name ? { before: "Commented on", name, after: "'s profile." } : { before: "Commented on a profile", name: null, after: "." };
		case ActivityType.COMMENTED_ON_GAME:
			return name ? { before: "Commented on", name, after: "." } : { before: "Commented on a game", name: null, after: "." };
		case ActivityType.FOLLOWED_USER:
			return { before: "Followed", name, after: "." };
		case ActivityType.LIKED_COMMENT:
			return name ? { before: "Liked a comment on", name, after: commentTargetAfter(activity.targetType) } : { before: "Liked a comment", name: null, after: "." };
		case ActivityType.REPLIED_TO_COMMENT:
			return name ? { before: "Replied to a comment on", name, after: commentTargetAfter(activity.targetType) } : { before: "Replied to a comment", name: null, after: "." };
		case ActivityType.EARNED_BADGE:
			return { before: "Earned a badge", name: null, after: "." };
		default:
			return { before: "New activity", name: null, after: "." };
	}
}

function commentTargetAfter(targetType: InteractionTargetType | null) {
	if (targetType === InteractionTargetType.GAME_LIST) return "playlist.";
	if (targetType === InteractionTargetType.USER_PROFILE) return "'s profile.";
	if (targetType === InteractionTargetType.GAME) return ".";
	return ".";
}
