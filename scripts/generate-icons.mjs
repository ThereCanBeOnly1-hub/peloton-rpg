// Generates simple solid-background PWA icons (no external deps) so the app is
// installable out of the box. Replace public/icons/*.png with real artwork
// whenever you like — the manifest just points at these paths.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

// Themed icon: a gold sword on a near-black stone field, with a bronze grip.
const BG = [0x16, 0x12, 0x0d]; // COLORS.bg stone
const GOLD = [0xd9, 0xa4, 0x41]; // COLORS.gold blade/guard/pommel
const BRONZE = [0x6b, 0x4f, 0x2e]; // COLORS.bronze grip + border

// Returns the RGB for pixel (x, y) of an `size`×`size` sword icon.
function pixelColor(x, y, size) {
  const cx = size / 2;
  const u = x / size;
  const v = y / size; // 0 = top
  const bladeTop = 0.13, tipEnd = 0.22, guardY = 0.60, guardH = 0.05;
  const gripEnd = 0.82, bladeHalf = 0.045 * size, guardHalf = 0.19 * size;
  const dx = Math.abs(x - cx);

  // Outer rounded border ring for definition.
  const m = 0.06 * size;
  if (x < m || y < m || x > size - m || y > size - m) return BRONZE;

  // Blade (with a tapered tip).
  if (v >= bladeTop && v < guardY) {
    let half = bladeHalf;
    if (v < tipEnd) half = bladeHalf * ((v - bladeTop) / (tipEnd - bladeTop)); // taper to point
    if (dx <= half) return GOLD;
  }
  // Crossguard.
  if (v >= guardY && v < guardY + guardH && dx <= guardHalf) return GOLD;
  // Grip.
  if (v >= guardY + guardH && v < gripEnd && dx <= 0.03 * size) return BRONZE;
  // Pommel.
  if (Math.hypot(x - cx, y - 0.85 * size) <= 0.05 * size) return GOLD;

  return BG;
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function makePng(size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour RGB
  // bytes 10-12 (compression, filter, interlace) stay 0

  const raw = Buffer.alloc(size * (size * 3 + 1));
  let p = 0;
  for (let y = 0; y < size; y++) {
    raw[p++] = 0; // filter byte: none
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixelColor(x, y, size);
      raw[p++] = r;
      raw[p++] = g;
      raw[p++] = b;
    }
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const size of [192, 512]) {
  writeFileSync(join(outDir, `icon-${size}.png`), makePng(size));
  console.log(`wrote public/icons/icon-${size}.png`);
}
