"use client";

import { Field, Select } from "@/app/components/ui/Inputs";
import { useState } from "react";

export default function PrivacySettingsForm({ privacy }: { privacy: string }) {
    const [value, setValue] = useState(privacy);

    return (
        <Field label="Profile visibility">
            <Select name="privacy" value={value} onChange={(event) => setValue(event.target.value)}>
                <option value="public">Public</option>
                <option value="followers">Followers only</option>
                <option value="private">Private</option>
            </Select>
        </Field>
    );
}
