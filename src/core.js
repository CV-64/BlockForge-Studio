/* ============================================================
   BlockForge Studio — core: project library, data model, utilities
   ============================================================ */
(function (root) {
'use strict';
var BF = root.BF = root.BF || {};

/* ---------- constants ---------- */
BF.MC_VERSION = '1.20.1';
BF.FORGE_VERSION = '47.3.0';
BF.STORAGE_KEY = 'blockforge_project_v2';       // legacy single project
BF.LIB_KEY = 'blockforge_library_v1';            // multi project library

BF.TYPES = {
  block:      { label:'方块',     icon:'▣', color:'#7ac74f', texKeys:['top','bottom','front','back','left','right'], desc:'六面贴图、可设置矿物生成的放置方块' },
  workstation:{ label:'特殊工作站', icon:'⚒', color:'#4fc9c0', texKeys:['top','bottom','front','back','left','right'], desc:'带 UI 界面与配方的功能方块，可绘制 GUI 背景' },
  cluster:    { label:'晶簇',     icon:'✧', color:'#a887e8', texKeys:['main'], desc:'十字交叉模型，附着并生成在指定方块表面' },
  energy:     { label:'能量导管', icon:'⌁', color:'#4fc9c0', texKeys:['top','bottom','front','back','left','right'], desc:'传输单位能量（Forge Energy）的方块' },
  generator:  { label:'产能方块', icon:'✹', color:'#e8b64c', texKeys:['top','bottom','front','back','left','right'], desc:'产生并向相邻方块输出能量的方块' },
  item:       { label:'物品',     icon:'◆', color:'#e8b64c', texKeys:['main'], desc:'材料、食物、燃料与右键道具' },
  misc:       { label:'杂项物品', icon:'✦', color:'#f28b30', texKeys:['main'], desc:'药水、投掷物、护符等特殊物品' },
  tool:       { label:'工具',     icon:'⛏', color:'#5aa9e6', texKeys:['main'], desc:'镐 / 斧 / 锹 / 锄，完整 Tier 属性' },
  weapon:     { label:'武器',     icon:'⚔', color:'#e05c4b', texKeys:['main'], desc:'剑类近战武器与命中特效' },
  armor:      { label:'装备',     icon:'♜', color:'#a887e8', texKeys:['main','armor1','armor2'], desc:'头盔 / 胸甲 / 护腿 / 靴子 · 物品图标 + 两层穿戴皮肤可绘' },
  mob:        { label:'生物',     icon:'☠', color:'#e05c4b', texKeys:['skin','egg'], desc:'以生物蛋形式创建：建模、动画、AI、掉落与交易' }
};
BF.TYPE_ORDER = ['block','workstation','cluster','energy','generator','item','misc','tool','weapon','armor','mob'];
BF.TEX_LABEL = {
  main:'物品图标', top:'上面 up', bottom:'下面 down', front:'前面 / 北 north',
  back:'后面 / 南 south', left:'左面 / 西 west', right:'右面 / 东 east',
  skin:'生物皮肤（与模型 UV 严格对应）', egg:'刷怪蛋贴图',
  armor1:'穿戴皮肤 layer_1（头 / 身 / 靴 · 64×32）',
  armor2:'穿戴皮肤 layer_2（护腿 · 64×32）'
};
/* minecraft:block/cube 的纹理变量是 up/down/north/south/west/east。
   早期写成 top/bottom 会让上下面拿不到贴图 —— 游戏里表现为顶底面紫黑。 */
BF.FACE_FILE = { top:'up', bottom:'down', front:'north', back:'south', left:'west', right:'east' };

/* 16 dye base colours x 4 shades + grey ramp = 72 colours */
BF.PALETTE = (function () {
  var bases = ['#ffffff','#d9a87c','#e8a3d8','#7fc8f5','#f7e26b','#7ac74f','#f28bc4','#5a6270',
               '#9aa3ad','#4fc9c0','#5a7fd6','#a887e8','#3b5fc0','#8b5a2b','#4f8f31','#e05c4b','#1b1b22'];
  var out = [];
  [0.45,0.7,1,1.3].forEach(function (f) {
    bases.forEach(function (c) { out.push(BF.shade ? BF.shade(c,f) : c); });
  });
  return out;
})();
/* shade() is defined below; rebuild the palette after helpers exist */
BF._buildPalette = function () {
  var bases = ['#ffffff','#d9a87c','#e8a3d8','#7fc8f5','#f7e26b','#7ac74f','#f28bc4','#5a6270',
               '#9aa3ad','#4fc9c0','#5a7fd6','#a887e8','#3b5fc0','#8b5a2b','#4f8f31','#e05c4b','#1b1b22'];
  var out = [];
  [0.45,0.7,1,1.3].forEach(function (f) {
    bases.forEach(function (c) { out.push(BF.shade(c,f)); });
  });
  ['#000000','#202020','#404040','#606060','#808080','#a0a0a0','#c0c0c0','#ffffff',
   '#ffddbb','#ffe8cc','#fff3e0','#c7f5f0','#8fe3dc','#3a2f56','#2a2240','#0d1014'].forEach(function (c) { out.push(c); });
  BF.PALETTE = out;
};

BF.VANILLA = [
  'minecraft:iron_ingot','minecraft:gold_ingot','minecraft:diamond','minecraft:netherite_ingot',
  'minecraft:emerald','minecraft:stick','minecraft:coal','minecraft:charcoal','minecraft:redstone',
  'minecraft:cobblestone','minecraft:stone','minecraft:deepslate','minecraft:oak_planks','minecraft:oak_log',
  'minecraft:string','minecraft:leather','minecraft:iron_block','minecraft:gold_block','minecraft:diamond_block',
  'minecraft:crafting_table','minecraft:nether_star','minecraft:blaze_rod','minecraft:gold_nugget',
  'minecraft:iron_nugget','minecraft:amethyst_shard','minecraft:copper_ingot','minecraft:flint',
  'minecraft:feather','minecraft:gunpowder','minecraft:bone','minecraft:slime_ball','minecraft:obsidian',
  'minecraft:glass','minecraft:glowstone_dust','minecraft:lapis_lazuli','minecraft:quartz','minecraft:brick',
  'minecraft:paper','minecraft:book','minecraft:apple','minecraft:bread','minecraft:wheat','minecraft:egg',
  'minecraft:ender_pearl','minecraft:spider_eye','minecraft:magma_cream','minecraft:iron_pickaxe',
  'minecraft:diamond_sword','minecraft:iron_helmet','minecraft:water_bucket','minecraft:bone_meal',
  'minecraft:sugar','minecraft:blaze_powder','minecraft:ghast_tear','minecraft:phantom_membrane',
  'minecraft:scute','minecraft:prismarine_shard','minecraft:prismarine_crystals','minecraft:echo_shard',
  'minecraft:raw_iron','minecraft:raw_gold','minecraft:raw_copper','minecraft:clay_ball','minecraft:snowball',
  'minecraft:cobweb','minecraft:torch','minecraft:chest','minecraft:furnace','minecraft:anvil',
  'minecraft:netherrack','minecraft:end_stone','minecraft:tuff','minecraft:andesite','minecraft:diorite',
  'minecraft:granite','minecraft:calcite','minecraft:dripstone_block','minecraft:clay','minecraft:gravel',
  'minecraft:sand','minecraft:dirt','minecraft:grass_block','minecraft:golden_apple','minecraft:milk_bucket'
];
BF.VANILLA_NAMES = {
  'minecraft:iron_ingot':'铁锭','minecraft:gold_ingot':'金锭','minecraft:diamond':'钻石',
  'minecraft:netherite_ingot':'下界合金锭','minecraft:emerald':'绿宝石','minecraft:stick':'木棍',
  'minecraft:coal':'煤炭','minecraft:redstone':'红石粉','minecraft:cobblestone':'圆石',
  'minecraft:stone':'石头','minecraft:deepslate':'深板岩','minecraft:oak_planks':'橡木木板',
  'minecraft:oak_log':'橡木原木','minecraft:string':'线','minecraft:leather':'皮革',
  'minecraft:iron_block':'铁块','minecraft:gold_block':'金块','minecraft:diamond_block':'钻石块',
  'minecraft:crafting_table':'工作台','minecraft:nether_star':'下界之星','minecraft:blaze_rod':'烈焰棒',
  'minecraft:amethyst_shard':'紫水晶碎片','minecraft:copper_ingot':'铜锭','minecraft:flint':'燧石',
  'minecraft:feather':'羽毛','minecraft:gunpowder':'火药','minecraft:bone':'骨头',
  'minecraft:slime_ball':'黏液球','minecraft:obsidian':'黑曜石','minecraft:glass':'玻璃',
  'minecraft:glowstone_dust':'萤石粉','minecraft:lapis_lazuli':'青金石','minecraft:quartz':'下界石英',
  'minecraft:brick':'红砖','minecraft:paper':'纸','minecraft:book':'书','minecraft:apple':'苹果',
  'minecraft:bread':'面包','minecraft:wheat':'小麦','minecraft:egg':'鸡蛋','minecraft:ender_pearl':'末影珍珠',
  'minecraft:spider_eye':'蜘蛛眼','minecraft:magma_cream':'岩浆膏','minecraft:iron_pickaxe':'铁镐',
  'minecraft:diamond_sword':'钻石剑','minecraft:iron_helmet':'铁头盔','minecraft:blaze_powder':'烈焰粉',
  'minecraft:ghast_tear':'恶魂之泪','minecraft:echo_shard':'回响碎片','minecraft:gold_nugget':'金粒',
  'minecraft:iron_nugget':'铁粒','minecraft:charcoal':'木炭','minecraft:raw_iron':'粗铁',
  'minecraft:raw_gold':'粗金','minecraft:raw_copper':'粗铜','minecraft:clay_ball':'黏土球',
  'minecraft:bone_meal':'骨粉','minecraft:sugar':'糖','minecraft:water_bucket':'水桶',
  'minecraft:phantom_membrane':'幻翼膜','minecraft:scute':'鳞甲','minecraft:prismarine_shard':'海晶碎片',
  'minecraft:prismarine_crystals':'海晶砂粒','minecraft:snowball':'雪球','minecraft:cobweb':'蜘蛛网',
  'minecraft:torch':'火把','minecraft:chest':'箱子','minecraft:furnace':'熔炉','minecraft:anvil':'铁砧',
  'minecraft:netherrack':'下界岩','minecraft:end_stone':'末地石','minecraft:tuff':'凝灰岩',
  'minecraft:andesite':'安山岩','minecraft:diorite':'闪长岩','minecraft:granite':'花岗岩',
  'minecraft:calcite':'方解石','minecraft:dripstone_block':'滴水石块','minecraft:clay':'黏土',
  'minecraft:gravel':'砂砾','minecraft:sand':'沙子','minecraft:dirt':'泥土','minecraft:grass_block':'草方块',
  'minecraft:golden_apple':'金苹果','minecraft:milk_bucket':'奶桶','minecraft:lava_bucket':'熔岩桶'
};

/* ---------- reference tables (vanilla 1.20.1) ---------- */
BF.ORE_TARGETS = [
  {v:'stone',l:'主世界石头 (stone_ore_replaceables)'},
  {v:'deepslate',l:'深板岩 (deepslate_ore_replaceables)'},
  {v:'netherrack',l:'下界岩 (block_match)'},
  {v:'end_stone',l:'末地石 (block_match)'},
  {v:'tuff',l:'凝灰岩 (block_match)'},
  {v:'dirt',l:'泥土 (block_match)'},
  {v:'sand',l:'沙子 (block_match)'},
  {v:'gravel',l:'砂砾 (block_match)'}
];
BF.ORE_PRESETS = {
  custom:null,
  coal:   {size:17,count:20,minY:0,maxY:192,shape:'uniform',targets:['stone','deepslate'],dimension:'overworld',air:0},
  iron:   {size:9, count:20,minY:-64,maxY:72,shape:'trapezoid',targets:['stone','deepslate'],dimension:'overworld',air:0},
  diamond:{size:8, count:7, minY:-64,maxY:16,shape:'trapezoid',targets:['stone','deepslate'],dimension:'overworld',air:0.5},
  redstone:{size:8,count:8,minY:-64,maxY:16,shape:'uniform',targets:['stone','deepslate'],dimension:'overworld',air:0},
  quartz: {size:14,count:16,minY:10,maxY:117,shape:'uniform',targets:['netherrack'],dimension:'nether',air:0},
  debris: {size:3, count:2, minY:8,maxY:24,shape:'uniform',targets:['netherrack'],dimension:'nether',air:0}
};
BF.TOOL_ACTIONS = [
  {v:'AXE_STRIP',l:'斧：剥树皮'},{v:'AXE_SCRAPE',l:'斧：刮除氧化'},
  {v:'AXE_WAX_OFF',l:'斧：除蜡'},{v:'SHOVEL_FLATTEN',l:'锹：整平地面'},
  {v:'HOE_TILL',l:'锄：耕地'},{v:'PICKAXE_DIG',l:'镐：挖掘'},
  {v:'SHEARS_HARVEST',l:'剪刀：收割'},{v:'SWORD_DIG',l:'剑：快速破坏'}
];
BF.FAST_TAGS = [
  {v:'mineable_with_pickaxe',l:'可镐挖方块'},{v:'mineable_with_axe',l:'可斧挖方块'},
  {v:'mineable_with_shovel',l:'可锹挖方块'},{v:'mineable_with_hoe',l:'可锄挖方块'},
  {v:'logs',l:'原木'},{v:'leaves',l:'树叶'},{v:'dirt',l:'泥土类'},
  {v:'sand',l:'沙子类'},{v:'wool',l:'羊毛'},{v:'glass',l:'玻璃'},
  {v:'stone',l:'石头类'},{v:'deepslate',l:'深板岩类'},{v:'cobweb',l:'蜘蛛网'}
];
BF.INCORRECT_TAGS = [
  {v:'incorrect_for_wooden_tool',l:'木质级'},{v:'incorrect_for_stone_tool',l:'石质级'},
  {v:'incorrect_for_iron_tool',l:'铁质级'},{v:'incorrect_for_gold_tool',l:'金质级'},
  {v:'incorrect_for_diamond_tool',l:'钻石级'},{v:'incorrect_for_netherite_tool',l:'下界合金级'}
];
BF.USE_ACTIONS = [
  {v:'none',l:'无'},{v:'heal',l:'治疗自身'},{v:'teleport',l:'向前瞬移'},
  {v:'fireball',l:'发射火球'},{v:'lightning',l:'召唤闪电'},{v:'xp',l:'给予经验'},
  {v:'explosion',l:'产生爆炸'},{v:'potion',l:'给予状态效果'},
  {v:'clear_effects',l:'清除所有状态效果'},{v:'snowball',l:'投掷雪球'},
  {v:'sound',l:'播放升级音效'},{v:'extinguish',l:'熄灭自身火焰'},
  {v:'feed',l:'直接补充饥饿值'}
];
BF.MOB_EFFECTS = [
  {v:'none',l:'无'},{v:'speed',l:'速度'},{v:'strength',l:'力量'},
  {v:'regeneration',l:'生命恢复'},{v:'fire_resistance',l:'防火'},
  {v:'night_vision',l:'夜视'},{v:'invisibility',l:'隐身'},{v:'haste',l:'急迫'},
  {v:'jump',l:'跳跃提升'},{v:'water_breathing',l:'水下呼吸'},
  {v:'slow_falling',l:'缓降'},{v:'absorption',l:'伤害吸收'},
  {v:'resistance',l:'抗性提升'},{v:'saturation',l:'饱和'}
];

/* ---------- field definitions ---------- */
var OPT = function (arr) { return arr.map(function (o) {
  return typeof o === 'string' ? { v:o, l:o } : o; }); };
BF.FIELD_DEFS = [
  { k:'name', l:'显示名称', t:'text', g:'基本信息', all:true, help:'游戏中物品/方块显示的名称（写入语言文件）' },
  { k:'reg',  l:'注册名', t:'text', g:'基本信息', all:true, help:'只能用英文小写、数字、下划线' },
  { k:'desc', l:'提示文本', t:'textarea', g:'基本信息', all:true },
  { k:'tab',  l:'创造模式标签', t:'select', g:'基本信息', all:true, o:OPT([
      {v:'materials',l:'材料 / 杂项'},{v:'building',l:'建筑方块'},{v:'tools',l:'工具'},
      {v:'combat',l:'战斗'},{v:'food',l:'食物'},{v:'redstone',l:'红石'},{v:'decorations',l:'装饰'}]) },
  { k:'stack', l:'最大堆叠', t:'number', g:'基本信息', all:true, min:1, max:64 },
  { k:'rarity',l:'稀有度', t:'select', g:'基本信息', all:true, o:OPT([
      {v:'common',l:'普通'},{v:'uncommon',l:'非凡'},{v:'rare',l:'稀有'},{v:'epic',l:'史诗'}]) },
  { k:'glow',  l:'附魔光效', t:'check', g:'基本信息', all:true },
  { k:'fireResistant', l:'防火（免疫火焰/熔岩）', t:'check', g:'基本信息', all:true },
  { k:'itemModel', l:'手持 / 图标模型', t:'select', g:'基本信息', types:['item','misc','tool','weapon','armor'],
    o:OPT([{v:'auto',l:'自动（工具/武器用 handheld）'},{v:'generated',l:'平面图标 generated'},
           {v:'handheld',l:'握持模型 handheld'}]),
    help:'原版剑与工具使用 minecraft:item/handheld，手持时才是正确握持姿态；材料/食物用 item/generated' },

  { g:'方块物理', note:'硬度决定挖掘时间；发光等级 0~15；挖掘工具与等级写入方块标签 JSON。', types:['block','workstation'] },
  { k:'hardness', l:'硬度', t:'number', g:'方块物理', types:['block','workstation'], min:0, max:100, step:0.1 },
  { k:'resistance', l:'爆炸抗性', t:'number', g:'方块物理', types:['block','workstation'], min:0, max:2000, step:0.5 },
  { k:'light', l:'发光等级', t:'range', g:'方块物理', types:['block','workstation'], min:0, max:15 },
  { k:'sound', l:'音效类型', t:'select', g:'方块物理', types:['block','workstation'], o:OPT([
      {v:'STONE',l:'石头'},{v:'WOOD',l:'木头'},{v:'METAL',l:'金属'},{v:'GLASS',l:'玻璃'},
      {v:'GRASS',l:'草/泥土'},{v:'WOOL',l:'羊毛'},{v:'AMETHYST',l:'紫水晶'}]) },
  { k:'tool', l:'所需挖掘工具', t:'select', g:'方块物理', types:['block','workstation'], o:OPT([
      {v:'none',l:'无（徒手）'},{v:'pickaxe',l:'镐'},{v:'axe',l:'斧'},{v:'shovel',l:'锹'},{v:'hoe',l:'锄'}]) },
  { k:'harvestLevel', l:'挖掘等级', t:'select', g:'方块物理', types:['block','workstation','tool','weapon'], o:OPT([
      {v:0,l:'0 木/金'},{v:1,l:'1 石'},{v:2,l:'2 铁'},{v:3,l:'3 钻石'},{v:4,l:'4 下界合金'}]) },
  { k:'dropSelf', l:'破坏后掉落自身', t:'check', g:'方块物理', types:['block','workstation'] },
  { k:'flammable', l:'可燃', t:'check', g:'方块物理', types:['block','workstation'] },
  { k:'gravity', l:'受重力影响（沙砾类）', t:'check', g:'方块物理', types:['block','workstation'] },
  { k:'noCollision', l:'无碰撞（可穿过）', t:'check', g:'方块物理', types:['block','workstation'] },
  { k:'mapColor', l:'地图颜色', t:'color', g:'方块物理', types:['block','workstation'] },

  { g:'工作站逻辑', note:'GUI 槽位在「工作站界面」标签页拖拽设计；配方在「合成配方」中定义。', types:['workstation'] },
  { k:'guiTitle', l:'界面标题', t:'text', g:'工作站逻辑', types:['workstation'] },
  { k:'workTime', l:'处理耗时（游戏刻）', t:'number', g:'工作站逻辑', types:['workstation'], min:0, max:12000 },
  { k:'showProgress', l:'显示进度箭头', t:'check', g:'工作站逻辑', types:['workstation'] },
  { k:'showFuel', l:'显示燃料火焰', t:'check', g:'工作站逻辑', types:['workstation'] },

  { g:'基础数值', note:'自定义 Tier / ArmorMaterial；更多原版覆写在「工具属性」标签页。', types:['tool','weapon','armor'] },
  { k:'toolKind', l:'工具种类', t:'select', g:'基础数值', types:['tool'], o:OPT([
      {v:'pickaxe',l:'镐 Pickaxe'},{v:'axe',l:'斧 Axe'},{v:'shovel',l:'锹 Shovel'},{v:'hoe',l:'锄 Hoe'}]) },
  { k:'tier', l:'基础材料等级', t:'select', g:'基础数值', types:['tool','weapon'], o:OPT([
      {v:'custom',l:'自定义（使用下方数值）'},{v:'wood',l:'木'},{v:'stone',l:'石'},
      {v:'iron',l:'铁'},{v:'gold',l:'金'},{v:'diamond',l:'钻石'},{v:'netherite',l:'下界合金'}]) },
  { k:'durability', l:'耐久度', t:'number', g:'基础数值', types:['tool','weapon','armor'], min:1, max:10000 },
  { k:'speed', l:'挖掘速度', t:'number', g:'基础数值', types:['tool'], min:0, max:30, step:0.1 },
  { k:'damage', l:'攻击伤害加成', t:'number', g:'基础数值', types:['tool','weapon'], min:-10, max:50, step:0.5 },
  { k:'attackSpeed', l:'攻击速度修正', t:'number', g:'基础数值', types:['tool','weapon'], min:-4, max:10, step:0.1 },
  { k:'enchantability', l:'附魔能力', t:'number', g:'基础数值', types:['tool','weapon','armor'], min:0, max:50 },
  { k:'repair', l:'修复材料', t:'ref', g:'基础数值', types:['tool','weapon','armor'] },

  { g:'护甲属性', note:'防御值按槽位写入 ArmorMaterial 实现；穿戴效果在 inventoryTick() 中持续给予。', types:['armor'] },
  { k:'armorSlot', l:'装备槽位', t:'select', g:'护甲属性', types:['armor'], o:OPT([
      {v:'helmet',l:'头盔'},{v:'chestplate',l:'胸甲'},{v:'leggings',l:'护腿'},{v:'boots',l:'靴子'}]) },
  { k:'defense', l:'护甲值（该槽位）', t:'number', g:'护甲属性', types:['armor'], min:0, max:20 },
  { k:'toughness', l:'盔甲韧性', t:'number', g:'护甲属性', types:['armor'], min:0, max:20, step:0.5 },
  { k:'knockback', l:'击退抗性', t:'number', g:'护甲属性', types:['armor'], min:0, max:1, step:0.05 },
  { k:'armorEffect', l:'穿戴效果', t:'select', g:'护甲属性', types:['armor'], o:OPT(BF.MOB_EFFECTS) }
];

/* ---------- utilities ---------- */
BF.uid = function (p) { return (p||'e') + '_' + Math.random().toString(36).slice(2,9); };
BF.clone = function (o) { return JSON.parse(JSON.stringify(o)); };
BF.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
BF.slug = function (s) {
  var raw = String(s||'');
  var t = raw.toLowerCase().replace(/[^a-z0-9_]/g,'_').replace(/_+/g,'_').replace(/^_|_$/g,'');
  if (t) return t;
  /* 原文全是非法字符（如纯中文）时，用确定性的短 hash 保证同一输入永远得到
     同一注册名 —— 之前用 Math.random() 会导致每次导出 ID 都变 */
  var h = 5381;
  for (var i=0;i<raw.length;i++) { h = ((h<<5) + h + raw.charCodeAt(i)) >>> 0; }
  return 'custom_' + h.toString(36);
};
BF.pascal = function (s) {
  return String(BF.slug(s)).split('_').filter(Boolean).map(function (p) {
    return p.charAt(0).toUpperCase() + p.slice(1); }).join('');
};
BF.upper = function (s) { return String(BF.slug(s)).toUpperCase(); };
BF.hex2rgb = function (h) {
  var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h||'');
  return m ? [parseInt(m[1],16),parseInt(m[2],16),parseInt(m[3],16)] : [0,0,0];
};
BF.shade = function (hex, f) {
  var c = BF.hex2rgb(hex);
  return '#' + c.map(function (v) {
    return ('0' + Math.max(0,Math.min(255,Math.round(v*f))).toString(16)).slice(-2); }).join('');
};
BF.mix = function (a,b,t) {
  var x = BF.hex2rgb(a), y = BF.hex2rgb(b);
  return '#' + x.map(function(v,i){ return ('0'+Math.round(v+(y[i]-v)*t).toString(16)).slice(-2); }).join('');
};
BF.rgb2hsl = function (hex) {
  var c = BF.hex2rgb(hex).map(function (v) { return v/255; });
  var r=c[0],g=c[1],b=c[2], mx=Math.max(r,g,b), mn=Math.min(r,g,b), d=mx-mn;
  var l=(mx+mn)/2, s=d===0?0:d/(1-Math.abs(2*l-1)), h=0;
  if (d) {
    if (mx===r) h=((g-b)/d)%6; else if (mx===g) h=(b-r)/d+2; else h=(r-g)/d+4;
    h=h/6; if (h<0) h+=1;
  }
  return [h,s,l];
};
BF.hsl2rgb = function (h,s,l) {
  var c=(1-Math.abs(2*l-1))*s, x=c*(1-Math.abs((h*6)%2-1)), m=l-c/2, r=0,g=0,b=0;
  var seg=Math.floor(((h%1)+1)%1*6);
  if (seg===0){r=c;g=x;} else if(seg===1){r=x;g=c;} else if(seg===2){g=c;b=x;}
  else if(seg===3){g=x;b=c;} else if(seg===4){r=x;b=c;} else {r=c;b=x;}
  return '#' + [r,g,b].map(function(v){ return ('0'+Math.round((v+m)*255).toString(16)).slice(-2); }).join('');
};
BF.toast = function (msg, err) {
  var el = (typeof document !== 'undefined') ? document.getElementById('toast') : null;
  if (!el) return;
  el.textContent = msg; el.className = 'show' + (err ? ' err' : '');
  clearTimeout(BF._tt); BF._tt = setTimeout(function(){ el.className=''; }, 2600);
};
BF.saveFile = function (blob, filename) {
  var a = document.createElement('a'), url = URL.createObjectURL(blob);
  a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  setTimeout(function(){ document.body.removeChild(a); URL.revokeObjectURL(url); }, 1500);
};
BF.tex = function (fn, w, h) {
  w = w || 16; h = h || 16;
  var d = new Array(w*h).fill(null);
  for (var y=0;y<h;y++) for (var x=0;x<w;x++) d[y*w+x] = fn(x,y) || null;
  return { w:w, h:h, data:d };
};
BF.resizeTex = function (t, size) {
  var out = new Array(size*size).fill(null);
  for (var y=0;y<size;y++) for (var x=0;x<size;x++) {
    var sx = Math.min(t.w-1, Math.floor(x*t.w/size)), sy = Math.min(t.h-1, Math.floor(y*t.h/size));
    out[y*size+x] = t.data[sy*t.w+sx];
  }
  return { w:size, h:size, data:out };
};
BF._buildPalette();

/* ---------- procedural default textures (six faces) ---------- */
function oreTex(base, spot, seed) {
  return BF.tex(function (x,y) {
    var n = ((x*73 + y*151 + seed*29) % 17);
    var c = n < 3 ? BF.shade(base,1.12) : (n > 14 ? BF.shade(base,.86) : base);
    var clusters = [[3,3],[11,4],[5,10],[12,11],[2,12],[9,8]];
    for (var i=0;i<clusters.length;i++) {
      var cx = clusters[i][0]+((seed+i)%2), cy = clusters[i][1]+((seed*3+i)%2);
      if (x>=cx && x<=cx+2 && y>=cy && y<=cy+2) {
        if (x===cx && y===cy) return BF.shade(spot,1.35);
        if ((x+y+seed)%3===0) return BF.shade(spot,.78);
        return spot;
      }
    }
    return c;
  });
}
function runeTex(seed) {
  seed = seed || 0;
  return BF.tex(function (x,y) {
    var edge = x===0||y===0||x===15||y===15;
    if (edge) return (x+y+seed)%2 ? '#3a2f56' : '#2a2240';
    if ((x===2||x===13||y===2||y===13) && x>1&&x<14&&y>1&&y<14) return '#4fc9c0';
    var cx = Math.abs(x-7.5), cy = Math.abs(y-7.5);
    if ((cx<1&&cy<5) || (cy<1&&cx<5) || (cx+cy<5.2 && cx+cy>4.1)) return '#8fe3dc';
    if ((x*7+y*11+seed)%13===0) return '#6b3fa0';
    return '#1c1729';
  });
}
function iconSword() {
  return BF.tex(function (x,y) {
    var s=x+y,d=14-s,g=x-y+8;
    if (y<=12&&x>=3&&Math.abs(d)<=1) return d<=-1?'#f2f7ff':(d===0?'#c9d9ea':'#7d90a6');
    if (y<=11&&x>=4&&d===-2) return '#5a6a7d';
    if (Math.abs(g)<=1&&s>=12&&s<=18&&x>=1&&x<=8) return '#e8b64c';
    if (s>=15&&s<=18&&Math.abs(d-2)<=1&&x<=4) return '#8b5a2b';
    if (s>=19&&s<=21&&x<=3) return '#b98a4b';
    return null;
  });
}
function iconPick() {
  return BF.tex(function (x,y) {
    var head=(y===3&&x>=4&&x<=11)||(y===4&&x>=2&&x<=13)||
      (y===5&&((x>=2&&x<=4)||(x>=11&&x<=13)))||(y===6&&(x===2||x===13));
    if (head) return y===3?'#e6f2ff':(x<7?'#a9bed3':'#7d90a6');
    if (y>=5&&y<=15&&(x===7||x===8)) return x===7?'#b98a4b':'#8b5a2b';
    return null;
  });
}
function iconHelmet() {
  return BF.tex(function (x,y) {
    var a=(x-7.5)/5.6,b=(y-10)/7.2,e=a*a+b*b;
    if (y<=9&&e<=1) return y<4?'#e6f2ff':(x<7?'#a9bed3':'#7d90a6');
    if (y>=10&&y<=12&&x>=4&&x<=11) return (y===11&&(x===5||x===6||x===9||x===10))?'#4fc9c0':'#4a5868';
    if (y===13&&x>=5&&x<=10) return '#5a6a7d';
    return null;
  });
}
function iconIngot() {
  return BF.tex(function (x,y) {
    if (y>=6&&y<=10) {
      var l=y===6?5:(y===7?4:3), r=y===6?10:(y===7?11:12);
      if (x>=l&&x<=r) return y===6?'#e8b64c':(y===7?'#f7e26b':(y===10?'#9c6b1e':(x<7?'#e8b64c':'#c9922f')));
    }
    return null;
  });
}
function iconCharm() {
  return BF.tex(function (x,y) {
    var dx=x-7.5,dy=y-7.5,r=Math.sqrt(dx*dx+dy*dy);
    if (r<5.5&&r>3.6) return '#e8b64c';
    if (r<=3.6) {
      if (Math.abs(dx)<1||Math.abs(dy)<1) return '#f7e26b';
      return '#a887e8';
    }
    if (y<2&&x>6&&x<9) return '#5a3f1a';
    return null;
  });
}
/* ---------- mob (creature) helpers: parts, box UV layout, skin & egg textures ---------- */
BF.defaultMobParts = function () {
  /* 原版人形比例，y 向上、脚底 0。pivot 是旋转中心（肩/髋），
     offset 是盒子相对 pivot 的位置，避免使用绝对坐标导致手臂错位。 */
  return [
    { name:'head',     pivot:[-4,24,0], offset:[0,0,-4],    size:[8,8,8],  color:'#e8c39e' },
    { name:'body',     pivot:[-4,24,0], offset:[0,-12,-2],  size:[8,12,4], color:'#4f7fd6' },
    { name:'armRight', pivot:[-8,22,0], offset:[0,-10,-2],  size:[4,12,4], color:'#5c8ce0' },
    { name:'armLeft',  pivot:[4,22,0],  offset:[0,-10,-2],  size:[4,12,4], color:'#5c8ce0' },
    { name:'legRight', pivot:[-4,12,0], offset:[0,-12,-2],  size:[4,12,4], color:'#3a5f9c' },
    { name:'legLeft',  pivot:[0,12,0],  offset:[0,-12,-2],  size:[4,12,4], color:'#3a5f9c' }
  ];
};
/* 新建生物自带一段柔和的待机动画，避免「生成出来完全不动」。
   关键帧会烘焙进 Java 的 setupAnim，原版 EntityModel 直接生效。 */
BF.defaultMobFrames = function () {
  return [
    { part:'armLeft',  t:0, rx:0, ry:0, rz:-4 },
    { part:'armLeft',  t:1, rx:0, ry:0, rz:6 },
    { part:'armLeft',  t:2, rx:0, ry:0, rz:-4 },
    { part:'armRight', t:0, rx:0, ry:0, rz:4 },
    { part:'armRight', t:1, rx:0, ry:0, rz:-6 },
    { part:'armRight', t:2, rx:0, ry:0, rz:4 },
    { part:'head',     t:0, rx:0, ry:-5, rz:0 },
    { part:'head',     t:1, rx:0, ry:5, rz:0 },
    { part:'head',     t:2, rx:0, ry:-5, rz:0 }
  ];
};
/* Minecraft box UV layout: each cube needs 2*(d+w) x (d+h) pixels */
/* ---------- Blockbench 导入 ----------
   支持：
   · .bbmodel —— 解析其中 type=cube 的 elements 转为部件表（size/pivot/offset），
     含 animations 时一并返回（1.20.1 客户端 bones 格式，可直接写进导出工程）
   · .java —— Blockbench 的 Java 模型导出，原样交给导出器
   · 动画 JSON —— {animations:{...}} 结构
   坐标约定：Blockbench 与原版实体一致，y 向上、0 在脚底。 */
BF.parseBBModel = function (text) {
  var obj = JSON.parse(text);
  var used = {};
  function uniq(n) {
    n = String(n || 'part').toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^_+|_+$/g, '') || 'part';
    var base = n, i = 2;
    while (used[n]) { n = base + '_' + (i++); }
    used[n] = 1;
    return n;
  }
  function r3(v) { return Math.round(v * 1000) / 1000; }
  var parts = [];
  (obj.elements || []).forEach(function (el) {
    if (el.type && el.type !== 'cube') return;      /* 跳过 group 等，v1 只处理长方体 */
    if (!Array.isArray(el.from) || !Array.isArray(el.to)) return;
    var size = [
      Math.max(0.5, r3(el.to[0] - el.from[0])),
      Math.max(0.5, r3(el.to[1] - el.from[1])),
      Math.max(0.5, r3(el.to[2] - el.from[2]))];
    var pivot = Array.isArray(el.origin) && el.origin.length >= 3
      ? [r3(el.origin[0]), r3(el.origin[1]), r3(el.origin[2])]
      : [r3((el.from[0] + el.to[0]) / 2), r3(el.from[1]), r3((el.from[2] + el.to[2]) / 2)];
    parts.push({
      name: uniq(el.name),
      pivot: pivot,
      offset: [r3(el.from[0] - pivot[0]), r3(el.from[1] - pivot[1]), r3(el.from[2] - pivot[2])],
      size: size,
      color: '#8fb8e8'
    });
  });
  var anim = null;
  if (obj.animations && Object.keys(obj.animations).length) {
    anim = JSON.stringify({ animations: obj.animations }, null, 2);
  }
  return { parts: parts, animJson: anim, count: parts.length };
};
/* Blockbench 动画 JSON -> 编辑器关键帧。生成器会把这些帧烘焙进 Java 的 setupAnim，
   因为原版 EntityModel 根本不读取 .animation.json（之前只存不转换 = 动画永远无效）。 */
BF.animationJsonToFrames = function (text) {
  var obj;
  try { obj = typeof text === 'string' ? JSON.parse(text) : text; } catch (err) { return []; }
  if (!obj || typeof obj !== 'object') return [];
  var anims = obj.animations || { main:obj }, out = [];
  Object.keys(anims).forEach(function (an) {
    var bones = (anims[an] || {}).bones || {};
    Object.keys(bones).forEach(function (bone) {
      var rot = (bones[bone] || {}).rotation, pts = [];
      if (Array.isArray(rot)) {
        rot.forEach(function (kf) {
          if (Array.isArray(kf) && kf.length >= 2) pts.push([Number(kf[0]) || 0, kf[1]]);
          else if (kf && typeof kf === 'object' && kf.time != null) pts.push([Number(kf.time) || 0, kf.value]);
        });
      } else if (rot && typeof rot === 'object') {
        Object.keys(rot).forEach(function (t) { pts.push([Number(t) || 0, rot[t]]); });
      }
      pts.forEach(function (p) {
        var v = Array.isArray(p[1]) ? p[1] : (p[1] && p[1].value) || [0,0,0];
        out.push({
          part: String(bone || 'part').toLowerCase().replace(/[^a-z0-9_]/g,'_').replace(/^_+|_+$/g,'') || 'part',
          t: Math.round((Number(p[0]) || 0) * 1000) / 1000,
          rx: Math.round((Number(v[0]) || 0) * 100) / 100,
          ry: Math.round((Number(v[1]) || 0) * 100) / 100,
          rz: Math.round((Number(v[2]) || 0) * 100) / 100
        });
      });
    });
  });
  out.sort(function (a, b) {
    return a.part === b.part ? a.t - b.t : (a.part < b.part ? -1 : 1); });
  return out;
};

/* ---------- mob UV: 与原版 Cube 的 box-UV 展开严格一致 ----------
   每个盒子占 2*(w+d) × (h+d) 像素。贴图尺寸按部件总量自动取 64/128/256，
   保证所有 texOffs 都落在贴图内 —— 越界正是「生物紫黑乱码块」的根因。 */
BF.mobTextureSize = function (parts) {
  for (var size = 64; size <= 256; size *= 2) {
    var u = 0, v = 0, rowH = 0, ok = true;
    (parts || []).forEach(function (p) {
      var w = Math.max(1, Math.round(p.size[0])), h = Math.max(1, Math.round(p.size[1])),
          d = Math.max(1, Math.round(p.size[2]));
      var bw = 2*(w+d), bh = h+d;
      if (u > 0 && u + bw > size) { u = 0; v += rowH; rowH = 0; }
      if (u + bw > size || v + bh > size) ok = false;
      u += bw; rowH = Math.max(rowH, bh);
    });
    if (ok) return { w:size, h:size };
  }
  return { w:256, h:256 };
};
BF.mobUVLayout = function (parts, texW) {
  var W = texW || BF.mobTextureSize(parts).w;
  var u = 0, v = 0, rowH = 0, out = [];
  (parts || []).forEach(function (p) {
    var w = Math.max(1, Math.round(p.size[0])), h = Math.max(1, Math.round(p.size[1])),
        d = Math.max(1, Math.round(p.size[2]));
    var bw = 2*(w+d), bh = h+d;
    if (u > 0 && u + bw > W) { u = 0; v += rowH; rowH = 0; }
    out.push({ name:p.name, u:u, v:v, w:w, h:h, d:d,
      color:p.color || '#cccccc', pivot:p.pivot, offset:p.offset });
    u += bw; rowH = Math.max(rowH, bh);
  });
  out.texW = W; out.texH = Math.max(W, v + rowH);
  return out;
};
BF.mobSkinTexture = function (parts, texW, texH) {
  var sz = BF.mobTextureSize(parts);
  var W = texW || sz.w, H = texH || sz.h;
  var layout = BF.mobUVLayout(parts, W);
  var data = new Array(W*H).fill(null);
  function box(x, y, w, h, color, fade) {
    for (var j=0;j<h;j++) for (var i=0;i<w;i++) {
      var px=x+i, py=y+j;
      if (px<0||py<0||px>=W||py>=H) continue;
      data[py*W+px] = BF.shade(color, fade);
    }
  }
  layout.forEach(function (L) {
    var c = L.color, u = L.u, v = L.v, w = L.w, h = L.h, d = L.d;
    /* 先给整个 UV 矩形铺底色：无论原版各面如何取样，都不会出现未着色的紫黑像素 */
    box(u, v, 2*(w+d), h+d, c, 0.88);
    /* 再按原版 box UV 分区加明暗，方便在 UV 预览里辨认朝向 */
    box(u,           v+d, d, h, c, 0.74);
    box(u+d,         v,   w, d, c, 1.12);
    box(u+d,         v+d, w, h, c, 1.0);
    box(u+d+w,       v,   w, d, c, 0.78);
    box(u+d+w,       v+d, d, h, c, 0.82);
    box(u+2*d+w,     v+d, w, h, c, 0.92);
  });
  return { w:W, h:H, data:data };
};
BF.mobEggTexture = function (bg, spot) {
  return BF.tex(function (x,y) {
    var dx=(x-7.5)/7.2, dy=(y-7.5)/7.6, r=dx*dx+dy*dy;
    if (r > 1) return null;
    var s = ((x*3+y*5)%13===0) ? BF.shade(spot,0.75) : spot;
    return BF.mix(bg, s, Math.min(1, r*0.85));
  });
};
function energyFaceTex(kind, seed) {
  return BF.tex(function (x,y) {
    if (x===0||y===0||x===15||y===15) return '#141a1e';
    var base = kind === 'generator' ? '#4a4436' : '#25333a';
    var c = ((x*7+y*11+seed)%13===0) ? BF.shade(base,1.18) : base;
    if (kind === 'generator' && x>=3&&x<=12&&y>=3&&y<=12) {
      var d = Math.abs(x-7.5)+Math.abs(y-7.5);
      if (d<3.5) return '#ffe9a0';
      if (d<5.2) return '#e8732a';
      if (d<6.5) return '#8b3f16';
    }
    if ((x>=6&&x<=9) || (y>=6&&y<=9)) return (x===7||y===7) ? '#8fe3dc' : '#2f7f96';
    return c;
  });
}
function iconCluster() {
  return BF.tex(function (x,y) {
    var dx=Math.abs(x-7.5), dy=Math.abs(y-7.5);
    if (dx<1.5 && dy<7) return '#c9b0f5';
    if (dy<1.5 && dx<7) return '#a887e8';
    if (dx+dy<6 && (x+y)%2===0) return '#e9dcff';
    if (y>12 && x>6 && x<9) return '#6b3fa0';
    return null;
  });
}
/* ---------- brand assets: creative tab icon + jar cover (pack.png) ---------- */
/* 两者都是普通贴图对象 {w,h,data}，可直接用 PixelEditor 编辑、用 PNG 编码器导出 */
BF.defaultCreativeTabIcon = function () {
  return BF.tex(function (x, y) {
    var dx = Math.abs(x - 7.5), dy = Math.abs(y - 7.5);
    if (x < 1 || x > 14 || y < 1 || y > 14) return null;
    if (dx + dy < 3.2) return (dx < 1 && dy < 1) ? '#fff6c9' : '#ffd45e';
    if (dx < 1.2 || dy < 1.2) return '#e8a13c';
    if (dx + dy < 6.4) return '#8a5a2b';
    return '#3b2a1a';
  }, 16, 16);
};
BF.defaultPackIcon = function () {
  return BF.tex(function (x, y) {
    var dx = Math.abs(x - 31.5), dy = Math.abs(y - 31.5), m = Math.max(dx, dy);
    if (m > 30) return null;
    if (m > 27) return '#1b2230';
    if (m > 24) return '#e8b45a';
    if (dx + dy < 14) return ((x + y) % 8 < 4) ? '#fff1b8' : '#ffd45e';
    if (dx < 3 || dy < 3) return '#ffd45e';
    if (dx + dy < 27) return '#8a5a2b';
    return '#2c3d5a';
  }, 64, 64);
};
BF.defaultCreativeTab = function (name) {
  return { enabled:true, title:name || '', icon:BF.defaultCreativeTabIcon() };
};
/* 旧项目 / 外部导入的数据可能缺字段或尺寸不对，统一在这里补齐 */
BF.normalizeBrand = function (p) {
  var m = p.meta, n = m.name || m.modid || 'My Mod';
  if (!m.creativeTab || typeof m.creativeTab !== 'object') m.creativeTab = {};
  var ct = m.creativeTab;
  if (typeof ct.enabled !== 'boolean') ct.enabled = true;
  if (!ct.title) ct.title = n;
  if (!ct.icon || !Array.isArray(ct.icon.data) || ct.icon.data.length !== 256)
    ct.icon = BF.defaultCreativeTabIcon();
  if (!m.packIcon || !Array.isArray(m.packIcon.data) || m.packIcon.data.length !== 4096)
    m.packIcon = BF.defaultPackIcon();
  return p;
};
/* 原版护甲 UV 模板（64×32）。之前把 16×16 物品图标拉伸半张图，
   穿戴时贴图区域完全对不上，游戏里就是「皮肤层面乱码/花屏」。
   这里按 vanilla diamond_layer_1/2 的区域生成：头盔、胸甲、手臂、靴子 / 护腿。 */
/* 用显式构建避免每个像素重复计算 */
BF.defaultArmorLayer = function (layer, base) {
  var color = base || '#a887e8';
  var data = new Array(64 * 32).fill(null);
  function rect(x0, y0, w, h, shade) {
    for (var y = y0; y < y0 + h; y++) for (var x = x0; x < x0 + w; x++) {
      if (x < 0 || y < 0 || x >= 64 || y >= 32) continue;
      var f = shade * (((x + y) % 11 === 0) ? 0.88 : 1);
      data[y * 64 + x] = BF.shade(color, f);
    }
  }
  /* 每个身体部位是一个标准 box UV 展开：上/下、四个侧面 */
  function box(x0, y0, w, h) {
    var t = 4, main = Math.max(4, h);
    rect(x0 + w, y0, w, t, 1.0);                 // 顶面
    rect(x0 + w * 2, y0, w, t, 0.66);           // 底面
    rect(x0, y0 + t, w, main, 0.8);             // 右侧
    rect(x0 + w, y0 + t, w, main, 1.0);         // 正面
    rect(x0 + w * 2, y0 + t, w, main, 0.86);    // 左侧
    rect(x0 + w * 3, y0 + t, w, main, 0.72);    // 背面
  }
  if (layer === 1) {
    box(0, 0, 8, 8);        /* 头盔 0..32 × 0..12 */
    box(16, 16, 8, 12);     /* 胸甲 16..48 × 16..32 */
    rect(48, 20, 8, 12, 0.9); /* 手臂 */
    box(0, 16, 4, 12);      /* 靴子 */
  } else {
    box(0, 16, 8, 12);      /* 左腿 */
    box(16, 16, 8, 12);     /* 右腿与腰带 */
    rect(32, 20, 8, 12, 0.9);
  }
  return { w:64, h:32, data:data };
};
BF.defaultTextures = function (type) {
  var t = {};
  if (type === 'block') {
    t.top = oreTex('#5c7f3f','#8fd05e',1);
    t.bottom = oreTex('#4a3a24','#5b9c39',3);
    t.front = oreTex('#6b5030','#7ac74f',2);
    t.back = oreTex('#6b5030','#7ac74f',4);
    t.left = oreTex('#63502f','#7ac74f',5);
    t.right = oreTex('#6b5030','#7ac74f',6);
  } else if (type === 'workstation') {
    t.top=runeTex(0); t.bottom=runeTex(3);
    t.front=runeTex(1); t.back=runeTex(2); t.left=runeTex(4); t.right=runeTex(5);
  } else if (type === 'energy' || type === 'generator') {
    t.top=energyFaceTex(type,1); t.bottom=energyFaceTex(type,2);
    t.front=energyFaceTex(type,3); t.back=energyFaceTex(type,4);
    t.left=energyFaceTex(type,5); t.right=energyFaceTex(type,6);
  } else if (type === 'cluster') t.main = iconCluster();
  else if (type === 'mob') {
    var mp = BF.defaultMobParts(), sz = BF.mobTextureSize(mp);
    t.skin = BF.mobSkinTexture(mp, sz.w, sz.h);
    t.egg = BF.mobEggTexture('#3a3a4a','#8fe3dc');
  }
  else if (type === 'tool') t.main = iconPick();
  else if (type === 'weapon') t.main = iconSword();
  else if (type === 'armor') {
    t.main = iconHelmet();
    t.armor1 = BF.defaultArmorLayer(1, '#a887e8');
    t.armor2 = BF.defaultArmorLayer(2, '#8e6fd0');
  }
  else if (type === 'misc') t.main = iconCharm();
  else t.main = iconIngot();
  return t;
};

/* ---------- element model ---------- */
BF.defaultOre = function () {
  return { enabled:false, preset:'iron', size:9, count:12, minY:-64, maxY:64,
    shape:'uniform', targets:['stone','deepslate'], dimension:'overworld', air:0,
    step:'underground_ores' };
};
function stackDefault(type) {
  return ['tool','weapon','armor'].indexOf(type) >= 0 ? 1 : 64;
}
BF.defaultElement = function (type) {
  var e = {
    id: BF.uid(), type: type, name: BF.TYPES[type].label, reg: type + '_' + Math.random().toString(36).slice(2,6),
    desc:'', tab:'materials', stack:stackDefault(type), rarity:'common', glow:false, fireResistant:false,
    craftable:true, showInCreative:true, itemModel:'auto',
    textures: BF.defaultTextures(type), recipes:[],
    stationRecipes: type === 'workstation' ? BF.defaultStationRecipes() : [],
    hardness:1.5, resistance:6, light:0, sound:'STONE', tool:'none', harvestLevel:0,
    dropSelf:true, flammable:false, gravity:false, noCollision:false, mapColor:'#7ac74f',
    ore: BF.defaultOre(),
    /* energy network (Forge Energy, unit = FE) */
    energyCfg:{ capacity:4000, transfer:256, loss:0 },
    genCfg:{ capacity:10000, perTick:32, fuelMode:'none', fuel:'minecraft:coal', burnTicks:1600 },
    stationEnergy:{ enabled:true, capacity:10000, input:256, output:64, cost:120 },
    /* amethyst-style cluster */
    clusterCfg:{ support:'minecraft:amethyst_block', worldgen:true, count:6,
      minY:-64, maxY:32, dimension:'overworld', light:5, waterlogged:false },
    /* creature (spawn egg) */
    mobCfg:{ health:20, healthDisplay:'normal', damage:3, attackSpeed:1.0, armor:0, followRange:32,
      knockback:1.0, boss:false, friendly:false, tameable:false, scale:1.0, category:'MONSTER',
      attack:'melee', rangedDamage:3, rangedSpeed:20, rangedCooldown:20,
      skills:[], drops:[], xp:5, xpType:'diamond', trades:[], tradeCurrency:'minecraft:emerald',
      eggColor:'#3a3a4a', eggSpot:'#8fe3dc', showName:true,
      anim:{ walk:true, idle:true, attack:true } },
    mobParts: BF.defaultMobParts(),
    mobFrames: BF.defaultMobFrames(),
    mobAnimRaw: '',
    mobModelRaw: '',
    /* hand-drawn GUI background (176 x 166), null = procedural */
    guiPixels:null,
    guiTitle:'符文工作台', workTime:100, showProgress:true, showFuel:false,
    toolKind:'pickaxe', tier:'custom', durability:500, speed:8, damage:3, attackSpeed:-2.4,
    enchantability:15, repair:'minecraft:iron_ingot', effect:'none', effectSeconds:5, effectPower:0,
    armorSlot:'helmet', defense:3, toughness:1, knockback:0, armorEffect:'none',
    /* tool attributes (vanilla-style overrides) */
    incorrectTag:'incorrect_for_diamond_tool', fastTags:[], fastSpeed:12,
    overrideAttributes:false, overrideCorrectTool:false, enchantable:true, repairable:true,
    toolActions:[], knockbackPower:0,
    /* item effects */
    food:false, hunger:4, saturation:2, fuelTime:0,
    rightClick:'none', useCooldown:20, useAnim:'none', useDuration:32,
    consumeItem:false, damageOnUse:0, giveEffect:'none', effectDuration:30, effectAmplifier:0,
    craftingRemaining:'',
    ui:{ slots:[ {kind:'input',x:38,y:28}, {kind:'input',x:62,y:28},
                  {kind:'output',x:112,y:34}, {kind:'fuel',x:56,y:62} ] }
  };
  return e;
};
/* fill missing fields (old project format / imported files) */
BF.normalizeElement = function (e) {
  if (!e || !e.type) return e;
  if (!BF.TYPES[e.type]) e.type = 'item';
  var d = BF.defaultElement(e.type);
  Object.keys(d).forEach(function (k) { if (e[k] === undefined) e[k] = BF.clone(d[k]); });
  if (!e.textures) e.textures = BF.clone(d.textures);
  var keys = BF.texKeys(e);
  var legacySide = e.textures.side || null;
  keys.forEach(function (k) {
    if (!e.textures[k]) {
      /* 尺寸不同的专用贴图（护甲 64×32 皮肤层）必须取默认值，
         不能用 16×16 的 main 顶替，否则穿戴皮肤会被拉伸成花屏 */
      var alt = legacySide || e.textures.top || e.textures.main;
      var def = d.textures[k];
      e.textures[k] = BF.clone(def && (!alt || alt.w !== def.w || alt.h !== def.h) ? def : (alt || def));
    }
    if (!e.textures[k].data) e.textures[k] = BF.clone(d.textures[k]);
  });
  delete e.textures.side;
  delete e.textures.main_side;
  if (!Array.isArray(e.recipes)) e.recipes = [];
  if (!Array.isArray(e.stationRecipes)) e.stationRecipes = [];
  if (!e.ui || !Array.isArray(e.ui.slots)) e.ui = BF.clone(d.ui);
  ['ore','energyCfg','genCfg','clusterCfg','stationEnergy'].forEach(function (k) {
    var def = d[k];
    if (!def || typeof def !== 'object') return;
    if (!e[k] || typeof e[k] !== 'object') e[k] = BF.clone(def);
    else Object.keys(def).forEach(function (kk) {
      if (e[k][kk] === undefined) e[k][kk] = BF.clone(def[kk]);
    });
  });
  if (e.guiPixels && (!e.guiPixels.data || e.guiPixels.w !== 176 || e.guiPixels.h !== 166)) e.guiPixels = null;
  return e;
};
BF.normalizeProject = function (p) {
  if (!p || !p.meta || !Array.isArray(p.elements)) return BF.defaultProject();
  if (!p.meta.modid) p.meta.modid = 'mymod';
  if (!p.meta.pkg) p.meta.pkg = 'com.' + BF.slug(p.meta.modid);
  if (!p.meta.version) p.meta.version = '1.0.0';
  /* 旧项目只把 Blockbench 动画存成 JSON 文本、从未转成关键帧（动画永远无效）。
     必须在 normalizeElement 补默认值之前迁移，否则默认关键帧会占住位置。 */
  p.elements.filter(Boolean).forEach(function (e) {
    if (e.type === 'mob' && !(e.mobFrames || []).length && (e.mobAnimRaw || '').trim()) {
      var converted = BF.animationJsonToFrames(e.mobAnimRaw);
      if (converted.length) e.mobFrames = converted;
    }
  });
  p.elements = p.elements.filter(Boolean).map(BF.normalizeElement);
  if (!p.view) p.view = 'element';
  if (!p.tab) p.tab = 'paint';
  if (!p.paintColor) p.paintColor = '#7ac74f';
  if (!p.paintTool) p.paintTool = 'pencil';
  if (!p.selected || !p.elements.some(function (e) { return e.id === p.selected; })) {
    p.selected = p.elements.length ? p.elements[0].id : null;
  }
  return BF.normalizeBrand(p);
};
/* 新建工作站默认带两条可用配方，避免打开界面后「什么都不能合成」。
   产物先用原版物品（不依赖项目里是否有其它元素），用户可在「工作站界面」标签页改成自己的物品。 */
BF.defaultStationRecipes = function () {
  return [
    { id:BF.uid(), a:'minecraft:iron_ingot', ca:2, b:'minecraft:redstone', cb:1,
      out:'minecraft:diamond', count:1 },
    { id:BF.uid(), a:'minecraft:cobblestone', ca:4, b:null, cb:1,
      out:'minecraft:iron_ingot', count:1 }
  ];
};
/* create a sensible default crafting recipe for any element type */
BF.defaultRecipeFor = function (e, materialRef) {
  var m = materialRef || 'minecraft:iron_ingot';
  var g = [null,null,null,null,null,null,null,null,null];
  switch (e.type) {
    case 'block': g=[m,m,m,m,m,m,m,m,m]; break;
    case 'workstation': g=[null,'minecraft:iron_block',null,m,'minecraft:crafting_table',m,null,'minecraft:iron_block',null]; break;
    case 'tool': g=[m,m,m,null,'minecraft:stick',null,null,'minecraft:stick',null]; break;
    case 'weapon': g=[null,m,null,null,m,null,null,'minecraft:stick',null]; break;
    case 'armor': g=[m,m,m,m,null,m,null,null,null]; break;
    default: g=[null,m,null,m,'minecraft:redstone',m,null,m,null]; break;
  }
  return { id:BF.uid(), type:'crafting', shapeless:false, grid:g, count:1, time:200, xp:0.5 };
};
BF.defaultProject = function (name, modid) {
  var p = {
    meta:{ name:name || '星辉工艺', modid:modid || 'starcraft', version:'1.0.0', author:'BlockForge Studio',
      description:'使用 BlockForge Studio 可视化生成的 Minecraft 1.20.1 Forge 模组',
      pkg:'com.' + (modid || 'starcraft'), license:'MIT', mc:BF.MC_VERSION, forge:BF.FORGE_VERSION,
      creativeTab:BF.defaultCreativeTab(name || '星辉工艺'), packIcon:BF.defaultPackIcon() },
    elements:[], selected:null, view:'element', tab:'paint', texKey:null,
    paintTool:'pencil', paintColor:'#7ac74f', previewFacing:0
  };
  var a = BF.defaultElement('item');
  a.name='星辉锭'; a.reg='star_ingot'; a.desc='蕴含星光的金属锭'; a.tab='materials'; a.fuelTime=400;
  a.recipes=[{ id:BF.uid(), type:'smelting', shapeless:false,
    grid:[null,'minecraft:iron_ingot',null,null,null,null,null,null,null], count:1, time:200, xp:0.7 }];
  var ore = BF.defaultElement('block');
  ore.name='星辉矿石'; ore.reg='star_ore'; ore.desc='在主世界深处自然生成'; ore.tab='building';
  ore.hardness=3; ore.resistance=9; ore.tool='pickaxe'; ore.harvestLevel=2; ore.sound='STONE';
  ore.ore = { enabled:true, preset:'diamond', size:8, count:9, minY:-64, maxY:24,
    shape:'trapezoid', targets:['stone','deepslate'], dimension:'overworld', air:0.3, step:'underground_ores' };
  ore.recipes=[]; ore.craftable=false;
  var b = BF.defaultElement('block');
  b.name='星辉矿块'; b.reg='star_block'; b.desc='由星辉锭压缩而成的方块'; b.tab='building';
  b.hardness=3; b.resistance=12; b.light=4; b.tool='pickaxe'; b.harvestLevel=2; b.sound='METAL';
  b.recipes=[BF.defaultRecipeFor(b,'elem:'+a.id)];
  var c = BF.defaultElement('workstation');
  c.name='符文工作台'; c.reg='rune_workbench'; c.desc='把凡铁锻成星辉'; c.tab='decorations';
  c.hardness=3.5; c.resistance=15; c.sound='METAL'; c.tool='pickaxe'; c.harvestLevel=1;
  c.guiTitle='符文工作台'; c.workTime=120;
  c.ui.slots=[{kind:'input',x:32,y:26},{kind:'input',x:56,y:26},{kind:'output',x:112,y:34},{kind:'fuel',x:44,y:64}];
  c.stationRecipes=[{ id:BF.uid(), a:'minecraft:iron_ingot', ca:1, b:'minecraft:redstone', cb:1,
                      out:'elem:'+a.id, count:1 }];
  c.recipes=[BF.defaultRecipeFor(c,'elem:'+a.id)];
  var d = BF.defaultElement('tool');
  d.name='星辉镐'; d.reg='star_pickaxe'; d.desc='以星光淬炼的矿镐'; d.tab='tools';
  d.durability=1200; d.speed=10; d.damage=2; d.harvestLevel=3; d.repair='elem:'+a.id;
  d.fastTags=['mineable_with_pickaxe','stone','deepslate']; d.fastSpeed=16;
  d.toolActions=['PICKAXE_DIG']; d.overrideAttributes=true; d.effect='fire';
  d.recipes=[BF.defaultRecipeFor(d,'elem:'+a.id)];
  var f = BF.defaultElement('weapon');
  f.name='雷霆之刃'; f.reg='thunder_blade'; f.tab='combat'; f.desc='命中时召唤雷霆';
  f.durability=1600; f.damage=8; f.attackSpeed=-2.2; f.effect='lightning'; f.glow=true;
  f.repair='elem:'+a.id; f.knockbackPower=0.6; f.overrideAttributes=true;
  f.recipes=[BF.defaultRecipeFor(f,'elem:'+a.id)];
  var g0 = BF.defaultElement('armor');
  g0.name='星辉头盔'; g0.reg='star_helmet'; g0.desc='穿戴时获得夜视'; g0.tab='combat';
  g0.armorSlot='helmet'; g0.defense=4; g0.toughness=2; g0.knockback=0.1; g0.durability=500;
  g0.armorEffect='night_vision'; g0.repair='elem:'+a.id;
  g0.recipes=[BF.defaultRecipeFor(g0,'elem:'+a.id)];
  var charm = BF.defaultElement('misc');
  charm.name='星辉护符'; charm.reg='star_charm'; charm.desc='右键获得速度与夜视'; charm.tab='materials';
  charm.stack=1; charm.rarity='rare'; charm.glow=true; charm.rightClick='potion';
  charm.giveEffect='speed'; charm.effectDuration=30; charm.effectAmplifier=1;
  charm.useAnim='bow'; charm.useDuration=24; charm.damageOnUse=1; charm.repairable=true;
  charm.recipes=[BF.defaultRecipeFor(charm,'elem:'+a.id)];
  c.stationEnergy = { enabled:true, capacity:10000, input:256, output:64, cost:120 };
  var conduit = BF.defaultElement('energy');
  conduit.name='星辉能量导管'; conduit.reg='star_conduit'; conduit.desc='在相邻方块间传输单位能量';
  conduit.tab='redstone'; conduit.energyCfg={ capacity:4000, transfer:256, loss:0 };
  conduit.recipes=[BF.defaultRecipeFor(conduit,'elem:'+a.id)];
  var gen = BF.defaultElement('generator');
  gen.name='星辉发电机'; gen.reg='star_generator'; gen.desc='燃烧燃料产生能量并向四周输出';
  gen.tab='redstone'; gen.genCfg={ capacity:10000, perTick:32, fuelMode:'burn',
    fuel:'minecraft:coal', burnTicks:1600 };
  gen.recipes=[BF.defaultRecipeFor(gen,'elem:'+a.id)];
  var crystal = BF.defaultElement('cluster');
  crystal.name='星辉晶簇'; crystal.reg='star_cluster'; crystal.desc='附着在紫水晶块上的十字晶簇';
  crystal.tab='decorations'; crystal.light=5;
  crystal.clusterCfg={ support:'minecraft:amethyst_block', worldgen:true, count:6,
    minY:-64, maxY:32, dimension:'overworld', light:5, waterlogged:false };
  crystal.recipes=[]; crystal.craftable=false;
  var boss = BF.defaultElement('mob');
  boss.name='星辉守卫'; boss.reg='star_guardian'; boss.desc='远古的星辉守卫，拥有 Boss 血条与雷霆技能';
  boss.tab='combat';
  boss.mobCfg = Object.assign({}, BF.defaultElement('mob').mobCfg, {
    health:120, healthDisplay:'boss', damage:12, attackSpeed:1.4, followRange:40, boss:true,
    category:'MONSTER', attack:'melee', skills:['lightning','explode'], xp:120, xpType:'diamond',
    eggColor:'#2b2140', eggSpot:'#8fe3dc', showName:true,
    drops:[ {ref:'elem:'+a.id, count:2, chance:1}, {ref:'minecraft:diamond', count:3, chance:0.35} ] });
  boss.recipes=[BF.defaultRecipeFor(boss,'elem:'+a.id)];
  var pet = BF.defaultElement('mob');
  pet.name='星辉幼兽'; pet.reg='star_cub'; pet.desc='友好伙伴，可用绿宝石交易';
  pet.tab='misc';
  pet.mobCfg = Object.assign({}, BF.defaultElement('mob').mobCfg, {
    health:10, damage:2, friendly:true, tameable:true, category:'CREATURE', attack:'melee',
    xp:5, eggColor:'#4a3f6b', eggSpot:'#f7e26b', showName:false,
    trades:[ {ref:'minecraft:emerald', count:1, price:'minecraft:emerald', pcount:1} ] });
  pet.recipes=[BF.defaultRecipeFor(pet,'elem:'+a.id)];
  p.elements = [a,ore,b,c,d,f,g0,charm,conduit,gen,crystal,boss,pet];
  p.selected = c.id;
  return p;
};

/* empty project skeleton used by "new project" (no example elements) */
BF.blankProject = function (name, modid) {
  var id = modid || BF.slug(name || 'newmod');
  return {
    meta:{ name:name || '新模组', modid:id, version:'1.0.0', author:'BlockForge Studio',
      description:'', pkg:'com.' + id, license:'MIT', mc:BF.MC_VERSION, forge:BF.FORGE_VERSION,
      creativeTab:BF.defaultCreativeTab(name || '新模组'), packIcon:BF.defaultPackIcon() },
    elements:[], selected:null, view:'element', tab:'paint', texKey:null,
    paintTool:'pencil', paintColor:'#7ac74f', paintSecondary:'#ffffff',
    brushSize:1, symmetry:'none', colorHistory:[], previewFacing:0, recipeIdx:0
  };
};

/* ---------- project library ---------- */
BF.library = null;
BF.loadLibrary = function () {
  var lib = null;
  try {
    var raw = localStorage.getItem(BF.LIB_KEY);
    if (raw) { var o = JSON.parse(raw); if (o && Array.isArray(o.projects) && o.projects.length) lib = o; }
  } catch (e) { console.warn('library load failed', e); }
  if (!lib) {
    var legacy = null;
    try { var r = localStorage.getItem(BF.STORAGE_KEY); if (r) legacy = JSON.parse(r); } catch (e) {}
    var data = legacy && legacy.meta && Array.isArray(legacy.elements) ? legacy : BF.defaultProject();
    lib = { projects:[{ id:BF.uid('p'), name:data.meta.name || '未命名项目',
      updated:Date.now(), data:BF.normalizeProject(data) }], activeId:null };
    lib.activeId = lib.projects[0].id;
  }
  if (!lib.activeId || !lib.projects.some(function (x) { return x.id === lib.activeId; })) {
    lib.activeId = lib.projects[0].id;
  }
  lib.projects.forEach(function (p) { p.data = BF.normalizeProject(p.data); });
  return lib;
};
BF.currentProject = function () {
  if (!BF.library) return null;
  for (var i=0;i<BF.library.projects.length;i++) {
    if (BF.library.projects[i].id === BF.library.activeId) return BF.library.projects[i];
  }
  return BF.library.projects[0] || null;
};
BF.saveLibrary = function () {
  try { localStorage.setItem(BF.LIB_KEY, JSON.stringify(BF.library)); } catch (e) {
    console.warn('library save failed', e);
    BF.toast('本地存储空间不足，请删除部分项目', true);
  }
};
BF.persist = function () {
  var p = BF.currentProject();
  if (p && BF.state) {
    p.data = BF.state; p.name = BF.state.meta.name || '未命名项目'; p.updated = Date.now();
    BF.saveLibrary();
    try { localStorage.setItem(BF.STORAGE_KEY, JSON.stringify(BF.state)); } catch (e) {}
  }
  var dot = document.getElementById('save-dot'); if (dot) dot.classList.remove('dirty');
};
BF.dirty = function () {
  var dot = document.getElementById('save-dot'); if (dot) dot.classList.add('dirty');
  clearTimeout(BF._pt);
  BF._pt = setTimeout(function(){ try { BF.persist(); } catch(e){} }, 500);
};
BF.load = function () {
  BF.library = BF.loadLibrary();
  var p = BF.currentProject();
  BF.saveLibrary();
  return p ? p.data : BF.defaultProject();
};
BF.listProjects = function () {
  return (BF.library ? BF.library.projects : []).slice().sort(function (a,b) {
    return (b.updated||0) - (a.updated||0); });
};
BF.switchProject = function (id) {
  try { BF.persist(); } catch (e) {}
  BF.library.activeId = id; BF.saveLibrary();
  BF.state = BF.currentProject().data;
  BF.state.view = 'element'; BF.state.tab = 'paint'; BF.state.texKey = null;
};
BF.createProject = function (name, modid, template) {
  /* no template = empty project; use defaultProject() explicitly for the example template */
  var data = template ? BF.clone(template) : BF.blankProject(name, modid);
  data.meta.name = name || data.meta.name || '新模组';
  data.meta.modid = BF.slug(modid || name || data.meta.modid || 'mymod');
  data.meta.pkg = 'com.' + data.meta.modid;
  data = BF.normalizeProject(data);
  var p = { id:BF.uid('p'), name:data.meta.name, updated:Date.now(), data:data };
  BF.library.projects.push(p);
  BF.switchProject(p.id);
  return p;
};
BF.duplicateProject = function (id) {
  var src = null;
  BF.library.projects.forEach(function (p) { if (p.id === id) src = p; });
  if (!src) return null;
  var data = BF.clone(src.data);
  data.meta.name = src.name + ' 副本';
  data.meta.modid = BF.slug(src.data.meta.modid + '_copy');
  data.meta.pkg = 'com.' + data.meta.modid;
  var p = { id:BF.uid('p'), name:data.meta.name, updated:Date.now(), data:data };
  BF.library.projects.push(p);
  BF.saveLibrary();
  return p;
};
BF.deleteProject = function (id) {
  if (BF.library.projects.length <= 1) return false;
  BF.library.projects = BF.library.projects.filter(function (p) { return p.id !== id; });
  if (BF.library.activeId === id) {
    BF.library.activeId = BF.library.projects[0].id;
    BF.state = BF.currentProject().data;
  }
  BF.saveLibrary();
  return true;
};
BF.renameProject = function (id, name) {
  BF.library.projects.forEach(function (p) {
    if (p.id === id) { p.name = name; p.updated = Date.now(); if (BF.library.activeId === id) p.data.meta.name = name; }
  });
  if (BF.library.activeId === id && BF.state) BF.state.meta.name = name;
  BF.saveLibrary();
};
BF.exportProjectFile = function (id) {
  var src = null;
  BF.library.projects.forEach(function (p) { if (p.id === id) src = p; });
  if (!src) return;
  BF.saveFile(new Blob([JSON.stringify(src.data,null,2)], {type:'application/json'}),
    BF.slug(src.name || 'project') + '.mcmproj');
};
BF.importProjectFile = function (data) {
  var p = BF.normalizeProject(data);
  var rec = { id:BF.uid('p'), name:p.meta.name || '导入项目', updated:Date.now(), data:p };
  BF.library.projects.push(rec);
  BF.switchProject(rec.id);
  return rec;
};

/* ---------- current-project helpers ---------- */
BF.state = null;
BF.get = function (id) {
  if (!id || !BF.state) return null;
  for (var i=0;i<BF.state.elements.length;i++) if (BF.state.elements[i].id===id) return BF.state.elements[i];
  return null;
};
BF.cur = function () { return BF.get(BF.state ? BF.state.selected : null); };
BF.texKeys = function (e) { return BF.TYPES[e.type].texKeys; };
BF.refLabel = function (ref) {
  if (!ref) return '空';
  if (ref.indexOf('elem:')===0) { var e = BF.get(ref.slice(5)); return e ? e.name : '已删除元素'; }
  return BF.VANILLA_NAMES[ref] || ref.replace('minecraft:','');
};
BF.refKey = function (ref) {
  if (!ref) return null;
  if (ref.indexOf('elem:')===0) {
    var e = BF.get(ref.slice(5));
    return e ? BF.state.meta.modid + ':' + BF.slug(e.reg) : null;
  }
  return ref;
};
BF.refJava = function (ref) {
  if (!ref) return null;
  if (ref.indexOf('elem:')===0) {
    var e = BF.get(ref.slice(5)); if (!e) return null;
    return 'ModItems.' + BF.upper(e.reg) + '.get()';
  }
  return 'Items.'+BF.upper(ref.replace('minecraft:',''));
};
})(typeof window !== 'undefined' ? window : globalThis);
