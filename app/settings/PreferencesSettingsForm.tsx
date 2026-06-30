"use client";

import { Checkbox, Field, Input, Select } from "@/app/components/ui/Inputs";
import type { User } from "@/lib/types";
import { useState } from "react";

export default function PreferencesSettingsForm({ profile }: Readonly<{ profile: User }>) {
	const [themeMode, setThemeMode] = useState(profile.siteThemeMode);

	return (
		<div className="flex flex-col gap-6">
			<div className="grid gap-4 md:grid-cols-3">
				<Field label="Default library status">
					<Select name="defaultGameListStatus" defaultValue={profile.defaultGameListStatus} className="w-full">
						<option value="all">All statuses</option>
						<option value="PLAYING">Playing</option>
						<option value="COMPLETED">Completed</option>
						<option value="BACKLOG">Backlog</option>
						<option value="PAUSED">Paused</option>
						<option value="DROPPED">Dropped</option>
						<option value="WISHLIST">Wishlist</option>
					</Select>
				</Field>
				<Field label="Default library sort">
					<Select name="defaultGameListSort" defaultValue={profile.defaultGameListSort} className="w-full">
						<option value="added">Recently added</option>
						<option value="rating">Rating</option>
						<option value="time">Time played</option>
						<option value="name">Name</option>
						<option value="release">Release date</option>
						<option value="notes">Has notes</option>
					</Select>
				</Field>
				<Field label="Default library view">
					<Select name="defaultGameListView" defaultValue={profile.defaultGameListView} className="w-full">
						<option value="grid">Grid</option>
						<option value="list">List</option>
					</Select>
				</Field>
			</div>

			<Field label="Default activity filter">
				<Select name="defaultActivityFilter" defaultValue={profile.defaultActivityFilter} className="w-full md:w-64">
					<option value="all">All</option>
					<option value="logs">Game logs</option>
					<option value="games">Games</option>
					<option value="playlists">Playlists</option>
					<option value="comments">Comments</option>
					<option value="social">Social</option>
				</Select>
			</Field>

			<div>
				<h3>Site theme</h3>
				<div className="mt-1 grid gap-4 md:grid-cols-3">
					<Field label="Source">
						<Select name="siteThemeMode" value={themeMode} onChange={(event) => setThemeMode(event.target.value)} className="w-full">
							<option value="default">Default colors</option>
							<option value="profile">Use profile colors</option>
							<option value="custom">Custom colors</option>
						</Select>
					</Field>
					{themeMode === "custom" && (
						<>
							<label className="flex flex-row items-center gap-2 text-sm font-bold text-text-muted">
								<Input name="siteThemeColor" type="color" defaultValue={profile.siteThemeColor ?? "#7b5cdb"} className="max-h-10 max-w-10" />
								Theme
							</label>
							<label className="flex flex-row items-center gap-2 text-sm font-bold text-text-muted">
								<Input name="siteAccentColor" type="color" defaultValue={profile.siteAccentColor ?? "#b8842f"} className="max-h-10 max-w-10" />
								Accent
							</label>
						</>
					)}
				</div>
			</div>

			<div className="flex flex-col gap-2">
				<h3>Display</h3>
				<input type="hidden" name="hideCommentsEverywhere" value="false" />
				<label className="flex items-center gap-2 text-sm font-bold text-text-muted">
					<Checkbox name="hideCommentsEverywhere" value="true" defaultChecked={profile.hideCommentsEverywhere} />
					Hide comments across the website
				</label>
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
						<label key={String(name)} className="flex items-center gap-2 text-sm font-bold text-text-muted">
							<input type="hidden" name={String(name)} value="false" />
							<Checkbox name={String(name)} value="true" defaultChecked={Boolean(checked)} />
							{label}
						</label>
					))}
				</div>
			</div>
		</div>
	);
}
