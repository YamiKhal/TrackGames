"use client";

import { useRef, useState, useTransition } from "react";
import { PrimaryButton } from "@/components/ui/control/Button";
import { Select } from "@/components/ui/control/Select";
import { TextArea } from "@/components/ui/control/TextArea";
import { TextInput } from "@/components/ui/control/TextInput";
import { submitFeedback } from "@/lib/actions/account/feedback";
import { FEEDBACK_TYPE_LABELS } from "@/lib/constants";

export default function FeedbackSettingsForm() {
	const ref = useRef<HTMLFormElement>(null);
	const [error, setError] = useState("");
	const [sent, setSent] = useState(false);
	const [pending, startTransition] = useTransition();

	function send(formData: FormData) {
		setError("");
		setSent(false);
		startTransition(async () => {
			const response = await submitFeedback(formData);
			if (response?.error) {
				setError(response.error);
				return;
			}
			setSent(true);
			ref.current?.reset();
		});
	}

	return (
		<form ref={ref} action={send} className="flex flex-col gap-5">
			<p className="text-sm text-text-muted">
				Found a bug or have an idea? Send it our way. This goes to the TrackGames team. To report abusive content instead, use the report button on that content.
			</p>

			{sent && <div className="rounded border border-success/40 bg-success/10 px-4 py-3 text-sm font-bold text-success">Thanks — your feedback was sent.</div>}
			{error && <div className="rounded border border-error/40 bg-error/10 px-4 py-3 text-sm font-bold text-error">{error}</div>}

			<Select name="type" label="Type" defaultValue="SUGGESTION" fieldClassName="max-w-sm">
				{Object.entries(FEEDBACK_TYPE_LABELS).map(([value, text]) => (
					<option key={value} value={value}>
						{text}
					</option>
				))}
			</Select>

			<TextInput name="page" label="Related page (optional)" placeholder="https://..." fieldClassName="max-w-lg" />

			<TextArea name="message" label="Your feedback" rows={6} maxLength={4000} required placeholder="Describe what you ran into or what you'd like to see." />

			<div className="flex justify-end">
				<PrimaryButton type="submit" disabled={pending}>
					{pending ? "Sending..." : "Send feedback"}
				</PrimaryButton>
			</div>
		</form>
	);
}
