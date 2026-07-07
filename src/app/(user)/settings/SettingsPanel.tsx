"use client";

import { useState, useTransition } from "react";
import AccountSettingsForm from "@/app/(user)/settings/AccountSettingsForm";
import DataSettingsForm from "@/app/(user)/settings/DataSettingsForm";
import FeedbackSettingsForm from "@/app/(user)/settings/FeedbackSettingsForm";
import ImportSettingsForm from "@/app/(user)/settings/ImportSettingsForm";
import PreferencesSettingsForm from "@/app/(user)/settings/PreferencesSettingsForm";
import PrivacySettingsForm from "@/app/(user)/settings/PrivacySettingsForm";
import ProfileSettingsForm from "@/app/(user)/settings/ProfileSettingsForm";
import { SaveBar } from "@/app/(user)/settings/SettingsShared";
import WidgetsSettingsForm from "@/app/(user)/settings/WidgetsSettingsForm";
import PlansPanel from "@/components/doc/PlansPanel";
import { updateUserSettings } from "@/lib/actions/account/settings";
import { type SecuredUser } from "@/lib/data/social/user";

type SettingsPanelProps = Readonly<{ activeTab: string; profile: SecuredUser; linkedProviders: string[]; hasPassword: boolean }>;

export default function SettingsPanel({ activeTab, profile, linkedProviders, hasPassword }: SettingsPanelProps) {
	const [error, setError] = useState("");
	const [saved, setSaved] = useState(false);
	const [pending, startTransition] = useTransition();

	if (activeTab === "backing") {
		return <PlansPanel showHeader={false} />;
	}

	if (activeTab === "feedback") {
		return <FeedbackSettingsForm />;
	}

	if (activeTab === "data") {
		return <DataSettingsForm profile={profile} />;
	}

	function save(formData: FormData) {
		setError("");
		setSaved(false);
		startTransition(async () => {
			const response = await updateUserSettings(activeTab, formData);

			if (response?.error) {
				setError(response.error);
				return;
			}

			setSaved(true);
		});
	}

	return (
		<form action={save} className="flex flex-col gap-5">
			{saved && <div className="rounded border border-success/40 bg-success/10 px-4 py-3 text-sm font-bold text-success">Settings saved.</div>}
			{error && <div className="rounded border border-error/40 bg-error/10 px-4 py-3 text-sm font-bold text-error">{error}</div>}

			{activeTab === "profile" && <ProfileSettingsForm profile={profile} />}
			{activeTab === "privacy" && <PrivacySettingsForm profile={profile} />}
			{activeTab === "widgets" && <WidgetsSettingsForm profile={profile} />}
			{activeTab === "preferences" && <PreferencesSettingsForm profile={profile} />}
			{activeTab === "import" && <ImportSettingsForm />}
			{activeTab === "account" && <AccountSettingsForm profile={profile} linkedProviders={linkedProviders} hasPassword={hasPassword} />}

			<SaveBar pending={pending} />
		</form>
	);
}
