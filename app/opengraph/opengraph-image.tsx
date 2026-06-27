import { DEFAULT_DESCRIPTION, SITE_NAME } from "@/lib/metadata";
import { createOpenGraphImage } from "./OpenGraphImage";

export const alt = SITE_NAME;
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = "image/png";

export default async function Image() {
    return createOpenGraphImage({
        title: "Build Your Library :)",
        description: DEFAULT_DESCRIPTION,
    });
}
