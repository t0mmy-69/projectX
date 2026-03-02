#!/usr/bin/env node
/**
 * NarrativeOS Chrome Extension Build Script
 * - Generates PNG icons (16, 48, 128px) programmatically — no dependencies
 * - Copies all extension files to dist/
 * - Creates a .zip file ready for Chrome Web Store or manual install
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execSync } = require('child_process');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const EXT_DIST = path.join(DIST, 'extension');

// ─── PNG Icon Generator ────────────────────────────────────────────────────

/**
 * CRC32 lookup table for PNG chunks
 */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

/**
 * Creates a NarrativeOS icon PNG:
 * - Purple (#814ac8) rounded square background
 * - White "✦" style sparkle mark in center
 */
function createIconPNG(size) {
  const BGR = [8, 8, 8];          // background: near-black #080808
  const PRIMARY = [129, 74, 200]; // purple #814ac8
  const WHITE = [255, 255, 255];

  const rowSize = 1 + size * 3; // filter byte + RGB
  const raw = Buffer.alloc(size * rowSize);

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.42;          // icon circle/square radius
  const cornerR = size * 0.22;         // rounded corner radius
  const innerR = size * 0.18;          // white dot radius

  for (let y = 0; y < size; y++) {
    raw[y * rowSize] = 0; // filter type: None
    for (let x = 0; x < size; x++) {
      const offset = y * rowSize + 1 + x * 3;

      // Rounded rectangle test (simplified)
      const dx = Math.abs(x - cx);
      const dy = Math.abs(y - cy);
      const inRect = dx <= radius && dy <= radius;
      const inCorner = dx > (radius - cornerR) && dy > (radius - cornerR);
      const cornerDist = Math.sqrt((dx - (radius - cornerR)) ** 2 + (dy - (radius - cornerR)) ** 2);
      const inRounded = inRect && (!inCorner || cornerDist <= cornerR);

      // White center sparkle (circle)
      const distFromCenter = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const inCenter = distFromCenter <= innerR;

      // Cross/sparkle arms
      const armW = size * 0.055;
      const inHArm = Math.abs(y - cy) <= armW && dx <= radius * 0.75;
      const inVArm = Math.abs(x - cx) <= armW && dy <= radius * 0.75;
      const inSparkle = inCenter || inHArm || inVArm;

      let color;
      if (inRounded) {
        color = inSparkle ? WHITE : PRIMARY;
      } else {
        color = BGR;
      }

      raw[offset]     = color[0];
      raw[offset + 1] = color[1];
      raw[offset + 2] = color[2];
    }
  }

  const compressed = zlib.deflateSync(raw);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type: RGB

  const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    PNG_SIG,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0))
  ]);
}

// ─── Build Steps ───────────────────────────────────────────────────────────

function step(msg) { console.log(`\n  → ${msg}`); }
function ok(msg)   { console.log(`  ✓ ${msg}`); }
function fail(msg) { console.error(`  ✗ ${msg}`); process.exit(1); }

console.log('\n╔══════════════════════════════════════╗');
console.log('║  NarrativeOS Extension Build v1.0   ║');
console.log('╚══════════════════════════════════════╝');

// 1. Clean & create dist
step('Cleaning dist/...');
if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true });
fs.mkdirSync(EXT_DIST, { recursive: true });
fs.mkdirSync(path.join(EXT_DIST, 'assets'), { recursive: true });
ok('dist/ created');

// 2. Generate icons
step('Generating icons...');
const iconSizes = [16, 48, 128];
for (const size of iconSizes) {
  const png = createIconPNG(size);
  const iconPath = path.join(EXT_DIST, 'assets', `icon-${size}.png`);
  fs.writeFileSync(iconPath, png);
  ok(`icon-${size}.png (${png.length} bytes)`);
}

// 3. Copy extension files
step('Copying extension files...');
const FILES_TO_COPY = [
  'manifest.json',
  'background.js',
  'content.js',
  'popup.html',
  'popup.js',
  'options.html',
  'options.js',
  'styles.css',
];

for (const file of FILES_TO_COPY) {
  const src = path.join(ROOT, file);
  const dst = path.join(EXT_DIST, file);
  if (!fs.existsSync(src)) {
    console.log(`  ! skipping ${file} (not found)`);
    continue;
  }
  fs.copyFileSync(src, dst);
  ok(file);
}

// 4. Create zip
step('Creating zip archive...');
const zipPath = path.join(DIST, 'narrativeos-extension.zip');
try {
  execSync(`cd "${EXT_DIST}" && zip -r "${zipPath}" .`, { stdio: 'pipe' });
  const zipSize = (fs.statSync(zipPath).size / 1024).toFixed(1);
  ok(`narrativeos-extension.zip (${zipSize} KB)`);
} catch (e) {
  // zip not available on all systems; skip gracefully
  console.log('  ! zip command not available, skipping archive creation');
}

// 5. Summary
const allFiles = fs.readdirSync(EXT_DIST);
const assetFiles = fs.readdirSync(path.join(EXT_DIST, 'assets'));

console.log('\n╔══════════════════════════════════════╗');
console.log('║           BUILD COMPLETE ✓           ║');
console.log('╠══════════════════════════════════════╣');
console.log(`║  Output: extension/dist/extension/   ║`);
console.log(`║  Files: ${String(allFiles.length).padEnd(3)} + ${String(assetFiles.length).padEnd(2)} assets                ║`);
if (fs.existsSync(zipPath)) {
  console.log(`║  Zip: narrativeos-extension.zip      ║`);
}
console.log('╠══════════════════════════════════════╣');
console.log('║  HOW TO INSTALL IN CHROME:           ║');
console.log('║  1. chrome://extensions              ║');
console.log('║  2. Enable "Developer mode"          ║');
console.log('║  3. "Load unpacked"                  ║');
console.log('║  4. Select dist/extension/ folder    ║');
console.log('╚══════════════════════════════════════╝\n');
