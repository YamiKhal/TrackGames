"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { GhostButton, PrimaryButton } from "@/components/ui/control/Button";
import { TextArea } from "@/components/ui/control/TextArea";
import { TextInput } from "@/components/ui/control/TextInput";
import MenuPanel from "@/components/ui/MenuPanel";
import { createPlaylist } from "@/lib/actions/gamelist/lists";

export default function PlaylistCreatorModal({ canCreate }: Readonly<{ canCreate: boolean }>) {
	const [open, setOpen] = useState(false);
	const [error, setError] = useState("");
	const [pending, startTransition] = useTransition();

	function save(formData: FormData) {
		setError("");
		startTransition(async () => {
			const response = await createPlaylist(formData);

			if (response?.error) {
				setError(response.error);
			}
		});
	}

	return (
		<>
			{canCreate && (
				<button
					type="button"
					onClick={() => setOpen(true)}
					className="flex aspect-80/49 w-full max-w-82 cursor-pointer flex-col items-center justify-center rounded border border-border text-text-muted transition-colors hover:border-primary hover:text-primary"
				>
					<Plus size={48} />
					<span className="mt-2 text-sm font-bold">Create playlist</span>
				</button>
			)}
			<MenuPanel open={open} onClose={() => setOpen(false)} title="Create playlist" panelClassName="max-w-lg bg-bg">
				<form action={save} className="flex flex-col gap-3">
					<TextInput label="Name" name="name" required maxLength={80} />
					<TextArea label="Description" name="description" rows={1} maxLength={500} />
					{error && <p className="text-sm font-bold text-error">{error}</p>}
					<div className="mt-2 flex justify-end gap-2">
						<GhostButton variant="outline" type="button" onClick={() => setOpen(false)}>
							Cancel
						</GhostButton>
						<PrimaryButton type="submit" disabled={pending}>
							{pending ? "Creating..." : "Create"}
						</PrimaryButton>
					</div>
				</form>
			</MenuPanel>
		</>
	);
}
