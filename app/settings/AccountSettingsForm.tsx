"use client";

import { GhostButton } from "@/app/components/ui/Buttons";
import ConfirmAction from "@/app/components/ui/ConfirmAction";
import { Field, Input } from "@/app/components/ui/Inputs";
import { linkProvider, unlinkProvider } from "@/lib/actions/auth";
import { clearUserLibrary, deleteUserAccount, resetUserAccountData } from "@/lib/actions/settings";
import { AUTHPROVIDERS } from "@/lib/constants";
import type { User } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function AccountSettingsForm({ profile }: Readonly<{ profile: User }>) {
	const [email, setEmail] = useState(profile.email ?? "");
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [passwordConfirm, setPasswordConfirm] = useState("");
	const [confirming, setConfirming] = useState<"library" | "data" | "account" | null>(null);
	const [pending, startTransition] = useTransition();
	const router = useRouter();
	const username = profile.name ?? "";

	function run(action: "library" | "data" | "account") {
		startTransition(async () => {
			if (action === "library") {
				await clearUserLibrary(username);
				router.refresh();
			}

			if (action === "data") {
				await resetUserAccountData(username);
				router.refresh();
			}

			if (action === "account") {
				await deleteUserAccount(username);
			}

			setConfirming(null);
		});
	}

	return (
		<div className="flex flex-col gap-5">
			<Field label="Email">
				<div className="relative max-w-md">
					<Input name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="pl-2" />
				</div>
			</Field>

			<div>
				<h3>Password</h3>
				<div className="mt-1 grid gap-3 md:grid-cols-3">
					{profile.hasPassword && (
						<div className="flex flex-col">
							<span className="text-sm text-text-muted">Current password</span>
							<label className="relative">
								<Input
									name="currentPassword"
									type="password"
									value={currentPassword}
									onChange={(event) => setCurrentPassword(event.target.value)}
									className="pl-2"
									autoComplete="current-password"
								/>
							</label>
						</div>
					)}
					<label className="flex flex-col">
						<span className="text-sm text-text-muted">{profile.hasPassword ? "New password" : "Set password"}</span>
						<span className="relative">
							<Input
								name="newPassword"
								type="password"
								value={newPassword}
								onChange={(event) => setNewPassword(event.target.value)}
								className="pl-2"
								autoComplete="new-password"
							/>
						</span>
					</label>
					<div className="flex flex-col">
						<span className="text-sm text-text-muted">Confirm password</span>
						<label className="relative">
							<Input
								name="passwordConfirm"
								type="password"
								value={passwordConfirm}
								onChange={(event) => setPasswordConfirm(event.target.value)}
								className="pl-2"
								autoComplete="new-password"
							/>
						</label>
					</div>
				</div>
			</div>

			<div>
				<h3>Login providers</h3>
				<div className="mt-2 grid gap-2 md:grid-cols-2">
					{AUTHPROVIDERS.map((provider) => {
						const linked = profile.linkedProviders.includes(provider.slug);
						const Icon = provider.icon;

						return (
							<div key={provider.slug} className="flex items-center justify-between rounded bg-bg p-3">
								<div className="flex min-w-0 items-center gap-2 text-sm font-bold text-text-muted">
									<Icon size={18} title="" aria-hidden className="shrink-0" />
									<span>{provider.label}</span>
								</div>
								{linked ? (
									<GhostButton type="submit" formAction={unlinkProvider.bind(null, provider.slug)} className="px-3 py-1 text-sm">
										Unlink
									</GhostButton>
								) : (
									<GhostButton type="submit" formAction={linkProvider.bind(null, provider.slug)} className="px-3 py-1 text-sm">
										Link
									</GhostButton>
								)}
							</div>
						);
					})}
				</div>
				<p className="mt-2 ml-1.5 text-[0.7rem] text-text-muted">Sign in first, then link providers here to connect them to this account.</p>
			</div>

			<p className="ml-1.5 text-[0.7rem] text-text-muted">Joined {profile.createdAt}</p>

			<div className="rounded border border-error/40 bg-error/10 p-4">
				<h3>Danger zone</h3>
				<p className="mt-1 text-sm text-text-muted">These actions permanently remove account data. Each action requires confirmation before it runs.</p>
				<div className="mt-4 grid gap-2 md:grid-cols-3">
					<GhostButton type="button" onClick={() => setConfirming("library")} className="border-error px-3 py-2 text-error hover:border-error hover:text-error">
						Clear library
					</GhostButton>
					<GhostButton type="button" onClick={() => setConfirming("data")} className="border-error px-3 py-2 text-error hover:border-error hover:text-error">
						Clear all data
					</GhostButton>
					<GhostButton type="button" onClick={() => setConfirming("account")} className="border-error px-3 py-2 text-error hover:border-error hover:text-error">
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
				requireText={username}
				requireLabel={`Type your username (${username}) to clear your library`}
				onClose={() => setConfirming(null)}
				onConfirm={() => run("library")}
			/>
			<ConfirmAction
				open={confirming === "data"}
				title="Clear all account data?"
				message="This resets your profile, library, playlists, comments, likes, follows, badges, notifications, preferences, and widgets. Your username and login methods stay in place."
				confirmLabel="Clear all data"
				pending={pending}
				requireText={username}
				requireLabel={`Type your username (${username}) to reset your account data`}
				onClose={() => setConfirming(null)}
				onConfirm={() => run("data")}
			/>
			<ConfirmAction
				open={confirming === "account"}
				title="Delete account?"
				message="This permanently deletes your account and all related data. This cannot be undone."
				confirmLabel="Delete account"
				pending={pending}
				requireText={username}
				requireLabel={`Type your username (${username}) to delete your account`}
				onClose={() => setConfirming(null)}
				onConfirm={() => run("account")}
			/>
		</div>
	);
}
