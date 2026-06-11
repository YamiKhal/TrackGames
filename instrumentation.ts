export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        const { startCacheJobs } = await import("@/lib/cache/start");
        startCacheJobs();
    }
}