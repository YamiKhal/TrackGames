"use client";

import { useState, useTransition } from "react";
import { PrimaryButton } from "@/components/ui/control/Button";
import { TextInput } from "@/components/ui/control/TextInput";
import { confirmAdminPassword } from "@/lib/actions/admin/admin";

export default function GateForm() {
	const [error, setError] = useState("");
	const [pending, startTransition] = useTransition();

	function submit(formData: FormData) {
		setError("");
		startTransition(async () => {
			// On success the action sets the cookie and redirects; only failures return here.
			const response = await confirmAdminPassword(formData);
			if (response?.error) setError(response.error);
		});
	}

	return (
		<form action={submit} className="flex flex-col gap-4">
			<TextInput name="password" type="password" autoComplete="current-password" label="Password" required />
			{error && <p className="text-sm font-bold text-error">{error}</p>}
			<PrimaryButton type="submit" disabled={pending}>
				{pending ? "Verifying..." : "Unlock admin"}
			</PrimaryButton>
		</form>
	);
}
