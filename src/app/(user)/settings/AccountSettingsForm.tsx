"use client";

import { useState } from "react";
import { GhostButton } from "@/components/ui/control/Button";
import { TextInput } from "@/components/ui/control/TextInput";
import { DiscordIcon, GithubIcon, GoogleIcon, TwitchIcon } from "@/components/ui/SVG";
import { linkProvider, unlinkProvider } from "@/lib/actions/account/auth";
import { AUTH_PROVIDERS } from "@/lib/constants";
import { type SecuredUser } from "@/lib/data/social/user";

const authIcons = {
	google: GoogleIcon,
	github: GithubIcon,
	twitch: TwitchIcon,
	discord: DiscordIcon,
} as const;

const authProviders = AUTH_PROVIDERS.map((provider) => ({ ...provider, icon: authIcons[provider.slug as keyof typeof authIcons] }));

export default function AccountSettingsForm({ profile, linkedProviders, hasPassword }: Readonly<{ profile: SecuredUser; linkedProviders: string[]; hasPassword: boolean }>) {
	const [email, setEmail] = useState(profile.email ?? "");
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [passwordConfirm, setPasswordConfirm] = useState("");

	return (
		<div className="flex flex-col gap-5">
			<TextInput label="Email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="max-w-md pl-2" />

			<div>
				<h3>Password</h3>
				<div className="mt-1 grid gap-3 md:grid-cols-3">
					{hasPassword && (
						<TextInput
							label="Current password"
							name="currentPassword"
							type="password"
							value={currentPassword}
							onChange={(event) => setCurrentPassword(event.target.value)}
							className="pl-2"
							autoComplete="current-password"
						/>
					)}
					<TextInput
						label={hasPassword ? "New password" : "Set password"}
						name="newPassword"
						type="password"
						value={newPassword}
						onChange={(event) => setNewPassword(event.target.value)}
						className="pl-2"
						autoComplete="new-password"
					/>
					<TextInput
						label="Confirm password"
						name="passwordConfirm"
						type="password"
						value={passwordConfirm}
						onChange={(event) => setPasswordConfirm(event.target.value)}
						className="pl-2"
						autoComplete="new-password"
					/>
				</div>
			</div>

			<div>
				<h3>Login providers</h3>
				<div className="mt-2 grid gap-2 md:grid-cols-2">
					{authProviders.map((provider) => {
						const linked = linkedProviders.includes(provider.slug);
						const Icon = provider.icon;

						return (
							<div key={provider.slug} className="flex items-center justify-between rounded bg-bg p-3">
								<div className="flex min-w-0 items-center gap-2 text-sm font-bold text-text-muted">
									<Icon size={18} title="" aria-hidden className="shrink-0" />
									<span>{provider.label}</span>
								</div>
								{linked ? (
									<GhostButton variant="outline" type="submit" formAction={unlinkProvider.bind(null, provider.slug)} className="px-3 py-1 text-sm">
										Unlink
									</GhostButton>
								) : (
									<GhostButton variant="outline" type="submit" formAction={linkProvider.bind(null, provider.slug)} className="px-3 py-1 text-sm">
										Link
									</GhostButton>
								)}
							</div>
						);
					})}
				</div>
				<p className="mt-2 ml-1.5 text-[0.7rem] text-text-muted">Sign in first, then link providers here to connect them to this account.</p>
			</div>

			<p className="ml-1.5 text-[0.7rem] text-text-muted">Joined {new Date(profile.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</p>

			<p className="ml-1.5 text-[0.7rem] text-text-muted">Looking to clear your library, reset your data, or delete your account? Those live under the Data tab.</p>
		</div>
	);
}
