"use client";

import { GhostButton } from "@/app/components/ui/Buttons";
import { MarkdownBlocks } from "@/app/components/markdown/MarkdownBlocks";
import { AlignCenter, AlignLeft, AlignRight, Bold, Eye, Image as ImageIcon, Italic, Link, Palette, Strikethrough, Table, Video } from "lucide-react";
import { useRef, useState } from "react";
import { parseMarkdownBlocks } from "@/lib/markdown";
import { Input, Textarea } from "@/app/components/ui/Inputs";
import MenuPanel from "@/app/components/ui/MenuPanel";

type MarkdownWidgetEditorProps = Readonly<{
	value: string;
	onChange: (value: string) => void;
}>;

function quoteAttribute(value: string) {
	return value.replaceAll('"', "&quot;");
}

export default function MarkdownWidgetEditor({ value, onChange }: MarkdownWidgetEditorProps) {
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);
	const [mediaModal, setMediaModal] = useState<"image" | "video" | null>(null);
	const [lastMediaModal, setLastMediaModal] = useState<"image" | "video">("image");
	const [showPreview, setShowPreview] = useState(false);
	const [imageSrc, setImageSrc] = useState("");
	const [videoSrc, setVideoSrc] = useState("");
	const [mediaAlt, setMediaAlt] = useState("");
	const [mediaWidth, setMediaWidth] = useState("520");
	const [mediaHeight, setMediaHeight] = useState("280");

	function replaceSelection(format: (selection: string) => string) {
		const textarea = textareaRef.current;

		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const selection = value.slice(start, end);
		const replacement = format(selection);
		const next = `${value.slice(0, start)}${replacement}${value.slice(end)}`;

		onChange(next);

		globalThis.requestAnimationFrame(() => {
			textarea.focus();
			textarea.setSelectionRange(start, start + replacement.length);
		});
	}

	function insertBlock(block: string) {
		replaceSelection((selection) => {
			const content = selection || block;
			const prefix = value.endsWith("\n") || value.length === 0 ? "" : "\n";

			return `${prefix}${content}\n`;
		});
	}

	function wrapSelection(before: string, after = before, fallback = "text") {
		replaceSelection((selection) => `${before}${selection || fallback}${after}`);
	}

	function wrapBlock(directive: "start" | "center" | "end") {
		replaceSelection((selection) => `::${directive}\n${selection || "Text"}\n::`);
	}

	function insertImage() {
		if (!imageSrc.trim()) return;

		insertBlock(
			`::image src="${quoteAttribute(imageSrc.trim())}" alt="${quoteAttribute(mediaAlt.trim())}" align=center width=${mediaWidth || 520} height=${mediaHeight || 280} fit=cover position=center rounded=true`,
		);
		setImageSrc("");
		setMediaAlt("");
		setMediaModal(null);
	}

	function insertVideo() {
		if (!videoSrc.trim()) return;

		insertBlock(`::video src="${quoteAttribute(videoSrc.trim())}" align=center width=${mediaWidth || 520} height=${mediaHeight || 292} rounded=true`);
		setVideoSrc("");
		setMediaModal(null);
	}

	const previewBlocks = showPreview ? parseMarkdownBlocks(value) : [];

	return (
		<div className="mt-3 flex flex-col gap-3">
			<div className="flex flex-wrap gap-2">
				<GhostButton type="button" onClick={() => wrapSelection("**")} className="px-3 py-2" title="Bold selected text" aria-label="Bold selected text">
					<Bold size={16} />
				</GhostButton>
				<GhostButton type="button" onClick={() => wrapSelection("*")} className="px-3 py-2" title="Italic selected text" aria-label="Italic selected text">
					<Italic size={16} />
				</GhostButton>
				<GhostButton type="button" onClick={() => wrapSelection("~~")} className="px-3 py-2" title="Strikethrough selected text" aria-label="Strikethrough selected text">
					<Strikethrough size={16} />
				</GhostButton>
				<GhostButton type="button" onClick={() => wrapSelection("[", "](https://example.com)", "link text")} className="px-3 py-2" title="Add link" aria-label="Add link">
					<Link size={16} />
				</GhostButton>
				<GhostButton
					type="button"
					onClick={() => wrapSelection("[", "]{color=primary}", "colored text")}
					className="px-3 py-2"
					title="Apply color token"
					aria-label="Apply color token"
				>
					<Palette size={16} />
				</GhostButton>
				<GhostButton
					type="button"
					onClick={() => insertBlock("| Head | Value |\n| --- | --- |\n| Label | Text |")}
					className="px-3 py-2"
					title="Insert table"
					aria-label="Insert table"
				>
					<Table size={16} />
				</GhostButton>
				<GhostButton type="button" onClick={() => wrapBlock("start")} className="px-3 py-2" title="Align block to start" aria-label="Align block to start">
					<AlignLeft size={16} />
				</GhostButton>
				<GhostButton type="button" onClick={() => wrapBlock("center")} className="px-3 py-2" title="Center block" aria-label="Center block">
					<AlignCenter size={16} />
				</GhostButton>
				<GhostButton type="button" onClick={() => wrapBlock("end")} className="px-3 py-2" title="Align block to end" aria-label="Align block to end">
					<AlignRight size={16} />
				</GhostButton>
				<GhostButton
					type="button"
					onClick={() => {
						setLastMediaModal("image");
						setMediaModal("image");
					}}
					className="px-3 py-2"
					title="Insert image"
					aria-label="Insert image"
				>
					<ImageIcon size={16} />
				</GhostButton>
				<GhostButton
					type="button"
					onClick={() => {
						setLastMediaModal("video");
						setMediaModal("video");
					}}
					className="px-3 py-2"
					title="Insert video"
					aria-label="Insert video"
				>
					<Video size={16} />
				</GhostButton>
			</div>

			<Textarea
				ref={textareaRef}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				className="min-h-72 font-mono text-sm leading-6"
				placeholder="# Markdown widget"
			/>

			<GhostButton
				type="button"
				onClick={() => setShowPreview((current) => !current)}
				className="px-3 py-2"
				title={showPreview ? "Hide preview" : "Show preview"}
				aria-label={showPreview ? "Hide preview" : "Show preview"}
			>
				<Eye size={16} />
				Preview
			</GhostButton>

			{showPreview && (
				<div className="border border-border bg-bg p-4">
					{value.trim() ? (
						<div className="space-y-4 text-sm leading-6 text-text md:text-base">
							<MarkdownBlocks blocks={previewBlocks} />
						</div>
					) : (
						<p className="text-sm text-text-muted">Nothing to preview.</p>
					)}
				</div>
			)}

			<MenuPanel open={Boolean(mediaModal)} onClose={() => setMediaModal(null)} title={lastMediaModal === "image" ? "Insert image" : "Insert video"}>
				<div className="flex flex-col gap-2">
					{lastMediaModal === "image" ? (
						<>
							<Input value={imageSrc} onChange={(event) => setImageSrc(event.target.value)} placeholder="https://images.unsplash.com/..." />
							<Input value={mediaAlt} onChange={(event) => setMediaAlt(event.target.value)} placeholder="Alt text" />
						</>
					) : (
						<Input value={videoSrc} onChange={(event) => setVideoSrc(event.target.value)} placeholder="https://cdn.pixabay.com/video.mp4" />
					)}
					<div className="grid grid-cols-2 gap-2">
						<Input value={mediaWidth} onChange={(event) => setMediaWidth(event.target.value)} placeholder="Width" inputMode="numeric" />
						<Input value={mediaHeight} onChange={(event) => setMediaHeight(event.target.value)} placeholder="Height" inputMode="numeric" />
					</div>
				</div>
				<div className="mt-5 flex justify-end gap-2">
					<GhostButton type="button" onClick={() => setMediaModal(null)}>
						Cancel
					</GhostButton>
					<GhostButton
						type="button"
						onClick={lastMediaModal === "image" ? insertImage : insertVideo}
						disabled={lastMediaModal === "image" ? !imageSrc.trim() : !videoSrc.trim()}
					>
						Insert
					</GhostButton>
				</div>
			</MenuPanel>
		</div>
	);
}
