"use client";

import { Field, Textarea } from "@/app/components/ui/Inputs";
import { useState } from "react";

export default function PreferencesSettingsForm({ preferences }: { preferences: string | null | undefined }) {
    const [value, setValue] = useState(preferences ?? "");

    return (
        <Field label="Website preferences">
            <Textarea name="preferences" value={value} onChange={(event) => setValue(event.target.value)} className="min-h-28" placeholder="Theme, notifications, default library view..." />
        </Field>
    );
}
