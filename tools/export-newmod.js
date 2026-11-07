/* 导出模组 ID 为 newmod 的工程包（供用户解压到 newmod 目录）
   复用 demo-export.js 的 PNG 编码器，保证贴图是真实 PNG。
   用法：node tools/export-newmod.js [modid] [项目名] */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const dir = path.join(__dirname, '..');
require(path.join(dir, 'src/core.js'));
require(path.join(dir, 'src/zip.js'));
require(path.join(dir, 'src/usage.js'));
require(path.join(dir, 'src/wrapper.js'));
require(path.join(dir, 'src/export.js'));
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
    raw[off] = 0;
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
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]).toString('base64');
}

const modid = BF.slug(process.argv[2] || 'newmod');
const name = process.argv[3] || '新模组';
const state = BF.defaultProject(name, modid);
state.meta.modid = modid;
state.meta.pkg = 'com.' + modid;
state.meta.name = name;

const built = BF.buildProject(state, { png: pngBase64 });
const out = path.join(dir, modid + '-forge-1.20.1.zip');
fs.writeFileSync(out, BF.zipFiles(built.files));
console.log('written: ' + out);
console.log('files=' + built.files.length + ' java=' + built.stats.java +
  ' png=' + built.stats.textures + ' json=' + built.stats.json);
console.log('contains tutorial: ' + built.files.some(f => f.path.includes('使用教程')));
