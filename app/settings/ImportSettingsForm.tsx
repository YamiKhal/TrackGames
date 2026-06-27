"use client";

import { GhostButton, PrimaryButton } from "@/app/components/ui/Buttons";
import { Checkbox, Input } from "@/app/components/ui/Inputs";
import { exportTgLibrary, getSteamProfileImportPreview, importSteamLibrary, importTgLibrary } from "@/lib/actions/import";
import Image from "next/image";
import { useState, useTransition } from "react";

export default function ImportSettingsForm() {
    const [steamId, setSteamId] = useState("");
    const [profile, setProfile] = useState<{ steamId: string; personaname: string; profileurl: string; avatar: string; } | null>(null);
    const [skipImportedLogsRecap, setSkipImportedLogsRecap] = useState(true);
    const [error, setError] = useState("");
    const [result, setResult] = useState<{ imported: number; failed: string[] } | null>(null);
    const [tgError, setTgError] = useState("");
    const [tgResult, setTgResult] = useState<{ imported: number; logs: number; skipped: number } | null>(null);
    const [pending, startTransition] = useTransition();
    const failedUrl = result?.failed.length ? `data:text/plain;charset=utf-8,${encodeURIComponent(result.failed.join("\n"))}` : "";

    function previewProfile() {
        setError("");
        setResult(null);
        startTransition(async () => {
            const response = await getSteamProfileImportPreview(steamId);

            if (response.error) {
                setProfile(null);
                setError(response.error);
                return;
            }

            setProfile({
                steamId: response.steamId ?? "",
                personaname: response.personaname ?? "",
                profileurl: response.profileurl ?? "",
                avatar: response.avatar ?? "",
            });
        });
    }

    function importLibrary() {
        if (!profile) return;

        setError("");
        startTransition(async () => {
            try {
                setResult(await importSteamLibrary(profile.steamId, skipImportedLogsRecap));
            } catch {
                setError("Steam import failed. Check your profile ID and try again.");
            }
        });
    }

    function exportLibrary() {
        setTgError("");
        setTgResult(null);
        startTransition(async () => {
            try {
                const backup = await exportTgLibrary();
                const url = URL.createObjectURL(new Blob([backup.data], { type: "application/json" }));
                const link = document.createElement("a");
                link.href = url;
                link.download = backup.filename;
                link.click();
                URL.revokeObjectURL(url);
            } catch {
                setTgError("Export failed. Try again in a moment.");
            }
        });
    }

    async function importLibraryBackup(file: File | undefined) {
        if (!file) return;

        setTgError("");
        setTgResult(null);

        if (!file.name.toLowerCase().endsWith(".tg")) {
            setTgError("Choose a .tg file.");
            return;
        }

        const contents = await file.text();
        startTransition(async () => {
            try {
                setTgResult(await importTgLibrary(contents));
            } catch {
                setTgError("Import failed. Make sure this is a valid .tg backup.");
            }
        });
    }

    return (
        <div className="flex flex-col gap-6">
            <section>
                <div className="mb-4">
                    <h3 className="text-lg font-bold">Steam Library</h3>
                </div>

                <div className="flex max-w-xl flex-col gap-3">
                    <label className="text-sm text-text-muted">
                        <div className="flex flex-row justify-between">
                            <p className="font-bold">
                                Steam profile ID
                            </p>

                            <a href="https://steamdb.info/calculator/" target="_blank" rel="noreferrer" className="text-sm text-primary hover:text-primary-hover">
                                Get your profile ID
                            </a>
                        </div>
                        <Input value={steamId} onChange={(event) => setSteamId(event.target.value)} placeholder="7656119..." />
                    </label>
                    <div className="flex flex-row gap-2">
                        <GhostButton type="button" onClick={previewProfile} disabled={pending || !steamId.trim()}>
                            {pending ? "Checking..." : "Check profile"}
                        </GhostButton>
                    </div>
                </div>

                {error && <p className="mt-4 rounded border border-error/40 bg-error/10 p-3 text-sm font-bold text-error">{error}</p>}

                {profile && !result && (
                    <div className="mt-5 rounded border border-warning/40 bg-bg/80 p-4">
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-row items-start gap-4">
                                {profile.avatar && (
                                    <div className="relative h-24 w-24 shrink-0 rounded overflow-hidden">
                                        <Image src={profile.avatar} alt="Steam Image" fill sizes="100px" className="object-cover" />
                                    </div>
                                )}
                                <div>
                                    <p className="font-bold text-text">Import games from profile <a href={profile.profileurl} target="_blank" className="bg-bg p-1 text-secondary">{profile.personaname}</a>?</p>
                                    <p className="mt-1 text-sm text-text-muted">Importing a Steam library will add matched games and only create logs for new playtime since your current total.</p>
                                </div>
                            </div>
                            <label className="flex cursor-pointer items-start gap-3 rounded border border-border bg-bg/60 p-3 text-sm text-text-muted">
                                <Checkbox
                                    checked={skipImportedLogsRecap}
                                    onChange={(event) => setSkipImportedLogsRecap(event.target.checked)}
                                    className="mt-0.5"
                                />
                                <span>
                                    <span className="block font-bold text-text">Skip imported logs in recaps</span>
                                    <span>Imported logs still appear in your history and count toward game time. They will only be left out of recap features.</span>
                                </span>
                            </label>
                            <PrimaryButton type="button" onClick={importLibrary} disabled={pending} className="mt-4 w-fit">
                                {pending ? "Importing..." : "Confirm import"}
                            </PrimaryButton>
                        </div>
                    </div>
                )}

                {result && (
                    <div className="mt-5 rounded border border-success/40 bg-bg/80 p-4">
                        <p className="font-bold text-success">Imported {result.imported} games.</p>
                        <p className="mt-1 text-sm text-error">* Failed to import {result.failed.length} games.</p>
                        <br />
                        <h2 className="text-text-muted">Next Steps:</h2>
                        <ul className="text-text-muted text-sm">
                            <li>- Download failed import list from below</li>
                            <li>- Review game titles and attempt searching for them in the site</li>
                            <li>- Add them to library and adjust their game time</li>
                            <li>- Game time is provided as (time), inside the downloaded list</li>
                        </ul>
                        <div className="mt-4 flex flex-row gap-2">
                            {failedUrl && (
                                <a
                                    href={failedUrl}
                                    download="failed-steam-import.txt"
                                    className="flex items-center justify-center gap-5 rounded border border-text-faint bg-primary/0 px-6 py-2 font-bold text-text-muted transition-colors hover:border-primary hover:text-primary"
                                >
                                    Download failed list
                                </a>
                            )}
                            <PrimaryButton type="button" onClick={() => {
                                setProfile(null);
                                setResult(null);
                                setSteamId("");
                            }}>
                                Finish
                            </PrimaryButton>
                        </div>
                    </div>
                )}
            </section>


            <section>
                <div className="mb-4">
                    <h3 className="text-lg font-bold">Backup File</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                    <p className="text-sm text-text-muted">Import a .tg library backup:</p>
                    <Input
                        type="file"
                        accept=".tg"
                        disabled={pending}
                        onChange={(event) => {
                            importLibraryBackup(event.target.files?.[0]);
                            event.currentTarget.value = "";
                        }}
                        className="text-sm h-max w-max"
                    />
                    <p className="text-sm text-text-muted">Export a new backup file: </p>
                    <GhostButton type="button" onClick={exportLibrary} disabled={pending} className="shrink-0 text-sm w-max">
                        {pending ? "Working..." : "Export .TG"}
                    </GhostButton>
                </div>

                {tgError && <p className="mt-4 rounded border border-error/40 bg-error/10 p-3 text-sm font-bold text-error">{tgError}</p>}
                {tgResult && (
                    <p className="mt-4 rounded border border-success/40 bg-success/10 p-3 text-sm font-bold text-success">
                        Imported {tgResult.imported} games and {tgResult.logs} logs. Skipped {tgResult.skipped}.
                    </p>
                )}
            </section>
        </div>
    );
}
