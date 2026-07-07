import { createOpenGraphImage } from "@/app/(net)/opengraph/OpenGraphImage";
import { getGameBySlug } from "@/lib/data/catalog/games";
import { ImageIdToURL } from "@/lib/external/igdb/util";
import { metadataDescription } from "@/lib/util/metadata";

export const alt = "Game on TrackGames";
export const size = {
	width: 1200,
	height: 630,
};
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const game = await getGameBySlug(slug);
	const coverImage = ImageIdToURL(game?.cover, "1080");
	const image = ImageIdToURL(game?.screenshots?.[0], "1080") ?? coverImage;

	return createOpenGraphImage({
		title: game?.name ?? "Game not found",
		label: "Game",
		description: metadataDescription(
			game?.summary,
			game ? `Track ratings, playtime, playlists, and community activity for ${game.name}.` : "The requested game could not be found.",
		),
		image: image?.replace(/\.webp$/, ".jpg"),
		coverImage: coverImage?.replace(/\.webp$/, ".jpg"),
		variant: "game",
	});
}
