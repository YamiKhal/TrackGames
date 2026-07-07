"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { type ActionResult } from "@/lib/types";

/** Shared runner for admin mutations: pending state, error surfacing, and a refresh on success. */
export function useAdminAction() {
	const router = useRouter();
	const [error, setError] = useState("");
	const [pending, startTransition] = useTransition();

	function run(action: (formData: FormData) => Promise<ActionResult | undefined>, formData: FormData, onDone?: () => void) {
		setError("");
		startTransition(async () => {
			const response = await action(formData);
			if (response?.error) {
				setError(response.error);
				return;
			}
			router.refresh();
			onDone?.();
		});
	}

	return { run, pending, error, setError };
}
