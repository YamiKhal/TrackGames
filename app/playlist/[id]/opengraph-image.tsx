import db from "@/lib/db";
import { GameListType } from "@/lib/generated/prisma/enums";
import { ImageIdToURL } from "@/lib/external/igdb/util";
import { metadataDescription } from "@/lib/metadata";
import { createOpenGraphImage } from "../../opengraph/OpenGraphImage";

export const alt = "Playlist on TrackGames";
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const playlist = await db.gameList.findFirst({
        where: {
            id,
            type: GameListType.PLAYLIST,
        },
        select: {
            name: true,
            description: true,
            privacy: true,
            _count: {
                select: {
                    entries: true,
                },
            },
            user: {
                select: {
                    name: true,
                },
            },
            entries: {
                orderBy: [
                    { position: "asc" },
                    { addedAt: "asc" },
                ],
                take: 4,
                select: {
                    game: {
                        select: {
                            cover: true,
                        },
                    },
                },
            },
        },
    });
    const isPublic = playlist?.privacy === "public";
    const title = playlist ? isPublic ? playlist.name : "Private playlist" : "Playlist not found";
    const description = playlist
        ? isPublic ? `Browse ${playlist.name}${playlist.user?.name ? ` by ${playlist.user.name}` : ""} on TrackGames.` : "This TrackGames playlist is private."
        : "The requested playlist could not be found.";
    const playlistImages = isPublic ? playlist.entries
        .map((entry) => ImageIdToURL(entry.game.cover ?? undefined, "cover_big")?.replace(/\.webp$/, ".jpg"))
        .filter((image): image is string => Boolean(image)) : [];

    return createOpenGraphImage({
        title,
        label: "Playlist",
        description: metadataDescription(isPublic ? playlist?.description : null, description),
        playlistImages,
        playlistGameCount: isPublic ? playlist?._count.entries : undefined,
        variant: "playlist",
    });
}
