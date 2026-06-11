import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginClient from "./LoginClient";


export default async function Page() {
    const [session] = await Promise.all([auth()]);

    if (session) redirect("/");

    return (
        <Suspense fallback={null}>
            <main className="min-h-0 flex-1 overflow-hidden bg-bg text-text md:grid md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <section className="flex h-full min-h-0 items-center justify-center px-5 py-4 sm:px-8 lg:px-14">
                    <LoginClient />
                </section>

                <section className="relative hidden min-h-0 overflow-hidden border-l border-border md:block">
                    <div className="pointer-events-none absolute inset-0 bg-[url('/assets/games-bg-perped-rev.webp')] bg-center before:absolute before:inset-0 before:bg-bg/72 before:content-['']" />
                    <div className="pointer-events-none absolute inset-0 bg-linear-to-tr from-bg via-bg/45 to-transparent" />
                </section>
            </main>
        </Suspense>
    );
}
