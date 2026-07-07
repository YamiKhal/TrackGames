"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ConfirmAction from "@/components/ui/ConfirmAction";
import { GhostButton, PrimaryButton } from "@/components/ui/control/Button";
import { Checkbox } from "@/components/ui/control/Checkbox";
import { clearUserLibrary, deleteUserAccount, resetUserAccountData } from "@/lib/actions/account/settings";
import { type SecuredUser } from "@/lib/data/social/user";
import { applyConsent, type ConsentChoice, readConsent } from "@/lib/util/client/consent";
import { deferHook } from "@/lib/util/client/func";

export default function DataSettingsForm({ profile }: Readonly<{ profile: SecuredUser }>) {
	const [consent, setConsent] = useState<ConsentChoice>({ analytics: false, ads: false });
	const [savedConsent, setSavedConsent] = useState(false);
	const [confirming, setConfirming] = useState<"library" | "data" | "account" | null>(null);
	const [pending, startTransition] = useTransition();
	const router = useRouter();

	useEffect(() => {
		const stored = readConsent();
		if (stored) {
			deferHook(() => {
				setConsent(stored);
			});
		}
	}, []);

	function saveConsent() {
		applyConsent(consent);
		setSavedConsent(true);
	}

	function run(action: "library" | "data" | "account") {
		startTransition(async () => {
			if (action === "library") await clearUserLibrary(profile.name!);
			if (action === "data") await resetUserAccountData(profile.name!);
			if (action === "account") await deleteUserAccount(profile.name!);

			if (action !== "account") router.refresh();
			setConfirming(null);
		});
	}

	return (
		<div className="flex flex-col gap-5">
			<div>
				<h3>Data tracking</h3>
				<p className="mt-1 text-sm text-text-muted">Choose which optional cookies TrackGames may use. Essential cookies keep you signed in and cannot be turned off.</p>
				<div className="mt-4 flex flex-col gap-3">
					<label className="flex items-center gap-2 text-sm font-bold text-text-muted opacity-60">
						<Checkbox checked disabled />
						<span>Essential — sign-in, sessions, security (always on)</span>
					</label>
					<Checkbox
						label="Analytics — page views and feature usage"
						checked={consent.analytics}
						onChange={(event) => {
							setConsent((value) => ({ ...value, analytics: event.target.checked }));
							setSavedConsent(false);
						}}
					/>
					<Checkbox
						label="Advertising — measurement and personalization"
						checked={consent.ads}
						onChange={(event) => {
							setConsent((value) => ({ ...value, ads: event.target.checked }));
							setSavedConsent(false);
						}}
					/>
				</div>
				<div className="mt-4 flex items-center gap-3">
					<PrimaryButton type="button" onClick={saveConsent} className="px-4 py-2">
						Save preferences
					</PrimaryButton>
					{savedConsent && <span className="text-sm font-bold text-success">Preferences saved.</span>}
				</div>
			</div>

			<div className="rounded border border-error/40 bg-error/10 p-4">
				<h3>Danger zone</h3>
				<p className="mt-1 text-sm text-text-muted">These actions permanently remove account data. Each action requires confirmation before it runs.</p>
				<div className="mt-4 grid gap-2 md:grid-cols-3">
					<GhostButton
						variant="outline"
						type="button"
						onClick={() => setConfirming("library")}
						className="border-error px-3 py-2 text-error hover:border-error hover:text-error"
					>
						Clear library
					</GhostButton>
					<GhostButton
						variant="outline"
						type="button"
						onClick={() => setConfirming("data")}
						className="border-error px-3 py-2 text-error hover:border-error hover:text-error"
					>
						Clear all data
					</GhostButton>
					<GhostButton
						variant="outline"
						type="button"
						onClick={() => setConfirming("account")}
						className="border-error px-3 py-2 text-error hover:border-error hover:text-error"
					>
						Delete account
					</GhostButton>
				</div>
			</div>

			<ConfirmAction
				open={confirming === "library"}
				title="Clear library?"
				message="This deletes every game entry in your library, including play logs and entry data."
				confirmLabel="Clear library"
				pending={pending}
				requireText={profile.name!}
				requireLabel={`Type your username (${profile.name!}) to clear your library`}
				onClose={() => setConfirming(null)}
				onConfirm={() => run("library")}
			/>
			<ConfirmAction
				open={confirming === "data"}
				title="Clear all account data?"
				message="This resets your profile, library, playlists, comments, likes, follows, badges, notifications, preferences, and widgets. Your username and login methods stay in place."
				confirmLabel="Clear all data"
				pending={pending}
				requireText={profile.name!}
				requireLabel={`Type your username (${profile.name!}) to reset your account data`}
				onClose={() => setConfirming(null)}
				onConfirm={() => run("data")}
			/>
			<ConfirmAction
				open={confirming === "account"}
				title="Delete account?"
				message="This permanently deletes your account and all related data. This cannot be undone."
				confirmLabel="Delete account"
				pending={pending}
				requireText={profile.name!}
				requireLabel={`Type your username (${profile.name!}) to delete your account`}
				onClose={() => setConfirming(null)}
				onConfirm={() => run("account")}
			/>
		</div>
	);
}
