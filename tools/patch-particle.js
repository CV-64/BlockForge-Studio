/* 给已导出的工程补上挖掘粒子贴图（textures.particle）。
   只改 assets/<modid>/models/block/*.json，不动任何 Java 源码与构建文件。
   用法：node patch-particle.js <工程目录> [modid] */
const fs = require('fs');
const path = require('path');
const dir = process.argv[2];
const modid = process.argv[3] || null;
if (!dir || !fs.existsSync(dir)) { console.error('usage: node patch-particle.js <工程目录> [modid]'); process.exit(1); }
const modelsDir = path.join(dir, 'assets');
let changed = 0, skipped = 0;
function walk(p, cb) {
  for (const n of fs.readdirSync(p)) {
    const f = path.join(p, n);
    const st = fs.statSync(f);
    if (st.isDirectory()) walk(f, cb); else cb(f);
  }
}
walk(modelsDir, (file) => {
  if (!/models[\\/]block[\\/].+\.json$/.test(file)) return;
  const j = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!j.textures) return;
  if (j.textures.particle) { skipped++; return; }
  if (j.parent === 'minecraft:block/cross') {
    j.textures.particle = j.textures.cross;            /* 十字模型：粒子用 cross 贴图 */
  } else if (j.textures.north) {
    j.textures.particle = '#north';                     /* cube 模型：粒子指向正面 */
  } else { skipped++; return; }
  fs.writeFileSync(file, JSON.stringify(j, null, 2) + '\n', 'utf8');
  changed++;
  console.log('patched: ' + path.relative(dir, file) + '  particle=' + j.textures.particle);
});
console.log('changed=' + changed + ' skipped=' + skipped);
