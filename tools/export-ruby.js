/* 导出「红宝石工艺 Ruby Craft」模组工程包。
   所有贴图手绘参考 Minecraft 原版像素风格：
   矿石=石头/深板岩底+宝石矿点，宝石=明亮式切割，工具/剑=原版对角朝向，
   护甲图标=原版头盔/胸甲/护腿/靴子形状，方块=原版宝石块倒角。
   复用 demo-export.js 的真实 PNG 编码器，保证贴图是真实 PNG。
   用法：node tools/export-ruby.js */
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

/* ---------- 真实 PNG 编码器（与 demo-export.js 一致） ---------- */
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
        raw[i] = c[0]; raw[i + 1] = c[1]; raw[i + 2] = c[2]; raw[i + 3] = 255;
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

/* ---------- 像素画辅助：字符串网格 -> 贴图 ---------- */
function mk(rows, map, w, h) {
  w = w || 16; h = h || 16;
  if (rows.length !== h) throw new Error('grid height ' + rows.length + ' != ' + h);
  const data = new Array(w * h).fill(null);
  rows.forEach((row, y) => {
    if (row.length !== w) throw new Error('row ' + y + ' width ' + row.length + ' != ' + w + ' : "' + row + '"');
    for (let x = 0; x < w; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      const col = map[ch];
      if (!col) throw new Error('row ' + y + ' col ' + x + ' unmapped char "' + ch + '"');
      data[y * w + x] = col;
    }
  });
  return { w, h, data };
}
function hash(x, y, s) {
  let n = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  n = (n ^ (n >> 13)) * 1274126177 | 0;
  return Math.abs(n ^ (n >> 16));
}

/* ---------- 调色板（参考原版宝石/矿石/木棍配色） ---------- */
const GEM = { O:'#551509', D:'#7e2013', S:'#b23222', M:'#e14b39', L:'#f4674f', H:'#ff9d8a' };
const WOOD = { x:'#5c3a1e', W:'#8b5a2b', w:'#a9793f' };
const STONE = ['#8a8a8a', '#7f7f7f', '#747474', '#6b6b6b', '#909090', '#777777'];
const DEEPSLATE = ['#55555c', '#4a4a51', '#414148', '#38383f', '#5c5c63', '#46464d'];

/* ---------- 宝石物品（明亮式切割，参考原版钻石/绿宝石） ---------- */
function gemTex() {
  const rows = [
    '................',
    '................',
    '....OOOOOOOO....',
    '...OHHHHHHHHO...',
    '..OHHHHHHHHHHO..',
    '..OHHLLLLLLHHO..',
    '..OLLLLLLLLLLO..',
    '..OLLLLLLLLLLO..',
    '..OMMMMMMMMMMO..',
    '...OMMMMMMMMO...',
    '...OSMMMMMMSO...',
    '....OSMMMMSO....',
    '....OSSMMSSO....',
    '.....OSSSSO.....',
    '......OSSO......',
    '.......OO.......'
  ];
  return mk(rows, GEM);
}

/* ---------- 粗红宝石（粗糙矿块，参考原版粗铁/粗金） ---------- */
function rawTex() {
  const rows = [
    '................',
    '................',
    '.....OO.........',
    '....OMLOO.......',
    '...OMLLOO.OO....',
    '..OMLLLMLOLO....',
    '..OMLLMMMMLLO...',
    '.OMLMMMMMMSLO...',
    '.OMMMMMMMSSO....',
    '.OSMMMMMSSO.....',
    '..OSMMSSSO......',
    '...OSSSSO.......',
    '....OOO.........',
    '................',
    '................',
    '................'
  ];
  return mk(rows, GEM);
}

/* ---------- 矿石（石头/深板岩噪声底 + 红宝石矿点，参考原版矿石） ---------- */
function oreTex(deep, seed) {
  const base = deep ? DEEPSLATE : STONE;
  const spots = deep
    ? [[3, 4], [10, 3], [6, 9], [12, 11], [2, 12], [9, 7]]
    : [[3, 3], [11, 4], [5, 10], [12, 11], [2, 12], [9, 8]];
  return BF.tex(function (x, y) {
    // 石头底：2x2 斑块噪声 + 少量细颗粒，接近原版石头纹理
    const px = Math.floor(x / 2), py = Math.floor(y / 2);
    let n = hash(px, py, seed) % base.length;
    if (hash(x, y, seed * 7 + 1) % 6 === 0) n = (n + 1) % base.length;
    let col = base[n];
    // 矿点：每个矿点是一个小钻石形宝石簇，带高光与阴影
    for (let i = 0; i < spots.length; i++) {
      const cx = spots[i][0], cy = spots[i][1];
      const dx = x - cx, dy = y - cy;
      if (dx === 0 && dy === -1) return GEM.L;
      if (dx === -1 && dy === 0) return GEM.H;
      if (dx === 0 && dy === 0) return GEM.M;
      if (dx === 1 && dy === 0) return GEM.S;
      if (dx === 0 && dy === 1) return GEM.S;
      if (dx === -1 && dy === -1) return GEM.L;
      if (dx === 1 && dy === 1) return GEM.D;
    }
    return col;
  });
}

/* ---------- 宝石块（倒角面板，参考原版钻石块） ---------- */
function blockTex() {
  return BF.tex(function (x, y) {
    if (x === 0 || y === 0 || x === 15 || y === 15) return GEM.D;
    if (x === 1 || y === 1) return GEM.H;
    if (x === 14 || y === 14) return GEM.S;
    // 内部：左上亮、右下暗的倒角面 + 对角刻面线
    const s = x + y;
    if (s === 15 || x === y) return GEM.L;
    if (s < 14) return ((x * 3 + y * 5) % 7 === 0) ? GEM.L : GEM.M;
    if (s > 16) return ((x * 5 + y * 3) % 7 === 0) ? GEM.M : GEM.S;
    return GEM.M;
  });
}

/* ---------- 工具/剑（原版对角朝向：柄在左下，头在右上） ---------- */
function handle(x, y, topT) {
  const s = x + y, t = x - y;
  if (s >= 14 && s <= 16 && t >= -10 && t <= topT) {
    if (s === 14) return WOOD.w;
    if (s === 15) return WOOD.W;
    return WOOD.x;
  }
  return null;
}
function swordTex() {
  return BF.tex(function (x, y) {
    const s = x + y, t = x - y;
    // 剑刃：沿反对角线，尖端在右上
    if (s >= 13 && s <= 16 && t >= -3 && t <= 12) {
      if (t >= 10 && s !== 14 && s !== 15) return null;
      if (t >= 12) return GEM.H;
      if (s === 13) return GEM.H;
      if (s === 14) return GEM.L;
      if (s === 15) return GEM.M;
      return GEM.S;
    }
    if (s === 17 && t >= -2 && t <= 8) return GEM.D;
    // 护手（垂直短横）
    if (t >= -5 && t <= -4 && s >= 10 && s <= 18) return (s <= 12 ? GEM.L : GEM.M);
    // 剑柄 + 剑首
    const h = handle(x, y, -6);
    if (h) return h;
    if (t >= -12 && t <= -10 && s >= 14 && s <= 16) return GEM.S;
    return null;
  });
}
function pickaxeTex() {
  return BF.tex(function (x, y) {
    // 镐头：顶部横杆 + 两端下弯的镐尖
    if (y === 2 && x >= 4 && x <= 11) return GEM.H;
    if (y === 3 && x >= 3 && x <= 12) return GEM.L;
    if (y === 4 && ((x >= 3 && x <= 5) || (x >= 10 && x <= 12))) return GEM.M;
    if (y === 4 && x >= 6 && x <= 9) return GEM.S;
    if (y === 5 && (x === 3 || x === 4 || x === 11 || x === 12)) return GEM.S;
    if (y === 5 && x >= 7 && x <= 8) return GEM.D;
    const h = handle(x, y, 1);
    if (h) return h;
    return null;
  });
}
function axeTex() {
  return BF.tex(function (x, y) {
    // 斧头：右上的楔形斧刃
    if (y === 2 && x >= 7 && x <= 10) return GEM.H;
    if (y === 3 && x >= 6 && x <= 11) return GEM.L;
    if (y === 4 && x >= 5 && x <= 12) return GEM.M;
    if (y === 5 && x >= 5 && x <= 11) return GEM.M;
    if (y === 6 && x >= 6 && x <= 10) return GEM.S;
    if (y === 7 && x >= 7 && x <= 9) return GEM.D;
    const h = handle(x, y, 0);
    if (h) return h;
    return null;
  });
}
function shovelTex() {
  return BF.tex(function (x, y) {
    // 锹头：顶部圆铲
    if (y === 2 && x >= 6 && x <= 9) return GEM.H;
    if (y === 3 && x >= 5 && x <= 10) return GEM.L;
    if (y === 4 && x >= 5 && x <= 10) return GEM.M;
    if (y === 5 && x >= 5 && x <= 10) return GEM.M;
    if (y === 6 && x >= 6 && x <= 9) return GEM.S;
    if (y === 7 && x >= 7 && x <= 8) return GEM.D;
    const h = handle(x, y, 0);
    if (h) return h;
    return null;
  });
}
function hoeTex() {
  return BF.tex(function (x, y) {
    // 锄头：顶部横刃 + 左端下弯
    if (y === 3 && x >= 5 && x <= 11) return GEM.H;
    if (y === 4 && x >= 5 && x <= 11) return GEM.L;
    if (y === 5 && x >= 5 && x <= 7) return GEM.M;
    if (y === 6 && x >= 5 && x <= 6) return GEM.S;
    if (y === 4 && x >= 8 && x <= 9) return GEM.S;
    const h = handle(x, y, 1);
    if (h) return h;
    return null;
  });
}

/* ---------- 护甲物品图标（参考原版头盔/胸甲/护腿/靴子） ---------- */
function helmetTex() {
  const rows = [
    '................',
    '................',
    '.....OOOOOO.....',
    '....OHHHHHHO....',
    '...OHHHHHHHHO...',
    '..OHHMMMMMMHHO..',
    '..OHMMMMMMMMHO..',
    '..OMMMMMMMMMMO..',
    '..OMMOOOOOOMMO..',
    '..OMMO....OMMO..',
    '..OMMO....OMMO..',
    '..OMMOOOOOOMMO..',
    '...OMMMMMMMMO...',
    '....OOOOOOOO....',
    '................',
    '................'
  ];
  return mk(rows, GEM);
}
function chestplateTex() {
  const rows = [
    '................',
    '..OOO......OOO..',
    '.OHHHO....OHHHO.',
    '.OHHHOOOOOOHHHO.',
    '.OHMMMMMMMMMMHO.',
    '..OMMMMMMMMMMO..',
    '..OMMMMMMMMMMO..',
    '..OMMMMMMMMMMO..',
    '..OMMMMMMMMMMO..',
    '..OMMMMMMMMMMO..',
    '..OSMMMMMMMMSO..',
    '..OSSMMMMMMSSO..',
    '...OSSMMMMSSO...',
    '....OOOOOOOO....',
    '................',
    '................'
  ];
  return mk(rows, GEM);
}
function leggingsTex() {
  const rows = [
    '................',
    '................',
    '..OOOOOOOOOOOO..',
    '..OHHHHHHHHHHO..',
    '..OMMMMMMMMMMO..',
    '..OMMMMMMMMMMO..',
    '..OMMMOOOOMMMO..',
    '..OMMO....OMMO..',
    '..OMMO....OMMO..',
    '..OMMO....OMMO..',
    '..OMMO....OMMO..',
    '..OSMO....OMSO..',
    '..OSSO....OSSO..',
    '...OO......OO...',
    '................',
    '................'
  ];
  return mk(rows, GEM);
}
function bootsTex() {
  const rows = [
    '................',
    '................',
    '................',
    '..OOO......OOO..',
    '..OHO......OHO..',
    '..OMO......OMO..',
    '..OMO......OMO..',
    '..OMO......OMO..',
    '..OMMO....OMMO..',
    '..OMMMO..OMMMO..',
    '.OMMMMOOOOMMMMO.',
    '.OMMMMMMMMMMMMO.',
    '.OSSSSSSSSSSSSO.',
    '..OOOOOOOOOOOO..',
    '................',
    '................'
  ];
  return mk(rows, GEM);
}

/* ---------- 创造栏目图标 / 封面（红宝石主题） ---------- */
function tabIcon() {
  // 16x16 小宝石
  return gemTex();
}
function packIcon() {
  // 64x64 封面：深色背景 + 居中大红宝石 + 边框
  const small = gemTex();
  const data = new Array(64 * 64).fill(null);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    const m = Math.max(Math.abs(x - 31.5), Math.abs(y - 31.5));
    let bg = null;
    if (m <= 31) {
      bg = (m > 29) ? '#2a1410' : ((m > 27) ? '#7e2013' : '#1a0f0d');
    }
    data[y * 64 + x] = bg;
  }
  // 把 16x16 宝石放大到 40x40 居中（最近邻）
  for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) {
    const sx = Math.floor(x * 16 / 40), sy = Math.floor(y * 16 / 40);
    const col = small.data[sy * 16 + sx];
    if (col) data[(y + 12) * 64 + (x + 12)] = col;
  }
  return { w: 64, h: 64, data };
}

/* ---------- 组装项目 ---------- */
const state = BF.blankProject('红宝石工艺', 'ruby');
state.meta.name = '红宝石工艺';
state.meta.modid = 'ruby';
state.meta.pkg = 'com.ruby';
state.meta.author = 'BlockForge Studio';
state.meta.description = '红宝石工艺 Ruby Craft — 在主世界深处开采红宝石，锻造全套工具与护甲。使用 BlockForge Studio 可视化生成，贴图参考 Minecraft 原版风格。';
state.meta.creativeTab = { enabled: true, title: '红宝石工艺', icon: tabIcon() };
state.meta.packIcon = packIcon();

const els = [];
function add(e) { els.push(e); return e; }
function el(type, name, reg) {
  const e = BF.defaultElement(type);
  e.name = name; e.reg = reg; e.recipes = []; e.craftable = true;
  return e;
}
const G = (ref) => ref; // 语义占位
function craft(grid, count, shapeless) {
  return { id: BF.uid(), type: 'crafting', shapeless: !!shapeless, grid, count: count || 1, time: 200, xp: 0.5 };
}
function smelt(input, type, xp, time) {
  const g = [null, null, null, null, null, null, null, null, null];
  g[0] = input;
  return { id: BF.uid(), type: type || 'smelting', shapeless: false, grid: g, count: 1, time: time || 200, xp: xp == null ? 0.7 : xp };
}

/* 1) 红宝石矿石 */
const ore = add(el('block', '红宝石矿石', 'ruby_ore'));
ore.desc = '在主世界石头中自然生成的红宝石矿石';
ore.tab = 'building'; ore.hardness = 3; ore.resistance = 9; ore.tool = 'pickaxe';
ore.harvestLevel = 2; ore.sound = 'STONE'; ore.dropSelf = true; ore.mapColor = '#e14b39';
{
  const t = oreTex(false, 11);
  ore.textures = { top: t, bottom: t, front: t, back: t, left: t, right: t };
}
ore.ore = { enabled: true, preset: 'custom', size: 7, count: 8, minY: -16, maxY: 48,
  shape: 'uniform', targets: ['stone'], dimension: 'overworld', air: 0.2, step: 'underground_ores' };
ore.craftable = false;

/* 2) 深板岩红宝石矿石 */
const dore = add(el('block', '深板岩红宝石矿石', 'deepslate_ruby_ore'));
dore.desc = '生成在深板岩层的红宝石矿石';
dore.tab = 'building'; dore.hardness = 4.5; dore.resistance = 9; dore.tool = 'pickaxe';
dore.harvestLevel = 2; dore.sound = 'STONE'; dore.dropSelf = true; dore.mapColor = '#b23222';
{
  const t = oreTex(true, 23);
  dore.textures = { top: t, bottom: t, front: t, back: t, left: t, right: t };
}
dore.ore = { enabled: true, preset: 'custom', size: 7, count: 8, minY: -64, maxY: 8,
  shape: 'trapezoid', targets: ['deepslate'], dimension: 'overworld', air: 0.3, step: 'underground_ores' };
dore.craftable = false;

/* 3) 红宝石块 */
const block = add(el('block', '红宝石块', 'ruby_block'));
block.desc = '由九颗红宝石压缩而成的珍贵方块';
block.tab = 'building'; block.hardness = 5; block.resistance = 12; block.light = 3;
block.tool = 'pickaxe'; block.harvestLevel = 2; block.sound = 'METAL'; block.mapColor = '#e14b39';
{
  const t = blockTex();
  block.textures = { top: t, bottom: t, front: t, back: t, left: t, right: t };
}

/* 4) 粗红宝石 */
const raw = add(el('item', '粗红宝石', 'raw_ruby'));
raw.desc = '从矿石中开采出的未经打磨的红宝石';
raw.tab = 'materials'; raw.textures = { main: rawTex() };

/* 5) 红宝石 */
const gem = add(el('item', '红宝石', 'ruby'));
gem.desc = '璀璨夺目的珍贵宝石，可锻造工具与护甲';
gem.tab = 'materials'; gem.rarity = 'uncommon'; gem.textures = { main: gemTex() };

/* 6-9) 工具 */
function tool(name, reg, kind, tex, dmg, spd) {
  const e = add(el('tool', name, reg));
  e.tab = 'tools'; e.toolKind = ({ pickaxe: 'pickaxe', axe: 'axe', shovel: 'shovel', hoe: 'hoe' })[kind] || 'pickaxe';
  e.desc = '以红宝石锻造的' + ({ pickaxe: '镐', axe: '斧', shovel: '锹', hoe: '锄' })[e.toolKind];
  e.tier = 'custom'; e.durability = 1000; e.speed = spd; e.damage = dmg; e.attackSpeed = -2.8;
  e.harvestLevel = 3; e.enchantability = 12; e.repair = 'elem:' + gem.id;
  e.overrideAttributes = true; e.enchantable = true; e.repairable = true;
  e.textures = { main: tex };
  return e;
}
const pick = tool('红宝石镐', 'ruby_pickaxe', 'pickaxe', pickaxeTex(), 2, 7);
pick.fastTags = ['mineable_with_pickaxe', 'stone', 'deepslate']; pick.fastSpeed = 14;
pick.toolActions = ['PICKAXE_DIG'];
const axe = tool('红宝石斧', 'ruby_axe', 'axe', axeTex(), 5, 6.5);
axe.fastTags = ['mineable_with_axe', 'logs']; axe.fastSpeed = 14; axe.toolActions = ['AXE_STRIP'];
const shovel = tool('红宝石锹', 'ruby_shovel', 'shovel', shovelTex(), 1.5, 7);
shovel.fastTags = ['mineable_with_shovel', 'dirt', 'sand']; shovel.fastSpeed = 14; shovel.toolActions = ['SHOVEL_FLATTEN'];
const hoe = tool('红宝石锄', 'ruby_hoe', 'hoe', hoeTex(), 0, 7);
hoe.fastTags = ['mineable_with_hoe']; hoe.fastSpeed = 14; hoe.toolActions = ['HOE_TILL'];

/* 10) 剑 */
const sword = add(el('weapon', '红宝石剑', 'ruby_sword'));
sword.desc = '锋利无比的红宝石剑';
sword.tab = 'combat'; sword.tier = 'custom'; sword.durability = 1000; sword.damage = 6;
sword.attackSpeed = -2.4; sword.harvestLevel = 3; sword.enchantability = 12;
sword.repair = 'elem:' + gem.id; sword.overrideAttributes = true; sword.knockbackPower = 0.4;
sword.textures = { main: swordTex() };

/* 11-14) 护甲 */
function armor(name, reg, slot, def, dur, tex, effect) {
  const e = add(el('armor', name, reg));
  e.tab = 'combat'; e.armorSlot = slot;
  e.desc = '以红宝石锻造的' + ({ helmet: '头盔', chestplate: '胸甲', leggings: '护腿', boots: '靴子' })[slot];
  e.defense = def; e.toughness = 2; e.knockback = 0.1;
  e.durability = dur; e.enchantability = 12; e.repair = 'elem:' + gem.id;
  e.armorEffect = effect || 'none'; e.repairable = true;
  e.textures = { main: tex, armor1: BF.defaultArmorLayer(1, '#e14b39'), armor2: BF.defaultArmorLayer(2, '#b23222') };
  return e;
}
const helmet = armor('红宝石头盔', 'ruby_helmet', 'helmet', 3, 363, helmetTex(), 'night_vision');
const chest = armor('红宝石胸甲', 'ruby_chestplate', 'chestplate', 8, 528, chestplateTex());
const legs = armor('红宝石护腿', 'ruby_leggings', 'leggings', 6, 495, leggingsTex());
const boots = armor('红宝石靴子', 'ruby_boots', 'boots', 3, 429, bootsTex());

/* ---------- 配方（参考原版合成表） ---------- */
const R = 'elem:' + gem.id;
const stick = 'minecraft:stick';
// 红宝石块：3x3 宝石
block.recipes = [craft([R, R, R, R, R, R, R, R, R], 1)];
// 宝石：块 -> 9 宝石（无序）
gem.recipes = [craft(['elem:' + block.id, null, null, null, null, null, null, null, null], 9, true)];
// 粗红宝石：矿石 -> 粗红宝石（无序，模拟开采）
raw.recipes = [craft(['elem:' + ore.id, null, null, null, null, null, null, null, null], 1, true),
               craft(['elem:' + dore.id, null, null, null, null, null, null, null, null], 1, true)];
// 熔炼：矿石/粗红宝石 -> 宝石
gem.recipes.push(smelt('elem:' + ore.id, 'smelting', 1.0, 200));
gem.recipes.push(smelt('elem:' + dore.id, 'smelting', 1.0, 200));
gem.recipes.push(smelt('elem:' + raw.id, 'smelting', 0.7, 200));
gem.recipes.push(smelt('elem:' + ore.id, 'blasting', 1.0, 100));
gem.recipes.push(smelt('elem:' + raw.id, 'blasting', 0.7, 100));
// 镐：顶部 3 宝石 + 中间 2 木棍
pick.recipes = [craft([R, R, R, null, stick, null, null, stick, null], 1)];
// 斧：原版斧形
axe.recipes = [craft([R, R, null, R, stick, null, null, stick, null], 1)];
// 锹：1 宝石 + 2 木棍竖排
shovel.recipes = [craft([null, R, null, null, stick, null, null, stick, null], 1)];
// 锄：原版锄形
hoe.recipes = [craft([R, R, null, null, stick, null, null, stick, null], 1)];
// 剑：2 宝石竖排 + 1 木棍
sword.recipes = [craft([null, R, null, null, R, null, null, stick, null], 1)];
// 头盔：5 宝石
helmet.recipes = [craft([R, R, R, R, null, R, null, null, null], 1)];
// 胸甲：8 宝石
chest.recipes = [craft([R, null, R, R, R, R, R, R, R], 1)];
// 护腿：7 宝石
legs.recipes = [craft([R, R, R, R, null, R, R, null, R], 1)];
// 靴子：4 宝石
boots.recipes = [craft([R, null, R, R, null, R, null, null, null], 1)];

state.elements = els;
state.selected = gem.id;
BF.normalizeProject(state);

/* ---------- 导出 ---------- */
const built = BF.buildProject(state, { png: pngBase64 });
const out = path.join(dir, 'ruby-forge-1.20.1.zip');
fs.writeFileSync(out, BF.zipFiles(built.files));
console.log('written: ' + out);
console.log('files=' + built.files.length + ' java=' + built.stats.java +
  ' png=' + built.stats.textures + ' json=' + built.stats.json +
  ' recipes=' + built.stats.recipes + ' worldgen=' + built.stats.worldgen);
console.log('elements=' + els.length);
console.log('warnings=' + built.warnings.length);
built.warnings.forEach(w => console.log('  WARN: ' + w.replace(/<[^>]+>/g, '')));

/* 同时保存项目源文件，便于导入制作器继续编辑 */
const projOut = path.join(dir, 'ruby.mcmproj');
fs.writeFileSync(projOut, JSON.stringify(state, null, 2));
console.log('project: ' + projOut);