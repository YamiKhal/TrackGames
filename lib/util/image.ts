import "server-only";

import { deflateSync } from "node:zlib";

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

        const entry: number[] | null = dictionary[code] ?? (code === nextCode && previous ? [...previous, previous[0]] : null);

        if (!entry) break;

        pixels.push(...entry);

        if (previous && nextCode < 4096) {
            dictionary[nextCode++] = [...previous, entry[0]];

            if (nextCode === (1 << codeSize) && codeSize < 12) {
                codeSize++;
            }
        }

        previous = entry;
    }

    return pixels.slice(0, pixelCount);
}

export function gifFirstFrameToPngDataUrl(buffer: ArrayBuffer) {
    const bytes = new Uint8Array(buffer);

    if (String.fromCharCode(...bytes.subarray(0, 3)) !== "GIF") return null;

    let offset = 6;
    const screenWidth = bytes[offset] | (bytes[offset + 1] << 8);
    const screenHeight = bytes[offset + 2] | (bytes[offset + 3] << 8);
    const packed = bytes[offset + 4];
    const hasGlobalColorTable = Boolean(packed & 0x80);
    const globalColorCount = 1 << ((packed & 0x07) + 1);
    let globalColors: number[][] = [];
    let transparentIndex: number | null = null;

    offset += 7;

    if (hasGlobalColorTable) {
        globalColors = Array.from({ length: globalColorCount }, (_, index) => {
            const colorOffset = offset + index * 3;

            return [bytes[colorOffset], bytes[colorOffset + 1], bytes[colorOffset + 2]];
        });
        offset += globalColorCount * 3;
    }

    while (offset < bytes.length) {
        const block = bytes[offset++];

        if (block === 0x21) {
            const label = bytes[offset++];

            if (label === 0xf9) {
                const blockSize = bytes[offset++];
                const flags = bytes[offset];
                const transparent = bytes[offset + 3];

                transparentIndex = flags & 1 ? transparent : null;
                offset += blockSize + 1;
            } else {
                const result = readGifSubBlocks(bytes, offset);
                offset = result.offset;
            }
            continue;
        }

        if (block !== 0x2c) break;

        const left = bytes[offset] | (bytes[offset + 1] << 8);
        const top = bytes[offset + 2] | (bytes[offset + 3] << 8);
        const width = bytes[offset + 4] | (bytes[offset + 5] << 8);
        const height = bytes[offset + 6] | (bytes[offset + 7] << 8);
        const imagePacked = bytes[offset + 8];
        const hasLocalColorTable = Boolean(imagePacked & 0x80);
        const interlaced = Boolean(imagePacked & 0x40);
        const localColorCount = 1 << ((imagePacked & 0x07) + 1);
        let colors = globalColors;

        offset += 9;

        if (hasLocalColorTable) {
            colors = Array.from({ length: localColorCount }, (_, index) => {
                const colorOffset = offset + index * 3;

                return [bytes[colorOffset], bytes[colorOffset + 1], bytes[colorOffset + 2]];
            });
            offset += localColorCount * 3;
        }

        const minCodeSize = bytes[offset++];
        const imageData = readGifSubBlocks(bytes, offset);
        const decoded = decodeGifLzw(minCodeSize, imageData.data, width * height);
        const indices = new Array<number>(width * height);

        if (interlaced) {
            let sourceRow = 0;

            for (const [start, step] of [[0, 8], [4, 8], [2, 4], [1, 2]]) {
                for (let row = start; row < height; row += step) {
                    for (let column = 0; column < width; column++) {
                        indices[row * width + column] = decoded[sourceRow * width + column] ?? 0;
                    }
                    sourceRow++;
                }
            }
        } else {
            for (let index = 0; index < width * height; index++) {
                indices[index] = decoded[index] ?? 0;
            }
        }

        const canvas = new Uint8Array(screenWidth * screenHeight * 4);

        for (let index = 0; index < indices.length; index++) {
            const colorIndex = indices[index];
            const x = left + (index % width);
            const y = top + Math.floor(index / width);
            const target = (y * screenWidth + x) * 4;
            const color = colors[colorIndex] ?? [0, 0, 0];

            canvas[target] = color[0];
            canvas[target + 1] = color[1];
            canvas[target + 2] = color[2];
            canvas[target + 3] = colorIndex === transparentIndex ? 0 : 255;
        }

        return rgbaToPngDataUrl(screenWidth, screenHeight, canvas);
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
