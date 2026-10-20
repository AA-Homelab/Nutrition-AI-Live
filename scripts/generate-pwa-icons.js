import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Minimal compliant PNG generator using built-in zlib
function createPng(width, height, r, g, b, isMaskable = false) {
  // RGBA buffer: 1 filter byte per scanline + (width * 4) bytes
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = isMaskable ? width * 0.45 : width * 0.42;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background gradient
      let bgR = 2, bgG = 44, bgB = 34; // #022c22
      if (y > height * 0.5) {
        bgR = 15; bgG = 23; bgB = 42; // #0f172a
      }

      if (dist < radius) {
        // Inner circle/emblem
        if (dist < radius * 0.55 && (x > centerX - radius * 0.35 && x < centerX + radius * 0.35)) {
          // Flame glow center (emerald/teal)
          rawData[pixelOffset] = 16;     // R
          rawData[pixelOffset + 1] = 185; // G (185)
          rawData[pixelOffset + 2] = 129; // B (129) #10b981
          rawData[pixelOffset + 3] = 255;
        } else {
          rawData[pixelOffset] = bgR + 15;
          rawData[pixelOffset + 1] = bgG + 35;
          rawData[pixelOffset + 2] = bgB + 25;
          rawData[pixelOffset + 3] = 255;
        }
      } else {
        rawData[pixelOffset] = bgR;
        rawData[pixelOffset + 1] = bgG;
        rawData[pixelOffset + 2] = bgB;
        rawData[pixelOffset + 3] = 255;
      }
    }
  }

  // Compress IDAT
  const compressed = zlib.deflateSync(rawData);

  // CRC32 table
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);

    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const combined = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(combined), 0);

    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type (RGBA)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write PWA Icons
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, 16, 185, 129));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, 16, 185, 129));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, 16, 185, 129, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, 16, 185, 129));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPng(48, 48, 16, 185, 129));

console.log('✅ Generated standard PNG icons in public/: 192px, 512px, maskable, and apple-touch-icon.png');
