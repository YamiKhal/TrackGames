import PlaylistCreatorModal from "@/app/(user)/u/[user]/PlaylistCreatorModal";
import PlaylistCoverCard from "@/components/gamelist/PlaylistCoverCard";
import { getUserPlaylists } from "@/lib/data/gamelist/lists";

export default async function ProfilePlaylists({
	userId,
	canCreate,
	isOwner,
	isFollower,
}: Readonly<{ userId: string; canCreate: boolean; isOwner: boolean; isFollower: boolean }>) {
	const followerFilter = isFollower ? "followers" : "public";
	const filter = isOwner ? "all" : followerFilter;
	const playlists = await getUserPlaylists(userId, filter);

	return (
		<div className="flex flex-col gap-4">
			<div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
				{playlists.map((playlist) => (
					<PlaylistCoverCard key={playlist.id} playlist={playlist} hasHref />
				))}
				<PlaylistCreatorModal canCreate={canCreate} />
				{!playlists.length && !canCreate && <p className="rounded border border-border bg-bg p-4 text-sm text-text-muted">No playlists yet.</p>}
			</div>
		</div>
	);
}
