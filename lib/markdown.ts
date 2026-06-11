import { MarkdownAlign } from "./enums";
import { MarkdownBlock } from "./types";
import { isSafeLinkHref, isSafeUrl, normalizeColorInput } from "./util/util";

function normalizeSize(value: string | undefined) {
    if (!value) return undefined;

    const parsed = Number(value);

    if (!Number.isInteger(parsed)) return undefined;

    return Math.min(Math.max(parsed, 40), 1200);
}

function normalizeColumns(value: string | undefined) {
    const parsed = Number(value);

    if (!Number.isInteger(parsed)) return 2;

    return Math.min(Math.max(parsed, 1), 4);
}

function normalizeGap(value: string | undefined) {
    const parsed = Number(value);

    if (!Number.isInteger(parsed)) return 8;

    return Math.min(Math.max(parsed, 0), 32);
}

function normalizeImageFit(value: string | undefined): string | undefined {
    if (value === "contain" || value === "cover") return value;

    return undefined;
}

function normalizeImagePosition(value: string | undefined): string | undefined {
    if (value === "center" || value === "left" || value === "right" || value === "top" || value === "bottom") {
        return value;
    }

    return undefined;
}

function normalizeAlign(value: string | undefined): MarkdownAlign | undefined {
    if (!value) return undefined;

    const v = value.toLowerCase();

    if (v === "start" || v === "left") return MarkdownAlign.START;
    if (v === "center") return MarkdownAlign.CENTER;
    if (v === "end" || v === "right") return MarkdownAlign.END;

    return undefined;
}

function normalizeBoolean(value: string | undefined) {
    if (!value) return false;

    return value === "true" || value === "1" || value === "yes";
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
    let active: { type: "group" | "grid"; align?: MarkdownAlign; color?: string; href?: string; columns?: number; gap?: number; lines: string[] } | null = null;

    function flushDefault() {
        const content = defaultLines.join("\n").trim();

        if (content) {
            blocks.push({ type: "markdown", align: MarkdownAlign.START, content });
            defaultLines.length = 0;
        }
    }

    function flushActive() {
        if (!active) return;

        const content = active.lines.join("\n").trim();

        if (content) {
            if (active.type === "grid") {
                blocks.push({
                    type: "grid",
                    columns: active.columns ?? 2,
                    gap: active.gap ?? 8,
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
            const width = normalizeSize(attributes.width);
            const height = normalizeSize(attributes.height);

            if (mediaDirective[1].toLowerCase() === "image" && isSafeUrl(src)) {
                blocks.push({
                    type: "image",
                    src,
                    alt: attributes.alt ?? "",
                    align: normalizeAlign(attributes.align ?? "") ?? undefined,
                    width,
                    height,
                    fit: normalizeImageFit(attributes.fit),
                    position: normalizeImagePosition(attributes.position),
                    rounded: normalizeBoolean(attributes.rounded),
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
                    rounded: normalizeBoolean(attributes.rounded),
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
                    align: MarkdownAlign.START,
                    columns: normalizeColumns(attributes.columns),
                    gap: normalizeGap(attributes.gap),
                    lines: [],
                };
            } else {
                const align = normalizeAlign(name) ?? undefined;
                const href = attributes.href && isSafeLinkHref(attributes.href) ? attributes.href : undefined;

                active = {
                    type: "group",
                    align,
                    color: normalizeColorInput(attributes.value ?? attributes.color),
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