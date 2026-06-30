import { auth } from "@/lib/auth";
import { getComments } from "@/lib/data/comments";
import { InteractionTargetType } from "@/lib/generated/prisma/enums";
import CommentSectionClient from "./CommentSectionClient";

export default async function CommentSection({ targetType, targetId }: Readonly<{ targetType: InteractionTargetType; targetId: string }>) {
	const session = await auth();
	const comments = await getComments(targetType, targetId, session?.user?.id);

	return <CommentSectionClient targetType={targetType} targetId={targetId} comments={comments} currentUserId={session?.user?.id ?? null} />;
}
