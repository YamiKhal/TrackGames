import db from "@/lib/db";
import { GameListType } from "@/lib/generated/prisma/enums";
import { DEFAULT_OG_IMAGE, metadataDescription, metadataImage } from "@/lib/metadata";
import { createOpenGraphImage } from "../../opengraph/OpenGraphImage";

export const alt = "Library on TrackGames";
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const library = await db.gameList.findFirst({
        where: {
            slug,
            type: GameListType.LIBRARY,
        },
        select: {
            userId: true,
            name: true,
            description: true,
            image: true,
            background: true,
            color: true,
            privacy: true,
            user: {
                select: {
                    libraryPrivacy: true,
                },
            },
        },
    });
    const privacy = library?.user?.libraryPrivacy ?? library?.privacy;
    const isPublic = privacy === "public";
    const image = isPublic ? metadataImage(library?.image ?? library?.background) : null;
    const title = library ? isPublic ? library.name : "Private library" : "Library not found";
    const description = library
        ? isPublic ? `Browse ${library.name} on TrackGames.` : "This TrackGames library is private."
        : "The requested library could not be found.";
    const gameCount = isPublic && library ? await db.userGameEntry.count({
        where: {
            userId: library.userId,
        },
    }) : undefined;

    return createOpenGraphImage({
        title,
        label: "Library",
        description: metadataDescription(isPublic ? library?.description : null, description),
        image: image === DEFAULT_OG_IMAGE ? null : image,
        libraryGameCount: gameCount,
        primaryColor: isPublic ? library?.color : null,
        variant: "library",
    });
}
