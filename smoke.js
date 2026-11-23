/* Headless smoke test for the generator, project library and ZIP writer */
const fs = require('fs');
const path = require('path');
/* minimal browser stubs for headless Node execution */
global.localStorage = { _d:{}, getItem(k){ return this._d[k] || null; },
  setItem(k,v){ this._d[k] = String(v); }, removeItem(k){ delete this._d[k]; } };
global.document = { getElementById(){ return null; } };
require('./src/core.js');
require('./src/vanilla.js');
require('./src/zip.js');
require('./src/usage.js');
require('./src/wrapper.js');
require('./src/export.js');
const BF = globalThis.BF;

function assert(cond, msg) { if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; } else console.log('  ok  ' + msg); }

const state = BF.defaultProject();
assert(state.elements.length === 14, 'example project has 14 elements (incl. multiblock core)');
assert(state.elements.some(e => e.type === 'core' && (e.coreCfg.actions || []).length > 0),
  'example project ships a working multiblock core');
assert(Object.keys(BF.TYPES).length === 12, '12 element types (energy/generator/cluster/core/mob included)');
assert(!!BF.TYPES.core && BF.texKeys({ type:'core' }).length === 6, 'core: multiblock core is a six-face block type');
/* 通用守卫：任何类型新建时，所有 texKey 都必须有尺寸正确的贴图数据。
   新增类型若忘记在 defaultTextures 里加分支，这里会立刻失败。 */
Object.keys(BF.TYPES).forEach(function (t) {
  const el = BF.defaultElement(t);
  const bad = BF.texKeys(el).filter(function (k) {
    const tex = el.textures[k];
    return !tex || !Array.isArray(tex.data) || tex.data.length !== tex.w * tex.h;
  });
  assert(bad.length === 0, 'textures: default ' + t + ' element has every texKey (' + bad.join(',') + ')');
});
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
/* 资源层级守卫：资源必须落在 assets/<modid>/、data/<modid>/ 或 data/minecraft/
   （后者是挖掘标签注入的唯一正确位置）下，否则 Minecraft 读不到 */
const resFiles = files.filter(x => /\/(?:assets|data)\//.test(x.path));
assert(resFiles.length > 20 && resFiles.every(x =>
  /\/(?:assets|data)\/starcraft\//.test(x.path) || /\/data\/minecraft\/tags\/blocks\//.test(x.path)),
  'every generated resource sits under assets/<modid>/, data/<modid>/ or data/minecraft/tags/blocks/');
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
/* --- 封面：jar 根目录 + assets/ 双路径，且导入的图案真的写进输出 --- */
assert(files.some(x => x.path.endsWith('/src/main/resources/pack.png')) &&
  files.some(x => x.path.endsWith('/assets/starcraft/pack.png')) &&
  /logoFile="pack\.png"/.test(f('mods.toml')),
  'cover: pack.png at jar root and assets/<modid>/, declared as logoFile');
{
  const custom = BF.defaultProject();
  custom.meta.packIcon.data[0] = '#ff0000';
  const enc = t => (t.data[0] || 'none') + '|' + t.w + 'x' + t.h;
  const cb = BF.buildProject(custom, { png: enc });
  const rootPng = cb.files.find(x => x.path.endsWith('/src/main/resources/pack.png'));
  assert(rootPng && rootPng.content === '#ff0000|64x64',
    'cover: imported/edited cover image is what gets exported');
}
/* --- 护甲：两层穿戴皮肤可绘且按原版 64x32 UV 输出 --- */
{
  const armorEl = BF.defaultElement('armor');
  assert(BF.texKeys(armorEl).join(',') === 'main,armor1,armor2' &&
    BF.TEX_LABEL.armor1 && BF.TEX_LABEL.armor2,
    'armor: two drawable 64x32 skin layers exposed in the editor');
  assert(armorEl.textures.armor1.w === 64 && armorEl.textures.armor1.h === 32 &&
    armorEl.textures.armor1.data.filter(Boolean).length > 400 &&
    armorEl.textures.armor2.data.filter(Boolean).length > 400,
    'armor: default layers follow vanilla UV layout and are not blank');
  const p = BF.blankProject('护甲', 'armortest');
  p.elements = [armorEl]; p.selected = armorEl.id;
  const enc = t => (t.data[0] || 'none') + '|' + t.w + 'x' + t.h;
  const b = BF.buildProject(p, { png: enc });
  const l1 = b.files.find(x => /textures\/models\/armor\/.*_layer_1\.png$/.test(x.path));
  assert(l1 && l1.content === 'none|64x32' || (l1 && l1.content.includes('|64x32')),
    'armor: exported layer_1 uses the painted 64x32 texture');
  const legacyArmor = BF.normalizeElement({ type:'armor', name:'旧头盔', reg:'oldhelm', textures:{ main:{w:16,h:16,data:[]} } });
  assert(legacyArmor.textures.armor1.w === 64 && legacyArmor.textures.armor2.h === 32,
    'armor: legacy projects get both skin layers added');
}
/* --- 生物：默认人形含双臂、自带动画、Java 里摆臂 --- */
{
  const m = BF.defaultElement('mob');
  const names = m.mobParts.map(x => x.name);
  assert(names.includes('armLeft') && names.includes('armRight') &&
    names.includes('legLeft') && names.includes('legRight') && m.mobParts.length === 6,
    'mob: default model is a proper humanoid with correctly placed arms');
  assert((m.mobFrames || []).length >= 6, 'mob: default keyframes exist so idle animation plays');
  assert(BF.defaultProject().elements.filter(e => e.type === 'mob')
    .every(e => (e.mobFrames || []).length >= 6), 'mob: example project mobs are animated too');
  const model = files.find(x => /StarGuardianModel\.java$/.test(x.path)).content;
  assert(/this\.armLeft\.xRot = \(float\)Math\.cos/.test(model) &&
    /this\.armRight\.xRot = \(float\)Math\.cos/.test(model),
    'mob: setupAnim swings both arms');
  assert(/keyed\(kfT/.test(model), 'mob: default keyframes baked into setupAnim');
  assert(/faces\.sort/.test(fs.readFileSync(path.join(__dirname, 'src/ui.js'), 'utf8')),
    'mob: 3D preview depth-sorts all faces (no broken shards)');
}

/* ===== 成熟方案重构守卫：方块六面 / 晶簇 / 生物全链路 / 工作站配方 ===== */
assert(BF.FACE_FILE.top === 'up' && BF.FACE_FILE.bottom === 'down',
  'cube texture keys are up/down (top/bottom caused purple top faces)');
const starOreModel = JSON.parse(f('models/block/star_ore.json'));
assert(starOreModel.textures.up && starOreModel.textures.down && !starOreModel.textures.top,
  'block model uses up/down/north/south/west/east');
const clusterModel = files.find(x => /models\/block\/.*\.json/.test(x.path) &&
  JSON.parse(x.content).parent === 'minecraft:block/cross');
assert(clusterModel && JSON.parse(clusterModel.content).render_type === 'minecraft:cutout',
  'cluster model uses cutout render type for transparent pixels');
assert(/noOcclusion\(\)/.test(f('StarClusterBlock.java')), 'cluster block is non-occluding');
assert(has('src/main/java/com/starcraft/registry/ModEntityAttributes.java'),
  'mob: entity attribute registration class generated');
const attrSrc = f('ModEntityAttributes.java');
assert(/EntityAttributeCreationEvent/.test(attrSrc) && /createMobAttributes\(\)\.build\(\)/.test(attrSrc),
  'mob: attributes registered on MOD bus (otherwise entities cannot spawn)');
const mobModelSrc = f('StarGuardianModel.java');
assert(/\.xRot = \(float\)Math\.cos/.test(mobModelSrc) &&
  !/\.x = \(float\)Math\.cos/.test(mobModelSrc),
  'mob: walk animation rotates legs via xRot (not the invalid ModelPart.x)');
const layerSize = mobModelSrc.match(/LayerDefinition\.create\(mesh, (\d+), (\d+)\)/);
const needSize = BF.mobTextureSize(BF.defaultMobParts());
assert(layerSize && +layerSize[1] === needSize.w && +layerSize[2] === needSize.h,
  'mob: layer definition texture size matches generated skin');
const texOffs = [...mobModelSrc.matchAll(/texOffs\((\d+), (\d+)\)/g)];
assert(texOffs.length > 0 && texOffs.every(m => +m[1] < needSize.w && +m[2] < needSize.h),
  'mob: every texOffs is inside the skin (no purple/garbled blocks)');
assert(!files.some(x => /\/animations\//.test(x.path)),
  'mob: no invalid animations JSON (keyframes are baked into Java)');
assert(/0xFFFFFF, 0xFFFFFF/.test(f('StarGuardianSpawnEgg.java')),
  'mob: spawn egg tint is white so painted texture shows');
/* 独立生物项目：验证坐标转换与关键帧烘焙 */
const kfProj = BF.blankProject('动画测试', 'kftest');
const kfMob = BF.defaultElement('mob');
kfMob.name = '测试生物'; kfMob.reg = 'testmob';
kfMob.mobFrames = [{ part:'head', t:0, rx:0, ry:0, rz:0 }, { part:'head', t:1, rx:0, ry:30, rz:0 }];
kfProj.elements = [kfMob]; kfProj.selected = kfMob.id;
const kfBuilt = BF.buildProject(kfProj, { png: () => fakePng });
const kfModel = (kfBuilt.files.find(x => x.path.endsWith('TestmobModel.java')) || {}).content || '';
assert(/PartPose\.offset\(-4\.0f, 0\.0f, 0\.0f\)/.test(kfModel) &&
  /\.addBox\(0\.0f, -8\.0f, -4\.0f, 8, 8, 8\)/.test(kfModel),
  'mob: Blockbench y-up converted to vanilla EntityModel y-down');
assert(/keyed\(kfT/.test(kfModel) && /private static float keyed/.test(kfModel),
  'mob: keyframes baked into setupAnim with interpolation');
assert(kfBuilt.files.some(x => /ModEntityAttributes/.test(x.path)),
  'mob: single-mob project also registers attributes');
/* 工作站默认配方 + 旧皮肤自动重建 + 外部 Java 模型提示 */
const ws = BF.defaultElement('workstation');
assert(ws.stationRecipes.length >= 2, 'workstation has default usable processing recipes');
const oldProj = BF.blankProject('旧皮肤', 'oldskin');
const oldMob = BF.defaultElement('mob');
oldMob.name = '旧生物'; oldMob.reg = 'oldmob';
oldMob.textures.skin = { w:16, h:16, data:new Array(256).fill('#ffffff') };
oldMob.mobModelRaw = 'public class Foo {}';
oldProj.elements = [oldMob]; oldProj.selected = oldMob.id;
const oldBuilt = BF.buildProject(oldProj, { png: () => fakePng });
assert(oldBuilt.warnings.some(w => /皮肤/.test(w)) &&
  oldBuilt.warnings.some(w => /Java 模型代码/.test(w)),
  'mob: warnings explain auto-rebuilt skin and unsupported pasted Java model');
const bbAnimFrames = BF.animationJsonToFrames(JSON.stringify({ animations:{ idle:{ bones:{
  head:{ rotation:{ '0':[0,0,0], '0.5':[0,30,0], '1':[0,0,0] } } } } } }));
assert(bbAnimFrames.length === 3 && bbAnimFrames[1].part === 'head' && bbAnimFrames[1].ry === 30,
  'mob: Blockbench animation JSON converted into usable keyframes');
assert(BF.TEX_LABEL.skin && BF.TEX_LABEL.egg, 'mob: skin/egg texture tabs have proper labels');
/* --- 游戏日志实锤的两个坑：blockstate facing 无属性、mob 物品无模型 --- */
{
  const demoFiles = files; /* 主构建产物（示例项目，modid=starcraft） */
  const energy = demoFiles.find(x => /StarConduitBlock\.java$/.test(x.path));
  assert(energy && energy.content.includes('BlockStateProperties.HORIZONTAL_FACING') &&
    energy.content.includes('createBlockStateDefinition'),
    'blockstate: energy/generator blocks define FACING to match facing variants');
  /* 每个注册的物品都必须有对应模型 JSON（游戏缺模型会打 Missing model） */
  const itemsJava = demoFiles.find(x => /ModItems\.java$/.test(x.path)).content;
  const regNames = [...itemsJava.matchAll(/ITEMS\.register\("([^"]+)"/g)].map(m => m[1]);
  const missing = regNames.filter(nm => !demoFiles.some(x => x.path.endsWith('/models/item/' + nm + '.json')));
  assert(regNames.length > 0 && missing.length === 0,
    'item models: every registered item has models/item/<name>.json (missing: ' + missing.join(',') + ')');
  assert(!demoFiles.some(x => /item\/\w*GuardianItem\.java$|item\/\w*CubItem\.java$/.test(x.path)) &&
    !/STAR_GUARDIAN\s*=|STAR_CUB\s*=/.test(itemsJava),
    'mob: no plain item registered for mobs (spawn egg only)');
  assert(/event\.accept\(ModItems\.STAR_GUARDIAN_SPAWN_EGG\.get\(\)\)/.test(
      demoFiles.find(x => /StarcraftMod\.java$/.test(x.path)).content),
    'mob: creative tab accepts the spawn egg');
}
const migrated = BF.normalizeProject({ meta:{ modid:'mig', name:'迁移' }, elements:[{
  type:'mob', name:'旧生物', reg:'oldmob',
  mobAnimRaw: JSON.stringify({ animations:{ idle:{ bones:{ head:{
    rotation:{ '0':[0,0,0], '0.5':[0,25,0] } } } } } }) }] });
assert((migrated.elements[0].mobFrames || []).length === 2,
  'mob: legacy animation JSON migrated into keyframes on load');
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

/* ---------- 挖掘粒子贴图：没有 particle 的方块模型会飞出紫黑乱码粒子 ---------- */
const blockModels = files.filter(x => /assets\/starcraft\/models\/block\/[^/]+\.json$/.test(x.path));
const noParticle = blockModels.filter(x => {
  const t = JSON.parse(x.content).textures || {};
  return !t.particle;
});
assert(noParticle.length === 0, 'every block model declares a particle texture' +
  (noParticle.length ? ' -> ' + noParticle.map(x => x.path).join(', ') : ''));
const oreModel = JSON.parse(f('models/block/star_ore.json'));
assert(oreModel.textures.particle === '#north' && !!oreModel.textures.north,
  'block particle points at an existing face texture');
const clusterParticleModel = JSON.parse(f('models/block/star_cluster.json'));
assert(clusterParticleModel.textures.particle === clusterParticleModel.textures.cross,
  'cluster model declares a particle texture');
/* particle 引用的贴图文件必须真的存在，否则仍然是紫黑乱码 */
const particleMissing = [];
blockModels.forEach(x => {
  const j = JSON.parse(x.content), tex = j.textures || {};
  let loc = tex.particle;
  if (typeof loc !== 'string') return;
  if (loc.charAt(0) === '#') loc = tex[loc.slice(1)];
  if (typeof loc !== 'string') { particleMissing.push(x.path + ' (unresolved ' + tex.particle + ')'); return; }
  const ns = loc.indexOf(':') >= 0 ? loc.split(':')[0] : 'minecraft';
  const path = loc.indexOf(':') >= 0 ? loc.split(':')[1] : loc;
  const want = 'assets/' + ns + '/textures/' + path + '.png';
  if (!files.some(y => y.path.endsWith(want))) particleMissing.push(x.path + ' -> ' + want);
});
assert(particleMissing.length === 0, 'particle textures exist in the jar' +
  (particleMissing.length ? ' -> ' + particleMissing.join(', ') : ''));

/* ---------- 空配方：原版会拒绝（有序）/ 变成免费配方（无序） ---------- */
const emptyProj = BF.blankProject('空配方', 'emptyrecipe');
emptyProj.elements.push(BF.normalizeElement({
  id:'er1', type:'item', name:'空配方物品', reg:'empty_item',
  textures:{ main:{ w:16, h:16, data:new Array(256).fill('#ffffff') } },
  recipes:[
    { id:'rr1', type:'crafting', shapeless:false, grid:[null,null,null,null,null,null,null,null,null], count:1 },
    { id:'rr2', type:'crafting', shapeless:true,  grid:[null,null,null,null,null,null,null,null,null], count:1 }
  ] }));
const erBuilt = BF.buildProject(emptyProj, { png: () => fakePng });
const erRecipes = erBuilt.files.filter(x => /recipes\/[^/]+\.json$/.test(x.path));
assert(erRecipes.length === 0, 'empty crafting recipes are skipped (vanilla rejects empty pattern)');
assert(erBuilt.warnings.some(w => /空的/.test(w)), 'empty recipe raises an export warning');
const badRecipes = [];
files.filter(x => /recipes\/[^/]+\.json$/.test(x.path)).forEach(x => {
  const j = JSON.parse(x.content);
  if (j.type === 'minecraft:crafting_shaped' && (!j.pattern || !j.pattern.length))
    badRecipes.push(x.path + ' (empty pattern)');
  if (j.type === 'minecraft:crafting_shapeless' && (!j.ingredients || !j.ingredients.length))
    badRecipes.push(x.path + ' (no ingredients)');
});
assert(badRecipes.length === 0, 'no empty crafting recipe in the demo project' +
  (badRecipes.length ? ' -> ' + badRecipes.join(', ') : ''));

/* ---------- 物品消耗只能在服务端执行（客户端也扣会「闪一下」） ---------- */
const useProj = BF.blankProject('消耗', 'useitem');
useProj.elements.push(BF.normalizeElement({
  id:'ui1', type:'misc', name:'消耗品', reg:'consume_item',
  textures:{ main:{ w:16, h:16, data:new Array(256).fill('#ffffff') } },
  rightClick:'heal', consumeItem:true, damageOnUse:2, useAnim:'eat', useDuration:20 }));
useProj.elements.push(BF.normalizeElement({
  id:'ui2', type:'misc', name:'右键药水', reg:'right_click_potion',
  textures:{ main:{ w:16, h:16, data:new Array(256).fill('#ffffff') } },
  rightClick:'heal', consumeItem:true, damageOnUse:1 }));
const uiBuilt = BF.buildProject(useProj, { png: () => fakePng });
const uiFile = uiBuilt.files.find(x => /item\/ConsumeItemItem\.java$/.test(x.path));
const uiFile2 = uiBuilt.files.find(x => /item\/RightClickPotionItem\.java$/.test(x.path));
assert(!!uiFile && !!uiFile2, 'consumable item classes generated');
if (uiFile) {
  assert(/if \(!level\.isClientSide\) result\.shrink\(1\)/.test(uiFile.content),
    'finishUsingItem shrinks the stack on the server only');
  assert(/if \(!level\.isClientSide\) result\.hurtAndBreak/.test(uiFile.content),
    'finishUsingItem damages the stack on the server only');
}
if (uiFile2) {
  const useBody = uiFile2.content.match(/public InteractionResultHolder<ItemStack> use\([\s\S]*?\n    \}/);
  assert(!!useBody && /if \(!level\.isClientSide\) \{/.test(useBody[0]) &&
    /stack\.shrink\(1\)/.test(useBody[0]),
    'use() consumes the item inside the server-side branch');
}
/* 全项目扫描：任何 shrink / hurtAndBreak / addCooldown 都必须被 isClientSide 保护 */
const unguarded = [];
files.filter(x => /item\/[^/]*Item\.java$/.test(x.path)).forEach(x => {
  const ls = x.content.split('\n');
  ls.forEach((ln, i) => {
    if (!/\.shrink\(1\)|hurtAndBreak|addCooldown/.test(ln)) return;
    const ctx = ls.slice(Math.max(0, i - 3), i + 1).join('\n');
    if (!/isClientSide/.test(ctx)) unguarded.push(x.path + ':' + (i + 1) + ' ' + ln.trim());
  });
});
assert(unguarded.length === 0, 'no client-side item consumption in the demo project' +
  (unguarded.length ? ' -> ' + unguarded.join(', ') : ''));

/* ---------- 像素编辑器：旋转非正方形贴图（护甲 64×32）不能写坏数据 ---------- */
require('./src/pixel.js');
const fakeCtx = { clearRect(){}, fillRect(){}, beginPath(){}, moveTo(){}, lineTo(){}, stroke(){}, };
const fakeCanvas = { getContext: () => fakeCtx, addEventListener(){}, width:0, height:0, style:{} };
const pe = new BF.PixelEditor(fakeCanvas, function () {});
const rt = { w:64, h:32, data:new Array(64*32).fill('#123456') };
rt.data[0] = '#ff0000';
pe.load(rt);
pe.rotate();
assert(pe.tex.data.length === 64*32 && pe.tex.w === 32 && pe.tex.h === 64,
  'rotate keeps non-square texture data consistent (' + pe.tex.w + 'x' + pe.tex.h + ')');
assert(pe.tex.data[31] === '#ff0000', 'rotate moves the top-left pixel to the top-right');

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

/* ===== 本轮：Java 标识符合法性 + 损坏项目健壮性 ===== */
{
  /* 注册名以数字开头：游戏 ID 保留，但 Java 类名/常量名/package 必须合法 */
  const numProj = BF.blankProject('数字名', '123mod');
  const numEl = BF.defaultElement('item');
  numEl.reg = '123abc';
  numProj.elements = [numEl];
  const nb = BF.buildProject(BF.normalizeProject(JSON.parse(JSON.stringify(numProj))), { png: () => fakePng });
  const decls = [];
  nb.files.filter(x => x.path.endsWith('.java')).forEach(x => {
    const m = x.content.match(/public class (\w+)/);
    if (m) decls.push(m[1]);
  });
  assert(decls.length > 0 && decls.every(n => !/^\d/.test(n)),
    'java: numeric-leading reg/modid produces legal class names (' + decls.join(',') + ')');
  const pkgLine = nb.files.find(x => x.path.endsWith('Mod.java')).content.match(/^package ([\w.]+);/m);
  assert(pkgLine && pkgLine[1].split('.').every(seg => !/^\d/.test(seg)),
    'java: package segments never start with a digit (' + (pkgLine && pkgLine[1]) + ')');
  const zhNum = JSON.parse(nb.files.find(x => x.path.endsWith('zh_cn.json')).content);
  assert(Object.keys(zhNum).some(k => k.indexOf('123abc') >= 0),
    'java: game ID still preserves the numeric-leading registration name');

  /* 损坏/畸形项目文件不能让 normalizeProject 崩溃 */
  const broken = [
    ['string element', { meta:{modid:'x'}, elements:['foo', null, 42] }],
    ['empty element', { meta:{modid:'x'}, elements:[{}] }],
    ['bad textures', { meta:{modid:'x'}, elements:[{type:'block', name:'b', reg:'b', textures:'bad'}] }],
    ['bad mobParts', { meta:{modid:'x'}, elements:[{type:'mob', name:'m', reg:'m', mobParts:'bad'}] }],
    ['null mob part', { meta:{modid:'x'}, elements:[{type:'mob', name:'m', reg:'m', mobParts:[null]}] }],
    ['duplicate ids', { meta:{modid:'x'}, elements:[{id:'same',type:'item',name:'a',reg:'a'},{id:'same',type:'item',name:'b',reg:'b'}] }]
  ];
  broken.forEach(function (entry) {
    let ok = true, err = '';
    try {
      const fixed = BF.normalizeProject(JSON.parse(JSON.stringify(entry[1])));
      BF.buildProject(fixed, { png: () => fakePng });
      const ids = fixed.elements.map(e => e.id);
      ok = new Set(ids).size === ids.length;
    } catch (e) { ok = false; err = e.message; }
    assert(ok, 'robust: malformed project survives normalize+build (' + entry[0] + ')' + (err ? ' -> ' + err : ''));
  });

  /* TOML 元数据转义：特殊字符不能截断 mods.toml */
  const tomlProj = BF.blankProject('T', 't');
  tomlProj.meta.author = 'Bob" }\n[bad]';
  const tb = BF.buildProject(tomlProj, { png: () => fakePng });
  const toml = tb.files.find(x => x.path.endsWith('mods.toml')).content;
  assert(toml.indexOf('authors="Bob\\" }\\n[bad]"') >= 0 && toml.indexOf('\n[bad]') < 0,
    'toml: quotes/newlines in metadata are escaped (mods.toml stays parseable)');

  /* creative_tab_icon 名称冲突：用户元素必须让位，避免重复字段与资源覆盖 */
  const clashProj = BF.blankProject('T', 't');
  const clashEl = BF.defaultElement('item');
  clashEl.reg = 'creative_tab_icon';
  clashProj.elements = [clashEl];
  const cb2 = BF.buildProject(clashProj, { png: () => fakePng });
  const itemFields = cb2.files.find(x => x.path.endsWith('ModItems.java')).content;
  assert((itemFields.match(/CREATIVE_TAB_ICON\s*=/g) || []).length === 1,
    'java: user element colliding with creative_tab_icon is renamed (no duplicate field)');

  /* 生物掉落/交易的空引用与外部引用不能生成非法 Java */
  const mobProj = BF.blankProject('T', 't');
  const mobEl = BF.defaultElement('mob');
  mobEl.reg = 'm';
  mobEl.mobCfg.drops = [{ ref:null, count:1, chance:1 }, { ref:'othermod:weird', count:1, chance:1 }];
  mobEl.mobCfg.trades = [{ ref:null, price:null, count:1, pcount:1 }];
  mobProj.elements = [mobEl];
  const mb = BF.buildProject(mobProj, { png: () => fakePng });
  const entJava = mb.files.find(x => x.path.endsWith('MEntity.java')).content;
  assert(!/new ItemStack\(ItemStack\.EMPTY|Items\.OTHERMOD_/.test(entJava),
    'java: null/external refs in mob drops & trades do not produce invalid constructors');
  assert(mb.warnings.some(w => /其它模组的物品/.test(w)),
    'java: external-namespace refs produce an export warning');
  /* 空交易让实体退化为 Animal 后，必须仍实现 AgeableMob 的抽象方法；
     getOffers 则不能出现在非 Villager 子类上 */
  const friendlyProj = BF.blankProject('T', 't');
  const friendlyMob = BF.defaultElement('mob');
  friendlyMob.reg = 'pet';
  friendlyMob.mobCfg.friendly = true;
  friendlyMob.mobCfg.trades = [{ ref:null, price:null, count:1, pcount:1 }];
  friendlyProj.elements = [friendlyMob];
  const fb = BF.buildProject(friendlyProj, { png: () => fakePng });
  const fEnt = fb.files.find(x => x.path.endsWith('PetEntity.java')).content;
  assert(/extends Animal/.test(fEnt) && /getBreedOffspring/.test(fEnt) && !/getOffers/.test(fEnt),
    'java: friendly mob with empty trades is a complete Animal (no @Override mismatch)');

  /* 熔炼经验值 0 必须保留为 0，不能被 `|| 0.5` 改写 */
  const smeltProj = BF.blankProject('T', 't');
  const smeltEl = BF.defaultElement('item');
  smeltEl.reg = 'ingot';
  smeltEl.recipes = [{ id:'r', type:'smelting', out:'elem:' + smeltEl.id, count:1,
    ingredients:[{ ref:'minecraft:iron_ore', count:1 }], xp:0, time:200,
    grid:['minecraft:iron_ore',null,null,null,null,null,null,null,null] }];
  smeltProj.elements = [smeltEl];
  const sb = BF.buildProject(smeltProj, { png: () => fakePng });
  const smeltJson = sb.files.find(x => /recipes\/ingot_1\.json$/.test(x.path));
  assert(smeltJson && JSON.parse(smeltJson.content).experience === 0,
    'recipe: smelting XP=0 is preserved (not silently changed to 0.5)');
}

/* ===== 本轮新功能：原版贴图模板 / 工作站自定义配方 / 多方块核心 ===== */
{
  /* --- 原版模板库 --- */
  const T = BF.VANILLA_TEXTURES || {};
  const itemKeys = Object.keys(T.item || {}), blockKeys = Object.keys(T.block || {});
  assert(itemKeys.length >= 40 && blockKeys.length >= 40,
    'vanilla: bundled template library has enough item/block textures (' + itemKeys.length + '/' + blockKeys.length + ')');
  assert(itemKeys.every(k => /^iVBOR/.test(T.item[k])) && blockKeys.every(k => /^iVBOR/.test(T.block[k])),
    'vanilla: every template is a valid PNG base64 payload');
  assert(BF.VANILLA_NAMES['minecraft:iron_ingot'] === '铁锭' &&
    Object.keys(T.item).filter(k => BF.VANILLA_NAMES['minecraft:' + k]).length >= Object.keys(T.item).length * 0.9,
    'vanilla: templates carry Chinese display names');
  assert(/importDataUrl/.test(fs.readFileSync(path.join(__dirname, 'src/pixel.js'), 'utf8')),
    'vanilla: pixel editor can load a template data-url');

  /* --- 工作站自定义配方：三输入 + 独立能量/时间 --- */
  const wsProj = BF.blankProject('工作站', 'ws');
  const ws = BF.defaultElement('workstation');
  ws.reg = 'forge_table';
  ws.stationRecipes = [
    { id:'r1', a:'minecraft:iron_ingot', ca:2, b:'minecraft:coal', cb:1, c:null, cc:1,
      out:'minecraft:diamond', count:1, energy:250, time:60 },
    { id:'r2', a:'minecraft:stone', ca:1, b:null, cb:1, c:'minecraft:redstone', cc:4,
      out:'minecraft:emerald', count:2, energy:0, time:20 }
  ];
  wsProj.elements = [ws];
  const wb = BF.buildProject(wsProj, { png: () => fakePng });
  const be = wb.files.find(x => x.path.endsWith('ForgeTableBlockEntity.java')).content;
  assert(/StationRecipe\(.*?250, 60\)/.test(be) && /StationRecipe\(.*?0, 20\)/.test(be),
    'station: each recipe keeps its own energy cost and processing time');
  assert(/public final ItemStack a, b, c, out;/.test(be) && /INPUT_SLOTS > 2/.test(be),
    'station: recipes support a third input slot');
  assert(/getEnergyStored\(\) >= recipe\.energy/.test(be) && /progress >= recipe\.time/.test(be),
    'station: tick uses the matched recipe energy/time, not global constants');

  /* --- 多方块核心 --- */
  const coreProj = BF.blankProject('核心', 'cm');
  const pillar = BF.defaultElement('block'); pillar.reg = 'pillar';
  const pet = BF.defaultElement('mob'); pet.reg = 'spirit';
  const coreEl = BF.defaultElement('core'); coreEl.reg = 'altar';
  coreEl.coreCfg.structure = [
    { dx:1, dy:0, dz:0, block:'elem:' + pillar.id },
    { dx:0, dy:1, dz:0, block:'minecraft:gold_block' }
  ];
  coreEl.coreCfg.actions = [
    { id:'a1', type:'summon', entity:'elem:' + pet.id, count:2, offset:[0,1,0] },
    { id:'a2', type:'loot', item:'minecraft:diamond', count:3, offset:[0,0,0] },
    { id:'a3', type:'buff', effect:'strength', duration:400, amplifier:1 },
    { id:'a4', type:'lightning', offset:[1,0,1] },
    { id:'a5', type:'command', command:'say 结构已激活' },
    { id:'a6', type:'place', block:'minecraft:gold_block', offset:[0,2,0] }
  ];
  coreProj.elements = [pillar, pet, coreEl];
  const cb3 = BF.buildProject(coreProj, { png: () => fakePng });
  const coreJava = (cb3.files.find(x => x.path.endsWith('AltarBlock.java')) || {}).content || '';
  assert(/extends Block/.test(coreJava) && /isFormed\(Level level, BlockPos pos\)/.test(coreJava),
    'core: multiblock structure validation is generated');
  /* 资源侧为所有方块生成 facing 变体，类里必须声明 FACING，否则
     游戏报 Unknown blockstate property，模型不渲染（紫黑乱码） */
  const coreState = JSON.parse(cb3.files.find(x => x.path.endsWith('blockstates/altar.json')).content);
  assert(/DirectionProperty FACING/.test(coreJava) && /createBlockStateDefinition/.test(coreJava) &&
    Object.keys(coreState.variants).every(k => k.indexOf('facing=') === 0),
    'core: blockstate variants match the declared FACING property (no purple/black texture)');
  assert(/new int\[\]\{1, 0, 0\}/.test(coreJava) && /ModBlocks\.PILLAR\.get\(\)/.test(coreJava),
    'core: structure offsets reference the configured blocks');
  ['ModEntities.SPIRIT.get().create(sl)', 'Block.popResource', 'MobEffects.DAMAGE_BOOST',
   'LIGHTNING_BOLT', 'performPrefixedCommand', 'setBlockAndUpdate'].forEach(function (snippet) {
    assert(coreJava.indexOf(snippet) >= 0, 'core: action generated -> ' + snippet);
  });
  assert(/InteractionResult use\(/.test(coreJava) && /COOLDOWN/.test(coreJava),
    'core: right-click trigger with cooldown');

  /* 挖掘工具标签必须落在 minecraft 命名空间：原版判断的是
     #minecraft:mineable/<tool> 与 #minecraft:needs_<tier>_tool，
     写在 data/<modid>/tags 下只会成为「自定义标签」，原版不认 → 用对工具也不掉落。 */
  const tagProj = BF.blankProject('标签', 'tagtest');
  const stoneBlk = BF.defaultElement('block');
  stoneBlk.reg = 'ruby_block'; stoneBlk.tool = 'pickaxe'; stoneBlk.harvestLevel = 2;
  const woodBlk = BF.defaultElement('block');
  woodBlk.reg = 'wood_crate'; woodBlk.tool = 'axe'; woodBlk.harvestLevel = 1;
  tagProj.elements = [stoneBlk, woodBlk];
  const tagBuilt = BF.buildProject(tagProj, { png: () => fakePng });
  const tagFiles = tagBuilt.files.filter(x => x.path.indexOf('/tags/') >= 0);
  assert(tagFiles.every(x => x.path.indexOf('/data/minecraft/tags/blocks/') >= 0),
    'mining: tool tags are written under data/minecraft/tags/blocks (vanilla reads only this)');
  const pickTag = tagBuilt.files.find(x => x.path.endsWith('/mineable/pickaxe.json'));
  const ironTag = tagBuilt.files.find(x => x.path.endsWith('/needs_iron_tool.json'));
  assert(pickTag && JSON.parse(pickTag.content).values.indexOf('tagtest:ruby_block') >= 0 &&
    ironTag && JSON.parse(ironTag.content).values.indexOf('tagtest:ruby_block') >= 0,
    'mining: blocks with tool+level are listed in mineable and needs_*_tool tags');
  assert(tagBuilt.files.some(x => x.path.endsWith('/mineable/axe.json')),
    'mining: axe-mined block gets its own mineable tag');
  const formedProj = BF.blankProject('成型触发', 'cf');
  const formedCore = BF.defaultElement('core'); formedCore.reg = 'beacon_core';
  formedCore.coreCfg.trigger = 'formed';
  formedCore.coreCfg.actions = [{ id:'x', type:'loot', item:'minecraft:emerald', count:1, offset:[0,1,0] }];
  formedProj.elements = [formedCore];
  const formedJava = BF.buildProject(formedProj, { png: () => fakePng })
    .files.find(x => x.path.endsWith('BeaconCoreBlock.java')).content;
  assert(/onPlace\(BlockState state, Level level, BlockPos pos/.test(formedJava) && /runActions/.test(formedJava),
    'core: formed-trigger mode fires when the last block is placed');
  /* 空引用/未设置不能生成非法代码 */
  const badProj = BF.blankProject('空动作', 'cbad');
  const badCore = BF.defaultElement('core'); badCore.reg = 'dead_core';
  badCore.coreCfg.actions = [
    { id:'b1', type:'summon', entity:null, count:1, offset:[0,1,0] },
    { id:'b2', type:'loot', item:null, count:1, offset:[0,1,0] },
    { id:'b3', type:'command', command:'' }
  ];
  badProj.elements = [badCore];
  const badJava = BF.buildProject(badProj, { png: () => fakePng })
    .files.find(x => x.path.endsWith('DeadCoreBlock.java')).content;
  assert(!/create\(sl\)/.test(badJava) && !/Block\.popResource/.test(badJava) && !/null\.defaultBlockState/.test(badJava),
    'core: empty action references are skipped (no invalid Java)');
  /* 配方/语言/资源完整性 */
  assert(cb3.files.some(x => /assets\/cm\/blockstates\/altar\.json$/.test(x.path)) &&
    cb3.files.filter(x => /textures\/block\/altar_/.test(x.path)).length === 6,
    'core: six-face model, blockstate and textures generated');
  assert(/message\.cm\.altar\.not_formed/.test(cb3.files.find(x => x.path.endsWith('zh_cn.json')).content),
    'core: incomplete-structure message is localized');
}

/* ===== 原版生物模板 + GeckoLib 几何导入 ===== */
{
  const tpls = BF.MOB_TEMPLATES || [];
  assert(tpls.length >= 12, 'mob templates: a library of vanilla-like skeletons is bundled (' + tpls.length + ')');
  const ok = tpls.every(function (t) {
    const e = BF.defaultElement('mob');
    if (!BF.applyMobTemplate(e, t.k)) return false;
    const sz = BF.mobTextureSize(e.mobParts);
    return e.mobParts.length > 0 &&
      e.mobParts.every(p => Array.isArray(p.pivot) && p.size.every(v => v > 0)) &&
      e.textures.skin.w === sz.w && e.textures.skin.h === sz.h &&
      e.mobCfg.health > 0;
  });
  assert(ok, 'mob templates: every template applies with valid parts and matching skin size');
  assert(tpls.some(t => t.k === 'zombie') && tpls.some(t => t.k === 'cow') && tpls.some(t => t.k === 'spider'),
    'mob templates: humanoid / quadruped / eight-legged shapes are all covered');
  /* GeckoLib .geo.json -> parts：pivot 为骨骼枢轴，offset 为相对最小角 */
  const geoSample = JSON.stringify({
    format_version: '1.12.0',
    'minecraft:geometry': [{
      description: { texture_width: 64, texture_height: 64 },
      bones: [
        { name: 'body', pivot: [0, 24, 0], cubes: [{ origin: [-4, 12, -2], size: [8, 12, 4] }] },
        { name: 'right_arm', pivot: [-6, 22, 0], cubes: [
          { origin: [-8, 12, -2], size: [4, 10, 4] },
          { origin: [-8, 2, -2], size: [4, 8, 4] }] }
      ]
    }]
  });
  const geo = BF.parseGeoModel(geoSample);
  assert(geo.count === 3 && geo.parts[0].size.join(',') === '8,12,4' &&
    geo.parts[0].offset.join(',') === '-4,-12,-2',
    'geolib: .geo.json cubes are converted with correct pivot-relative offsets');
  assert(geo.parts.some(p => p.name.indexOf('right_arm') === 0) &&
    new Set(geo.parts.map(p => p.name)).size === geo.parts.length,
    'geolib: bones with multiple cubes get unique part names');
  /* 动画 JSON（GeckoLib / Blockbench 同构）转关键帧 */
  const anim = BF.animationJsonToFrames(JSON.stringify({
    animations: { idle: { loop: true, bones: {
      head: { rotation: { '0.0': [0, 0, 0], '1.0': [0, 20, 0] } },
      right_arm: { rotation: { '0': [10, 0, 0], '0.5': [30, 0, 0] } }
    } } }
  }));
  assert(anim.length >= 4 && anim.some(f => f.part === 'head' && f.ry === 20),
    'geolib: animation JSON is converted into editor keyframes');
}
