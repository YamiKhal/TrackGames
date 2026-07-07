import { createOpenGraphImage } from "@/app/(net)/opengraph/OpenGraphImage";
import { getPublicUser } from "@/lib/data/social/user";
import { DEFAULT_OG_IMAGE, metadataDescription, metadataImage } from "@/lib/util/metadata";

export const alt = "Profile on TrackGames";
export const size = {
	width: 1200,
	height: 630,
};
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ user: string }> }) {
	const { user } = await params;
	const profile = await getPublicUser(decodeURIComponent(user));
	const name = profile?.name ?? decodeURIComponent(user);
	const isPublic = profile?.privacy === "public";
	const image = isPublic ? metadataImage(profile?.image) : null;
	const publicName = isPublic ? `${name}'s Profile` : "Private profile";
	const publicDesc = isPublic ? `View ${name}'s TrackGames profile, playlists and activity.` : "This TrackGames profile is private.";
	const title = profile ? publicName : "Profile not found";
	const description = profile ? publicDesc : "The requested profile could not be found.";

	return createOpenGraphImage({
		title,
		label: "Profile",
		description: metadataDescription(isPublic ? profile?.bio : null, description),
		image: image === DEFAULT_OG_IMAGE ? null : image,
		primaryColor: isPublic ? profile?.profileColor : null,
		variant: "profile",
	});
}
