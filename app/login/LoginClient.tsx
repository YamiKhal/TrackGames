"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GhostButton } from "../components/ui/Buttons";
import { GoogleIcon, TwitchIcon, GithubIcon, DiscordIcon } from "../components/SVG";
import { Mail, User, Lock, EyeOff, Eye } from "lucide-react";
import { login, loginProvider, signup } from "@/lib/actions/auth";

const providers = [
    { name: "Google", icon: GoogleIcon, slug: "google" },
    { name: "GitHub", icon: GithubIcon, slug: "github" },
    { name: "Twitch", icon: TwitchIcon, slug: "twitch" },
    { name: "Discord", icon: DiscordIcon, slug: "discord" },
];

const authErrorMessages: Record<string, string> = {
    AccessDenied: "Access denied. Please try another sign-in method.",
    AccountNotLinked: "This email is already linked to another sign-in method.",
    CallbackRouteError: "Sign in failed. Please try again.",
    CredentialsSignin: "Invalid email or password.",
    OAuthAccountNotLinked: "This email is already linked to another sign-in method.",
    OAuthCallbackError: "The provider sign-in failed. Please try again.",
    OAuthSignInError: "The provider sign-in failed. Please try again.",
};

export default function LoginClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [mode, setMode] = useState<"login" | "register">("login");
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const isRegister = mode === "register";

    useEffect(() => {
        setMode(searchParams.get("mode") === "register" ? "register" : "login");
        const authError = searchParams.get("error");

        if (authError) {
            setErrorMessage(authErrorMessages[authError] ?? "Sign in failed. Please try again.");
        }
    }, [searchParams]);

    function switchTo(nextMode: "login" | "register") {
        setErrorMessage("");
        setMode(nextMode);
        router.replace(`/login?mode=${nextMode}`);
    }

    async function handleSubmit(formData: FormData) {
        const response = isRegister ? await signup(formData) : await login(formData);

        if (response?.error) {
            setErrorMessage(response.error);
            return;
        }

        setErrorMessage("");
    }

    return (
        <div className="w-full max-w-md rounded bg-bg-secondary p-5 sm:p-6">
            <div className="mb-4">
                <h1 className="text-2xl font-bold text-text text-center pb-5 sm:text-3xl">
                    {isRegister ? "Join" : "Login"}
                </h1>
            </div>
            {errorMessage &&
                <div className="p-5 mb-2 bg-error/20 border-2 border-error/50 text-error rounded-md">
                    <p className="text-sm">
                        {errorMessage}
                    </p>
                </div>
            }
            <form
                action={handleSubmit}
                key={mode} className="animate-auth-mode-in flex flex-col gap-4">
                {isRegister && (
                    <label className="flex flex-col gap-2 text-sm font-bold text-text-muted">
                        Username
                        <span className="relative">
                            <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" size={18} aria-hidden="true" />
                            <input
                                id="name"
                                name="name"
                                type="text"
                                autoComplete="username"
                                placeholder="Your display name"
                                className="h-10 w-full rounded border border-border bg-surface px-10 text-text outline-none transition-colors placeholder:text-text-faint focus:border-primary"
                            />
                        </span>
                    </label>
                )}

                <label className="flex flex-col gap-2 text-sm font-bold text-text-muted">
                    Email
                    <span className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" size={18} aria-hidden="true" />
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            placeholder="Email address"
                            className="h-10 w-full rounded border border-border bg-surface px-10 text-text outline-none transition-colors placeholder:text-text-faint focus:border-primary"
                        />
                    </span>
                </label>

                <label className="flex flex-col gap-2 text-sm font-bold text-text-muted">
                    Password
                    <span className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" size={18} aria-hidden="true" />
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete={isRegister ? "new-password" : "current-password"}
                            placeholder={isRegister ? "Create a password" : "Password"}
                            className="h-10 w-full rounded border border-border bg-surface px-10 pr-12 text-text outline-none transition-colors placeholder:text-text-faint focus:border-primary"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((value) => !value)}
                            className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-text-faint transition-colors hover:text-primary"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </span>
                </label>

                {isRegister && (
                    <label className="flex flex-col gap-2 text-sm font-bold text-text-muted">
                        Confirm password
                        <span className="relative">
                            <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" size={18} aria-hidden="true" />
                            <input
                                id="passwordConfirm"
                                name="passwordConfirm"
                                type={showPassword ? "text" : "password"}
                                autoComplete="new-password"
                                placeholder="Repeat your password"
                                className="h-10 w-full rounded border border-border bg-surface px-10 text-text outline-none transition-colors placeholder:text-text-faint focus:border-primary"
                            />
                        </span>
                    </label>
                )}

                {!isRegister && (
                    <a href="#" className="cursor-pointer w-fit text-sm font-bold text-primary transition-colors hover:text-primary-hover">
                        Forgot password?
                    </a>
                )}

                <button
                    type="submit"
                    className="cursor-pointer mt-1 h-10 rounded bg-primary px-6 text-sm font-bold text-text transition-colors hover:bg-primary-hover"
                >
                    {isRegister ? "Create account" : "Log in"}
                </button>
            </form>

            <div className="my-4 flex items-center gap-3 text-xs font-bold uppercase tracking-normal text-text-faint">
                <span className="h-px flex-1 bg-border" />
                <span>{isRegister ? "Or register with" : "Or use"}</span>
                <span className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {providers.map(({ name, icon: Icon, slug }) => (
                    <GhostButton key={slug} onClick={() => loginProvider(slug)}>
                        <Icon size={16} aria-hidden="true" />
                        <span>{name}</span>
                    </GhostButton>
                ))}
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
        </div>
    )
}
