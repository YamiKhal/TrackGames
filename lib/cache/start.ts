import { cachedResources } from "./resources";

let started = false;

export async function startCacheJobs() {
    if (started) return;
    started = true;

    console.log("[Cache] Jobs started");

    for (const resource of cachedResources) {
        await resource.hydrateFromDisk();

        resource.refresh().catch(console.error);

        setInterval(() => {
            resource.refresh().catch(console.error);
        }, resource.ttlMs);
    }
}