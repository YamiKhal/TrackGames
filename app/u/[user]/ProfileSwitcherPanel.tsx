"use client";

import SubTabs from "@/app/components/layout/SubTabs";
import { ReactNode, useState } from "react";
import { useRouter } from 'next/navigation'

export default function ProfileSwitcherPanel({user, children}: {user: string, children: ReactNode}) {
    const router = useRouter();

    const tabs = [
        { id: "profile" as const, label: "Profile" },
        { id: "activity" as const, label: "Activity" },
        { id: "playlists" as const, label: "Playlists" },
    ];

    function setTab(tab: any) {
        router.push(`/u/${user}?tab=${tab}`);
        setActiveTab(tab);
    }

    const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? "profile");

    return (
        <SubTabs tabs={tabs} active={activeTab} setter={setTab}>
            {children}
        </SubTabs>
    )
}