import LibraryEntriesPanel from "@/app/components/library/LibraryEntriesPanel";
import Container from "@/app/components/layout/Container";
import { GhostButton } from "@/app/components/ui/Buttons";
import BackgroundView from "@/app/components/user/BackgroundView";
import { getUserGameEntries } from "@/lib/data/library";
import { ensureAndGetUserLibrary } from "@/lib/playlist/library";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const [library, session] = await Promise.all([ensureAndGetUserLibrary(slug), auth()]);
    if (!library) redirect("/not-found");

    const isOwnLibrary = session?.user ? session.user.id === library.userId : false;
    const userEntries = await getUserGameEntries(library?.userId);
    const background = library.background ?? null;

    return (
        <main className="relative z-0 flex-1">
            <BackgroundView src={background} />
            <Container>
                {/* HEADER */}
                <section className="relative z-10 w-full bg-bg/95 border-b border-border">
                    <Container className="relative z-1 flex flex-row items-end justify-start gap-10 pt-5">
                        <div className="flex min-w-0 flex-1 flex-col justify-end mb-4 gap-3 md:flex-row md:items-end md:justify-between md:gap-5">
                            <div>
                                <h1 className="text-3xl">{library.name}</h1>
                                <p className="text-md text-text-muted">{library.description}Testing Description</p>
                            </div>
                            <div className="flex shrink-0 flex-row flex-wrap justify-end gap-3 md:gap-5">
                                <GhostButton href={`/u/${slug}`}>View Profile</GhostButton>
                            </div>
                        </div>
                    </Container>
                </section>

                <section className="relative z-10 pt-5 pb-10 bg-bg/95">
                    <Container className="flex flex-col-reverse gap-5 lg:flex-row lg:items-start">
                        {userEntries.length ? (
                            <LibraryEntriesPanel entries={userEntries} canEdit={isOwnLibrary} />
                        ) : (
                            <p>No games found.</p>
                        )}
                    </Container>
                </section>
            </Container>
        </main>
    )
}
