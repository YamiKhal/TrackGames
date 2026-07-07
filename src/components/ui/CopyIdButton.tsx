"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { joinClass } from "@/lib/util/client/func";

/** Admin-only affordance: copies a comment/playlist id so it can be pasted into the moderation tab. */
export default function CopyIdButton({ id, isAdmin, className }: Readonly<{ id: string; isAdmin: boolean; className?: string }>) {
	const [copied, setCopied] = useState(false);

	if (!isAdmin) return null;

	async function copy() {
		try {
			await navigator.clipboard.writeText(id);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			setCopied(false);
		}
	}

	return (
		<button
			type="button"
			onClick={copy}
			title="Copy ID (admin)"
			className={joinClass("flex cursor-pointer items-center gap-1 rounded px-2 py-1 hover:text-primary", className)}
		>
			{copied ? <Check size={14} /> : <Copy size={14} />}
			{copied ? "Copied" : "ID"}
		</button>
	);
}
