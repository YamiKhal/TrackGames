import "server-only";
import db from "@/lib/db";
import { getGaOverview } from "@/lib/external/ga/analytics";
import { type ActivityType, FeedbackStatus, type FeedbackType, GameListType, ReportStatus, RoadmapStatus } from "@/lib/generated/prisma/enums";

const FEEDBACK_LABELS: Record<FeedbackType, string> = {
	BUG: "Bug",
	SUGGESTION: "Suggestion",
	UI: "UI",
	PERFORMANCE: "Performance",
	CONTENT: "Content",
	OTHER: "Other",
};

// Human labels for the activity-mix bars.
const ACTIVITY_LABELS: Record<ActivityType, string> = {
	ADDED_GAME_TO_LIBRARY: "Added game",
	RATED_GAME: "Rated game",
	LOGGED_GAME_PLAY: "Logged play",
	CREATED_PLAYLIST: "Created playlist",
	ADDED_GAME_TO_PLAYLIST: "Added to playlist",
	LIKED_GAME_LIST: "Liked list",
	LIKED_COMMENT: "Liked comment",
	COMMENTED_ON_GAME_LIST: "Commented on list",
	COMMENTED_ON_PROFILE: "Commented on profile",
	COMMENTED_ON_GAME: "Commented on game",
	REPLIED_TO_COMMENT: "Replied to comment",
	FOLLOWED_USER: "Followed user",
	EARNED_BADGE: "Earned badge",
};

function last30Days() {
	const days: string[] = [];
	for (let i = 29; i >= 0; i--) days.push(new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10));
	return days;
}

function fillDaily(rows: { day: Date; count: number }[]) {
	const byDay = new Map(rows.map((row) => [new Date(row.day).toISOString().slice(0, 10), row.count]));
	return last30Days().map((day) => ({ label: day.slice(5), value: byDay.get(day) ?? 0 }));
}

export async function getAdminOverview() {
	const [
		openReports,
		newFeedback,
		totalMembers,
		totalLogs,
		totalComments,
		totalPlaylists,
		logRows,
		ga,
		feedbackRows,
		roadmapTotal,
		roadmapShipped,
		activityRows,
		topFollowedRows,
		topLoggerRows,
	] = await Promise.all([
		db.report.count({ where: { status: { not: ReportStatus.RESOLVED } } }),
		db.feedback.count({ where: { status: FeedbackStatus.NEW } }),
		db.user.count(),
		db.userGamePlayLog.count(),
		db.comment.count(),
		db.gameList.count({ where: { type: GameListType.PLAYLIST } }),
		db.$queryRaw<{ day: Date; count: number }[]>`
				SELECT date_trunc('day', "playedAt") AS day, COUNT(*)::int AS count
				FROM "UserGamePlayLog" WHERE "playedAt" >= NOW() - INTERVAL '30 days' GROUP BY 1 ORDER BY 1 ASC`,
		getGaOverview(),
		db.feedback.groupBy({ by: ["type"], _count: { type: true } }),
		db.roadmapItem.count(),
		db.roadmapItem.count({ where: { status: RoadmapStatus.SHIPPED } }),
		db.activity.groupBy({ by: ["type"], _count: { type: true }, orderBy: { _count: { type: "desc" } }, take: 8 }),
		db.userFollow.groupBy({ by: ["followingId"], _count: { followingId: true }, orderBy: { _count: { followingId: "desc" } }, take: 8 }),
		db.userGamePlayLog.groupBy({ by: ["userId"], _count: { userId: true }, orderBy: { _count: { userId: "desc" } }, take: 8 }),
	]);

	// Resolve display names for the members surfaced in the "most followed" /
	// "most active" leaderboards.
	const memberIds = [...new Set([...topFollowedRows.map((row) => row.followingId), ...topLoggerRows.map((row) => row.userId)])];
	const members = memberIds.length ? await db.user.findMany({ where: { id: { in: memberIds } }, select: { id: true, name: true } }) : [];

	const memberName = (id: string) => members.find((member) => member.id === id)?.name ?? "Unknown";

	return {
		openReports,
		newFeedback,
		ga,
		totalMembers,
		totalLogs,
		totalComments,
		totalPlaylists,
		logs: fillDaily(logRows),
		feedbackTypes: (Object.keys(FEEDBACK_LABELS) as FeedbackType[])
			.map((type) => ({ label: FEEDBACK_LABELS[type], value: feedbackRows.find((row) => row.type === type)?._count.type ?? 0 }))
			.filter((point) => point.value > 0),
		roadmap: { shipped: roadmapShipped, total: roadmapTotal, pct: roadmapTotal ? Math.round((roadmapShipped / roadmapTotal) * 100) : 0 },
		activityMix: activityRows.map((row) => ({ label: ACTIVITY_LABELS[row.type], value: row._count.type })),
		topFollowed: topFollowedRows.map((row) => ({ label: memberName(row.followingId), value: row._count.followingId })),
		mostActive: topLoggerRows.map((row) => ({ label: memberName(row.userId), value: row._count.userId })),
	};
}

export type AdminOverview = Awaited<ReturnType<typeof getAdminOverview>>;

export async function getReports(status?: ReportStatus) {
	return db.report.findMany({
		where: status ? { status } : {},
		orderBy: [{ status: "asc" }, { createdAt: "desc" }],
		take: 100,
		include: {
			reporter: { select: { id: true, name: true } },
			reportedUser: { select: { id: true, name: true } },
			handler: { select: { id: true, name: true } },
		},
	});
}

export async function getFeedbackList(status?: FeedbackStatus) {
	return db.feedback.findMany({
		where: status ? { status } : {},
		orderBy: [{ status: "asc" }, { createdAt: "desc" }],
		take: 100,
		include: { user: { select: { id: true, name: true } } },
	});
}

export async function searchMembers(query?: string) {
	return db.user.findMany({
		where: query ? { OR: [{ name: { contains: query, mode: "insensitive" } }, { email: { contains: query, mode: "insensitive" } }] } : {},
		orderBy: { createdAt: "desc" },
		take: 50,
		select: {
			id: true,
			name: true,
			email: true,
			image: true,
			background: true,
			bio: true,
			roles: true,
			createdAt: true,
			_count: { select: { comments: true, games: true, gameLists: true } },
		},
	});
}

export async function getAllChangelogs() {
	const rows = await db.changelog.findMany({ orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }] });
	return rows.map((row) => ({
		id: row.id,
		slug: row.slug,
		title: row.title,
		version: row.version,
		summary: row.summary,
		pinned: row.pinned,
		published: row.published,
		publishedAt: row.publishedAt.toISOString(),
		content: row.content,
	}));
}

export async function getAllRoadmapItems() {
	const rows = await db.roadmapItem.findMany({
		orderBy: [{ position: "asc" }, { createdAt: "desc" }],
		include: { _count: { select: { votes: true } } },
	});
	return rows.map((row) => ({
		id: row.id,
		slug: row.slug,
		title: row.title,
		summary: row.summary,
		status: row.status,
		position: row.position,
		public: row.public,
		content: row.content,
		voteCount: row._count.votes,
	}));
}
