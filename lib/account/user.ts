import db from "../db";
import { PublicUser } from "../types";

export async function getPublicUser(name: string): Promise<PublicUser | null> {
    const user = await db.user.findFirst({
        where: { name },
        select: {
            id: true,
            name: true,
            image: true,
            background: true,
            bio: true,
            socials: true,
            widgets: true,
            createdAt: true
        }
    });

    return user as PublicUser;
}
