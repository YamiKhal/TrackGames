import { ActivityType, InteractionTargetType } from "@/lib/generated/prisma/enums";
import Link from "next/link";
import PaginationControls from "@/app/components/layout/PaginationControls";
import { FilterBar } from "@/app/components/ui/FilterBar";

type Activity = {
	id: string;
	type: ActivityType;
	targetType: InteractionTargetType | null;
	targetId: string | null;
	listId: string | null;
	targetName: string | null;
	targetHref: string | null;
	createdAt: Date;
	game?: { slug: string | null; name: string | null } | null;
};

type ActivityListProps = Readonly<{
	user: string;
	activities: Activity[];
	page: number;
	totalPages: number;
	filter: string;
	canViewLogs: boolean;
}>;

function ActivityText({ activity }: Readonly<{ activity: Activity }>) {
	const message = activityMessage(activity);
	const spacer = message.after.startsWith(".") || message.after.startsWith("'") ? "" : " ";

	return (
		<p className="text-sm font-bold text-text">
			{message.before}
			{message.name && (
				<>
					{" "}
					{activity.targetHref ? (
						<Link href={activity.targetHref} className="text-primary hover:text-primary-hover">
							{message.name}
						</Link>
					) : (
						<span className="text-primary">{message.name}</span>
					)}
				</>
			)}
			{spacer}
			{message.after}
		</p>
	);
}

function commentTargetAfter(targetType: InteractionTargetType | null) {
	if (targetType === InteractionTargetType.GAME_LIST) return "playlist.";
	if (targetType === InteractionTargetType.USER_PROFILE) return "'s profile.";
	if (targetType === InteractionTargetType.GAME) return ".";
	return ".";
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

export default function ActivityList({ user, activities, page, totalPages, filter, canViewLogs }: ActivityListProps) {
	const filters = [
		{ id: "all", label: "All" },
		canViewLogs ? { id: "logs", label: "Game logs" } : null,
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
							href: `/u/${user}?tab=activity&activityFilter=${item.id}`,
						})),
					},
				]}
			/>

			{activities.length ? (
				activities.map((activity) => (
					<div key={activity.id} className="border-b border-border bg-bg p-4">
						<ActivityText activity={activity} />
						<p className="mt-1 text-xs text-text-faint">{new Date(activity.createdAt).toLocaleDateString()}</p>
					</div>
				))
			) : (
				<p className="rounded border border-border bg-bg p-4 text-sm text-text-muted">No activity yet.</p>
			)}

			{totalPages > 1 && (
				<div className="mt-2 flex justify-center">
					<PaginationControls page={page} pageCount={totalPages} href={(nextPage) => `/u/${user}?tab=activity&activityFilter=${filter}&activityPage=${nextPage}`} />
				</div>
			)}
		</div>
	);
}
