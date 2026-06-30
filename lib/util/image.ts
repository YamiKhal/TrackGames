import "server-only";

import { deflateSync } from "node:zlib";

type GifColorTable = number[][];

type GifHeader = {
	screenWidth: number;
	screenHeight: number;
	hasGlobalColorTable: boolean;
	globalColorCount: number;
	offset: number;
};

type GifImageDescriptor = {
	left: number;
	top: number;
	width: number;
	height: number;
	interlaced: boolean;
	colors: GifColorTable;
	offset: number;
};

function crc32(bytes: Uint8Array) {
	let crc = 0xffffffff;

	for (const byte of bytes) {
		crc ^= byte;

		for (let bit = 0; bit < 8; bit++) {
			crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
		}
	}

	return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data = new Uint8Array()) {
	const typeBytes = Buffer.from(type);
	const chunk = Buffer.alloc(12 + data.length);

	chunk.writeUInt32BE(data.length, 0);
	typeBytes.copy(chunk, 4);
	Buffer.from(data).copy(chunk, 8);
	chunk.writeUInt32BE(crc32(chunk.subarray(4, 8 + data.length)), 8 + data.length);

	return chunk;
}

function rgbaToPngDataUrl(width: number, height: number, rgba: Uint8Array) {
	const ihdr = Buffer.alloc(13);
	const scanlines = Buffer.alloc((width * 4 + 1) * height);

	ihdr.writeUInt32BE(width, 0);
	ihdr.writeUInt32BE(height, 4);
	ihdr[8] = 8;
	ihdr[9] = 6;

	for (let row = 0; row < height; row++) {
		const scanlineOffset = row * (width * 4 + 1);

		scanlines[scanlineOffset] = 0;
		Buffer.from(rgba.subarray(row * width * 4, (row + 1) * width * 4)).copy(scanlines, scanlineOffset + 1);
	}

	return `data:image/png;base64,${Buffer.concat([
		Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
		pngChunk("IHDR", ihdr),
		pngChunk("IDAT", deflateSync(scanlines)),
		pngChunk("IEND"),
	]).toString("base64")}`;
}

function readGifSubBlocks(bytes: Uint8Array, offset: number) {
	const blocks: number[] = [];
	let cursor = offset;

	while (cursor < bytes.length) {
		const size = bytes[cursor++];

		if (size === 0) break;

		for (let index = 0; index < size && cursor < bytes.length; index++) {
			blocks.push(bytes[cursor++]);
		}
	}

	return { data: Uint8Array.from(blocks), offset: cursor };
}

function readGifHeader(bytes: Uint8Array): GifHeader | null {
	if (String.fromCodePoint(...bytes.subarray(0, 3)) !== "GIF") return null;

	const offset = 6;
	const screenHeight = bytes[offset + 2] | (bytes[offset + 3] << 8);
	const screenWidth = bytes[offset] | (bytes[offset + 1] << 8);
	const packed = bytes[offset + 4];

	return {
		globalColorCount: 1 << ((packed & 0x07) + 1),
		hasGlobalColorTable: Boolean(packed & 0x80),
		screenHeight,
		screenWidth,
		offset: offset + 7,
	};
}

function readGifColorTable(bytes: Uint8Array, offset: number, count: number) {
	const colors = Array.from({ length: count }, (_, index) => {
		const colorOffset = offset + index * 3;

		return [bytes[colorOffset], bytes[colorOffset + 1], bytes[colorOffset + 2]];
	});

	return { colors, offset: offset + count * 3 };
}

function readGifExtension(bytes: Uint8Array, offset: number, currentTransparentIndex: number | null) {
	const label = bytes[offset++];

	if (label !== 0xf9) {
		return {
			transparentIndex: currentTransparentIndex,
			offset: readGifSubBlocks(bytes, offset).offset,
		};
	}

	const blockSize = bytes[offset++];
	const flags = bytes[offset];
	const transparent = bytes[offset + 3];

	return {
		transparentIndex: flags & 1 ? transparent : null,
		offset: offset + blockSize + 1,
	};
}

function readGifImageDescriptor(bytes: Uint8Array, offset: number, globalColors: GifColorTable): GifImageDescriptor {
	const left = bytes[offset] | (bytes[offset + 1] << 8);
	const top = bytes[offset + 2] | (bytes[offset + 3] << 8);
	const width = bytes[offset + 4] | (bytes[offset + 5] << 8);
	const height = bytes[offset + 6] | (bytes[offset + 7] << 8);
	const imagePacked = bytes[offset + 8];
	const hasLocalColorTable = Boolean(imagePacked & 0x80);
	const localColorCount = 1 << ((imagePacked & 0x07) + 1);
	const colorTableOffset = offset + 9;
	const colorTable = hasLocalColorTable ? readGifColorTable(bytes, colorTableOffset, localColorCount) : null;

	return {
		left,
		top,
		height,
		width,
		interlaced: Boolean(imagePacked & 0x40),
		colors: colorTable?.colors ?? globalColors,
		offset: colorTable?.offset ?? colorTableOffset,
	};
}

function entryCode(dictionary: number[][], code: number, nextCode: number, previous: number[] | null) {
	return dictionary[code] ?? (code === nextCode && previous ? [...previous, previous[0]] : null);
}

function decodeGifLzw(minCodeSize: number, data: Uint8Array, pixelCount: number) {
	const clearCode = 1 << minCodeSize;
	const endCode = clearCode + 1;
	let codeSize = minCodeSize + 1;
	let nextCode = endCode + 1;
	let bitOffset = 0;
	let previous: number[] | null = null;
	let dictionary: number[][] = [];
	const pixels: number[] = [];

	function resetDictionary() {
		dictionary = Array.from({ length: clearCode }, (_, index) => [index]);
		dictionary[clearCode] = [];
		dictionary[endCode] = [];
		codeSize = minCodeSize + 1;
		nextCode = endCode + 1;
		previous = null;
	}

	function readCode() {
		let code = 0;

		for (let bit = 0; bit < codeSize; bit++) {
			const byte = data[bitOffset >> 3] ?? 0;

			code |= ((byte >> (bitOffset & 7)) & 1) << bit;
			bitOffset++;
		}

		return code;
	}

	resetDictionary();

	while (pixels.length < pixelCount && bitOffset < data.length * 8) {
		const code = readCode();

		if (code === clearCode) {
			resetDictionary();
			continue;
		}

		if (code === endCode) break;

		const entry: number[] | null = entryCode(dictionary, code, nextCode, previous);

		if (!entry) break;

		pixels.push(...entry);

		if (previous && nextCode < 4096) {
			dictionary[nextCode++] = [...previous, entry[0]];

			if (nextCode === 1 << codeSize && codeSize < 12) {
				codeSize++;
			}
		}

		previous = entry;
	}

	return pixels.slice(0, pixelCount);
}

function gifFrameIndices(width: number, height: number, interlaced: boolean, decoded: number[]) {
	const indices = new Array<number>(width * height);

	if (!interlaced) {
		for (let index = 0; index < width * height; index++) {
			indices[index] = decoded[index] ?? 0;
		}

		return indices;
	}

	let sourceRow = 0;

	for (const [start, step] of [
		[0, 8],
		[4, 8],
		[2, 4],
		[1, 2],
	]) {
		for (let row = start; row < height; row += step) {
			for (let column = 0; column < width; column++) {
				indices[row * width + column] = decoded[sourceRow * width + column] ?? 0;
			}
			sourceRow++;
		}
	}

	return indices;
}

function gifFrameToCanvas(screenWidth: number, screenHeight: number, frame: GifImageDescriptor, indices: number[], transparentIndex: number | null) {
	const canvas = new Uint8Array(screenWidth * screenHeight * 4);

	for (let index = 0; index < indices.length; index++) {
		const colorIndex = indices[index];
		const x = frame.left + (index % frame.width);
		const y = frame.top + Math.floor(index / frame.width);
		const target = (y * screenWidth + x) * 4;
		const color = frame.colors[colorIndex] ?? [0, 0, 0];

		canvas[target] = color[0];
		canvas[target + 1] = color[1];
		canvas[target + 2] = color[2];
		canvas[target + 3] = colorIndex === transparentIndex ? 0 : 255;
	}

	return canvas;
}

export function gifFirstFrameToPngDataUrl(buffer: ArrayBuffer) {
	const bytes = new Uint8Array(buffer);
	const header = readGifHeader(bytes);

	if (!header) return null;

	let offset = header.offset;
	let globalColors: GifColorTable = [];
	let transparentIndex: number | null = null;

	if (header.hasGlobalColorTable) {
		const colorTable = readGifColorTable(bytes, offset, header.globalColorCount);

		globalColors = colorTable.colors;
		offset = colorTable.offset;
	}

	while (offset < bytes.length) {
		const block = bytes[offset++];

		if (block === 0x21) {
			const extension = readGifExtension(bytes, offset, transparentIndex);

			transparentIndex = extension.transparentIndex;
			offset = extension.offset;
			continue;
		}

		if (block !== 0x2c) break;

		const frame = readGifImageDescriptor(bytes, offset, globalColors);
		offset = frame.offset;

		const minCodeSize = bytes[offset++];
		const imageData = readGifSubBlocks(bytes, offset);
		const decoded = decodeGifLzw(minCodeSize, imageData.data, frame.width * frame.height);
		const indices = gifFrameIndices(frame.width, frame.height, frame.interlaced, decoded);
		const canvas = gifFrameToCanvas(header.screenWidth, header.screenHeight, frame, indices, transparentIndex);

		return rgbaToPngDataUrl(header.screenWidth, header.screenHeight, canvas);
	}

	return null;
}

export async function resolveStillImage(src: string | null | undefined) {
	const path = src?.toLowerCase().split("?")[0];

	if (!src || path?.endsWith(".webp")) return null;
	if (!path?.endsWith(".gif")) return src;

	try {
		const response = await fetch(src);

		if (!response.ok) return null;

		return gifFirstFrameToPngDataUrl(await response.arrayBuffer());
	} catch {
		return null;
	}
}
