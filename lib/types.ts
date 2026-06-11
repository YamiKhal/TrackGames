import { LinkType, MarkdownAlign, WidgetType } from "./enums";

export type PopScoreEntry = {
    game_id: number;
    popularity_type: number;
    value: number;
    created_at: number;
};

export type TrendingScore = {
    game_id: number;
    wantToPlay: number;
    playing: number;
    weightedScore: number;
};

export type DisplayGame = {
    id?: number;
    slug?: string;
    name?: string;
    summary?: string;
    total_rating?: number;
    first_release_date?: number;
    cover?: { image_id: string };
    screenshots?: { image_id: string }[];
    videos?: { video_id: string; }[]
    platforms?: { id: number; name: string; slug: string }[];
    involved_companies?: { company: number; developer: boolean; publisher: boolean }[];
    genres?: { id: number; name: string; slug: string }[];
    franchises?: { id: number; name: string; slug: string; games: number[] }[];
    collections?: { id: number; name: string; slug: string; games: number[] }[];
    similar_games?: number[];
}

export type Company = {
    id: number;
    slug: string;
    start_date: number;
    logo: string;
    name: string;
    description: string;
    developed: number[];
    published: number[];
}

export type PublicUser = {
    id: string;
    name: string;
    createdAt: Date;
    image?: string;
    background?: string;
    bio?: string;
    socials?: string;
    widgets?: string;
}

export type Widget = {
    id: string;
    type: WidgetType;
    title: string;
    visible: boolean;
    content: string;
    stats: string[];
    games: string[];
}

export type SocialLink = {
    id: string;
    platform: string;
    kind: LinkType;
    value: string;
};

export type MarkdownBlock =
    | {
        type: "markdown";
        align: MarkdownAlign;
        color?: string;
        content: string;
    }
    | {
        type: "group";
        align?: MarkdownAlign;
        color?: string;
        href?: string;
        children: MarkdownBlock[];
    }
    | {
        type: "image";
        src: string;
        alt: string;
        align?: MarkdownAlign;
        width?: number;
        height?: number;
        fit?: string;
        position?: string;
        rounded?: boolean;
    }
    | {
        type: "video";
        src: string;
        poster?: string;
        align?: MarkdownAlign;
        width?: number;
        height?: number;
        rounded?: boolean;
    }
    | {
        type: "grid";
        columns: number;
        gap: number;
        cells: MarkdownBlock[][];
    };
