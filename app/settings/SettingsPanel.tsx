"use client";

import { GhostButton, PrimaryButton } from "@/app/components/ui/Buttons";
import { linkProvider, unlinkProvider } from "@/lib/actions/auth";
import { updateUserSettings } from "@/lib/actions/settings";
import { ChevronDown, ChevronUp, Image as ImageIcon, Plus, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { WidgetEditor } from "./WidgetEditors";
import { SocialLink, Widget } from "@/lib/types";
import { parseWidgets, serializeWidgets } from "@/lib/account/widget";
import { LinkType, WidgetType } from "@/lib/enums";
import { AUTHPROVIDERS, SOCIALPLATFORMS } from "@/lib/constants";
import { getSocialOption, getSocialPlaceholder, getSocialPlatform, getSocialPlatformLabel, parseSocials, serializeSocials } from "@/lib/account/socials";
import { isVideoUrl, normalizeColorInput } from "@/lib/util/util";

type SettingsTab = "profile" | "privacy" | "widgets" | "preferences" | "account";

type SettingsProfile = {
    name: string | null;
    email: string | null;
    image: string | null;
    background: string | null;
    bio: string | null;
    profileColor: string | null;
    accentColor: string | null;
    privacy: string;
    socials: string | null;
    preferences: string | null;
    widgets: string | null;
    hasPassword: boolean;
    linkedProviders: string[];
    createdAt: string;
    updatedAt: string;
};

const inputClass = "bg-bg p-1 rounded mt-1 border border-border outline-none";
const wideInputClass = `${inputClass} w-full`;

function SocialPlatformLabel({ platform, kind }: { platform: string; kind: LinkType }) {
    const platformConfig = getSocialPlatform(platform, kind);

    if (!platformConfig) return <>{platform}</>;

    const Icon = platformConfig.icon;

    return (
        <span className="flex min-w-0 items-center gap-2">
            <Icon size={18} title="" aria-hidden className="shrink-0" />
            <span className="min-w-0 truncate">{platformConfig.label}</span>
        </span>
    );
}

function BackgroundPreview({ src }: { src: string }) {
    if (!src) return <ImageIcon size={24} />;

    if (isVideoUrl(src)) {
        return (
            <video
                src={src}
                className="h-full w-full object-cover object-center"
                muted
                playsInline
                preload="metadata"
            />
        );
    }

    return <Image src={src} alt="Profile background" fill sizes="160px" className="object-cover object-center" />;
}

function ColorField({ name, value, onChange, placeholder, label }: { name: string; value: string; onChange: (value: string) => void; placeholder: string; label: string }) {
    const pickerValue = normalizeColorInput(value || placeholder);

    return (
        <div className="flex flex-col">
            <div className="flex flex-row items-center gap-2">
                <label className="relative h-8 w-8 shrink-0 cursor-pointer overflow-hidden rounded border border-border bg-bg transition-colors hover:border-primary" title={`Pick ${label.toLowerCase()}`} aria-label={`Pick ${label.toLowerCase()}`}>
                    <span className="block h-full w-full" style={{ background: value || "transparent" }} />
                    <input
                        type="color"
                        value={pickerValue}
                        onChange={(event) => onChange(event.target.value.toUpperCase())}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                </label>
                <input name={name} value={value} onChange={(event) => onChange(event.target.value)} className={inputClass} type="text" placeholder={placeholder} />
            </div>
            <p className="ml-10 text-[0.7rem] text-text-muted">{label}</p>
        </div>
    );
}

function MediaModal({ title, value, onClose, onSave }: { title: string; value: string; onClose: () => void; onSave: (value: string) => void }) {
    const [draft, setDraft] = useState(value);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay px-4">
            <div className="w-full max-w-md rounded bg-bg-secondary p-5 shadow-main">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold">{title}</h3>
                    <button type="button" onClick={onClose} className="cursor-pointer rounded p-1 text-text-muted hover:text-primary" aria-label="Close">
                        <X size={18} />
                    </button>
                </div>
                <div className="flex flex-col gap-3">
                    <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="https://..." className={wideInputClass} />
                </div>
                <div className="mt-5 flex justify-end gap-2">
                    <GhostButton type="button" onClick={onClose}>Cancel</GhostButton>
                    <PrimaryButton type="button" onClick={() => onSave(draft)}>Apply</PrimaryButton>
                </div>
            </div>
        </div>
    );
}

export default function SettingsPanel({ activeTab, profile }: { activeTab: SettingsTab; profile: SettingsProfile }) {
    const [dirty, setDirty] = useState(false);
    const [name, setName] = useState(profile.name ?? "");
    const [bio, setBio] = useState(profile.bio ?? "");
    const [image, setImage] = useState(profile.image ?? "");
    const [background, setBackground] = useState(profile.background ?? "");
    const [profileColor, setProfileColor] = useState(profile.profileColor ?? "");
    const [accentColor, setAccentColor] = useState(profile.accentColor ?? "");
    const [privacy, setPrivacy] = useState(profile.privacy);
    const [socials, setSocials] = useState(() => parseSocials(profile.socials));
    const [socialSelector, setSocialSelector] = useState("");
    const [preferences, setPreferences] = useState(profile.preferences ?? "");
    const [email, setEmail] = useState(profile.email ?? "");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [widgets, setWidgets] = useState(() => parseWidgets(profile.widgets));
    const [modal, setModal] = useState<"avatar" | "background" | null>(null);
    const action = updateUserSettings.bind(null, activeTab);
    const widgetPayload = useMemo(() => serializeWidgets(widgets), [widgets]);
    const socialPayload = useMemo(() => serializeSocials(socials), [socials]);

    function markDirty() {
        setDirty(true);
    }

    function updateWidget(id: string, patch: Partial<Widget>) {
        setWidgets((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
        markDirty();
    }

    function moveWidget(id: string, direction: -1 | 1) {
        setWidgets((items) => {
            const index = items.findIndex((item) => item.id === id);
            const targetIndex = index + direction;

            if (index < 0 || targetIndex < 0 || targetIndex >= items.length) return items;

            const next = [...items];
            [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
            return next;
        });
        markDirty();
    }

    function updateSocial(id: string, patch: Partial<SocialLink>) {
        setSocials((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
        markDirty();
    }

    function moveSocial(id: string, direction: -1 | 1) {
        setSocials((items) => {
            const index = items.findIndex((item) => item.id === id);
            const targetIndex = index + direction;

            if (index < 0 || targetIndex < 0 || targetIndex >= items.length) return items;

            const next = [...items];
            [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
            return next;
        });
        markDirty();
    }

    function handlePlatformSelect(optionId: string) {
        const option = getSocialOption(optionId);

        if (!option) return;

        setSocials((items) => [...items, { id: `${Date.now()}-${option.id}`, platform: option.value, kind: option.kind, value: "" }]);
        markDirty();
    }

    return (
        <form action={action} onChange={markDirty} className="flex flex-col gap-5">
            {activeTab === "profile" && (
                <div className="flex flex-col gap-5">
                    <input type="hidden" name="image" value={image} />
                    <input type="hidden" name="background" value={background} />
                    <input type="hidden" name="socials" value={socialPayload} />
                    <div>
                        <h3>Username</h3>
                        <input name="name" type="text" value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
                        <p className="ml-1.5 text-[0.7rem] text-text-muted">You can change your name once every 30 days.</p>
                    </div>
                    <div>
                        <h3>Bio</h3>
                        <textarea name="bio" value={bio} onChange={(event) => setBio(event.target.value)} maxLength={150} className={`${wideInputClass} min-h-24`} />
                        <p className="ml-1.5 text-[0.7rem] text-text-muted">Maximum of 150 characters.</p>
                    </div>
                    <div>
                        <div className="flex flex-col gap-8 md:flex-row md:gap-28">
                            <div className="flex flex-col">
                                <h3>Avatar</h3>
                                <div className="mt-1 flex flex-row items-center gap-8">
                                    <div className="relative flex aspect-square h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg md:h-16 md:w-16">
                                        {image ? <Image src={image} alt="Profile avatar" fill sizes="80px" className="object-cover object-center" /> : <ImageIcon size={24} />}
                                    </div>
                                    <GhostButton type="button" onClick={() => setModal("avatar")} className="h-8 w-20 text-sm">Change</GhostButton>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <h3>Background</h3>
                                <div className="mt-1 flex flex-row items-center gap-8">
                                    <div className="relative flex h-12 w-24 shrink-0 items-center justify-center overflow-hidden bg-bg md:h-16 md:w-32">
                                        <BackgroundPreview src={background} />
                                    </div>
                                    <GhostButton type="button" onClick={() => setModal("background")} className="h-8 w-20 text-sm">Change</GhostButton>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3>Colors</h3>
                        <div className="flex flex-col gap-4 md:flex-row md:gap-10">
                            <ColorField name="profileColor" value={profileColor} onChange={setProfileColor} placeholder="#7B5CDB" label="Primary color" />
                            <ColorField name="accentColor" value={accentColor} onChange={setAccentColor} placeholder="#B8842F" label="Accent color" />
                        </div>
                    </div>
                    <div>
                        <h3>Socials</h3>
                        <select id="socialSelector" value={socialSelector} onChange={(event) => {
                            const val = event.target.value;
                            handlePlatformSelect(val);
                            setSocialSelector("");
                        }} className={inputClass}>
                            <option value="" disabled>Add platform</option>
                            {SOCIALPLATFORMS.map((platform) => (
                                <option key={platform.id} value={platform.id}>{platform.label}</option>
                            ))}
                        </select>
                        {socials.length === 0 ? (
                            <p className="mt-2 text-sm text-text-muted">No social links added.</p>
                        ) : (
                            <div className="mt-3 flex flex-col gap-2">
                                {socials.map((social, index) => (
                                    <div key={social.id} className="grid gap-2 rounded md:grid-cols-[9rem_minmax(0,1fr)_auto] md:items-center">
                                        <span className="min-w-0 text-sm font-bold text-text-muted">
                                            <SocialPlatformLabel platform={social.platform} kind={social.kind} />
                                        </span>
                                        <label>
                                            <span className="sr-only">{getSocialPlatformLabel(social.platform, social.kind)} {social.kind === LinkType.COPY ? "username" : "link"}</span>
                                            <input type={social.kind === LinkType.COPY ? "text" : "url"} value={social.value} onChange={(event) => updateSocial(social.id, { value: event.target.value })} placeholder={getSocialPlaceholder(social.platform, social.kind)} className={wideInputClass} />
                                        </label>
                                        <div className="flex items-center gap-1">
                                            <button type="button" onClick={() => moveSocial(social.id, -1)} disabled={index === 0} className="cursor-pointer rounded p-2 text-text-muted hover:text-primary disabled:cursor-not-allowed disabled:opacity-40" aria-label="Move social link up">
                                                <ChevronUp size={18} />
                                            </button>
                                            <button type="button" onClick={() => moveSocial(social.id, 1)} disabled={index === socials.length - 1} className="cursor-pointer rounded p-2 text-text-muted hover:text-primary disabled:cursor-not-allowed disabled:opacity-40" aria-label="Move social link down">
                                                <ChevronDown size={18} />
                                            </button>
                                            <button type="button" onClick={() => {
                                                setSocials((items) => items.filter((item) => item.id !== social.id));
                                                markDirty();
                                            }} className="cursor-pointer rounded p-2 text-text-muted hover:text-error" aria-label="Remove social link">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === "privacy" && (
                <div>
                    <h3>Profile visibility</h3>
                    <select name="privacy" value={privacy} onChange={(event) => setPrivacy(event.target.value)} className={inputClass}>
                        <option value="public">Public</option>
                        <option value="followers">Followers only</option>
                        <option value="private">Private</option>
                    </select>
                </div>
            )}

            {activeTab === "widgets" && (
                <div className="flex flex-col gap-4">
                    <input type="hidden" name="widgets" value={widgetPayload} />
                    <div className="flex flex-wrap gap-2">
                        {([WidgetType.GAMELIST, WidgetType.MARKDOWN, WidgetType.STATS]).map((type) => (
                            <GhostButton key={type} type="button" onClick={() => {
                                setWidgets((items) => [...items, {
                                    id: `${Date.now()}-${type}`,
                                    type,
                                    title: type === WidgetType.GAMELIST ? "Game list" : "",
                                    visible: true,
                                    content: "",
                                    stats: type === WidgetType.STATS ? ["played", "completed", "backlog"] : [],
                                    games: [],
                                }]);
                                markDirty();
                            }}>
                                <Plus size={16} />
                                {type === WidgetType.GAMELIST ? "Game list" : type === WidgetType.STATS ? "Stats" : "Markdown"}
                            </GhostButton>
                        ))}
                    </div>
                    {widgets.length === 0 ? (
                        <p className="text-sm text-text-muted">No widgets configured.</p>
                    ) : widgets.map((widget, index) => (
                        <WidgetEditor
                            key={widget.id}
                            widget={widget}
                            index={index}
                            total={widgets.length}
                            onChange={(patch) => updateWidget(widget.id, patch)}
                            onRemove={() => {
                                setWidgets((items) => items.filter((item) => item.id !== widget.id));
                                markDirty();
                            }}
                            onMoveUp={() => moveWidget(widget.id, -1)}
                            onMoveDown={() => moveWidget(widget.id, 1)}
                        />
                    ))}
                </div>
            )}

            {activeTab === "preferences" && (
                <div>
                    <h3>Website preferences</h3>
                    <textarea name="preferences" value={preferences} onChange={(event) => setPreferences(event.target.value)} className={`${wideInputClass} min-h-28`} placeholder="Theme, notifications, default library view..." />
                </div>
            )}

            {activeTab === "account" && (
                <div className="flex flex-col gap-5">
                    <div>
                        <h3>Email</h3>
                        <div className="relative max-w-md">
                            <input name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={`${wideInputClass} pl-2`} />
                        </div>
                    </div>

                    <div>
                        <h3>Password</h3>
                        <div className="mt-1 grid gap-3 md:grid-cols-3">
                            {profile.hasPassword && (
                                <label className="flex flex-col">
                                    <span className="text-sm text-text-muted">Current password</span>
                                    <span className="relative">
                                        <input name="currentPassword" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className={`${wideInputClass} pl-2`} autoComplete="current-password" />
                                    </span>
                                </label>
                            )}
                            <label className="flex flex-col">
                                <span className="text-sm text-text-muted">{profile.hasPassword ? "New password" : "Set password"}</span>
                                <span className="relative">
                                    <input name="newPassword" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className={`${wideInputClass} pl-2`} autoComplete="new-password" />
                                </span>
                            </label>
                            <label className="flex flex-col">
                                <span className="text-sm text-text-muted">Confirm password</span>
                                <span className="relative">
                                    <input name="passwordConfirm" type="password" value={passwordConfirm} onChange={(event) => setPasswordConfirm(event.target.value)} className={`${wideInputClass} pl-2`} autoComplete="new-password" />
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
            )}

            <div className="bottom-4 z-20 mt-5 flex justify-end">
                <div className="flex gap-2 rounded p-2">
                    <PrimaryButton type="submit">Save</PrimaryButton>
                </div>
            </div>

            {modal === "avatar" && <MediaModal title="Avatar" value={image} onClose={() => setModal(null)} onSave={(value) => { setImage(value); setModal(null); markDirty(); }} />}
            {modal === "background" && <MediaModal title="Background" value={background} onClose={() => setModal(null)} onSave={(value) => { setBackground(value); setModal(null); markDirty(); }} />}
        </form>
    );
}
