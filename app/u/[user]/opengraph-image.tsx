import { getPublicUser } from "@/lib/account/user";
import { DEFAULT_OG_IMAGE, metadataDescription, metadataImage } from "@/lib/metadata";
import { createOpenGraphImage } from "../../opengraph/OpenGraphImage";

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
    const title = profile ? isPublic ? `${name}'s Profile` : "Private profile" : "Profile not found";
    const description = profile
        ? isPublic ? `View ${name}'s TrackGames profile, playlists and activity.` : "This TrackGames profile is private."
        : "The requested profile could not be found.";

    return createOpenGraphImage({
        title,
        label: "Profile",
        description: metadataDescription(isPublic ? profile?.bio : null, description),
        image: image === DEFAULT_OG_IMAGE ? null : image,
        primaryColor: isPublic ? profile?.profileColor : null,
        variant: "profile",
    });
}
