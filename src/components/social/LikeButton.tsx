"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toggleLike } from "@/lib/actions/social/social";
import { type LikeTargetType } from "@/lib/generated/prisma/enums";
import { joinClass } from "@/lib/util/client/func";

type LikeButtonProps = Readonly<{
	targetType: LikeTargetType;
	targetId: string;
	initialLikes: number;
	hasLikedState: boolean;
	isLoggedIn: boolean;
}>;

export default function LikeButton({ targetType, targetId, initialLikes, hasLikedState, isLoggedIn }: LikeButtonProps) {
	const [likes, setLikes] = useState(initialLikes);
	const [liked, setLiked] = useState(hasLikedState);
	const [error, setError] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();
	const router = useRouter();

	function toggle() {
		if (!isLoggedIn) {
			router.push("/login");
			return;
		}

		const nextLiked = !liked;
		const previousLiked = liked;
		const previousLikes = likes;
		setError(null);
		setLiked(nextLiked);
		setLikes(Math.max(0, likes + (nextLiked ? 1 : -1)));

		startTransition(async () => {
			const response = await toggleLike(targetType, targetId);

			if (response?.error) {
				setLiked(previousLiked);
				setLikes(previousLikes);
				setError(response.error);
				return;
			}

			router.refresh();
		});
	}

	return (
		<div className="flex flex-col items-start gap-1">
			<button
				type="button"
				onClick={toggle}
				disabled={pending}
				className={joinClass(
					"flex cursor-pointer items-center gap-2 rounded bg-bg px-4 py-2 text-sm font-bold text-text-muted transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-70",
					liked && "text-primary",
				)}
			>
				<Heart size={16} className={joinClass(liked && "fill-primary")} />
				{likes}
			</button>
			{error && <output className="text-xs text-error">{error}</output>}
		</div>
	);
}
