export function ImageIdToURL(id?: string, type: "cover" | "cover_big" | "1080" | "720" = "cover_big"): string | null {
    if (id != null) {
        switch (type) {
            case "cover_big": return `https://images.igdb.com/igdb/image/upload/t_cover_big/${id}.webp`;
            case "cover": return `https://images.igdb.com/igdb/image/upload/t_cover/${id}.webp`;
            case "1080": return `https://images.igdb.com/igdb/image/upload/t_1080p/${id}.webp`;
            case "720": return `https://images.igdb.com/igdb/image/upload/t_720p/${id}.webp`;
        }
        
    } else {
        return null
    }
}