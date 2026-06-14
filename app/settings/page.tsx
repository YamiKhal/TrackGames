import Container from "@/app/components/layout/Container";
import ProfileBackground from "@/app/components/user/BackgroundView";
import { auth } from "@/lib/auth";
import { getUser, profileThemeStyle } from "@/lib/account/user";
import * as normalize from "@/lib/util/normalize";
import { Bell, LayoutGrid, Settings, Shield, UserIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import SettingsPanel from "./SettingsPanel";
import type { ReactNode } from "react";
import ProfileHeader from "@/app/components/user/ProfileHeader";

const tabs: { id: string; label: string; description: string; icon: typeof UserIcon }[] = [
    { id: "profile", label: "Profile", description: "Bio, avatar, background, and colors", icon: UserIcon },
    { id: "privacy", label: "Privacy", description: "Who can view and interact", icon: Shield },
    { id: "widgets", label: "Widgets", description: "Profile blocks and per-widget settings", icon: LayoutGrid },
    { id: "preferences", label: "Preferences", description: "Site defaults and notifications", icon: Bell },
    { id: "account", label: "Account", description: "Email and account metadata", icon: Settings },
];

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
    const activeTab = normalize.value(params.tab, tabs, "id", "profile");
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const profile = await getUser(session.user);

    if (!profile) {
        redirect("/login");
    }

    const background = profile.background ?? "https://cdn.pixabay.com/video/2020/06/16/42197-429661458_large.mp4";
    const active = normalize.byKey(tabs, "id", activeTab) ?? tabs[0];

    return (
        <main className="relative z-0 flex-1" style={profileThemeStyle(profile.profileColor, profile.accentColor)}>
            <ProfileBackground src={background} />

            <Container>
                <ProfileHeader isSettings={true} profileImage={profile.image} displayName={profile.name ?? "Player"} />

                <section className="relative z-10 bg-bg/95 py-5">
                    <Container className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start">
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
                                    profile={profile}
                                />
                            </SectionShell>
                        </div>
                    </Container>
                </section>
            </Container>
        </main>
    );
}
