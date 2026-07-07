"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, UserPlus } from "lucide-react";
import { GhostButton, PrimaryButton } from "@/components/ui/control/Button";
import { toggleFollow } from "@/lib/actions/social/social";

type FollowButtonProps = Readonly<{ userId: string; hasFollowedState?: boolean; isLoggedIn?: boolean }>;

export default function FollowButton({ userId, hasFollowedState, isLoggedIn }: FollowButtonProps) {
	const [following, setFollowing] = useState(hasFollowedState);
	const [error, setError] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();
	const router = useRouter();
	const Button = following ? GhostButton : PrimaryButton;

	function toggle() {
		if (!isLoggedIn) {
			router.push("/login");
			return;
		}

		const previousFollowing = following;
		setError(null);
		setFollowing(!following);
		startTransition(async () => {
			try {
				const result = await toggleFollow(userId);
				setFollowing(result.following);
				router.refresh();
			} catch {
				setFollowing(previousFollowing);
				setError("Could not update follow.");
			}
		});
	}

	return (
		<>
			<Button variant="outline" onClick={toggle} disabled={pending}>
				{following ? <UserCheck size={16} /> : <UserPlus size={16} />}
			</Button>
			{error && <output className="text-xs text-error">{error}</output>}
		</>
	);
}
