"use client";

import { updateUserSettings } from "@/lib/actions/settings";
import type { User } from "@/lib/types";
import AccountSettingsForm from "./AccountSettingsForm";
import ImportSettingsForm from "./ImportSettingsForm";
import PreferencesSettingsForm from "./PreferencesSettingsForm";
import PrivacySettingsForm from "./PrivacySettingsForm";
import ProfileSettingsForm from "./ProfileSettingsForm";
import { SaveBar } from "./SettingsShared";
import WidgetsSettingsForm from "./WidgetsSettingsForm";

export default function SettingsPanel({ activeTab, profile }: { activeTab: string; profile: User }) {
    const action = updateUserSettings.bind(null, activeTab);

    if (activeTab === "import") {
        return <ImportSettingsForm />;
    }

    return (
        <form action={action} className="flex flex-col gap-5">
            {activeTab === "profile" && <ProfileSettingsForm profile={profile} />}
            {activeTab === "privacy" && <PrivacySettingsForm privacy={profile.privacy} />}
            {activeTab === "widgets" && <WidgetsSettingsForm profile={profile} />}
            {activeTab === "preferences" && <PreferencesSettingsForm preferences={profile.preferences} />}
            {activeTab === "account" && <AccountSettingsForm profile={profile} />}

            <SaveBar />
        </form>
    );
}
