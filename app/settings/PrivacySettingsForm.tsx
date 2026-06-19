"use client";

import { Checkbox, Field, Select } from "@/app/components/ui/Inputs";
import type { User } from "@/lib/types";
import { useState } from "react";

export default function PrivacySettingsForm({ profile }: { profile: User }) {
    const [profilePrivacy, setProfilePrivacy] = useState(profile.privacy);
    const [libraryPrivacy, setLibraryPrivacy] = useState(profile.libraryPrivacy);
    const [activityPrivacy, setActivityPrivacy] = useState(profile.activityPrivacy);
    const [playlistPrivacy, setPlaylistPrivacy] = useState(profile.playlistPrivacy);

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Field label="Profile visibility">
                <Select name="privacy" value={profilePrivacy} onChange={(event) => setProfilePrivacy(event.target.value)} className="w-full">
                    <option value="public">Public</option>
                    <option value="followers">Followers only</option>
                    <option value="private">Private</option>
                </Select>
            </Field>
            <Field label="Library visibility">
                <Select name="libraryPrivacy" value={libraryPrivacy} onChange={(event) => setLibraryPrivacy(event.target.value)} className="w-full">
                    <option value="public">Public</option>
                    <option value="followers">Followers only</option>
                    <option value="private">Private</option>
                </Select>
            </Field>
            <Field label="Playlist default visibility">
                <Select name="playlistPrivacy" value={playlistPrivacy} onChange={(event) => setPlaylistPrivacy(event.target.value)} className="w-full">
                    <option value="public">Public</option>
                    <option value="followers">Followers only</option>
                    <option value="private">Private</option>
                </Select>
            </Field>
            <Field label="Activity visibility">
                <Select name="activityPrivacy" value={activityPrivacy} onChange={(event) => setActivityPrivacy(event.target.value)} className="w-full">
                    <option value="public">Public</option>
                    <option value="followers">Followers only</option>
                    <option value="private">Private</option>
                </Select>
            </Field>
            <label className="flex items-center gap-2 text-sm font-bold text-text-muted md:col-span-2">
                <Checkbox name="commentsHidden" defaultChecked={profile.commentsHidden} />
                Hide comments on profile
            </label>
        </div>
    );
}
