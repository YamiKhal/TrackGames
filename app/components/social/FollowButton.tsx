"use client";

import { toggleFollow } from "@/lib/actions/social";
import { UserPlus, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PrimaryButton, GhostButton } from "../ui/Buttons";

export default function FollowButton({ userId, initiallyFollowing, loggedIn }: { userId: string; initiallyFollowing: boolean; loggedIn: boolean }) {
    const [following, setFollowing] = useState(initiallyFollowing);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();
    const router = useRouter();
    const Button = following ? GhostButton : PrimaryButton;

    function toggle() {
        if (!loggedIn) {
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
        <div className="flex flex-col items-start gap-1">
            <Button type="button" onClick={toggle} disabled={pending}>
                {following ? <UserCheck size={16} /> : <UserPlus size={16} />}
                {following ? "Following" : "Follow"}
            </Button>
            {error && <p className="text-xs text-error" role="status">{error}</p>}
        </div>
    );
}
