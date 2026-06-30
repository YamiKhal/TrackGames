import { MarkdownAlign } from "@/lib/enums";
import type { MarkdownBlock } from "@/lib/types";
import * as normalize from "@/lib/util/normalize";
import { isSafeLinkHref, isSafeUrl } from "@/lib/util/safety";
import Image from "next/image";
import { Children, cloneElement, isValidElement, ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

type MarkdownImageProps = Readonly<{
	src: string;
	alt: string;
	width?: number;
	height?: number;
	fit?: string;
	position?: string;
	rounded?: boolean;
	shouldFillCell?: boolean;
	align?: MarkdownAlign;
}>;

type MarkdownVideoProps = Readonly<{
	src: string;
	poster?: string;
	width?: number;
	height?: number;
	rounded?: boolean;
	shouldFillCell?: boolean;
	align?: MarkdownAlign;
}>;

type MarkdownGroupProps = Readonly<{
	block: Extract<MarkdownBlock, { type: "group" }>;
	shouldCompact: boolean;
	shouldFillMedia: boolean;
	parentAlign: MarkdownAlign;
}>;

type MarkdownContentProps = Readonly<{ block: Extract<MarkdownBlock, { type: "markdown" }>; parentAlign: MarkdownAlign }>;

type MarkdownComponentName = "h1" | "h2" | "h3" | "p" | "strong" | "em" | "del" | "ul" | "ol" | "li" | "blockquote" | "hr" | "table" | "th" | "td" | "code" | "pre" | "a" | "img";

type MarkdownComponentProps = {
	children?: ReactNode;
	href?: string;
	// react-markdown/img props can include non-string src (eg. Blob), so accept unknown and validate at runtime
	src?: unknown;
	alt?: string;
};

type MarkdownBlocksProps = Readonly<{
	blocks: MarkdownBlock[];
	shouldCompact?: boolean;
	shouldFillMedia?: boolean;
	align?: MarkdownAlign;
}>;

const allowedTags = [
	"p",
	"br",
	"strong",
	"em",
	"del",
	"blockquote",
	"ul",
	"ol",
	"li",
	"code",
	"pre",
	"h1",
	"h2",
	"h3",
	"a",
	"img",
	"hr",
	"table",
	"thead",
	"tbody",
	"tr",
	"th",
	"td",
];

const markdownComponents: Components = {
	h1: (props) => renderMarkdownComponent("h1", props),
	h2: (props) => renderMarkdownComponent("h2", props),
	h3: (props) => renderMarkdownComponent("h3", props),
	p: (props) => renderMarkdownComponent("p", props),
	strong: (props) => renderMarkdownComponent("strong", props),
	em: (props) => renderMarkdownComponent("em", props),
	del: (props) => renderMarkdownComponent("del", props),
	ul: (props) => renderMarkdownComponent("ul", props),
	ol: (props) => renderMarkdownComponent("ol", props),
	li: (props) => renderMarkdownComponent("li", props),
	blockquote: (props) => renderMarkdownComponent("blockquote", props),
	hr: (props) => renderMarkdownComponent("hr", props),
	table: (props) => renderMarkdownComponent("table", props),
	th: (props) => renderMarkdownComponent("th", props),
	td: (props) => renderMarkdownComponent("td", props),
	code: (props) => renderMarkdownComponent("code", props),
	pre: (props) => renderMarkdownComponent("pre", props),
	a: (props) => renderMarkdownComponent("a", props),
	img: (props) => renderMarkdownComponent("img", props),
};

function MarkdownImage({ src, alt, width, height, fit, position, rounded, shouldFillCell = false, align = MarkdownAlign.START }: MarkdownImageProps) {
	const widthPx = width ? `${width}px` : undefined;

	return (
		<Image
			src={src}
			alt={alt}
			width={width}
			height={height}
			loading="lazy"
			referrerPolicy="no-referrer"
			className={mediaClassName({ rounded, align })}
			style={{
				width: shouldFillCell ? "100%" : widthPx,
				height: height ? `${height}px` : undefined,
				objectFit: (fit as React.CSSProperties["objectFit"]) ?? (shouldFillCell ? "cover" : undefined),
				objectPosition: position,
			}}
		/>
	);
}

function MarkdownVideo({ src, poster, width, height, rounded, shouldFillCell = false, align = MarkdownAlign.START }: MarkdownVideoProps) {
	const widthPx = width ? `${width}px` : undefined;
	const heightPx = height ? `${height}px` : undefined;

	return (
		<video
			src={src}
			poster={poster}
			controls
			preload="metadata"
			playsInline
			suppressHydrationWarning
			className={mediaClassName({ rounded, align })}
			style={{ width: shouldFillCell ? "100%" : widthPx, height: heightPx }}
		>
			<track kind="captions" />
		</video>
	);
}

function MarkdownGrid({ block }: Readonly<{ block: Extract<MarkdownBlock, { type: "grid" }> }>) {
	return (
		<div
			className="grid w-full"
			style={{
				gridTemplateColumns: `repeat(${block.columns}, minmax(0, 1fr))`,
				gap: `${block.gap}px`,
			}}
		>
			{block.cells.map((cell, index) => (
				<div key={index.toLocaleString()} className="min-w-0 overflow-hidden">
					<MarkdownBlocks blocks={cell} shouldCompact shouldFillMedia align={MarkdownAlign.START} />
				</div>
			))}
		</div>
	);
}

function MarkdownGroup({ block, shouldCompact, shouldFillMedia, parentAlign }: MarkdownGroupProps) {
	const align = block.align ?? parentAlign;
	const content = (
		<div className={block.href ? "max-w-full" : "w-full"}>
			<MarkdownBlocks blocks={block.children} shouldCompact={shouldCompact} shouldFillMedia={shouldFillMedia} align={align} />
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

function MarkdownContent({ block, parentAlign }: MarkdownContentProps) {
	const align = parentAlign !== MarkdownAlign.START && block.align === MarkdownAlign.START ? parentAlign : block.align;

	return (
		<div className={alignClassName(align)} style={{ color: block.color }}>
			<ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]} allowedElements={allowedTags} components={markdownComponents}>
				{block.content}
			</ReactMarkdown>
		</div>
	);
}

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

function renderColoredTextString(value: string) {
	const parts: ReactNode[] = [];
	let index = 0;

	while (index < value.length) {
		const start = value.indexOf("[", index);

		if (start === -1) {
			parts.push(value.slice(index));
			break;
		}

		const textEnd = value.indexOf("]{color=", start);
		const colorEnd = textEnd === -1 ? -1 : value.indexOf("}", textEnd + 8);

		if (textEnd === -1 || colorEnd === -1) {
			parts.push(value.slice(index));
			break;
		}

		if (start > index) parts.push(value.slice(index, start));

		const text = value.slice(start + 1, textEnd);
		const color = normalize.hexColor(value.slice(textEnd + 8, colorEnd));

		parts.push(
			color ? (
				<span key={`${text}-${start}`} style={{ color }}>
					{text}
				</span>
			) : (
				value.slice(start, colorEnd + 1)
			),
		);
		index = colorEnd + 1;
	}

	return parts;
}

function renderColoredText(children: ReactNode): ReactNode {
	return Children.map(children, (child) => {
		if (typeof child === "string") {
			return renderColoredTextString(child);
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

function renderMarkdownComponent(name: MarkdownComponentName, { children, href, src, alt }: MarkdownComponentProps) {
	switch (name) {
		case "h1":
			return <h1 className="mb-3 text-2xl leading-tight font-bold">{renderColoredText(children)}</h1>;
		case "h2":
			return <h2 className="mb-2 text-xl leading-tight font-bold">{renderColoredText(children)}</h2>;
		case "h3":
			return <h3 className="mb-2 text-lg leading-tight font-bold">{renderColoredText(children)}</h3>;
		case "p":
			return <p className="whitespace-pre-line">{renderColoredText(children)}</p>;
		case "strong":
			return <strong>{renderColoredText(children)}</strong>;
		case "em":
			return <em>{renderColoredText(children)}</em>;
		case "del":
			return <del>{renderColoredText(children)}</del>;
		case "ul":
			return <ul className="ms-5 list-disc space-y-1 text-start">{children}</ul>;
		case "ol":
			return <ol className="ms-5 list-decimal space-y-1 text-start">{children}</ol>;
		case "li":
			return <li className="whitespace-pre-line">{renderColoredText(children)}</li>;
		case "blockquote":
			return <blockquote className="border-s-4 border-primary/50 ps-4 text-text-muted">{children}</blockquote>;
		case "hr":
			return <hr className="border-border" />;
		case "table":
			return (
				<div className="overflow-x-auto">
					<table className="w-full border-collapse text-start">{children}</table>
				</div>
			);
		case "th":
			return <th className="border border-border bg-bg/60 px-3 py-2 font-bold">{renderColoredText(children)}</th>;
		case "td":
			return <td className="border border-border px-3 py-2">{renderColoredText(children)}</td>;
		case "code":
			return <code className="rounded bg-bg/70 px-1.5 py-0.5 text-sm">{children}</code>;
		case "pre":
			return <pre className="overflow-x-auto rounded bg-bg/70 p-3 text-start text-sm">{children}</pre>;
		case "a":
			if (!href || !isSafeLinkHref(href)) return <span>{renderColoredText(children)}</span>;

			return (
				<a href={href} rel="noopener noreferrer nofollow" target="_blank" className="text-primary underline underline-offset-2">
					{renderColoredText(children)}
				</a>
			);
		case "img":
			if (!src || typeof src !== "string" || !isSafeUrl(src)) return null;

			return <MarkdownImage src={src} alt={alt ?? ""} />;
		default:
			return children;
	}
}

export function MarkdownBlocks({ blocks, shouldCompact = false, shouldFillMedia = false, align = MarkdownAlign.START }: MarkdownBlocksProps) {
	return (
		<div className={shouldCompact ? "space-y-0" : "space-y-4"}>
			{blocks.map((block, index) => {
				if (block.type === "image") {
					return (
						<MarkdownImage
							key={index.toLocaleString()}
							src={block.src}
							alt={block.alt}
							width={block.width}
							height={block.height}
							fit={block.fit}
							position={block.position}
							rounded={block.rounded}
							shouldFillCell={shouldFillMedia}
							align={block.align ?? align}
						/>
					);
				}

				if (block.type === "video") {
					return (
						<MarkdownVideo
							key={index.toLocaleString()}
							src={block.src}
							poster={block.poster}
							width={block.width}
							height={block.height}
							rounded={block.rounded}
							shouldFillCell={shouldFillMedia}
							align={block.align ?? align}
						/>
					);
				}

				if (block.type === "grid") {
					return <MarkdownGrid key={index.toLocaleString()} block={block} />;
				}

				if (block.type === "group") {
					return <MarkdownGroup key={index.toLocaleString()} block={block} shouldCompact={shouldCompact} shouldFillMedia={shouldFillMedia} parentAlign={align} />;
				}

				return <MarkdownContent key={index.toLocaleString()} block={block} parentAlign={align} />;
			})}
		</div>
	);
}
