"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/control/Checkbox";
import { ColorPicker } from "@/components/ui/control/ColorPicker";
import { Select } from "@/components/ui/control/Select";
import { type SecuredUser } from "@/lib/data/social/user";

export default function PreferencesSettingsForm({ profile }: Readonly<{ profile: SecuredUser }>) {
	const [themeMode, setThemeMode] = useState(profile.siteThemeMode);

	return (
		<div className="flex flex-col gap-6">
			<div className="grid gap-4 md:grid-cols-3">
				<Select label="Default library status" name="defaultGameListStatus" defaultValue={profile.defaultGameListStatus} className="w-full">
					<option value="all">All statuses</option>
					<option value="PLAYING">Playing</option>
					<option value="COMPLETED">Completed</option>
					<option value="BACKLOG">Backlog</option>
					<option value="PAUSED">Paused</option>
					<option value="DROPPED">Dropped</option>
					<option value="WISHLIST">Wishlist</option>
				</Select>
				<Select label="Default library sort" name="defaultGameListSort" defaultValue={profile.defaultGameListSort} className="w-full">
					<option value="added">Recently added</option>
					<option value="rating">Rating</option>
					<option value="time">Time played</option>
					<option value="name">Name</option>
					<option value="release">Release date</option>
					<option value="notes">Has notes</option>
				</Select>
				<Select label="Default library view" name="defaultGameListView" defaultValue={profile.defaultGameListView} className="w-full">
					<option value="grid">Grid</option>
					<option value="list">List</option>
				</Select>
			</div>

			<Select label="Default activity filter" name="defaultActivityFilter" defaultValue={profile.defaultActivityFilter} className="w-full md:w-64">
				<option value="all">All</option>
				<option value="logs">Game logs</option>
				<option value="games">Games</option>
				<option value="playlists">Playlists</option>
				<option value="comments">Comments</option>
				<option value="social">Social</option>
			</Select>

			<div>
				<h3>Site theme</h3>
				<div className="mt-1 grid gap-4 md:grid-cols-3">
					<Select label="Source" name="siteThemeMode" value={themeMode} onChange={(event) => setThemeMode(event.target.value)} className="w-full">
						<option value="default">Default colors</option>
						<option value="profile">Use profile colors</option>
						<option value="custom">Custom colors</option>
					</Select>
					{themeMode === "custom" && (
						<>
							<ColorPicker label="Theme" name="siteThemeColor" defaultValue={profile.siteThemeColor ?? "#7b5cdb"} />
							<ColorPicker label="Accent" name="siteAccentColor" defaultValue={profile.siteAccentColor ?? "#b8842f"} />
						</>
					)}
				</div>
			</div>

			<div className="flex flex-col gap-2">
				<h3>Display</h3>
				<input type="hidden" name="hideCommentsEverywhere" value="false" />
				<Checkbox label="Hide comments across the website" name="hideCommentsEverywhere" value="true" defaultChecked={profile.hideCommentsEverywhere} />
			</div>

			<div>
				<h3>Notifications</h3>
				<div className="mt-2 grid gap-2 md:grid-cols-2">
					{[
						["notifyCommentReplies", "Comment replies", profile.notifyCommentReplies],
						["notifyProfileComments", "Profile comments", profile.notifyProfileComments],
						["notifyLikes", "Likes", profile.notifyLikes],
						["notifyFollows", "New followers", profile.notifyFollows],
						["notifyFollowerLists", "Followed users creating playlists", profile.notifyFollowerLists],
						["notifyBadges", "Badges", profile.notifyBadges],
					].map(([name, label, checked]) => (
						<div key={String(name)}>
							<input type="hidden" name={String(name)} value="false" />
							<Checkbox label={label} name={String(name)} value="true" defaultChecked={Boolean(checked)} />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
