/* Headless smoke test for the generator, project library and ZIP writer */
const fs = require('fs');
const path = require('path');
/* minimal browser stubs for headless Node execution */
global.localStorage = { _d:{}, getItem(k){ return this._d[k] || null; },
  setItem(k,v){ this._d[k] = String(v); }, removeItem(k){ delete this._d[k]; } };
global.document = { getElementById(){ return null; } };
require('./src/core.js');
require('./src/zip.js');
require('./src/usage.js');
require('./src/wrapper.js');
require('./src/export.js');
const BF = globalThis.BF;

function assert(cond, msg) { if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; } else console.log('  ok  ' + msg); }

const state = BF.defaultProject();
assert(state.elements.length === 13, 'example project has 13 elements');
assert(Object.keys(BF.TYPES).length === 11, '11 element types (energy/generator/cluster/mob included)');
assert(state.elements.some(e => e.type === 'mob'), 'example has a creature');
assert(state.elements.some(e => e.type === 'energy'), 'example has an energy conduit');
assert(state.elements.some(e => e.type === 'generator'), 'example has a generator');
assert(state.elements.some(e => e.type === 'cluster'), 'example has a cluster');
assert(BF.PALETTE.length >= 80, 'palette has ' + BF.PALETTE.length + ' colours');
assert(state.elements.some(e => e.type === 'misc'), 'example has a misc item');
assert(state.elements.some(e => e.type === 'workstation'), 'example has a workstation');
const ore = state.elements.filter(e => e.ore && e.ore.enabled)[0];
assert(!!ore, 'example has an enabled ore vein');
assert(Object.keys(ore.textures).length === 6, 'blocks have 6 faces');
assert(BF.normalizeProject({meta:{modid:'x'},elements:[{type:'block',name:'a',reg:'a',
  textures:{top:{w:16,h:16,data:[]},side:{w:16,h:16,data:[]},bottom:{w:16,h:16,data:[]}}}]})
  .elements[0].textures.front !== undefined, 'legacy side texture migrates to 6 faces');

/* project library */
BF.library = BF.loadLibrary();
assert(BF.listProjects().length === 1, 'library starts with 1 project');
assert(BF.blankProject('空','blank').elements.length === 0, 'blankProject has zero elements');
assert(BF.defaultElement('tool').stack === 1, 'damageable tools default to stack size 1');
const p2 = BF.createProject('测试模组', 'testmod');
assert(BF.listProjects().length === 2, 'createProject adds a project');
assert(BF.state.elements.length === 0, 'new project is an empty skeleton (no example elements)');
const p3 = BF.duplicateProject(p2.id);
assert(BF.listProjects().length === 3, 'duplicateProject works');
BF.switchProject(p2.id);
assert(BF.state.meta.modid === 'testmod', 'switchProject changes active state');
assert(BF.deleteProject(p3.id), 'deleteProject works');
BF.importProjectFile(state);
assert(BF.listProjects().some(p => p.data.meta.modid === 'starcraft'), 'importProjectFile works');
BF.switchProject(BF.listProjects().filter(p => p.data.meta.modid === 'starcraft')[0].id);

const fakePng = Buffer.from('89504E470D0A1A0A0000000D49484452', 'hex').toString('base64');
const built = BF.buildProject(BF.state, { png: () => fakePng });
const files = built.files;
console.log('\nGenerated stats:', JSON.stringify(built.stats));
const has = p => files.some(f => f.path.endsWith(p));
[
  'build.gradle', 'README.md', 'src/main/resources/META-INF/mods.toml',
  'src/main/java/com/starcraft/StarcraftMod.java',
  'src/main/java/com/starcraft/ModMaterials.java',
  'src/main/java/com/starcraft/registry/ModItems.java',
  'src/main/java/com/starcraft/registry/ModBlocks.java',
  'src/main/java/com/starcraft/registry/ModBlockEntities.java',
  'src/main/java/com/starcraft/registry/ModMenuTypes.java',
  'src/main/java/com/starcraft/client/ClientSetup.java',
  'src/main/java/com/starcraft/item/StarCharmItem.java',
  'src/main/java/com/starcraft/block/entity/RuneWorkbenchBlockEntity.java',
  'src/main/java/com/starcraft/client/screen/RuneWorkbenchScreen.java',
  'assets/starcraft/lang/zh_cn.json',
  'assets/starcraft/textures/block/star_ore_front.png',
  'assets/starcraft/textures/block/star_ore_right.png',
  'assets/starcraft/textures/gui/rune_workbench.png',
  'data/starcraft/worldgen/configured_feature/star_ore_ore.json',
  'data/starcraft/worldgen/placed_feature/star_ore_ore.json',
  'data/starcraft/forge/biome_modifier/star_ore_ore_overworld.json',
  'src/main/java/com/starcraft/energy/ModEnergy.java',
  'src/main/java/com/starcraft/registry/ModFeatures.java',
  'src/main/java/com/starcraft/worldgen/feature/StarClusterFeature.java',
  'src/main/java/com/starcraft/registry/ModEntities.java',
  'src/main/java/com/starcraft/entity/StarGuardianEntity.java',
  'src/main/java/com/starcraft/entity/model/StarGuardianModel.java',
  'src/main/java/com/starcraft/client/StarGuardianRenderer.java',
  'src/main/java/com/starcraft/item/StarGuardianSpawnEgg.java',
  'assets/starcraft/textures/entity/star_guardian.png',
  'assets/starcraft/textures/item/star_guardian_spawn_egg.png',
  'assets/starcraft/models/item/star_guardian_spawn_egg.json',
  'src/main/java/com/starcraft/block/StarClusterBlock.java',
  'src/main/java/com/starcraft/block/entity/StarConduitBlockEntity.java',
  'assets/starcraft/models/block/star_cluster.json',
  'assets/starcraft/blockstates/star_cluster.json',
  'data/starcraft/worldgen/placed_feature/star_cluster_cluster.json',
  'gradlew',
  'gradlew.bat',
  'gradle/wrapper/gradle-wrapper.jar',
  'gradle/wrapper/gradle-wrapper.properties',
  'build.bat',
  'build.sh',
  '.modmaker/project.json'
].forEach(p => assert(has(p), 'file: ' + p));

const allText = files.filter(f => !f.binary).map(f => f.content).join('\n');
const f = p => (files.find(x => x.path.endsWith(p)) || {}).content || '';
/* 教程已不再随 ZIP 分发，README 必须自包含 */
assert(!files.some(x => x.path.endsWith('使用教程.md')),
  'exported ZIP does NOT contain 使用教程.md');
const rd = f('README.md');
assert(/## 构建方法/.test(rd) && /build\.bat/.test(rd) && /gradlew build/.test(rd),
  'generated README is self-contained with build instructions');
assert(/## 分享到 GitHub/.test(rd) && /gh repo create/.test(rd),
  'generated README contains GitHub sharing steps');
assert(!/使用教程\.md/.test(rd), 'README has no dead link to the removed tutorial');
/* wrapper 二进制完整性 */
const jarFile = files.find(x => x.path.endsWith('gradle/wrapper/gradle-wrapper.jar'));
assert(jarFile && jarFile.binary === true, 'gradle-wrapper.jar is stored as binary');
const jarBuf = Buffer.from(jarFile.content, 'base64');
assert(jarBuf.length > 50000 && jarBuf[0] === 0x50 && jarBuf[1] === 0x4B,
  'gradle-wrapper.jar decodes to a valid PK zip');
assert(/distributionUrl/.test(f('gradle/wrapper/gradle-wrapper.properties')),
  'wrapper properties has distributionUrl');
assert(/foojay-resolver-convention/.test(f('settings.gradle')),
  'settings.gradle auto-provisions JDK 17 via foojay');
assert(/gradlew\.bat build/.test(f('build.bat')), 'build.bat calls the wrapper');
/* --- 空白/极简项目守卫：曾因无条件 import 与资源目录缺失导致整模组"三无" --- */
const gradleTxt = f('build.gradle');
assert(!/srcDir\s+"assets"/.test(gradleTxt) && !/srcDir\s+"data"/.test(gradleTxt) &&
  /from\("assets"\)\s*\{\s*into\s+"assets"\s*\}/.test(gradleTxt) &&
  /from\("data"\)\s*\{\s*into\s+"data"\s*\}/.test(gradleTxt),
  'build.gradle keeps assets/ + data/ prefixes in the jar (three-nothing fix)');
/* 资源层级守卫：所有资源必须落在 assets/<modid>/ 或 data/<modid>/ 命名空间下，
   否则 jar 里即使有文件，Minecraft 也读不到（贴图紫黑/名称显示 ID/无配方） */
const resFiles = files.filter(x => /\/(?:assets|data)\//.test(x.path));
assert(resFiles.length > 20 && resFiles.every(x => /\/(?:assets|data)\/starcraft\//.test(x.path)),
  'every generated resource sits under assets/starcraft/ or data/starcraft/');
/* 游戏内 GUI 链路守卫：工作站界面必须注册、能右键打开、背景贴图真实生成且路径正确 */
const screenSrc = f('RuneWorkbenchScreen.java');
const guiTex = (screenSrc.match(/textures\/gui\/[\w]+\.png/) || [])[0];
assert(/MenuScreens\.register/.test(f('ClientSetup.java')), 'GUI: client registers the container screen');
assert(/NetworkHooks\.openScreen/.test(f('RuneWorkbenchBlock.java')), 'GUI: right-click opens the menu');
assert(guiTex && files.some(x => x.path.endsWith('/' + guiTex)),
  'GUI: screen background ' + guiTex + ' is generated under assets/<modid>/');
/* 品牌资源守卫：独立创造模式物品栏 + 可编辑 jar 封面 */
assert(has('src/main/java/com/starcraft/registry/ModCreativeTabs.java'), 'brand: ModCreativeTabs.java generated');
assert(/CreativeModeTab\.builder\(\)/.test(f('ModCreativeTabs.java')) &&
  /CREATIVE_TAB_ICON/.test(f('ModCreativeTabs.java')), 'brand: tab uses the editable icon item');
assert(/ModCreativeTabs\.TABS\.register\(bus\)/.test(f('StarcraftMod.java')) &&
  /getTabKey\(\)\.location\(\)/.test(f('StarcraftMod.java')), 'brand: main class registers tab and fills it');
assert(/CREATIVE_TAB_ICON/.test(f('ModItems.java')), 'brand: icon item registered in ModItems');
assert(/logoFile="pack\.png"/.test(f('mods.toml')), 'brand: mods.toml declares pack.png as logo');
assert(has('src/main/resources/pack.png'), 'brand: editable jar cover pack.png generated');
assert(has('assets/starcraft/models/item/creative_tab_icon.json') &&
  has('assets/starcraft/textures/item/creative_tab_icon.png'), 'brand: tab icon model + texture generated');
assert(/itemGroup\.starcraft\.main/.test(f('zh_cn.json')) &&
  /itemGroup\.starcraft\.main/.test(f('en_us.json')), 'brand: tab title written into both lang files');
/* 关闭独立栏目时回退到原版分类，且不生成多余的类/资源 */
const noTab = BF.blankProject('无栏目', 'notab');
noTab.meta.creativeTab.enabled = false;
const noTabItem = BF.defaultElement('item');
noTabItem.name = '测试物品'; noTabItem.reg = 'test_item';
noTab.elements = [noTabItem]; noTab.selected = noTabItem.id;
const noTabBuilt = BF.buildProject(noTab, { png: () => fakePng });
assert(!noTabBuilt.files.some(x => /ModCreativeTabs/.test(x.path)) &&
  /CreativeModeTabs\.INGREDIENTS/.test((noTabBuilt.files.find(x => x.path.endsWith('NotabMod.java')) || {}).content || ''),
  'brand: disabling custom tab falls back to vanilla creative tabs');
/* 旧项目（无品牌字段）加载时自动补齐 */
const legacy = BF.normalizeProject({ meta:{ modid:'oldmod', name:'旧模组' }, elements:[] });
assert(legacy.meta.creativeTab.enabled === true && legacy.meta.creativeTab.icon.data.length === 256 &&
  legacy.meta.packIcon.data.length === 4096, 'brand: legacy projects get default brand assets');
/* 配方兜底：craftable=true 但没加配方时自动补默认配方 */
const blankProj = BF.blankProject('极简', 'mini');
const mini = BF.defaultElement('block');
mini.name = '墨竹'; mini.reg = 'mozhu'; mini.recipes = [];
blankProj.elements = [mini];
const miniBuilt = BF.buildProject(blankProj, { png: () => 'AAAA' });
assert(miniBuilt.files.some(x => /recipes\/mozhu/.test(x.path)),
  'recipe fallback generated for element without recipes');
assert(!miniBuilt.files.some(x => /ClientSetup|ModMenuTypes|ModBlockEntities/.test(x.path)),
  'no empty registries or ClientSetup in a minimal project');
assert(!miniBuilt.files.some(x => /\.java$/.test(x.path) &&
    x.content.includes('import com.mini.block.entity.*')),
  'no imports of nonexistent packages in minimal project');

/* --- 通用悬空 import 守卫：项目内 import 的每个类都必须真实生成 ---
   曾因 ClientSetup 无条件 import ModEntities，导致"有工作站但没生物"的项目编译失败 */
function checkImports(built, label) {
  const pkgRe = built.ctx.pkg.replace(/\./g, '\\.');
  const paths = new Set(built.files.map(f => f.path));
  const re = new RegExp('import (' + pkgRe + '(?:\\.[a-z0-9_]+)*\\.(?:\\*|[A-Z][A-Za-z0-9_]*));', 'g');
  built.files.filter(f => /\.java$/.test(f.path)).forEach(f => {
    let m;
    while ((m = re.exec(f.content))) {
      const imp = m[1];
      if (imp.endsWith('.*')) {
        const pkgPath = built.ctx.root + 'src/main/java/' + imp.slice(0, -2).replace(/\./g, '/');
        const has = [...paths].some(p => p.startsWith(pkgPath + '/'));
        assert(has, label + ': wildcard import target exists: ' + imp);
      } else {
        const p = built.ctx.root + 'src/main/java/' + imp.replace(/\./g, '/') + '.java';
        assert(paths.has(p), label + ': import target exists: ' + imp);
      }
    }
  });
}
function sceneWith(types) {
  const p = BF.blankProject('场景', 'scene');
  p.elements = types.map(t => {
    const e = BF.defaultElement(t);
    e.name = t + '_test'; e.reg = t + '_test';
    e.recipes = [];
    return e;
  });
  p.selected = p.elements[0].id;
  return p;
}
[['block'], ['workstation'], ['mob'], ['block','workstation','mob','item','tool','cluster']].forEach(([...types]) => {
  const built = BF.buildProject(sceneWith(types), { png: () => 'AAAA' });
  checkImports(built, 'scene[' + types.join('+') + ']');
});
assert(true, 'dangling-import guard passed for 4 project shapes');
/* --- build.bat 硬规则：曾因中文+LF+括号块导致整脚本错乱，出现任一就别再退回 --- */
const bat = files.find(x => x.path.endsWith('build.bat'));
const batBuf = Buffer.from(bat.content, 'binary');
assert(Buffer.from(bat.content, 'utf8').every(b => b < 128), 'build.bat is ASCII-only (no Chinese, no chcp)');
assert(batBuf.includes('\r\n') && !batBuf.includes('\n').valueOf || bat.content.split('\r\n').length === bat.content.split('\n').length,
  'build.bat uses CRLF');
assert(!/\(.*\)/.test(bat.content.split('\r\n').filter(l => l.startsWith('if ')).join('')),
  'build.bat has no if (...) parenthesis blocks (use goto)');
assert(!/chcp/.test(bat.content), 'build.bat does not switch codepage');
assert(/\bcall gradlew\.bat build\b/.test(bat.content), 'build.bat calls gradlew.bat build');
assert(/%%F/.test(bat.content) && !/%%APPDATA%%/.test(bat.content),
  'build.bat: %%F for for-vars, single %APPDATA% for env vars');
assert(/gradlew build/.test(f('build.sh')), 'build.sh calls the wrapper');
assert(!/new ItemStack\(ModBlocks\./.test(allText), 'ItemStack never built from a Block');
assert(!/copyWithCount/.test(allText), 'no 1.20.5+ ItemStack API');
assert(/getDestroySpeed/.test(f('item/StarPickaxeItem.java')), 'tool getDestroySpeed override');
assert(/canPerformAction/.test(f('item/StarPickaxeItem.java')), 'tool ToolAction override');
/* creature (mob) */
assert(/registerGoals/.test(f('entity/StarGuardianEntity.java')), 'mob AI goals');
assert(/dropCustomDeathLoot/.test(f('entity/StarGuardianEntity.java')), 'mob custom drops');
assert(/this\.xpReward = /.test(f('entity/StarGuardianEntity.java')), 'mob xp reward set in constructor');
assert(/ServerBossEvent/.test(f('entity/StarGuardianEntity.java')) &&
  /startSeenByPlayer/.test(f('entity/StarGuardianEntity.java')), 'mob boss health bar via ServerBossEvent');
assert(/ForgeSpawnEggItem/.test(f('item/StarGuardianSpawnEgg.java')), 'mob spawn egg item');
/* --- 1.20.1 API 守卫：这些写法在 1.20.1 会编译失败，出现过就别再退回 --- */
const javaText = files.filter(f => /\.java$/.test(f.path)).map(f => f.content).join('\n');
assert(!/Material\.(METAL|STONE|AMETHYST|WOOD)/.test(javaText), 'no removed Material enum (1.20.1)');
assert(!/getXpToDrop/.test(javaText), 'no removed getXpToDrop (use xpReward)');
assert(!/TradingData/.test(javaText), 'no TradingData (not in 1.20.1 Forge)');
assert(!/RegisterMenuScreensEvent/.test(javaText), 'no RegisterMenuScreensEvent (not in Forge 47.3)');
assert(!/EntityTypeRegistryEvent/.test(javaText), 'no EntityTypeRegistryEvent (not in Forge)');
assert(!/Explosion\.BlockInteraction/.test(javaText), 'no Explosion.BlockInteraction (1.20 uses Level.ExplosionInteraction)');
assert(!/client\.model\.ModelPart;/.test(javaText), 'ModelPart imported from geom package');
assert(/bakeLayer/.test(f('client/StarGuardianRenderer.java')), 'renderer uses ctx.bakeLayer');
assert(/renderToBuffer/.test(f('entity/model/StarGuardianModel.java')), 'model implements renderToBuffer');
assert(/doHurtTarget/.test(f('entity/StarGuardianEntity.java')), 'entity skills use doHurtTarget');
assert(/texOffs/.test(f('entity/model/StarGuardianModel.java')), 'mob model part tree with UV offsets');
assert(/setupAnim/.test(f('entity/model/StarGuardianModel.java')), 'mob code animation in setupAnim');
assert(/registerEntityRenderer/.test(f('ClientSetup.java')), 'mob renderer + model layer registered');
assert(/entity\.starcraft\.star_guardian/.test(f('lang/zh_cn.json')), 'mob language entry');
assert(/getAttributeModifiers/.test(f('item/ThunderBladeItem.java')), 'vanilla-style attribute modifiers');
assert(/isValidRepairItem/.test(f('item/StarPickaxeItem.java')), 'repair ingredient override');
assert(/getUseAnimation/.test(f('item/StarCharmItem.java')), 'misc item use animation');
assert(/finishUsingItem/.test(f('item/StarCharmItem.java')), 'misc item finishUsingItem');
assert(/HORIZONTAL_FACING/.test(f('block/StarOreBlock.java')), 'block FACING state property');
assert(/getStateForPlacement/.test(f('block/StarOreBlock.java')), 'block placement rotation');
assert(/incorrect_for_diamond_tool/.test(f('ModMaterials.java')), 'Tier incorrect-tool tag');
assert(/GuiGraphics/.test(allText), '1.20.1 GuiGraphics rendering');
assert(/RegisterMenuScreensEvent/.test(allText), 'screen registration event');
assert(!files.some(x => x.path.includes('recipes/star_ore')), 'craftable=false skips recipe JSON');
assert(files.some(x => x.path.includes('recipes/star_charm')), 'misc item has a recipe');
assert(JSON.parse(f('models/item/star_pickaxe.json')).parent === 'minecraft:item/handheld',
  'tools use the vanilla handheld model (correct held pose)');
assert(JSON.parse(f('models/item/thunder_blade.json')).parent === 'minecraft:item/handheld',
  'weapons use the vanilla handheld model');
assert(JSON.parse(f('models/item/star_ingot.json')).parent === 'minecraft:item/generated',
  'materials keep the flat generated model');
assert(/\.stacksTo\(1\)/.test(f('item/StarPickaxeItem.java')), 'damageable items are forced to stack 1');

const bs = JSON.parse(f('blockstates/star_ore.json'));
assert(Object.keys(bs.variants).length === 4, '4 facing variants in blockstates');
const cfg = JSON.parse(f('worldgen/configured_feature/star_ore_ore.json'));
assert(cfg.type === 'minecraft:ore' && cfg.config.targets.length === 2, 'vanilla ore configured feature');
const placed = JSON.parse(f('worldgen/placed_feature/star_ore_ore.json'));
assert(placed.placement[0].type === 'minecraft:count' && placed.placement[2].height.type === 'minecraft:trapezoid',
  'vanilla count + trapezoid height placement');
const bm = JSON.parse(f('forge/biome_modifier/star_ore_ore_overworld.json'));
assert(bm.type === 'forge:add_features' && bm.step === 'underground_ores', 'Forge biome modifier');

/* energy network */
assert(/EnergyStorage/.test(f('block/entity/StarConduitBlockEntity.java')) &&
  /ModEnergy.push/.test(f('block/entity/StarConduitBlockEntity.java')), 'energy conduit capability + routing');
assert(/burn/.test(f('block/entity/StarGeneratorBlockEntity.java')), 'generator burn mode');
assert(/ENERGY_COST/.test(f('block/entity/RuneWorkbenchBlockEntity.java')) &&
  /ForgeCapabilities.ENERGY/.test(f('block/entity/RuneWorkbenchBlockEntity.java')), 'workstation consumes energy');
assert(/getEnergyScaled/.test(f('client/screen/RuneWorkbenchScreen.java')), 'GUI energy bar');
assert(/ModFeatures.FEATURES.register/.test(f('StarcraftMod.java')), 'custom features registered in main class');

/* amethyst-style cluster */
assert(/canSurvive/.test(f('block/StarClusterBlock.java')) &&
  /FACING/.test(f('block/StarClusterBlock.java')), 'cluster support check + six-way FACING');
assert(JSON.parse(f('models/block/star_cluster.json')).parent === 'minecraft:block/cross', 'cross model');
assert(Object.keys(JSON.parse(f('blockstates/star_cluster.json')).variants).length === 6,
  '6 facing variants for cluster');
assert(/NoneFeatureConfiguration/.test(f('worldgen/feature/StarClusterFeature.java')), 'custom cluster Feature');
assert(JSON.parse(f('worldgen/configured_feature/star_cluster_cluster.json')).type ===
  'starcraft:star_cluster_cluster_feature', 'configured feature points to Java Feature');

/* hand-drawn GUI background */
const wsSample = BF.state.elements.filter(x => x.type === 'workstation')[0];
wsSample.guiPixels = { w:176, h:166, data:new Array(176*166).fill('#123456') };
const gt = BF.guiTexture(wsSample);
assert(gt.data[0] === '#123456' && gt.data[165*256+175] === '#123456',
  'guiPixels overrides procedural GUI panel');
assert(gt.data[5*256+176] === '#e8b64c', 'progress-arrow atlas preserved outside 176x166');
const baseGui = BF.guiTexture(wsSample, true);
assert(baseGui.data[0] !== '#123456', 'ignoreHandDrawn returns the procedural example UI base');

/* Java brace balance (rough template sanity check) */
let unbalanced = [];
files.filter(x => /\.java$/.test(x.path)).forEach(x => {
  const open = (x.content.match(/\{/g) || []).length, close = (x.content.match(/\}/g) || []).length;
  if (open !== close) unbalanced.push(x.path + ' (' + open + '/' + close + ')');
});
assert(unbalanced.length === 0, 'all Java files have balanced braces' + (unbalanced.length ? ' -> ' + unbalanced.join(', ') : ''));

let jsonCount = 0;
files.filter(x => /\.json$/.test(x.path)).forEach(x => {
  try { JSON.parse(x.content); jsonCount++; }
  catch (e) { console.error('FAIL: invalid JSON ' + x.path + ' -> ' + e.message); process.exitCode = 1; }
});
assert(jsonCount > 20, 'all ' + jsonCount + ' JSON files parse');
const pngs = files.filter(x => x.binary);
assert(pngs.length >= 20 && pngs.every(x => typeof x.content === 'string' && x.content.length > 0),
  pngs.length + ' PNG payloads present');

const zipBuf = BF.zipFiles(files);
const zipPath = path.join(__dirname, '_smoke.zip');
fs.writeFileSync(zipPath, zipBuf);
assert(zipBuf.slice(0,4).toString('hex') === '504b0304', 'ZIP local header signature');
assert(zipBuf.slice(-22,-18).toString('hex') === '504b0506', 'ZIP EOCD signature');
console.log('\nZIP written: ' + zipPath + ' (' + zipBuf.length + ' bytes)');
