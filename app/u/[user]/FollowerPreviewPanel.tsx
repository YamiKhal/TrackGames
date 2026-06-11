import Image from "next/image";
import { UserIcon } from "lucide-react";

export default function FollowerPreviewPanel({ title, profiles }: {
    title: string; profiles: {
        name: string;
        image: string | null;
    }[]
}) {
    return (
        <div className="w-full max-w-4xl rounded bg-bg-secondary p-4">
            <div className="mb-3 flex items-center justify-between gap-4">
                <h2 className="text-sm">{title} - {profiles.length}</h2>
                <button
                    type="button"
                    className="shrink-0 cursor-pointer text-sm font-bold text-text-muted transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                    View all
                </button>
            </div>

            <div className="grid w-full gap-2 rounded bg-surface p-2">
                {profiles.length > 0 ? profiles.map((profile) => (
                    <div key={profile.name} className="flex min-w-0 items-center gap-3 rounded bg-bg-secondary/60 p-2">
                        <div className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full text-text-muted">
                            {profile.image ? (
                                <Image
                                    src={profile.image}
                                    alt={`${profile.name} profile image`}
                                    fill
                                    sizes="40px"
                                    className="object-cover object-center"
                                />
                            ) : (
                                <UserIcon size={20} aria-hidden="true" />
                            )}
                        </div>
                        <p className="min-w-0 truncate font-bold text-text">{profile.name}</p>
                    </div>
                )) : (
                    <p className="rounded p-3 text-sm text-text-muted">No entries to show yet.</p>
                )}
            </div>
        </div>
    );
}