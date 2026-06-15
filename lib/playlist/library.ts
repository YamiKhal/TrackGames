import db from "../db";

const listSelect = {
    id: true,
    userId: true,
    type: true,
    name: true,
    slug: true,
    description: true,
    image: true,
    background: true,
    color: true,
    accentColor: true,
    privacy: true,
    entries: true
}

export async function ensureAndGetUserLibrary(slug: string) {
    const user = await db.user.findFirst({
        where: {
            name: slug
        },
        select: {
            id: true,
            name: true
        }
    })

    if (!user) return null;

    const library = await db.gameList.findFirst({
        where: {
            slug: slug,
            userId: user.id
        },
        select: listSelect
    })

    if (library) return library;

    return await db.gameList.create({
        data: {
            userId: user.id,
            type: "LIBRARY",
            name: `${user.name}'s Library`,
            slug: `${user.name}`,
            privacy: "public"
        }
    })
}