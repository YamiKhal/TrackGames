"use client";

import { useState, useTransition } from "react";
import { Search, Trash2 } from "lucide-react";
import { useAdminAction } from "@/app/(admin)/dashboard/_tabs/useAdminAction";
import ConfirmAction from "@/components/ui/ConfirmAction";
import { DangerButton, PrimaryButton } from "@/components/ui/control/Button";
import { Checkbox } from "@/components/ui/control/Checkbox";
import { Select } from "@/components/ui/control/Select";
import { TextArea } from "@/components/ui/control/TextArea";
import { TextInput } from "@/components/ui/control/TextInput";
import AvatarView from "@/components/user/AvatarView";
import RoleTags from "@/components/user/RoleTags";
import { deleteCommentAsAdmin, deletePlaylistAsAdmin, loadCommentForAdmin, loadPlaylistForAdmin, updateCommentAsAdmin, updatePlaylistAsAdmin } from "@/lib/actions/admin/admin";

type LoadedComment = NonNullable<Awaited<ReturnType<typeof loadCommentForAdmin>>>;
type LoadedPlaylist = NonNullable<Awaited<ReturnType<typeof loadPlaylistForAdmin>>>;

export default function ModerationPanel() {
	return (
		<div className="flex flex-col gap-6">
			<p className="text-sm text-text-muted">Paste an ID copied from a comment or playlist (admins see a copy button on each) to load and manage it.</p>
			<CommentModeration />
			<PlaylistModeration />
		</div>
	);
}

function CommentModeration() {
	const [id, setId] = useState("");
	const [comment, setComment] = useState<LoadedComment | null>(null);
	const [notFound, setNotFound] = useState(false);
	const [loading, startLoad] = useTransition();
	const [confirmDelete, setConfirmDelete] = useState(false);
	const { run, pending, error } = useAdminAction();

	function load(formData: FormData) {
		const value = String(formData.get("id") ?? "").trim();
		setNotFound(false);
		startLoad(async () => {
			const result = await loadCommentForAdmin(value);
			setComment(result);
			setNotFound(!result);
		});
	}

	function save(formData: FormData) {
		if (!comment) return;
		formData.set("commentId", comment.id);
		run(updateCommentAsAdmin, formData);
	}

	function remove() {
		if (!comment) return;
		const data = new FormData();
		data.set("commentId", comment.id);
		run(deleteCommentAsAdmin, data, () => (setConfirmDelete(false), setComment(null), setId("")));
	}

	return (
		<section className="flex flex-col gap-3 rounded p-4">
			<h2 className="text-sm font-bold">Manage comment by ID</h2>
			<form action={load} className="flex items-end gap-2">
				<TextInput name="id" value={id} onChange={(event) => setId(event.target.value)} placeholder="Comment ID" className="flex-1" />
				<PrimaryButton type="submit" disabled={loading} className="h-10 shrink-0 px-4">
					<Search size={16} />
				</PrimaryButton>
			</form>

			{notFound && <p className="text-sm text-text-muted">No comment found for that ID.</p>}

			{comment && (
				<div className="flex flex-col gap-4 text-sm">
					<div className="flex gap-3 rounded bg-bg-secondary/40 p-3">
						<AvatarView image={comment.user?.image ?? null} size={8} mdSize={8} iconSize={16} />
						<div className="min-w-0 flex-1">
							<div className="flex flex-wrap items-center gap-2 font-bold">
								{comment.user?.name ?? "Unknown"}
								<RoleTags roles={comment.user?.roles} />
							</div>
							<div className="text-xs text-text-faint">
								{comment.targetType} · {comment._count.likes} likes · {comment._count.replies} replies · {new Date(comment.createdAt).toLocaleDateString()}
							</div>
						</div>
					</div>

					<form action={save} className="flex flex-col gap-3">
						<TextArea name="content" label="Content" defaultValue={comment.content} rows={4} maxLength={2000} />
						<div className="flex items-center justify-between gap-2">
							<PrimaryButton type="submit" disabled={pending}>
								Save comment
							</PrimaryButton>
							<DangerButton variant="outline" type="button" disabled={pending} onClick={() => setConfirmDelete(true)}>
								<Trash2 size={15} /> Delete
							</DangerButton>
						</div>
					</form>

					{error && <p className="font-bold text-error">{error}</p>}
				</div>
			)}

			<ConfirmAction
				open={confirmDelete}
				title="Delete comment"
				message="Permanently remove this comment and its replies? This can't be undone."
				confirmLabel="Delete"
				pending={pending}
				error={error}
				onClose={() => setConfirmDelete(false)}
				onConfirm={remove}
			/>
		</section>
	);
}

function PlaylistModeration() {
	const [id, setId] = useState("");
	const [playlist, setPlaylist] = useState<LoadedPlaylist | null>(null);
	const [notFound, setNotFound] = useState(false);
	const [loading, startLoad] = useTransition();
	const [confirmDelete, setConfirmDelete] = useState(false);
	const { run, pending, error } = useAdminAction();

	function load(formData: FormData) {
		const value = String(formData.get("id") ?? "").trim();
		setNotFound(false);
		startLoad(async () => {
			const result = await loadPlaylistForAdmin(value);
			setPlaylist(result);
			setNotFound(!result);
		});
	}

	function save(formData: FormData) {
		if (!playlist) return;
		formData.set("listId", playlist.id);
		run(updatePlaylistAsAdmin, formData);
	}

	function remove() {
		if (!playlist) return;
		const data = new FormData();
		data.set("listId", playlist.id);
		run(deletePlaylistAsAdmin, data, () => (setConfirmDelete(false), setPlaylist(null), setId("")));
	}

	return (
		<section className="flex flex-col gap-3 rounded p-4">
			<h2 className="text-sm font-bold">Manage playlist by ID</h2>
			<form action={load} className="flex items-end gap-2">
				<TextInput name="id" value={id} onChange={(event) => setId(event.target.value)} placeholder="Playlist ID" className="flex-1" />
				<PrimaryButton type="submit" disabled={loading} className="h-10 shrink-0 px-4">
					<Search size={16} />
				</PrimaryButton>
			</form>

			{notFound && <p className="text-sm text-text-muted">No playlist found for that ID.</p>}

			{playlist && (
				<div className="flex flex-col gap-4 text-sm">
					<div className="flex gap-3 rounded bg-bg-secondary/40 p-3">
						<AvatarView image={playlist.user?.image ?? null} size={8} mdSize={8} iconSize={16} />
						<div className="min-w-0 flex-1">
							<div className="font-bold">{playlist.user?.name ?? "Unknown"}</div>
							<div className="text-xs text-text-faint">
								{playlist._count.entries} games · {playlist._count.likes} likes · {new Date(playlist.createdAt).toLocaleDateString()}
							</div>
						</div>
					</div>

					<form action={save} className="flex flex-col gap-3">
						<TextInput name="name" label="Name" defaultValue={playlist.name} maxLength={80} />
						<TextArea name="description" label="Description" defaultValue={playlist.description ?? ""} rows={3} maxLength={500} />
						<Select name="privacy" label="Privacy" defaultValue={playlist.privacy === "private" ? "private" : "public"}>
							<option value="public">Public</option>
							<option value="private">Private</option>
						</Select>
						<Checkbox name="commentsHidden" label="Hide comments" defaultChecked={playlist.commentsHidden} />
						<div className="flex items-center justify-between gap-2">
							<PrimaryButton type="submit" disabled={pending}>
								Save playlist
							</PrimaryButton>
							<DangerButton variant="outline" type="button" disabled={pending} onClick={() => setConfirmDelete(true)}>
								<Trash2 size={15} /> Delete
							</DangerButton>
						</div>
					</form>

					{error && <p className="font-bold text-error">{error}</p>}
				</div>
			)}

			<ConfirmAction
				open={confirmDelete}
				title="Delete playlist"
				message="Permanently remove this playlist and all of its comments, likes, and activity? This can't be undone."
				confirmLabel="Delete"
				pending={pending}
				error={error}
				onClose={() => setConfirmDelete(false)}
				onConfirm={remove}
			/>
		</section>
	);
}
