import Container from "@/app/components/layout/Container";
import ProfileBackground from "@/app/components/user/ProfileBackground";
import { GhostButton } from "@/app/components/ui/Buttons";
import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { Bell, LayoutGrid, Settings, Shield, UserIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import SettingsPanel from "./SettingsPanel";
import type { ReactNode } from "react";

type SettingsTab = "profile" | "privacy" | "widgets" | "preferences" | "account";

const tabs: { id: SettingsTab; label: string; description: string; icon: typeof UserIcon }[] = [
    { id: "profile", label: "Profile", description: "Bio, avatar, background, and colors", icon: UserIcon },
    { id: "privacy", label: "Privacy", description: "Who can view and interact", icon: Shield },
    { id: "widgets", label: "Widgets", description: "Profile blocks and per-widget settings", icon: LayoutGrid },
    { id: "preferences", label: "Preferences", description: "Site defaults and notifications", icon: Bell },
    { id: "account", label: "Account", description: "Email and account metadata", icon: Settings },
];

function normalizeTab(value: string | undefined): SettingsTab {
    return tabs.some((tab) => tab.id === value) ? value as SettingsTab : "profile";
}

function SectionShell({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="rounded bg-bg-secondary/80 p-5">
            <div className="mb-5 flex flex-col gap-3 border-b border-border pb-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold">{title}</h2>
                </div>
            </div>
            {children}
        </div>
    );
}

function settingsErrorMessage(error: string) {
    switch (error) {
        case "duplicate":
            return "That username or email is already in use.";
        case "invalid-password":
            return "Enter matching passwords with at least 8 characters.";
        case "current-password":
            return "Your current password was incorrect.";
        case "email-required":
            return "Add an email before setting a password.";
        case "last-login":
            return "Add another login method before unlinking that provider.";
        case "invalid-provider":
            return "That provider could not be linked.";
        default:
            return "Some settings were invalid. Check the fields and try again.";
    }
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string; edit?: string; saved?: string; error?: string }> }) {
    const params = await searchParams;
    const activeTab = normalizeTab(params.tab);
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const profile = await db.user.findFirst({
        where: {
            OR: [
                session.user.email ? { email: session.user.email } : undefined,
                session.user.name ? { name: session.user.name } : undefined,
            ].filter(Boolean) as { email?: string; name?: string }[],
        },
        select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            image: true,
            background: true,
            bio: true,
            profileColor: true,
            accentColor: true,
            privacy: true,
            socials: true,
            preferences: true,
            widgets: true,
            accounts: {
                select: {
                    provider: true,
                },
            },
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!profile) {
        redirect("/login");
    }

    const { passwordHash, accounts, ...settingsProfile } = profile;
    const displayName = profile.name ?? "Player";
    const background = profile.background ?? "https://cdn.pixabay.com/video/2020/06/16/42197-429661458_large.mp4";
    const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];
    const profileHref = profile.name ? `/u/${encodeURIComponent(profile.name)}` : "/settings";

    return (
        <main className="relative z-0 flex-1">
            <ProfileBackground src={background} />

            <Container>
                <section className="relative z-10 w-full border-b border-border bg-bg/90">
                    <Container className="relative z-1 flex flex-row items-end justify-start gap-10 pt-5">
                        <div className="relative z-1 mx-5 mb-3 flex min-h-max w-full min-w-0 gap-4 text-text md:gap-6">
                            <div className="relative flex aspect-square h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg md:h-34 md:w-34">
                                {profile.image ? (
                                    <Image src={profile.image} alt={`${displayName} profile image`} fill priority sizes="160px" className="pointer-events-none select-none object-cover object-center" />
                                ) : (
                                    <UserIcon size={48} aria-hidden="true" />
                                )}
                            </div>

                            <div className="flex min-w-0 flex-1 flex-col justify-end gap-3 md:flex-row md:items-end md:justify-between">
                                <div className="min-w-0">
                                    <h1 className="max-w-full wrap-break-word text-3xl font-bold md:text-4xl">{displayName}</h1>
                                </div>
                                <GhostButton href={profileHref}>View profile</GhostButton>
                            </div>
                        </div>
                    </Container>
                </section>

                <section className="relative z-10 bg-bg/95 py-5">
                    <Container className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
                        <aside className="rounded bg-bg-secondary/80 p-3">
                            <nav className="flex gap-2 flex-col">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    const selected = tab.id === activeTab;

                                    return (
                                        <Link
                                            key={tab.id}
                                            href={`/settings?tab=${tab.id}`}
                                            className={`flex min-w-56 items-start gap-3 rounded px-3 py-3 text-left transition-colors lg:min-w-0 ${selected ? "bg-primary/15 text-primary" : "text-text-muted hover:bg-surface hover:text-text"}`}
                                        >
                                            <Icon size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
                                            <span className="min-w-0">
                                                <span className="block text-sm font-bold">{tab.label}</span>
                                            </span>
                                        </Link>
                                    );
                                })}
                            </nav>
                        </aside>

                        <div className="min-w-0">
                            {params.saved === "1" && (
                                <div className="mb-4 rounded border border-success/40 bg-success/10 px-4 py-3 text-sm font-bold text-success">
                                    Settings saved.
                                </div>
                            )}
                            {params.error && (
                                <div className="mb-4 rounded border border-error/40 bg-error/10 px-4 py-3 text-sm font-bold text-error">
                                    {settingsErrorMessage(params.error)}
                                </div>
                            )}

                            <SectionShell title={active.label}>
                                <SettingsPanel
                                    activeTab={activeTab}
                                    profile={{
                                        ...settingsProfile,
                                        hasPassword: Boolean(passwordHash),
                                        linkedProviders: accounts.map((account) => account.provider),
                                        createdAt: profile.createdAt.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
                                        updatedAt: profile.updatedAt.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }),
                                    }}
                                />
                            </SectionShell>
                        </div>
                    </Container>
                </section>
            </Container>
        </main>
    );
}
