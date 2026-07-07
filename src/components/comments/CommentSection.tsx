import CommentSectionClient from "@/components/comments/CommentSectionClient";
import { auth } from "@/lib/auth";
import { getComments } from "@/lib/data/social/comments";
import db from "@/lib/db";
import { type InteractionTargetType, UserRole } from "@/lib/generated/prisma/enums";

export default async function CommentSection({ targetType, targetId }: Readonly<{ targetType: InteractionTargetType; targetId: string }>) {
	const session = await auth();
	const userId = session?.user?.id ?? null;
	const [comments, viewer] = await Promise.all([
		getComments(targetType, targetId, userId ?? undefined),
		userId ? db.user.findUnique({ where: { id: userId }, select: { roles: true } }) : null,
	]);

	return (
		<CommentSectionClient targetType={targetType} targetId={targetId} comments={comments} currentUserId={userId} isAdmin={Boolean(viewer?.roles.includes(UserRole.ADMIN))} />
	);
}
