"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useAdminAction } from "@/app/(admin)/dashboard/_tabs/useAdminAction";
import ConfirmAction from "@/components/ui/ConfirmAction";
import { DangerButton, PrimaryButton } from "@/components/ui/control/Button";
import { Checkbox } from "@/components/ui/control/Checkbox";
import { TextArea } from "@/components/ui/control/TextArea";
import { TextInput } from "@/components/ui/control/TextInput";
import MenuPanel from "@/components/ui/MenuPanel";
import AvatarView from "@/components/user/AvatarView";
import RoleTags from "@/components/user/RoleTags";
import { deleteMemberAsAdmin, updateMember, wipeUserImages, wipeUserWidgets } from "@/lib/actions/admin/admin";
import { UserRole } from "@/lib/generated/prisma/enums";

type AdminMember = {
	id: string;
	name: string | null;
	email: string | null;
	image: string | null;
	background: string | null;
	bio: string | null;
	roles: UserRole[];
	createdAt: string | Date;
	_count: { comments: number; games: number; gameLists: number };
};

export default function MembersPanel({ members, query }: Readonly<{ members: AdminMember[]; query: string }>) {
	const router = useRouter();
	const [active, setActive] = useState<AdminMember | null>(null);
	const [confirm, setConfirm] = useState<"images" | "widgets" | "delete" | null>(null);
	const { run, pending, error } = useAdminAction();

	function submitUpdate(formData: FormData) {
		if (!active) return;
		formData.set("userId", active.id);
		run(updateMember, formData, () => setActive(null));
	}

	function runDanger() {
		if (!active || !confirm) return;
		const data = new FormData();
		data.set("userId", active.id);
		if (confirm === "images") run(wipeUserImages, data, () => setConfirm(null));
		else if (confirm === "widgets") run(wipeUserWidgets, data, () => setConfirm(null));
		else run(deleteMemberAsAdmin, data, () => (setConfirm(null), setActive(null)));
	}

	return (
		<div className="flex flex-col gap-4">
			<form action={(formData) => router.push(`/dashboard?tab=members&q=${encodeURIComponent(String(formData.get("q") ?? ""))}`)} className="flex gap-2">
				<TextInput name="q" defaultValue={query} placeholder="Search by username or email" className="flex-1" />
				<PrimaryButton type="submit" className="h-10 shrink-0 px-4">
					<Search size={16} />
				</PrimaryButton>
			</form>

			{members.length === 0 ? (
				<p className="text-sm text-text-muted">No members found.</p>
			) : (
				<ul className="grid auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
					{members.map((member) => (
						<li key={member.id}>
							<button
								type="button"
								onClick={() => setActive(member)}
								className="flex h-full w-full cursor-pointer flex-col items-center gap-2 rounded border border-border bg-bg-secondary/40 p-4 text-center transition-colors hover:border-primary hover:bg-bg-secondary/70"
							>
								<AvatarView image={member.image} size={16} mdSize={16} iconSize={28} className="rounded-full" />
								<span className="w-full truncate text-sm font-bold">{member.name ?? "Unnamed"}</span>
								<span className="flex min-h-5 flex-wrap items-center justify-center gap-1">
									<RoleTags roles={member.roles} />
								</span>
							</button>
						</li>
					))}
				</ul>
			)}

			<MenuPanel
				open={Boolean(active)}
				onClose={() => setActive(null)}
				title={active ? `Manage ${active.name ?? "member"}` : ""}
				width="34rem"
				shouldShowClose
				formId="member-update"
				submitLabel="Apply changes"
				isSubmitPending={pending}
			>
				{active && (
					<div className="flex flex-col gap-5 text-sm text-text">
						<dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
							<div className="col-span-2">
								<dt className="text-text-faint">Email</dt>
								<dd className="truncate font-bold text-text">{active.email ?? "no email"}</dd>
							</div>
							<div>
								<dt className="text-text-faint">Comments</dt>
								<dd className="font-bold text-text">{active._count.comments}</dd>
							</div>
							<div>
								<dt className="text-text-faint">Games</dt>
								<dd className="font-bold text-text">{active._count.games}</dd>
							</div>
							<div>
								<dt className="text-text-faint">Playlists</dt>
								<dd className="font-bold text-text">{active._count.gameLists}</dd>
							</div>
							<div>
								<dt className="text-text-faint">Joined</dt>
								<dd className="font-bold text-text">{new Date(active.createdAt).toLocaleDateString()}</dd>
							</div>
						</dl>

						<form id="member-update" action={submitUpdate} className="flex flex-col gap-4">
							<TextInput name="username" label="Username" defaultValue={active.name ?? ""} maxLength={32} className="text-text" />
							<TextArea name="bio" label="Bio" defaultValue={active.bio ?? ""} rows={3} maxLength={280} className="text-text" />
							<div className="flex flex-col gap-2">
								<span className="font-bold text-text-muted">Roles</span>
								<div className="flex flex-wrap gap-4">
									{Object.values(UserRole).map((role) => (
										<Checkbox key={role} name="roles" value={role} defaultChecked={active.roles.includes(role)} label={role} labelClassName="text-text" />
									))}
								</div>
							</div>
						</form>

						<div className="flex flex-col gap-2">
							<span className="font-bold text-error">Danger zone</span>
							<div className="flex flex-wrap gap-2">
								<DangerButton variant="outline" type="button" disabled={pending || (!active.image && !active.background)} onClick={() => setConfirm("images")}>
									Wipe images
								</DangerButton>
								<DangerButton variant="outline" type="button" disabled={pending} onClick={() => setConfirm("widgets")}>
									Wipe widgets
								</DangerButton>
								<DangerButton variant="outline" type="button" disabled={pending} onClick={() => setConfirm("delete")}>
									Delete member
								</DangerButton>
							</div>
						</div>

						{error && <p className="font-bold text-error">{error}</p>}
					</div>
				)}
			</MenuPanel>

			<ConfirmAction
				open={Boolean(confirm)}
				title={confirm === "delete" ? "Delete member" : confirm === "widgets" ? "Wipe widgets" : "Wipe images"}
				message={
					confirm === "delete"
						? `Permanently delete ${active?.name ?? "this member"} and all of their comments, playlists, and activity? This can't be undone.`
						: confirm === "widgets"
							? `Permanently clear ${active?.name ?? "this member"}'s profile widgets?`
							: `Permanently remove ${active?.name ?? "this member"}'s avatar and background?`
				}
				confirmLabel={confirm === "delete" ? "Delete member" : "Wipe"}
				requireText={confirm === "delete" ? (active?.name ?? undefined) : undefined}
				requireLabel={confirm === "delete" ? `Type ${active?.name ?? ""} to confirm` : undefined}
				pending={pending}
				error={error}
				onClose={() => setConfirm(null)}
				onConfirm={runDanger}
			/>
		</div>
	);
}
