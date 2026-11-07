/* Generate a real, downloadable demo of the exported Forge project from Node.
   Implements a minimal PNG encoder so textures are genuine PNG files. */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
require('./src/core.js');
require('./src/zip.js');
require('./src/usage.js');
require('./src/wrapper.js');
require('./src/export.js');
const BF = globalThis.BF;

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(BF.crc32(Buffer.concat([t, data])) >>> 0, 0);
  return Buffer.concat([len, t, data, crc]);
}
function pngBase64(tex) {
  const w = tex.w, h = tex.h, stride = w * 4 + 1;
  const raw = Buffer.alloc(stride * h);
  for (let y = 0; y < h; y++) {
    const off = y * stride;
    raw[off] = 0; // filter: none
    for (let x = 0; x < w; x++) {
      const i = off + 1 + x * 4;
      const col = tex.data[y * w + x];
      if (col) {
        const c = BF.hex2rgb(col);
        raw[i] = c[0]; raw[i+1] = c[1]; raw[i+2] = c[2]; raw[i+3] = 255;
      }
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // RGBA
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
  return png.toString('base64');
}

const state = BF.defaultProject();
const built = BF.buildProject(state, { png: pngBase64 });
const out = path.join(__dirname, 'starcraft-demo-forge-1.20.1.zip');
fs.writeFileSync(out, BF.zipFiles(built.files));
console.log('Demo project written: ' + out);
console.log(JSON.stringify(built.stats));
