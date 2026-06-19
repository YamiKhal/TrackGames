"use client";

import { GhostButton } from "@/app/components/ui/Buttons";
import { Field, Input, Select, Textarea } from "@/app/components/ui/Inputs";
import AvatarPreview from "@/app/components/user/AvatarView";
import BackgroundView from "@/app/components/user/BackgroundView";
import { SOCIALPLATFORMS } from "@/lib/constants";
import { getSocialOption, getSocialPlaceholder, getSocialPlatform, getSocialPlatformLabel, parseSocials, serializeSocials } from "@/lib/account/socials";
import { LinkType } from "@/lib/enums";
import type { SocialLink, User } from "@/lib/types";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { ColorField, MediaModal } from "./SettingsShared";

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

export default function ProfileSettingsForm({ profile }: { profile: User; }) {
    const [name, setName] = useState(profile.name ?? "");
    const [bio, setBio] = useState(profile.bio ?? "");
    const [image, setImage] = useState(profile.image ?? "");
    const [background, setBackground] = useState(profile.background ?? "");
    const [profileColor, setProfileColor] = useState(profile.profileColor ?? "");
    const [accentColor, setAccentColor] = useState(profile.accentColor ?? "");
    const [socials, setSocials] = useState(() => parseSocials(profile.socials));
    const [socialSelector, setSocialSelector] = useState("");
    const [modal, setModal] = useState<"avatar" | "background" | null>(null);
    const socialPayload = useMemo(() => serializeSocials(socials), [socials]);

    function updateSocial(id: string, patch: Partial<SocialLink>) {
        setSocials((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
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
    }

    function handlePlatformSelect(optionId: string) {
        const option = getSocialOption(optionId);

        if (!option) return;

        setSocials((items) => [...items, { id: `${Date.now()}-${option.id}`, platform: option.value, kind: option.kind, value: "" }]);
    }

    return (
        <div className="flex flex-col gap-5">
            <input type="hidden" name="image" value={image} />
            <input type="hidden" name="background" value={background} />
            <input type="hidden" name="socials" value={socialPayload} />
            <Field label="Username" hint="You can change your name once every 30 days.">
                <Input name="name" type="text" value={name} onChange={(event) => setName(event.target.value)} className="w-auto" />
            </Field>
            <Field label="Bio" hint="Maximum of 150 characters.">
                <Textarea name="bio" value={bio} onChange={(event) => setBio(event.target.value)} maxLength={150} className="min-h-24" />
            </Field>
            <div>
                <div className="flex flex-col gap-8 md:flex-row md:gap-28">
                    <div className="flex flex-col">
                        <h3>Avatar</h3>
                        <div className="mt-1 flex flex-row items-center gap-8">
                            <AvatarPreview image={image} size={12} />
                            <GhostButton type="button" onClick={() => setModal("avatar")} className="h-8 w-20 text-sm">Change</GhostButton>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <h3>Background</h3>
                        <div className="mt-1 flex flex-row items-center gap-8">
                            <BackgroundView src={background} size={24} mdSize={32} alt="Profile background" />
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
                <Select id="socialSelector" value={socialSelector} onChange={(event) => {
                    const val = event.target.value;
                    handlePlatformSelect(val);
                    setSocialSelector("");
                }}>
                    <option value="" disabled>Add platform</option>
                    {SOCIALPLATFORMS.map((platform) => (
                        <option key={platform.id} value={platform.id}>{platform.label}</option>
                    ))}
                </Select>
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
                                    <Input type={social.kind === LinkType.COPY ? "text" : "url"} value={social.value} onChange={(event) => updateSocial(social.id, { value: event.target.value })} placeholder={getSocialPlaceholder(social.platform, social.kind)} />
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
                                    }} className="cursor-pointer rounded p-2 text-text-muted hover:text-error" aria-label="Remove social link">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <MediaModal open={modal === "avatar"} title="Avatar" value={image} onClose={() => setModal(null)} onSave={(value) => { setImage(value); setModal(null); }} />
            <MediaModal open={modal === "background"} title="Background" value={background} onClose={() => setModal(null)} onSave={(value) => { setBackground(value); setModal(null);}} />
        </div>
    );
}
