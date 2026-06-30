import Link from "next/link";
import AvatarView from "@/app/components/user/AvatarView";

type FollowerPreviewPanelProps = Readonly<{
	title: string;
	count: number;
	profiles: {
		name: string;
		image: string | null;
	}[];
}>;

export default function FollowerPreviewPanel({ title, count, profiles }: FollowerPreviewPanelProps) {
	const visible = profiles.slice(0, count > 16 ? 15 : 16);
	const overflow = Math.max(0, count - visible.length);

	return (
		<div className="w-full max-w-4xl rounded bg-bg-secondary/80 p-4">
			<div className="mb-3 flex items-center justify-between gap-4 border-b border-border pb-2">
				<h2 className="text-sm">
					{title} - {count}
				</h2>
			</div>

			<div className="grid w-full grid-cols-4 gap-2 rounded p-2">
				{visible.length > 0 ? (
					<>
						{visible.map((profile) => (
							<Link href={`/u/${profile.name}`} key={profile.name} title={profile.name} className="flex items-center justify-center">
								<AvatarView image={profile.image} size={10} mdSize={10} iconSize={20} alt={`${profile.name} profile image`} className="border border-border" />
							</Link>
						))}
						{overflow > 0 && (
							<div className="grid size-10 place-items-center rounded-full border border-border bg-bg text-xs font-bold text-text-muted">+{overflow}</div>
						)}
					</>
				) : (
					<p className="col-span-full rounded p-3 text-sm text-text-muted">No entries to show yet.</p>
				)}
			</div>
		</div>
	);
}
