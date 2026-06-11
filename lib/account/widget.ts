import { Widget } from "../types";

export function parseWidgets(value: string | null | undefined): Widget[] {
    if (!value) return [];

    try {
        const parsed = JSON.parse(value);

        if (!Array.isArray(parsed)) return [];

        return parsed.map((item, index) => ({
            id: typeof item.id === "string" ? item.id : `${Date.now()}-${index}`,
            type: item.type,
            title: typeof item.title === "string" ? item.title : item.type ?? "Widget",
            visible: typeof item.visible === "boolean" ? item.visible : true,
            content: typeof item.content === "string" ? item.content : "",
            stats: Array.isArray(item.stats) ? item.stats.filter((stat: unknown) => typeof stat === "string") : [],
            games: Array.isArray(item.games) ? item.games.filter((game: unknown) => typeof game === "string") : [],
        }));
    } catch {
        return [];
    }
}

export function serializeWidgets(widgets: Widget[]) {
    return JSON.stringify(widgets.map(({ type, title, visible, content, stats, games }) => ({ type, title, visible, content, stats, games })));
}