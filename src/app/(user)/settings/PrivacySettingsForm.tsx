"use client";

import { useState } from "react";
import { Select } from "@/components/ui/control/Select";
import { type SecuredUser } from "@/lib/data/social/user";

export default function PrivacySettingsForm({ profile }: Readonly<{ profile: SecuredUser }>) {
	const [profilePrivacy, setProfilePrivacy] = useState(profile.privacy);
	const [libraryPrivacy, setLibraryPrivacy] = useState(profile.libraryPrivacy);
	const [activityPrivacy, setActivityPrivacy] = useState(profile.activityPrivacy);
	const [playlistPrivacy, setPlaylistPrivacy] = useState(profile.playlistPrivacy);

	return (
		<div className="grid gap-4 md:grid-cols-2">
			<Select label="Profile visibility" name="privacy" value={profilePrivacy} onChange={(event) => setProfilePrivacy(event.target.value)} className="w-full">
				<option value="public">Public</option>
				<option value="followers">Followers only</option>
				<option value="private">Private</option>
			</Select>
			<Select label="Library visibility" name="libraryPrivacy" value={libraryPrivacy} onChange={(event) => setLibraryPrivacy(event.target.value)} className="w-full">
				<option value="public">Public</option>
				<option value="followers">Followers only</option>
				<option value="private">Private</option>
			</Select>
			<Select
				label="Playlist default visibility"
				name="playlistPrivacy"
				value={playlistPrivacy}
				onChange={(event) => setPlaylistPrivacy(event.target.value)}
				className="w-full"
			>
				<option value="public">Public</option>
				<option value="followers">Followers only</option>
				<option value="private">Private</option>
			</Select>
			<Select label="Activity visibility" name="activityPrivacy" value={activityPrivacy} onChange={(event) => setActivityPrivacy(event.target.value)} className="w-full">
				<option value="public">Public</option>
				<option value="followers">Followers only</option>
				<option value="private">Private</option>
			</Select>
			<Select label="Comments" name="commentsHidden" defaultValue={profile.commentsHidden ? "true" : "false"} className="w-full">
				<option value="false">Enabled</option>
				<option value="true">Disabled</option>
			</Select>
		</div>
	);
}
