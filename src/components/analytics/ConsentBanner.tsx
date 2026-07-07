"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GhostButton, PrimaryButton } from "@/components/ui/control/Button";
import { Checkbox } from "@/components/ui/control/Checkbox";
import { applyConsent, type ConsentChoice, readConsent } from "@/lib/util/client/consent";
import { deferHook } from "@/lib/util/client/func";

// First-visit consent banner. Google Analytics is already on the page under Consent
// Mode v2 with everything defaulted to "denied" (see layout.tsx), so this only records
// the visitor's choice and updates the signals. Footer's "Cookie preferences" button
// (and the Data settings tab) re-open this via the "tg:open-cookie-preferences" event
// so consent can be changed or withdrawn as easily as it was given.
export default function ConsentBanner() {
	// null = choice already made (banner hidden). A value means the banner is showing
	// with these pending toggles. undefined = not yet read on first paint.
	const [pending, setPending] = useState<ConsentChoice | null | undefined>(undefined);
	const [customizing, setCustomizing] = useState(false);

	useEffect(() => {
		const stored = readConsent();
		if (stored) applyConsent(stored); // re-sync GA with the remembered choice each load

		deferHook(() => {
			setPending(stored ? null : { analytics: true, ads: false });
		});

		function reopen() {
			setCustomizing(false);
			setPending({ analytics: true, ads: false });
		}

		window.addEventListener("tg:open-cookie-preferences", reopen);
		return () => window.removeEventListener("tg:open-cookie-preferences", reopen);
	}, []);

	function decide(choice: ConsentChoice) {
		applyConsent(choice);
		setPending(null);
		setCustomizing(false);
	}

	if (!pending) return null;

	return (
		<div className="fixed inset-x-0 bottom-0 z-modal border-t border-border bg-bg/95 backdrop-blur">
			<div className="mx-auto flex max-w-4xl flex-col p-5">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<p className="text-sm text-text-muted">
						Essential cookies keep you signed in and are always on. With your consent we also use Google Analytics (and related measurement) to understand how
						TrackGames is used. See our{" "}
						<Link href="/privacy" className="text-primary hover:underline">
							Privacy Policy
						</Link>
						.
					</p>
					{/* Once customizing, these controls move into the expanded panel below. */}
					{!customizing && (
						<div className="flex shrink-0 flex-wrap gap-3">
							<GhostButton variant="outline" onClick={() => setCustomizing(true)}>
								Customize
							</GhostButton>
							<GhostButton variant="outline" onClick={() => decide({ analytics: false, ads: false })}>
								Reject all
							</GhostButton>
							<PrimaryButton onClick={() => decide({ analytics: true, ads: true })}>Accept all</PrimaryButton>
						</div>
					)}
				</div>

				{/* Grid-rows 0fr->1fr animates the panel's real height open/closed; the overflow-hidden
				    child clips it mid-transition. motion-reduce disables the animation entirely. */}
				<div className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${customizing ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
					<div className="overflow-hidden">
						<div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
							<label className="flex items-center gap-2 text-sm font-bold text-text-muted opacity-60">
								<Checkbox checked disabled />
								<span>Essential — sign-in, sessions, security (always on)</span>
							</label>
							<Checkbox
								label="Analytics — page views and feature usage"
								checked={pending.analytics}
								onChange={(event) => setPending({ ...pending, analytics: event.target.checked })}
							/>
							<Checkbox
								label="Advertising — measurement and personalization"
								checked={pending.ads}
								onChange={(event) => setPending({ ...pending, ads: event.target.checked })}
							/>
							<div className="mt-1 mb-5 flex flex-wrap justify-end gap-4">
								<GhostButton variant="outline" onClick={() => decide({ analytics: false, ads: false })}>
									Reject all
								</GhostButton>
								<PrimaryButton onClick={() => decide(pending)}>Save my preferences</PrimaryButton>
								<PrimaryButton onClick={() => decide({ analytics: true, ads: true })}>Accept all</PrimaryButton>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
