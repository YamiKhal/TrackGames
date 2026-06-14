"use client";

import { GhostButton } from "@/app/components/ui/Buttons";
import { Field, Input } from "@/app/components/ui/Inputs";
import { linkProvider, unlinkProvider } from "@/lib/actions/auth";
import { AUTHPROVIDERS } from "@/lib/constants";
import type { User } from "@/lib/types";
import { useState } from "react";

export default function AccountSettingsForm({ profile }: { profile: User }) {
    const [email, setEmail] = useState(profile.email ?? "");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");

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
                        <label className="flex flex-col">
                            <span className="text-sm text-text-muted">Current password</span>
                            <span className="relative">
                                <Input name="currentPassword" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="pl-2" autoComplete="current-password" />
                            </span>
                        </label>
                    )}
                    <label className="flex flex-col">
                        <span className="text-sm text-text-muted">{profile.hasPassword ? "New password" : "Set password"}</span>
                        <span className="relative">
                            <Input name="newPassword" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="pl-2" autoComplete="new-password" />
                        </span>
                    </label>
                    <label className="flex flex-col">
                        <span className="text-sm text-text-muted">Confirm password</span>
                        <span className="relative">
                            <Input name="passwordConfirm" type="password" value={passwordConfirm} onChange={(event) => setPasswordConfirm(event.target.value)} className="pl-2" autoComplete="new-password" />
                        </span>
                    </label>
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
                                    <GhostButton type="submit" formAction={unlinkProvider.bind(null, provider.slug)} className="px-3 py-1 text-sm">Unlink</GhostButton>
                                ) : (
                                    <GhostButton type="submit" formAction={linkProvider.bind(null, provider.slug)} className="px-3 py-1 text-sm">Link</GhostButton>
                                )}
                            </div>
                        );
                    })}
                </div>
                <p className="ml-1.5 mt-2 text-[0.7rem] text-text-muted">Provider login links to this same account. If a provider login has the same email, it will use this account.</p>
            </div>

            <p className="ml-1.5 text-[0.7rem] text-text-muted">Joined {profile.createdAt}</p>
        </div>
    );
}
