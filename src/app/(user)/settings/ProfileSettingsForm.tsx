"use client";

import { type SetStateAction, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { MediaModal } from "@/app/(user)/settings/SettingsShared";
import { GhostButton } from "@/components/ui/control/Button";
import { ColorPicker } from "@/components/ui/control/ColorPicker";
import { Select } from "@/components/ui/control/Select";
import { TextArea } from "@/components/ui/control/TextArea";
import { TextInput } from "@/components/ui/control/TextInput";
import { SOCIAL_PLATFORM_ICONS } from "@/components/ui/SVG";
import AvatarPreview from "@/components/user/AvatarView";
import BackgroundView from "@/components/user/BackgroundView";
import { SOCIAL_PLATFORMS } from "@/lib/constants";
import { type SecuredUser } from "@/lib/data/social/user";
import type { SocialLink } from "@/lib/types";
import { LinkType } from "@/lib/types";
import { getSocialOption, getSocialPlaceholder, getSocialPlatform, getSocialPlatformLabel, parseSocials, serializeSocials } from "@/lib/util/parse/socials";

type SocialLinksEditorProps = Readonly<{
	socials: SocialLink[];
	update: (id: string, patch: Partial<SocialLink>) => void;
	move: (id: string, direction: -1 | 1) => void;
	setter: (value: SetStateAction<SocialLink[]>) => void;
}>;

type SocialLinkRowProps = Readonly<{
	social: SocialLink;
	isFirst: boolean;
	isLast: boolean;
	update: SocialLinksEditorProps["update"];
	move: SocialLinksEditorProps["move"];
	setter: SocialLinksEditorProps["setter"];
}>;

export default function ProfileSettingsForm({ profile }: Readonly<{ profile: SecuredUser }>) {
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
		setSocials((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
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
			<TextInput
				label="Username"
				hint="You can change your name once every 30 days."
				name="name"
				type="text"
				value={name}
				onChange={(event) => setName(event.target.value)}
				maxLength={32}
				pattern="[A-Za-z0-9_\-]+"
				className="w-auto"
			/>
			<TextArea label="Bio" hint="Maximum of 150 characters." name="bio" value={bio} onChange={(event) => setBio(event.target.value)} maxLength={150} className="min-h-24" />
			<div>
				<div className="flex flex-col gap-8 md:flex-row md:gap-28">
					<div className="flex flex-col">
						<h3>Avatar</h3>
						<div className="mt-1 flex flex-row items-center gap-8">
							<AvatarPreview image={image} size={12} />
							<GhostButton variant="outline" type="button" onClick={() => setModal("avatar")} className="h-8 w-20 text-sm">
								Change
							</GhostButton>
						</div>
					</div>
					<div className="flex flex-col">
						<h3>Background</h3>
						<div className="mt-1 flex flex-row items-center gap-8">
							<BackgroundView src={background} size={24} mdSize={32} alt="Profile background" />
							<GhostButton variant="outline" type="button" onClick={() => setModal("background")} className="h-8 w-20 text-sm">
								Change
							</GhostButton>
						</div>
					</div>
				</div>
			</div>
			<div>
				<h3>Colors</h3>
				<div className="flex flex-col gap-4 md:flex-row md:gap-10">
					<ColorPicker
						name="profileColor"
						value={profileColor}
						onChange={(event) => setProfileColor(event.target.value)}
						defaultValue="#7B5CDB"
						label="Primary color"
						swatchClassName="h-8 w-8"
					/>
					<ColorPicker
						name="accentColor"
						value={accentColor}
						onChange={(event) => setAccentColor(event.target.value)}
						defaultValue="#B8842F"
						label="Accent color"
						swatchClassName="h-8 w-8"
					/>
				</div>
			</div>
			<div>
				<h3>Socials</h3>
				<Select
					id="socialSelector"
					value={socialSelector}
					onChange={(event) => {
						const val = event.target.value;
						handlePlatformSelect(val);
						setSocialSelector("");
					}}
				>
					<option value="" disabled>
						Add platform
					</option>
					{SOCIAL_PLATFORMS.map((platform) => (
						<option key={platform.id} value={platform.id}>
							{platform.label}
						</option>
					))}
				</Select>
				{socials.length === 0 ? (
					<p className="mt-2 text-sm text-text-muted">No social links added.</p>
				) : (
					<SocialLinksEditor socials={socials} update={updateSocial} move={moveSocial} setter={setSocials} />
				)}
			</div>

			<MediaModal
				open={modal === "avatar"}
				title="Avatar"
				value={image}
				onClose={() => setModal(null)}
				onSave={(value) => {
					setImage(value);
					setModal(null);
				}}
			/>
			<MediaModal
				open={modal === "background"}
				title="Background"
				value={background}
				onClose={() => setModal(null)}
				onSave={(value) => {
					setBackground(value);
					setModal(null);
				}}
			/>
		</div>
	);
}

function SocialLinksEditor({ socials, update, move, setter }: SocialLinksEditorProps) {
	return (
		<div className="mt-3 flex flex-col gap-2">
			{socials.map((social, index) => (
				<SocialLinkRow key={social.id} social={social} isFirst={index === 0} isLast={index === socials.length - 1} update={update} move={move} setter={setter} />
			))}
		</div>
	);
}

function SocialLinkRow({ social, isFirst, isLast, update, move, setter }: SocialLinkRowProps) {
	return (
		<div className="grid gap-2 rounded md:grid-cols-[9rem_minmax(0,1fr)_auto] md:items-center">
			<span className="min-w-0 text-sm font-bold text-text-muted">
				<SocialPlatformLabel platform={social.platform} kind={social.kind} />
			</span>
			<label>
				<span className="sr-only">
					{getSocialPlatformLabel(social.platform, social.kind)} {social.kind === LinkType.COPY ? "username" : "link"}
				</span>
				<TextInput
					type={social.kind === LinkType.COPY ? "text" : "url"}
					value={social.value}
					onChange={(event) => update(social.id, { value: event.target.value })}
					placeholder={getSocialPlaceholder(social.platform, social.kind)}
				/>
			</label>
			<div className="flex items-center gap-1">
				<button
					type="button"
					onClick={() => move(social.id, -1)}
					disabled={isFirst}
					className="cursor-pointer rounded p-2 text-text-muted hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
					aria-label="Move social link up"
				>
					<ChevronUp size={18} />
				</button>
				<button
					type="button"
					onClick={() => move(social.id, 1)}
					disabled={isLast}
					className="cursor-pointer rounded p-2 text-text-muted hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
					aria-label="Move social link down"
				>
					<ChevronDown size={18} />
				</button>
				<button
					type="button"
					onClick={() => setter((items) => items.filter((item) => item.id !== social.id))}
					className="cursor-pointer rounded p-2 text-text-muted hover:text-error"
					aria-label="Remove social link"
				>
					<Trash2 size={18} />
				</button>
			</div>
		</div>
	);
}

function SocialPlatformLabel({ platform, kind }: Readonly<{ platform: string; kind: LinkType }>) {
	const platformConfig = getSocialPlatform(platform, kind);

	if (!platformConfig) return <>{platform}</>;

	const Icon = SOCIAL_PLATFORM_ICONS[platformConfig.id as keyof typeof SOCIAL_PLATFORM_ICONS];

	return (
		<span className="flex min-w-0 items-center gap-2">
			<Icon size={18} title="" aria-hidden className="shrink-0" />
			<span className="min-w-0 truncate">{platformConfig.label}</span>
		</span>
	);
}
