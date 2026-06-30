"use client";

import AvatarView from "@/app/components/user/AvatarView";
import { addComment, deleteComment, toggleLike } from "@/lib/actions/social";
import { InteractionTargetType, LikeTargetType, UserRole } from "@/lib/generated/prisma/enums";
import { ratingToFive } from "@/lib/util/rating";
import { Heart, MessageCircle, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { PrimaryButton } from "../ui/Buttons";
import StarRating from "../game/StarRating";
import RoleTags from "../user/RoleTags";

type Comment = {
	id: string;
	userId: string;
	parentId: string | null;
	content: string;
	createdAt: Date;
	likes: number;
	liked: boolean;
	userRating: number | null;
	user: {
		id: string;
		name: string | null;
		image: string | null;
		roles: UserRole[];
	};
};

type CommentFormProps = Readonly<{ action: (formData: FormData) => Promise<void>; placeholder?: string }>;

type CommentItemProps = Readonly<{
	comment: Comment;
	comments: Comment[];
	targetType: InteractionTargetType;
	targetId: string;
	currentUserId: string | null;
}>;

type CommenSectionClientProps = Readonly<{
	targetType: InteractionTargetType;
	targetId: string;
	comments: Comment[];
	currentUserId: string | null;
}>;

function CommentForm({ action, placeholder = "Write a comment" }: CommentFormProps) {
	const ref = useRef<HTMLFormElement>(null);
	const [content, setContent] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();
	const router = useRouter();

	function save(formData: FormData) {
		setError(null);
		startTransition(async () => {
			try {
				await action(formData);
				setContent("");
				ref.current?.reset();
				router.refresh();
			} catch {
				setError("Could not post comment.");
			}
		});
	}

	return (
		<form ref={ref} action={save} className="overflow-hidden rounded border border-border bg-bg-secondary/50">
			<textarea
				name="content"
				rows={3}
				maxLength={2000}
				value={content}
				onChange={(event) => setContent(event.target.value)}
				placeholder={placeholder}
				required
				className="block w-full resize-y bg-transparent p-3 text-sm outline-none placeholder:text-text-faint"
			/>
			<div className="flex items-center justify-between border-t border-border px-3 py-2">
				<span className="text-xs text-text-faint">{content.length}/2000</span>
				<PrimaryButton type="submit" disabled={pending || !content.trim()} className="md:text-md gap-2 px-2 py-2 text-sm md:px-4">
					<Send size={14} />
					{pending ? "Posting..." : "Post"}
				</PrimaryButton>
			</div>
			{error && <output className="border-t border-border px-3 py-2 text-xs text-error">{error}</output>}
		</form>
	);
}

function CommentItem({ comment, comments, targetType, targetId, currentUserId }: CommentItemProps) {
	const [replying, setReplying] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();
	const router = useRouter();
	const replies = comments.filter((reply) => reply.parentId === comment.id);
	const replyAction = addComment.bind(null, targetType, targetId, comment.id);

	function like() {
		setError(null);
		startTransition(async () => {
			try {
				await toggleLike(LikeTargetType.COMMENT, comment.id);
				router.refresh();
			} catch {
				setError("Could not update like.");
			}
		});
	}

	function remove() {
		setError(null);
		startTransition(async () => {
			try {
				await deleteComment(comment.id);
				router.refresh();
			} catch {
				setError("Could not delete comment.");
			}
		});
	}

	return (
		<div className="flex gap-3">
			<AvatarView image={comment.user.image} size={8} mdSize={8} iconSize={18} />
			<div className="min-w-0 flex-1">
				<div className="rounded bg-bg pl-1">
					<div className="flex flex-wrap items-center gap-2 text-sm">
						{comment.user.name ? (
							<Link href={`/u/${comment.user.name}`} className="font-bold hover:text-primary">
								{comment.user.name}
							</Link>
						) : (
							<span className="font-bold">Unknown</span>
						)}
						<RoleTags roles={comment.user.roles} />
						<span className="text-xs text-text-faint">{new Date(comment.createdAt).toLocaleDateString()}</span>
						{targetType === InteractionTargetType.GAME && <StarRating rating={ratingToFive(comment.userRating)} size={13} />}
					</div>
					<p className="mt-2 text-sm whitespace-pre-wrap text-text-muted">{comment.content}</p>
				</div>
				<div className="mt-1 flex items-center gap-2 text-xs text-text-faint">
					{currentUserId && (
						<button
							type="button"
							onClick={like}
							disabled={pending}
							className={`flex cursor-pointer items-center gap-1 rounded px-2 py-1 hover:text-primary ${comment.liked ? "text-primary" : ""}`}
						>
							<Heart size={14} className={comment.liked ? "fill-primary" : ""} />
							{comment.likes}
						</button>
					)}
					{currentUserId && (
						<button type="button" onClick={() => setReplying(!replying)} className="flex cursor-pointer items-center gap-1 rounded px-2 py-1 hover:text-primary">
							<MessageCircle size={14} />
							Reply
						</button>
					)}
					{currentUserId === comment.userId && (
						<button type="button" onClick={remove} disabled={pending} className="flex cursor-pointer items-center gap-1 rounded px-2 py-1 hover:text-error">
							<Trash2 size={14} />
							Delete
						</button>
					)}
				</div>
				{error && <output className="mt-1 text-xs text-error">{error}</output>}
				{replying && (
					<div className="mt-2">
						<CommentForm action={replyAction} placeholder="Write a reply" />
					</div>
				)}
				{replies.length > 0 && (
					<div className="mt-3 flex flex-col gap-3 border-l border-border pl-3">
						{replies.map((reply) => (
							<CommentItem key={reply.id} comment={reply} comments={comments} targetType={targetType} targetId={targetId} currentUserId={currentUserId} />
						))}
					</div>
				)}
			</div>
		</div>
	);
}

export default function CommentSectionClient({ targetType, targetId, comments, currentUserId }: CommenSectionClientProps) {
	const topLevelComments = comments.filter((comment) => !comment.parentId);
	const addTopLevel = addComment.bind(null, targetType, targetId, null);

	return (
		<section id="comments" className="flex scroll-mt-24 flex-col gap-4 rounded bg-bg p-4">
			<div className="flex items-center justify-between gap-3 border-b border-border pb-2">
				<h2 className="text-sm font-bold">Comments</h2>
				<span className="text-xs text-text-faint">{comments.length}</span>
			</div>
			{currentUserId ? (
				<CommentForm action={addTopLevel} />
			) : (
				<p className="rounded p-3 text-sm text-text-muted">
					<Link href="/login" className="font-bold text-primary">
						Log in
					</Link>{" "}
					to comment.
				</p>
			)}
			<div className="flex flex-col gap-4">
				{topLevelComments.length ? (
					topLevelComments.map((comment) => (
						<CommentItem key={comment.id} comment={comment} comments={comments} targetType={targetType} targetId={targetId} currentUserId={currentUserId} />
					))
				) : (
					<p className="text-sm text-text-muted">No comments yet.</p>
				)}
			</div>
		</section>
	);
}
