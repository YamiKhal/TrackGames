import { MarkdownAlign } from "./enums";
import { MarkdownBlock } from "./types";
import * as normalize from "./util/normalize";
import { isSafeLinkHref, isSafeUrl } from "./util/safety";

type ActiveState = | {
    type: "group";
    align?: MarkdownAlign;
    color?: string;
    href?: string;
    lines: string[];
} | {
    type: "grid";
    columns: number;
    gap: number;
    lines: string[];
};

function normalizeAlign(value: string | undefined): MarkdownAlign | undefined {
    switch (normalize.choice(value, ["start", "left", "center", "end", "right"] as const)) {
        case "start":
        case "left":
            return MarkdownAlign.START;
        case "center":
            return MarkdownAlign.CENTER;
        case "end":
        case "right":
            return MarkdownAlign.END;
        default:
            return undefined;
    }
}

function parseAttributes(input: string) {
    const attributes: Record<string, string> = {};
    const matcher = /(\w+)=(?:"([^"]*)"|'([^']*)'|([^\s]+))/g;
    let match = matcher.exec(input);

    while (match) {
        attributes[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? "";
        match = matcher.exec(input);
    }

    return attributes;
}

function splitGridCells(content: string) {
    return content
        .split(/\n\s*---cell---\s*\n/g)
        .map((cell) => cell.trim())
        .filter(Boolean);
}

export function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
    const blocks: MarkdownBlock[] = [];
    const defaultLines: string[] = [];
    const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
    let active: ActiveState | null = null;

    function flushDefault() {
        const content = defaultLines.join("\n").trim();
        if (!content) return;

        blocks.push({ type: "markdown", align: MarkdownAlign.START, content });
        defaultLines.length = 0;
    }

    function flushActive() {
        if (!active) return;

        const content = active.lines.join("\n").trim();
        if (!content) {
            active = null;
            return;
        }

        if (active.type === "grid") {
            blocks.push({
                type: "grid",
                columns: active.columns,
                gap: active.gap,
                cells: splitGridCells(content).map(parseMarkdownBlocks),
            });
        } else {
            blocks.push({
                type: "group",
                align: active.align,
                color: active.color,
                href: active.href,
                children: parseMarkdownBlocks(content),
            });
        }

        active = null;
    }

    for (const line of lines) {
        const trimmed = line.trim();
        const blockDirective = trimmed.match(/^::(start|left|center|end|right|color|link|grid)(?:\s+(.*))?$/i);
        const mediaDirective = trimmed.match(/^::(image|video)\s+(.+)$/i);

        if (mediaDirective && !active) {
            flushDefault();

            const attributes = parseAttributes(mediaDirective[2]);
            const src = attributes.src;
            const width = normalize.integer(attributes.width, { min: 40, max: 1200 });
            const height = normalize.integer(attributes.height, { min: 40, max: 1200 });

            if (mediaDirective[1].toLowerCase() === "image" && isSafeUrl(src)) {
                blocks.push({
                    type: "image",
                    src,
                    alt: attributes.alt ?? "",
                    align: normalizeAlign(attributes.align ?? "") ?? undefined,
                    width,
                    height,
                    fit: normalize.choice(attributes.fit, ["contain", "cover"] as const),
                    position: normalize.choice(attributes.position, ["center", "left", "right", "top", "bottom"] as const),
                    rounded: normalize.boolean(attributes.rounded),
                });
            }

            if (mediaDirective[1].toLowerCase() === "video" && isSafeUrl(src)) {
                blocks.push({
                    type: "video",
                    src,
                    poster: isSafeUrl(attributes.poster) ? attributes.poster : undefined,
                    align: normalizeAlign(attributes.align ?? "") ?? undefined,
                    width,
                    height,
                    rounded: normalize.boolean(attributes.rounded),
                });
            }

            continue;
        }

        if (blockDirective && !active) {
            flushDefault();

            const name = blockDirective[1].toLowerCase();
            const attributes = parseAttributes(blockDirective[2] ?? "");

            if (name === "grid") {
                active = {
                    type: "grid",
                    columns: normalize.integer(attributes.columns, { min: 1, max: 4, fallback: 2 }) ?? 2,
                    gap: normalize.integer(attributes.gap, { min: 0, max: 32, fallback: 8 }) ?? 8,
                    lines: [],
                };
            } else {
                const align = normalizeAlign(name) ?? undefined;
                const href = attributes.href && isSafeLinkHref(attributes.href) ? attributes.href : undefined;
                const colorValue = attributes.value ?? attributes.color;

                active = {
                    type: "group",
                    align,
                    color: colorValue ? normalize.hexColor(colorValue) : undefined,
                    href,
                    lines: [],
                };
            }

            continue;
        }

        if (trimmed === "::" && active) {
            flushActive();
            continue;
        }

        if (active) {
            active.lines.push(line);
        } else {
            defaultLines.push(line);
        }
    }

    flushActive();
    flushDefault();

    return blocks;
}
