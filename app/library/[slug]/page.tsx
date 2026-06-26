import LibraryEntriesPanel from "@/app/components/library/LibraryEntriesPanel";
import Container from "@/app/components/layout/Container";
import { GhostButton } from "@/app/components/ui/Buttons";
import BackgroundView from "@/app/components/user/BackgroundView";
import { getUserGameEntries } from "@/lib/data/library";
import { ensureAndGetUserLibrary } from "@/lib/playlist/library";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import GameListEditButton from "@/app/components/playlist/GameListEditButton";
import { canViewPrivacy, profileThemeStyle } from "@/lib/account/user";
import { defaultLibraryFilters } from "@/lib/account/preferences";
import { getUser } from "@/lib/account/user";
import db from "@/lib/db";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const [library, session] = await Promise.all([ensureAndGetUserLibrary(slug), auth()]);
    if (!library) redirect("/not-found");

    const isOwnLibrary = session?.user ? session.user.id === library.userId : false;
    const follow = !isOwnLibrary && session?.user?.id ? await db.userFollow.findUnique({
        where: {
            followerId_followingId: {
                followerId: session.user.id,
                followingId: library.userId,
            },
        },
        select: {
            id: true,
        },
    }) : null;
    const canViewLibrary = canViewPrivacy(library.user?.libraryPrivacy ?? library.privacy, isOwnLibrary, Boolean(follow));
    const userEntries = canViewLibrary ? await getUserGameEntries(library?.userId) : [];
    const viewer = await getUser(session?.user);
    const background = library.background ?? null;
    const themeStyle = profileThemeStyle(library.color, library.accentColor);

    return (
        <main className="relative z-0 flex-1 mb-40" style={themeStyle}>
            <BackgroundView src={background} />
            <Container>
                {/* HEADER */}
                <section className="relative z-10 w-full bg-bg/95 border-b border-border">
                    <Container className="relative z-1 flex flex-row items-end justify-start gap-10 pt-5">
                        <div className="flex min-w-0 flex-1 flex-col justify-end mb-4 gap-3 md:flex-row md:items-end md:justify-between md:gap-5">
                            <div>
                                <h1 className="text-3xl text-center md:text-start">{library.name}</h1>
                                <p className="text-md text-text-muted text-center md:text-start">{library.description}</p>
                            </div>
                            <div className="flex shrink-0 flex-row flex-wrap justify-center md:justify-emd gap-3 md:gap-5">
                                {isOwnLibrary && <GameListEditButton list={library} />}
                                <GhostButton href={`/u/${slug}`}>Profile</GhostButton>
                            </div>
                        </div>
                    </Container>
                </section>

                <section className="relative z-10 pt-5 pb-10 bg-bg/95">
                    <Container className="flex flex-col-reverse gap-5 lg:flex-row lg:items-start">
                        {!canViewLibrary ? (
                            <p className="rounded border border-border bg-bg p-4 text-sm text-text-muted">This library is private.</p>
                        ) : userEntries.length ? (
                            <LibraryEntriesPanel entries={userEntries} canEdit={isOwnLibrary} themeStyle={themeStyle} defaults={viewer ? defaultLibraryFilters(viewer) : undefined} />
                        ) : (
                            <p>No games found.</p>
                        )}
                    </Container>
                </section>
            </Container>
        </main>
    )
}
