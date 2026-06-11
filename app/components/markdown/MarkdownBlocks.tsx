import { ALLOWEDHOSTS } from "@/lib/constants";
import { MarkdownAlign } from "@/lib/enums";
import { MarkdownBlock } from "@/lib/types";
import { isSafeLinkHref, isSafeUrl, normalizeColorInput } from "@/lib/util/util";
import { Children, cloneElement, isValidElement, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

const allowedTags = [
    "p", "br", "strong", "em", "del", "blockquote", "ul", "ol", "li", "code", "pre", "h1", "h2", "h3", "a", "img", "hr", "table", "thead", "tbody", "tr", "th", "td"
]

function alignClassName(align: MarkdownAlign) {
    switch (align) {
        case MarkdownAlign.CENTER:
            return "text-center";
        case MarkdownAlign.END:
            return "text-end";
        default:
            return "text-start";
    }
}

function groupClassName(align: MarkdownAlign, inline = false) {
    const display = inline ? "inline-flex" : "flex";

    switch (align) {
        case MarkdownAlign.CENTER:
            return `${display} flex-col items-center text-center`;
        case MarkdownAlign.END:
            return `${display} flex-col items-end text-end`;
        default:
            return `${display} flex-col items-start text-start`;
    }
}

function renderColoredText(children: ReactNode): ReactNode {
    return Children.map(children, (child) => {
        if (typeof child === "string") {
            return child.split(/(\[[^\]]+\]\{color=[^}]+\})/g).map((part, index) => {
                const match = part.match(/^\[([^\]]+)\]\{color=([^}]+)\}$/);
                const color = normalizeColorInput(match?.[2]);

                if (!match || !color) return part;

                return <span key={`${match[1]}-${index}`} style={{ color }}>{match[1]}</span>;
            });
        }

        if (isValidElement<{ children?: ReactNode }>(child)) {
            return cloneElement(child, undefined, renderColoredText(child.props.children));
        }

        return child;
    });
}

function mediaClassName({ rounded, align }: { rounded?: boolean; align: MarkdownAlign }) {
    const classes = ["block", "max-w-full"];

    if (rounded) classes.push("rounded");
    if (align === MarkdownAlign.CENTER) classes.push("mx-auto");
    if (align === MarkdownAlign.END) classes.push("ml-auto");

    return classes.join(" ");
}

function MarkdownImage({ src, alt, width, height, fit, position, rounded, fillCell = false, align = MarkdownAlign.START }: { src: string; alt: string; width?: number; height?: number; fit?: string; position?: string; rounded?: boolean; fillCell?: boolean; align?: MarkdownAlign }) {
    return (
        <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            loading="lazy"
            referrerPolicy="no-referrer"
            className={mediaClassName({ rounded, align })}
            style={{
                width: fillCell ? "100%" : width ? `${width}px` : undefined,
                height: height ? `${height}px` : undefined,
                objectFit: (fit as React.CSSProperties['objectFit']) ?? (fillCell ? "cover" : undefined),
                objectPosition: position,
            }}
        />
    );
}

function MarkdownVideo({ src, poster, width, height, rounded, fillCell = false, align = MarkdownAlign.START }: { src: string; poster?: string; width?: number; height?: number; rounded?: boolean; fillCell?: boolean; align?: MarkdownAlign }) {
    return (
        <video
            src={src}
            poster={poster}
            controls
            preload="metadata"
            playsInline
            suppressHydrationWarning
            className={mediaClassName({ rounded, align })}
            style={{ width: fillCell ? "100%" : width ? `${width}px` : undefined, height: height ? `${height}px` : undefined }}
        />
    );
}

function MarkdownGrid({ block }: { block: Extract<MarkdownBlock, { type: "grid" }> }) {
    return (
        <div
            className="grid w-full"
            style={{
                gridTemplateColumns: `repeat(${block.columns}, minmax(0, 1fr))`,
                gap: `${block.gap}px`,
            }}
        >
            {block.cells.map((cell, index) => (
                <div key={index} className="min-w-0 overflow-hidden">
                    <MarkdownBlocks blocks={cell} compact fillMedia align={MarkdownAlign.START} />
                </div>
            ))}
        </div>
    );
}

function MarkdownGroup({ block, compact, fillMedia, parentAlign }: { block: Extract<MarkdownBlock, { type: "group" }>; compact: boolean; fillMedia: boolean; parentAlign: MarkdownAlign }) {
    const align = block.align ?? parentAlign;
    const content = (
        <div className={block.href ? "max-w-full" : "w-full"}>
            <MarkdownBlocks blocks={block.children} compact={compact} fillMedia={fillMedia} align={align} />
        </div>
    );
    const className = groupClassName(align, Boolean(block.href));
    const style = { color: block.color };

    if (block.href) {
        return (
            <a href={block.href} rel="noopener noreferrer nofollow" target="_blank" className={`${className} no-underline`} style={style}>
                {content}
            </a>
        );
    }

    return (
        <div className={className} style={style}>
            {content}
        </div>
    );
}

function MarkdownContent({ block, parentAlign }: { block: Extract<MarkdownBlock, { type: "markdown" }>; parentAlign: MarkdownAlign }) {
    const align = parentAlign !== MarkdownAlign.START && block.align === MarkdownAlign.START ? parentAlign : block.align;

    return (
        <div className={alignClassName(align)} style={{ color: block.color }}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
                allowedElements={allowedTags}
                components={{
                    h1: ({ children }) => <h1 className="mb-3 text-2xl font-bold leading-tight">{renderColoredText(children)}</h1>,
                    h2: ({ children }) => <h2 className="mb-2 text-xl font-bold leading-tight">{renderColoredText(children)}</h2>,
                    h3: ({ children }) => <h3 className="mb-2 text-lg font-bold leading-tight">{renderColoredText(children)}</h3>,
                    p: ({ children }) => <p className="whitespace-pre-line">{renderColoredText(children)}</p>,
                    strong: ({ children }) => <strong>{renderColoredText(children)}</strong>,
                    em: ({ children }) => <em>{renderColoredText(children)}</em>,
                    del: ({ children }) => <del>{renderColoredText(children)}</del>,
                    ul: ({ children }) => <ul className="ms-5 list-disc space-y-1 text-start">{children}</ul>,
                    ol: ({ children }) => <ol className="ms-5 list-decimal space-y-1 text-start">{children}</ol>,
                    li: ({ children }) => <li className="whitespace-pre-line">{renderColoredText(children)}</li>,
                    blockquote: ({ children }) => <blockquote className="border-s-4 border-primary/50 ps-4 text-text-muted">{children}</blockquote>,
                    hr: () => <hr className="border-border" />,
                    table: ({ children }) => <div className="overflow-x-auto"><table className="w-full border-collapse text-start">{children}</table></div>,
                    th: ({ children }) => <th className="border border-border bg-bg/60 px-3 py-2 font-bold">{renderColoredText(children)}</th>,
                    td: ({ children }) => <td className="border border-border px-3 py-2">{renderColoredText(children)}</td>,
                    code: ({ children }) => <code className="rounded bg-bg/70 px-1.5 py-0.5 text-sm">{children}</code>,
                    pre: ({ children }) => <pre className="overflow-x-auto rounded bg-bg/70 p-3 text-start text-sm">{children}</pre>,
                    a: ({ href, children }) => {
                        if (!href || !isSafeLinkHref(href)) return <span>{renderColoredText(children)}</span>;

                        return (
                            <a href={href} rel="noopener noreferrer nofollow" target="_blank" className="text-primary underline underline-offset-2">
                                {renderColoredText(children)}
                            </a>
                        );
                    },
                    img: ({ src, alt }) => {
                        if (typeof src !== "string" || !isSafeUrl(src)) return null;

                        return <MarkdownImage src={src} alt={alt ?? ""} />;
                    }
                }}
            >
                {block.content}
            </ReactMarkdown>
        </div>
    );
}

export function MarkdownBlocks({ blocks, compact = false, fillMedia = false, align = MarkdownAlign.START }: { blocks: MarkdownBlock[]; compact?: boolean; fillMedia?: boolean; align?: MarkdownAlign }) {
    return (
        <div className={compact ? "space-y-0" : "space-y-4"}>
            {blocks.map((block, index) => {
                if (block.type === "image") {
                    return <MarkdownImage key={index} src={block.src} alt={block.alt} width={block.width} height={block.height} fit={block.fit} position={block.position} rounded={block.rounded} fillCell={fillMedia} align={block.align ?? align} />;
                }

                if (block.type === "video") {
                    return <MarkdownVideo key={index} src={block.src} poster={block.poster} width={block.width} height={block.height} rounded={block.rounded} fillCell={fillMedia} align={block.align ?? align} />;
                }

                if (block.type === "grid") {
                    return <MarkdownGrid key={index} block={block} />;
                }

                if (block.type === "group") {
                    return <MarkdownGroup key={index} block={block} compact={compact} fillMedia={fillMedia} parentAlign={align} />;
                }

                return <MarkdownContent key={index} block={block} parentAlign={align} />;
            })}
        </div>
    );
}
