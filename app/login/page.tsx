import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginClient from "./LoginClient";
import type { Metadata } from "next";
import { absoluteUrl, DEFAULT_OG_IMAGE, metadataDescription, SITE_NAME } from "@/lib/metadata";

const description = metadataDescription("Log in or create a TrackGames account to track your game library, playlists, ratings, and profile.");

export const metadata: Metadata = {
    title: "Log in",
    description,
    alternates: {
        canonical: absoluteUrl("/login"),
    },
    openGraph: {
        title: `Log in | ${SITE_NAME}`,
        description,
        url: absoluteUrl("/login"),
        siteName: SITE_NAME,
        type: "website",
        images: [{
            url: DEFAULT_OG_IMAGE,
            alt: SITE_NAME,
        }],
    },
    twitter: {
        card: "summary_large_image",
        title: `Log in | ${SITE_NAME}`,
        description,
        images: [DEFAULT_OG_IMAGE],
    },
    robots: {
        index: false,
        follow: false,
    },
};

export default async function Page() {
    const [session] = await Promise.all([auth()]);

    if (session?.user?.id) redirect("/");

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
