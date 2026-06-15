"use client";

import { useState, useTransition } from "react";
import { addGameToLibrary, removeGameFromLibrary } from "@/lib/actions/library";
import { GhostButton, PrimaryButton } from "../ui/Buttons";

export default function GameLibraryButtonPanel({
    gameId,
    gameSlug,
    loggedIn,
    inLibrary,
}: {
    gameId: number;
    gameSlug: string;
    loggedIn: boolean;
    inLibrary: boolean;
}) {
    const [isInLibrary, setIsInLibrary] = useState(inLibrary);
    const [pending, startTransition] = useTransition();

    if (!loggedIn) {
        return (
            <div className="flex flex-row">
                <PrimaryButton href="/login">Log in to add</PrimaryButton>
            </div>
        );
    }

    return (
        <div className="flex flex-row flex-wrap gap-3">
            {isInLibrary ? (
                <>
                    <GhostButton
                        disabled={pending}
                        className="disabled:cursor-wait disabled:opacity-60"
                        onClick={() => startTransition(async () => {
                            const result = await removeGameFromLibrary(gameId, gameSlug);
                            setIsInLibrary(result.inLibrary);
                        })}
                    >
                        {pending ? "Removing..." : "Remove from Library"}
                    </GhostButton>
                </>
            ) : (
                <PrimaryButton
                    disabled={pending}
                    className="disabled:cursor-wait disabled:opacity-60"
                    onClick={() => startTransition(async () => {
                        const result = await addGameToLibrary(gameId, gameSlug);
                        setIsInLibrary(result.inLibrary);
                    })}
                >
                    {pending ? "Adding..." : "Add to Library"}
                </PrimaryButton>
            )}
        </div>
    );
}
