"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GhostButton } from "../components/ui/Buttons";
import { GoogleIcon, TwitchIcon, GithubIcon, DiscordIcon } from "../components/SVG";
import { Mail, User, Lock, EyeOff, Eye } from "lucide-react";
import { login, loginProvider, signup } from "@/lib/actions/auth";
import MenuPanel from "../components/ui/MenuPanel";
import { deferEffect } from "@/lib/util/effects";

const providers = [
	{ name: "Google", icon: GoogleIcon, slug: "google" },
	{ name: "GitHub", icon: GithubIcon, slug: "github" },
	{ name: "Twitch", icon: TwitchIcon, slug: "twitch" },
	{ name: "Discord", icon: DiscordIcon, slug: "discord" },
];

const authErrorMessages: Record<string, string> = {
	AccessDenied: "Access denied. Please try another sign-in method.",
	AccountNotLinked: "An account with this email already exists. Sign in first, then link this provider.",
	CallbackRouteError: "Sign in failed. Please try again.",
	CredentialsSignin: "Invalid email or password.",
	OAuthAccountNotLinked: "An account with this email already exists. Sign in first, then link this provider.",
	OAuthCallbackError: "The provider sign-in failed. Please try again.",
	OAuthSignInError: "The provider sign-in failed. Please try again.",
	OAuthUsernameRequired: "Use 1-32 letters, numbers, underscores, or hyphens.",
	OAuthUsernameTaken: "That username is already in use.",
};

export default function LoginClient() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [mode, setMode] = useState<"login" | "register">("login");
	const [showPassword, setShowPassword] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; password?: string; passwordConfirm?: string }>({});
	const [name, setName] = useState("");
	const [password, setPassword] = useState("");
	const [providerSignup, setProviderSignup] = useState<(typeof providers)[number] | null>(null);
	const [providerUsername, setProviderUsername] = useState("");
	const [providerUsernameError, setProviderUsernameError] = useState("");
	const isRegister = mode === "register";
	const passwordMessage = isRegister && password.length > 0 && password.length < 8 ? "Password must be at least 8 characters." : fieldErrors.password;

	useEffect(() => {
		const defer = deferEffect(() => {
			setMode(searchParams.get("mode") === "register" ? "register" : "login");
		});
		const authError = searchParams.get("error");

		if (authError) {
			return deferEffect(() => {
				setErrorMessage(authErrorMessages[authError] ?? "Sign in failed. Please try again.");
			});
		}

		return defer();
	}, [searchParams]);

	function switchTo(nextMode: "login" | "register") {
		setErrorMessage("");
		setFieldErrors({});
		setPassword("");
		setProviderSignup(null);
		setProviderUsername("");
		setProviderUsernameError("");
		setMode(nextMode);
		router.replace(`/login?mode=${nextMode}`);
	}

	async function handleSubmit(formData: FormData) {
		const response = isRegister ? await signup(formData) : await login(formData);

		if (response?.error) {
			setErrorMessage(response.error);
			setFieldErrors(response.fieldErrors ?? {});
			return;
		}

		setErrorMessage("");
		setFieldErrors({});
	}

	async function handleProvider(provider: (typeof providers)[number]) {
		if (isRegister) {
			setErrorMessage("");
			setFieldErrors({});
			setProviderSignup(provider);
			setProviderUsername("");
			setProviderUsernameError("");
			return;
		}

		const formData = new FormData();
		formData.set("mode", mode);

		const response = await loginProvider(provider.slug, formData);

		if (response?.error) {
			setErrorMessage(response.error);
			setFieldErrors(response.fieldErrors ?? {});
			return;
		}

		setErrorMessage("");
		setFieldErrors({});
	}

	async function handleProviderSignup(formData: FormData) {
		if (!providerSignup) return;

		formData.set("mode", "register");
		const response = await loginProvider(providerSignup.slug, formData);

		if (response?.error) {
			setProviderUsernameError(response.fieldErrors?.name ?? response.error);
			return;
		}

		setProviderUsernameError("");
	}

	return (
		<div className="w-full max-w-md rounded bg-bg-secondary p-5 sm:p-6">
			<div className="mb-4">
				<h1 className="pb-5 text-center text-2xl font-bold text-text sm:text-3xl">{isRegister ? "Join" : "Login"}</h1>
			</div>
			{errorMessage && (
				<div className="mb-2 rounded-md border-2 border-error/50 bg-error/20 p-5 text-error">
					<p className="text-sm">{errorMessage}</p>
				</div>
			)}
			<form action={handleSubmit} key={mode} className="animate-auth-mode-in flex flex-col gap-4">
				{isRegister && (
					<label className="flex flex-col gap-2 text-sm font-bold text-text-muted">
						<span>Username</span>
						<span className="relative">
							<User className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-faint" size={18} aria-hidden="true" />
							<input
								id="name"
								name="name"
								type="text"
								autoComplete="username"
								placeholder="Your display name"
								maxLength={32}
								pattern="[A-Za-z0-9_-]+"
								value={name}
								onChange={(event) => setName(event.target.value)}
								aria-invalid={Boolean(fieldErrors.name)}
								aria-describedby={fieldErrors.name ?? undefined}
								className="h-10 w-full rounded border border-border bg-surface px-10 text-text transition-colors outline-none placeholder:text-text-faint focus:border-primary"
							/>
						</span>
						{fieldErrors.name && (
							<span id="name-error" className="text-xs font-bold text-error">
								{fieldErrors.name}
							</span>
						)}
					</label>
				)}

				<label className="flex flex-col gap-2 text-sm font-bold text-text-muted">
					<span>Email</span>
					<span className="relative">
						<Mail className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-faint" size={18} aria-hidden="true" />
						<input
							id="email"
							name="email"
							type="email"
							autoComplete="email"
							placeholder="Email address"
							aria-invalid={Boolean(fieldErrors.email)}
							aria-describedby={fieldErrors.email ?? undefined}
							className="h-10 w-full rounded border border-border bg-surface px-10 text-text transition-colors outline-none placeholder:text-text-faint focus:border-primary"
						/>
					</span>
					{fieldErrors.email && (
						<span id="email-error" className="text-xs font-bold text-error">
							{fieldErrors.email}
						</span>
					)}
				</label>

				<label className="flex flex-col gap-2 text-sm font-bold text-text-muted">
					<span>Password</span>
					<span className="relative">
						<Lock className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-faint" size={18} aria-hidden="true" />
						<input
							id="password"
							name="password"
							type={showPassword ? "text" : "password"}
							autoComplete={isRegister ? "new-password" : "current-password"}
							placeholder="Password"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							aria-invalid={Boolean(passwordMessage)}
							aria-describedby={passwordMessage ?? undefined}
							className="h-10 w-full rounded border border-border bg-surface px-10 pr-12 text-text transition-colors outline-none placeholder:text-text-faint focus:border-primary"
						/>
						<button
							type="button"
							onClick={() => setShowPassword((value) => !value)}
							className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded p-1 text-text-faint transition-colors hover:text-primary"
							aria-label="Toggle password"
						>
							{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
						</button>
					</span>
					{passwordMessage && (
						<span id="password-error" className="text-xs font-bold text-error">
							{passwordMessage}
						</span>
					)}
				</label>

				{isRegister && (
					<label className="flex flex-col gap-2 text-sm font-bold text-text-muted">
						<span>Confirm password</span>
						<span className="relative">
							<Lock className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-faint" size={18} aria-hidden="true" />
							<input
								id="passwordConfirm"
								name="passwordConfirm"
								type={showPassword ? "text" : "password"}
								autoComplete="new-password"
								placeholder="Repeat your password"
								aria-invalid={Boolean(fieldErrors.passwordConfirm)}
								aria-describedby={fieldErrors.passwordConfirm ?? undefined}
								className="h-10 w-full rounded border border-border bg-surface px-10 text-text transition-colors outline-none placeholder:text-text-faint focus:border-primary"
							/>
						</span>
						{fieldErrors.passwordConfirm && (
							<span id="passwordConfirm-error" className="text-xs font-bold text-error">
								{fieldErrors.passwordConfirm}
							</span>
						)}
					</label>
				)}

				{!isRegister && (
					<a href="/login" className="w-fit cursor-pointer text-sm font-bold text-primary transition-colors hover:text-primary-hover">
						Forgot password?
					</a>
				)}

				<button type="submit" className="mt-1 h-10 cursor-pointer rounded bg-primary px-6 text-sm font-bold text-text transition-colors hover:bg-primary-hover">
					{isRegister ? "Create account" : "Log in"}
				</button>
			</form>

			<div className="my-4 flex items-center gap-3 text-xs font-bold tracking-normal text-text-faint uppercase">
				<span className="h-px flex-1 bg-border" />
				<span>{isRegister ? "Or register with" : "Or use"}</span>
				<span className="h-px flex-1 bg-border" />
			</div>

			<div className="grid grid-cols-2 gap-2 sm:gap-3">
				{providers.map((provider) => {
					const Icon = provider.icon;

					return (
						<GhostButton key={provider.slug} type="button" onClick={() => handleProvider(provider)}>
							<Icon size={16} aria-hidden="true" />
							<span>{provider.name}</span>
						</GhostButton>
					);
				})}
			</div>

			<p className="mt-4 text-center text-sm text-text-muted">
				{isRegister ? "Already have an account?" : "Need an account?"}{" "}
				<button
					type="button"
					onClick={() => switchTo(isRegister ? "login" : "register")}
					className="cursor-pointer font-bold text-primary transition-colors hover:text-primary-hover"
				>
					{isRegister ? "Log in" : "Register"}
				</button>
			</p>

			<MenuPanel open={Boolean(providerSignup)} onClose={() => setProviderSignup(null)} title={providerSignup ? `Register with ${providerSignup.name}` : ""} width="24rem">
				<form action={handleProviderSignup}>
					<label className="flex flex-col gap-2 text-sm font-bold text-text-muted">
						<span>Username</span>
						<span className="relative">
							<User className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-faint" size={18} aria-hidden="true" />
							<input
								name="name"
								type="text"
								autoComplete="username"
								placeholder="profile-name"
								maxLength={32}
								pattern="[A-Za-z0-9_-]+"
								value={providerUsername}
								onChange={(event) => {
									setProviderUsername(event.target.value);
									setProviderUsernameError("");
								}}
								aria-invalid={Boolean(providerUsernameError)}
								aria-describedby={providerUsernameError ? "provider-username-error" : undefined}
								className="h-10 w-full rounded border border-border bg-surface px-10 text-text transition-colors outline-none placeholder:text-text-faint focus:border-primary"
							/>
						</span>
						{providerUsernameError && (
							<span id="provider-username-error" className="text-xs font-bold text-error">
								{providerUsernameError}
							</span>
						)}
					</label>
					<div className="mt-5 flex justify-end gap-2">
						<GhostButton type="button" onClick={() => setProviderSignup(null)} className="px-4 py-2">
							Cancel
						</GhostButton>
						<button type="submit" className="cursor-pointer rounded bg-primary px-4 py-2 text-sm font-bold text-text transition-colors hover:bg-primary-hover">
							Continue with {providerSignup?.name ?? "provider"}
						</button>
					</div>
				</form>
			</MenuPanel>
		</div>
	);
}
