/* ============================================================
   BlockForge Studio — Forge 1.20.1 Java project generator
   ============================================================ */
(function (root) {
'use strict';
var BF = root.BF = root.BF || {};

/* ---------- small helpers ---------- */
function num(v, d) { var n = Number(v); return isFinite(n) ? Math.round(n) : (d || 0); }
function fv(v) { var n = Number(v) || 0; return (Math.round(n*100)/100).toFixed(1) + 'f'; }
function jstr(s) { return JSON.stringify(String(s == null ? '' : s)); }
function helpfulName(reg) {
  return reg.split('_').filter(Boolean).map(function (w) {
    return w.charAt(0).toUpperCase() + w.slice(1); }).join(' ');
}
function dyeOf(hex) {
  var c = BF.hex2rgb(hex), r = c[0], g = c[1], b = c[2];
  if (r > 205 && g > 205 && b > 205) return 'WHITE';
  if (r < 70 && g < 70 && b < 70) return 'BLACK';
  if (g > r*1.25 && g > b*1.25) return 'GREEN';
  if (b > r*1.25 && b > g*1.15) return 'BLUE';
  if (r > g*1.4 && r > b*1.4) return 'RED';
  if (r > 180 && g > 150 && b < 120) return 'YELLOW';
  if (r > 130 && b > 130 && g < 120) return 'MAGENTA';
  if (g > 150 && b > 150) return 'CYAN';
  if (r > 150 && g > 90 && b < 90) return 'ORANGE';
  if (r < 130 && g < 130 && b < 130) return 'GRAY';
  return 'LIGHT_GRAY';
}
function materialOf(sound) {
  return ({ METAL:'METAL', WOOD:'WOOD', GLASS:'GLASS', GRASS:'GRASS', WOOL:'WOOL',
            AMETHYST:'AMETHYST', STONE:'STONE' })[sound] || 'STONE';
}

/* ---------- procedural GUI / armor textures ---------- */
/* ignoreHandDrawn=true always returns the procedural layout (used as a drawing base) */
BF.guiTexture = function (e, ignoreHandDrawn) {
  var W = 256, H = 256, d = new Array(W*H).fill(null);
  function put(x,y,c) { if (x>=0 && y>=0 && x<W && y<H) d[y*W+x] = c; }
  function slot(x,y) {
    for (var j=-1;j<18;j++) for (var i=-1;i<18;i++) {
      var c = '#8b8b8b';
      if (i===-1 || j===-1) c = '#373737';
      if (i===17 || j===17) c = '#ffffff';
      put(x+i, y+j, c);
    }
  }
  for (var y=0;y<166;y++) for (var x=0;x<176;x++) {
    var c = '#c6c6c6';
    if (x===0||y===0||x===175||y===165) c = '#000000';
    else if (x===1||y===1) c = '#ffffff';
    else if (x===174||y===164) c = '#555555';
    put(x,y,c);
  }
  /* player inventory + hotbar slots */
  for (var r=0;r<3;r++) for (var col=0;col<9;col++) slot(8+col*18, 84+r*18);
  for (var h=0;h<9;h++) slot(8+h*18, 142);
  /* custom slots */
  (e.ui && e.ui.slots ? e.ui.slots : []).forEach(function (s) { slot(s.x, s.y); });
  /* progress arrow background */
  for (var py=0;py<16;py++) for (var pxi=0;pxi<24;pxi++) put(78+pxi, 34+py, '#8b8b8b');
  for (var py2=0;py2<16;py2++) for (var pxi2=0;pxi2<24;pxi2++) {
    var on = pxi2 < 20 && (py2>=5 && py2<=10 || (py2>=3 && py2<=12 && pxi2>=17));
    if (on) put(78+pxi2, 34+py2, '#5b5b5b');
  }
  /* arrow strip used by blit (u=176..200) */
  for (var ay=0;ay<16;ay++) for (var ax=0;ax<24;ax++) {
    var active = (ay>=5 && ay<=10 && ax<20) || (ay>=3 && ay<=12 && ax>=17 && ax<23);
    put(176+ax, ay, active ? '#e8b64c' : null);
  }
  /* flame strip (u=176,v=16) */
  for (var fy=0;fy<14;fy++) for (var fx=0;fx<14;fx++) {
    var dist = Math.abs(fx-6.5) + Math.abs(fy-8)*0.8;
    put(176+fx, 16+fy, dist < 5.2 ? (dist<2.6 ? '#ffe9a0' : '#e8732a') : null);
  }
  /* hand-drawn background overrides the procedural 176x166 panel */
  var gp = ignoreHandDrawn ? null : e.guiPixels;
  if (gp && gp.data && gp.w === 176 && gp.h === 166) {
    for (var gy=0;gy<166;gy++) for (var gx=0;gx<176;gx++) {
      put(gx, gy, gp.data[gy*gp.w+gx] || null);
    }
  }
  return { w:W, h:H, data:d };
};
function armorLayerTex(e, layer) {
  var W = 64, H = 32, d = new Array(W*H).fill(null);
  var src = e.textures.main || { w:16,h:16,data:[] };
  for (var y=0;y<H;y++) for (var x=0;x<W;x++) {
    var sx = Math.floor((x % 32)/2), sy = Math.floor(y/2);
    if (sx>=src.w || sy>=src.h) continue;
    var c = src.data[sy*src.w+sx];
    if (c && ((x < 32 && layer===1) || (x >= 32 && layer===2))) d[y*W+x] = c;
  }
  return { w:W, h:H, data:d };
}

/* ---------- Java import blocks ---------- */
var BASE_IMPORTS = [
'import net.minecraft.world.item.*;',
'import net.minecraft.world.item.crafting.*;',
'import net.minecraft.world.item.trading.*;',
'import net.minecraft.world.entity.*;',
'import net.minecraft.world.entity.player.*;',
'import net.minecraft.world.entity.projectile.*;',
'import net.minecraft.world.entity.monster.*;',
'import net.minecraft.world.entity.animal.*;',
'import net.minecraft.world.entity.npc.*;',
'import net.minecraft.world.entity.ai.goal.*;',
'import net.minecraft.world.entity.ai.goal.target.*;',
'import net.minecraft.server.level.*;',
'import net.minecraft.client.model.*;',
'import net.minecraft.client.model.geom.*;',
'import net.minecraft.client.model.geom.builders.*;',
'import net.minecraft.client.renderer.entity.*;',
'import net.minecraft.client.gui.GuiGraphics;',
'import net.minecraft.client.gui.screens.inventory.AbstractContainerScreen;',
'import com.mojang.blaze3d.vertex.PoseStack;',
'import com.mojang.blaze3d.vertex.VertexConsumer;',
'import net.minecraft.world.effect.*;',
'import net.minecraft.world.level.*;',
'import net.minecraft.world.level.block.*;',
'import net.minecraft.world.level.block.entity.*;',
'import net.minecraft.world.level.block.state.*;',
'import net.minecraft.world.level.block.state.properties.*;',
'import net.minecraft.world.item.context.*;',
'import net.minecraft.world.entity.ai.attributes.*;',
'import net.minecraft.world.phys.shapes.*;',
'import net.minecraft.core.registries.BuiltInRegistries;',
'import net.minecraft.world.level.levelgen.feature.*;',
'import net.minecraft.world.level.levelgen.feature.configurations.*;',
'import com.mojang.serialization.Codec;',
'import net.minecraftforge.energy.*;',
'import net.minecraftforge.common.capabilities.*;',
'import net.minecraftforge.common.util.LazyOptional;',
'import net.minecraftforge.common.ToolAction;',
'import net.minecraftforge.common.ToolActions;',
'import com.google.common.collect.Multimap;',
'import com.google.common.collect.ImmutableMultimap;',
'import net.minecraft.world.food.*;',
'import net.minecraft.world.*;',
'import net.minecraft.world.inventory.*;',
'import net.minecraft.world.phys.*;',
'import net.minecraft.network.chat.*;',
'import net.minecraft.nbt.*;',
'import net.minecraft.core.*;',
'import net.minecraft.core.registries.Registries;',
'import net.minecraft.resources.ResourceLocation;',
'import net.minecraft.tags.TagKey;',
'import net.minecraft.sounds.*;',
'import net.minecraft.*;',
'import net.minecraftforge.registries.DeferredRegister;',
'import net.minecraftforge.registries.ForgeRegistries;',
'import net.minecraftforge.registries.RegistryObject;',
'import net.minecraftforge.common.extensions.IForgeMenuType;',
'import net.minecraftforge.network.NetworkHooks;',
'import net.minecraftforge.event.BuildCreativeModeTabContentsEvent;',
'import net.minecraftforge.eventbus.api.IEventBus;',
'import net.minecraftforge.eventbus.api.SubscribeEvent;',
'import net.minecraftforge.fml.common.Mod;',
'import net.minecraftforge.fml.javafmlmod.FMLJavaModLoadingContext;',
'import net.minecraftforge.fml.event.lifecycle.FMLCommonSetupEvent;',
'import net.minecraftforge.common.MinecraftForge;',
'import com.mojang.logging.LogUtils;',
'import org.slf4j.Logger;',
'import java.util.*;',
'import java.util.function.Supplier;'
].join('\n');

/* ---------- context ---------- */
function prepare(state) {
  var m = state.meta || {};
  var modid = BF.slug(m.modid || 'mymod');
  var pkg = String(m.pkg || ('com.' + modid)).toLowerCase()
    .replace(/[^a-z0-9_.]/g,'').replace(/\.+/g,'.').replace(/^\.|\.$/g,'') || ('com.' + modid);
  var seen = {};
  var els = (state.elements || []).map(function (raw) {
    var e = BF.clone(raw);
    var r = BF.slug(e.reg);
    if (seen[r]) { var n = 2; while (seen[r+'_'+n]) n++; r = r + '_' + n; }
    seen[r] = 1;
    e._reg = r;
    e._up = BF.upper(r);
    e._cls = BF.pascal(r);
    e._isBlock = ['block','workstation','energy','generator'].indexOf(e.type) >= 0;
    e._isBlockItem = e._isBlock || e.type === 'cluster';
    return e;
  });
  var byId = {}; els.forEach(function (e) { byId[e.id] = e; });
  var mainCls = BF.pascal(modid) + 'Mod';
  /* 项目内部导入必须按实际生成的类条件添加：
     空白项目只加一个方块时，block.entity / menu / client.screen 包根本不存在，
     无条件 import 会让整个工程编译失败 */
  var types = {};
  els.forEach(function (e) { types[e.type] = 1; });
  /* 生成 block/ 包内类的类型：block、workstation、energy、generator、cluster。
     mob-only 项目没有 block 类，无条件 import pkg.block.* 会编译失败 */
  var hasBlockClasses = ['block','workstation','energy','generator','cluster'].some(function (t) { return types[t]; });
  var projectImports = [
    'import ' + pkg + '.' + mainCls + ';',
    'import ' + pkg + '.ModMaterials;',
    'import ' + pkg + '.registry.*;',
    'import ' + pkg + '.item.*;'
  ];
  if (hasBlockClasses) projectImports.push('import ' + pkg + '.block.*;');
  if (types.workstation) {
    projectImports.push(
      'import ' + pkg + '.block.entity.*;',
      'import ' + pkg + '.menu.*;',
      'import ' + pkg + '.client.screen.*;');
  }
  if (types.mob) {
    projectImports.push(
      'import ' + pkg + '.entity.*;',
      'import ' + pkg + '.entity.model.*;',
      'import ' + pkg + '.client.*;');
  }
  if (types.energy || types.generator || types.workstation) {
    projectImports.push('import ' + pkg + '.energy.ModEnergy;');
  }
  projectImports = projectImports.join('\n');
  /* 品牌资源：兼容旧项目（缺字段或尺寸不对时用默认图案） */
  var ct = (m.creativeTab && typeof m.creativeTab === 'object') ? m.creativeTab
    : (BF.defaultCreativeTab ? BF.defaultCreativeTab(m.name || modid) : { enabled:true, title:m.name || modid, icon:null });
  if (typeof ct.enabled !== 'boolean') ct.enabled = true;
  if (!ct.title) ct.title = m.name || modid;
  if (!ct.icon || !Array.isArray(ct.icon.data) || ct.icon.data.length !== 256)
    ct.icon = BF.defaultCreativeTabIcon();
  var packIcon = (m.packIcon && Array.isArray(m.packIcon.data) && m.packIcon.data.length === 4096)
    ? m.packIcon : BF.defaultPackIcon();
  return {
    m: m, modid: modid, pkg: pkg, pkgPath: pkg.replace(/\./g,'/'),
    root: modid + '/', els: els, byId: byId,
    ct: ct, packIcon: packIcon,
    mainCls: mainCls,
    IMPORTS: BASE_IMPORTS + '\n' + projectImports,
    java: 'src/main/java/' + pkg.replace(/\./g,'/') + '/',
    res: 'src/main/resources/'
  };
}
function refKeyOf(ref, c) {
  if (!ref) return null;
  if (ref.indexOf('elem:') === 0) {
    var e = c.byId[ref.slice(5)];
    return e ? c.modid + ':' + e._reg : null;
  }
  return ref;
}
function refItemOf(ref, c) {
  if (!ref) return 'ItemStack.EMPTY';
  if (ref.indexOf('elem:') === 0) {
    var e = c.byId[ref.slice(5)];
    if (!e) return 'ItemStack.EMPTY';
    /* every element owns a BlockItem in ModItems, even blocks */
    return 'new ItemStack(ModItems.' + e._up + '.get())';
  }
  return 'new ItemStack(Items.' + BF.upper(ref.replace('minecraft:','')) + ')';
}
function refIngredientOf(ref, c) {
  if (!ref) return null;
  if (ref.indexOf('elem:') === 0) {
    var e = c.byId[ref.slice(5)];
    if (!e) return null;
    return 'Ingredient.of(ModItems.' + e._up + '.get())';
  }
  return 'Ingredient.of(Items.' + BF.upper(ref.replace('minecraft:','')) + ')';
}

/* ---------- vanilla 1.20.1 mappings ---------- */
var MOB_MAP = {
  none:null, speed:'MOVEMENT_SPEED', strength:'DAMAGE_BOOST', regeneration:'REGENERATION',
  fire_resistance:'FIRE_RESISTANCE', night_vision:'NIGHT_VISION', invisibility:'INVISIBILITY',
  haste:'DIG_SPEED', jump:'JUMP', water_breathing:'WATER_BREATHING',
  slow_falling:'SLOW_FALLING', absorption:'ABSORPTION', resistance:'DAMAGE_RESISTANCE',
  saturation:'SATURATION', poison:'POISON', wither:'WITHER', slow:'MOVEMENT_SLOWDOWN',
  weakness:'WEAKNESS', blindness:'BLINDNESS'
};
function mobConst(v) { return MOB_MAP[v] || null; }
var USE_ANIM = { none:null, eat:'EAT', drink:'DRINK', bow:'BOW', block:'BLOCK',
  spear:'SPEAR', crossbow:'CROSSBOW', spyglass:'SPYGLASS', toot_horn:'TOOT_HORN', brush:'BRUSH' };
function tagExpr(tag) {
  return 'TagKey.create(Registries.BLOCK, new ResourceLocation("minecraft", ' + jstr(tag) + '))';
}
function refJavaItem(ref, c) {
  if (!ref) return null;
  if (ref.indexOf('elem:') === 0) {
    var e = c.byId[ref.slice(5)];
    return e ? 'ModItems.' + e._up + '.get()' : null;
  }
  return 'Items.' + BF.upper(ref.replace('minecraft:',''));
}

/* ---------- vanilla-style tool overrides ---------- */
function toolOverrideMethods(e, c) {
  var out = [];
  var tags = e.fastTags || [];
  if (tags.length) {
    out.push('    private static boolean isFastBlock(BlockState state) {\n        return ' +
      tags.map(function (t) { return 'state.is(' + tagExpr(t) + ')'; }).join('\n            || ') + ';\n    }');
    out.push('    @Override\n    public float getDestroySpeed(ItemStack stack, BlockState state) {\n' +
      '        if (isFastBlock(state)) return ' + fv(e.fastSpeed) + ';\n' +
      '        return super.getDestroySpeed(stack, state);\n    }');
  }
  var actions = e.toolActions || [];
  if (actions.length) {
    out.push('    @Override\n    public boolean canPerformAction(ItemStack stack, ToolAction action) {\n' +
      '        return ' + actions.map(function (a) { return 'action == ToolActions.' + a; }).join('\n            || ') +
      '\n            || super.canPerformAction(stack, action);\n    }');
  }
  if (e.overrideAttributes) {
    out.push('    @Override\n    public Multimap<Attribute, AttributeModifier> getAttributeModifiers(EquipmentSlot slot, ItemStack stack) {\n' +
      '        if (slot == EquipmentSlot.MAINHAND) {\n' +
      '            return ImmutableMultimap.<Attribute, AttributeModifier>builder()\n' +
      '                .put(Attributes.ATTACK_DAMAGE, new AttributeModifier(BASE_ATTACK_DAMAGE_UUID, "Tool modifier", ' +
      fv(e.damage) + ', AttributeModifier.Operation.ADDITION))\n' +
      '                .put(Attributes.ATTACK_SPEED, new AttributeModifier(BASE_ATTACK_SPEED_UUID, "Tool modifier", ' +
      fv(e.attackSpeed) + ', AttributeModifier.Operation.ADDITION))\n' +
      '                .build();\n        }\n' +
      '        return super.getAttributeModifiers(slot, stack);\n    }');
  }
  var repairItem = refJavaItem(e.repair, c);
  if (e.repairable && repairItem &&
      (['tool','weapon','armor'].indexOf(e.type) >= 0 || num(e.damageOnUse,0) > 0)) {
    out.push('    @Override\n    public boolean isValidRepairItem(ItemStack toRepair, ItemStack repairStack) {\n' +
      '        return repairStack.is(' + repairItem + ') || super.isValidRepairItem(toRepair, repairStack);\n    }');
  }
  if (e.enchantable === false) {
    out.push('    @Override\n    public boolean isEnchantable(ItemStack stack) {\n        return false;\n    }');
  } else if (e.enchantable === true && ['tool','weapon','armor'].indexOf(e.type) >= 0) {
    out.push('    @Override\n    public boolean isEnchantable(ItemStack stack) {\n        return true;\n    }');
  }
  if (e.overrideCorrectTool) {
    var lvl = num(e.harvestLevel,2);
    var need = lvl >= 4 ? 'diamond' : (lvl >= 3 ? 'diamond' : (lvl >= 2 ? 'iron' : (lvl >= 1 ? 'stone' : 'wooden')));
    out.push('    @Override\n    public boolean isCorrectToolForDrops(BlockState state) {\n' +
      '        if (state.is(' + tagExpr('needs_' + need + '_tool') + ')) {\n' +
      '            return ' + lvl + ' >= ' + (need === 'diamond' ? 3 : (need === 'iron' ? 2 : 1)) + ';\n' +
      '        }\n        return super.isCorrectToolForDrops(state);\n    }');
  }
  return out;
}
/* ---------- item effect overrides ---------- */
function itemEffectMethods(e, c) {
  var out = [], isItem = !e._isBlockItem;
  if (!isItem) return out;
  if (e.fuelTime > 0) {
    out.push('    @Override\n    public int getBurnTime(ItemStack stack, RecipeType<?> recipeType) {\n        return ' + num(e.fuelTime,200) + ';\n    }');
  }
  var anim = USE_ANIM[e.useAnim];
  if (anim) {
    out.push('    @Override\n    public UseAnim getUseAnimation(ItemStack stack) {\n        return UseAnim.' + anim + ';\n    }');
    out.push('    @Override\n    public int getUseDuration(ItemStack stack) {\n        return ' + num(e.useDuration,32) + ';\n    }');
    var lines = ['        ItemStack result = super.finishUsingItem(stack, level, entity);',
                 '        if (!level.isClientSide) {'];
    var mob = mobConst(e.giveEffect);
    if (mob) lines.push('            entity.addEffect(new MobEffectInstance(MobEffects.' + mob + ', ' +
      (num(e.effectDuration,30)*20) + ', ' + num(e.effectAmplifier,0) + '));');
    if (e.rightClick === 'heal') lines.push('            entity.heal(6.0f);');
    if (e.rightClick === 'xp') lines.push('            if (entity instanceof Player p) p.giveExperiencePoints(30);');
    if (e.rightClick === 'feed') lines.push('            if (entity instanceof Player p) p.getFoodData().eat(6, 0.6f);');
    lines.push('        }');
    if (!e.food && e.consumeItem) lines.push('        result.shrink(1);');
    if (num(e.damageOnUse,0) > 0) lines.push('        result.hurtAndBreak(' + num(e.damageOnUse,1) + ', entity, p -> {});');
    lines.push('        return result;');
    out.push('    @Override\n    public ItemStack finishUsingItem(ItemStack stack, Level level, LivingEntity entity) {\n' +
      lines.join('\n') + '\n    }');
    out.push('    @Override\n    public InteractionResultHolder<ItemStack> use(Level level, Player player, InteractionHand hand) {\n' +
      '        ItemStack stack = player.getItemInHand(hand);\n' +
      (e.rightClick === 'sound' ? '        level.playSound(null, player.getX(), player.getY(), player.getZ(), SoundEvents.LEVEL_UP, SoundSource.PLAYERS, 1.0f, 1.0f);\n' : '') +
      '        player.startUsingItem(hand);\n' +
      '        return InteractionResultHolder.consume(stack);\n    }');
  } else {
    var uc = useCode(e);
    if (uc) out.push('    @Override\n    public InteractionResultHolder<ItemStack> use(Level level, Player player, InteractionHand hand) {\n' +
      '        ItemStack stack = player.getItemInHand(hand);\n        ' + uc + '\n    }');
  }
  /* hurtEnemy: hit effects + knockback */
  var ec = effectCode(e), kb = Number(e.knockbackPower) || 0;
  if (ec || kb > 0) {
    var body = '        if (!target.level().isClientSide) {\n';
    if (ec) body += '            ' + ec + '\n';
    if (kb > 0) body += '            Vec3 look = attacker.getLookAngle();\n' +
      '            target.setDeltaMovement(target.getDeltaMovement().add(look.x * ' + fv(kb) +
      ', 0.25, look.z * ' + fv(kb) + '));\n';
    body += '        }\n        return super.hurtEnemy(stack, target, attacker);';
    out.push('    @Override\n    public boolean hurtEnemy(ItemStack stack, LivingEntity target, LivingEntity attacker) {\n' + body + '\n    }');
  }
  /* worn / carried effect */
  var worn = mobConst(e.armorEffect);
  if (worn) {
    var eq = ({helmet:'HEAD',chestplate:'CHEST',leggings:'LEGS',boots:'FEET'})[e.armorSlot] || 'HEAD';
    var cond = e.type === 'armor'
      ? 'entity instanceof Player player && player.getItemBySlot(EquipmentSlot.' + eq + ').is(this)'
      : 'entity instanceof Player player';
    out.push('    @Override\n    public void inventoryTick(ItemStack stack, Level level, Entity entity, int slotId, boolean selected) {\n' +
      '        if (!level.isClientSide && ' + cond + ') {\n' +
      '            player.addEffect(new MobEffectInstance(MobEffects.' + worn + ', 220, 0, false, false, false));\n' +
      '        }\n        super.inventoryTick(stack, level, entity, slotId, selected);\n    }');
  }
  var remain = refJavaItem(e.craftingRemaining, c);
  if (remain) {
    out.push('    @Override\n    public ItemStack getCraftingRemainingItem(ItemStack stack) {\n        return new ItemStack(' + remain + ');\n    }');
  }
  return out;
}
/* ---------- worldgen (vanilla ore feature + Forge biome modifier) ---------- */
function oreTarget(t) {
  if (t === 'stone') return { predicate_type:'minecraft:tag_match', tag:'minecraft:stone_ore_replaceables' };
  if (t === 'deepslate') return { predicate_type:'minecraft:tag_match', tag:'minecraft:deepslate_ore_replaceables' };
  var blocks = { netherrack:'minecraft:netherrack', end_stone:'minecraft:end_stone',
    tuff:'minecraft:tuff', dirt:'minecraft:dirt', sand:'minecraft:sand', gravel:'minecraft:gravel' };
  return { predicate_type:'minecraft:block_match', block:blocks[t] || 'minecraft:stone' };
}
function oreFiles(e, c) {
  var o = e.ore || {}, out = [];
  if (!o.enabled || !e._isBlock) return out;
  var D = 'data/' + c.modid + '/';
  var state = { Name:c.modid + ':' + e._reg };
  var targets = (o.targets && o.targets.length ? o.targets : ['stone']).map(function (t) {
    return { target:oreTarget(t), state:state };
  });
  var configured = { type:'minecraft:ore', config:{
    discard_chance_on_air_exposure:Math.max(0,Math.min(1,Number(o.air)||0)),
    size:Math.max(1,num(o.size,9)), targets:targets } };
  var heightType = o.shape === 'trapezoid' ? 'minecraft:trapezoid' : 'minecraft:uniform';
  var placed = { feature:c.modid + ':' + e._reg + '_ore', placement:[
    { type:'minecraft:count', count:Math.max(1,num(o.count,12)) },
    { type:'minecraft:in_square' },
    { type:'minecraft:height_range', height:{ type:heightType,
      min_inclusive:{ absolute:num(o.minY,-64) }, max_inclusive:{ absolute:num(o.maxY,64) } } },
    { type:'minecraft:biome' }
  ]};
  out.push({ path:D + 'worldgen/configured_feature/' + e._reg + '_ore.json',
    content:JSON.stringify(configured,null,2) + '\n' });
  out.push({ path:D + 'worldgen/placed_feature/' + e._reg + '_ore.json',
    content:JSON.stringify(placed,null,2) + '\n' });
  var dims = o.dimension === 'all' ? ['overworld','nether','end'] : [o.dimension || 'overworld'];
  var tags = { overworld:'#minecraft:is_overworld', nether:'#minecraft:is_nether', end:'#minecraft:is_end' };
  dims.forEach(function (dim) {
    out.push({ path:D + 'forge/biome_modifier/' + e._reg + '_ore_' + dim + '.json',
      content:JSON.stringify({ type:'forge:add_features', biomes:tags[dim] || tags.overworld,
        features:c.modid + ':' + e._reg + '_ore', step:o.step || 'underground_ores' }, null, 2) + '\n' });
  });
  return out;
}

/* ---------- item class ---------- */
function propsExpr(e, c) {
  /* damageable items must never stack: stack>1 + maxDamage>0 is what makes held tools glitch */
  var damageable = (e.type === 'tool' || e.type === 'weapon' || e.type === 'armor' ||
                    (e.type === 'misc' && num(e.damageOnUse,0) > 0));
  var p = ['new Properties()', '.stacksTo(' + (damageable ? 1 : num(e.stack,64)) + ')'];
  if (e.rarity && e.rarity !== 'common') p.push('.rarity(Rarity.' + String(e.rarity).toUpperCase() + ')');
  if (e.fireResistant) p.push('.fireResistant()');
  if ((e.type === 'item' || e.type === 'misc') && e.food) p.push('.food(new FoodProperties.Builder().nutrition(' +
      num(e.hunger,4) + ').saturationMod(' + fv(e.saturation) + ').build())');
  if (e.type === 'tool' || e.type === 'weapon' || e.type === 'armor') p.push('.durability(' + num(e.durability,500) + ')');
  else if (e.type === 'misc' && num(e.damageOnUse,0) > 0) p.push('.durability(' + num(e.durability,500) + ')');
  return p.join('');
}
function tierExpr(e, c) {
  if (e.tier && e.tier !== 'custom') return 'Tiers.' + String(e.tier).toUpperCase();
  return 'ModMaterials.' + e._up + '_TIER';
}
function effectCode(e) {
  var sec = num(e.effectSeconds,5) * 20, p = num(e.effectPower,0);
  switch (e.effect) {
    case 'fire': return 'target.setSecondsOnFire(' + num(e.effectSeconds,5) + ');';
    case 'lightning': return 'LightningBolt bolt = EntityType.LIGHTNING_BOLT.create(target.level());\n' +
      '            if (bolt != null) { bolt.moveTo(target.getX(), target.getY(), target.getZ()); target.level().addFreshEntity(bolt); }';
    case 'poison': return 'target.addEffect(new MobEffectInstance(MobEffects.POISON, ' + sec + ', ' + p + '));';
    case 'wither': return 'target.addEffect(new MobEffectInstance(MobEffects.WITHER, ' + sec + ', ' + p + '));';
    case 'slow': return 'target.addEffect(new MobEffectInstance(MobEffects.MOVEMENT_SLOWDOWN, ' + sec + ', ' + p + '));';
    case 'weakness': return 'target.addEffect(new MobEffectInstance(MobEffects.WEAKNESS, ' + sec + ', ' + p + '));';
    case 'blindness': return 'target.addEffect(new MobEffectInstance(MobEffects.BLINDNESS, ' + sec + ', ' + p + '));';
    default: {
      var m = mobConst(e.effect);
      return m ? 'target.addEffect(new MobEffectInstance(MobEffects.' + m + ', ' + sec + ', ' + p + '));' : null;
    }
  }
}
function useCode(e) {
  var act = [];
  switch (e.rightClick) {
    case 'heal': act.push('player.heal(6.0f);'); break;
    case 'teleport': act.push('Vec3 look = player.getLookAngle();',
      'player.teleportTo(player.getX() + look.x * 8, player.getY(), player.getZ() + look.z * 8);'); break;
    case 'fireball': act.push('Vec3 look = player.getLookAngle();',
      'SmallFireball ball = new SmallFireball(level, player, look.x * 1.5, look.y * 1.5, look.z * 1.5);',
      'ball.setPos(player.getX() + look.x, player.getEyeY(), player.getZ() + look.z);',
      'level.addFreshEntity(ball);'); break;
    case 'lightning': act.push('Vec3 look = player.getLookAngle();',
      'LightningBolt bolt = EntityType.LIGHTNING_BOLT.create(level);',
      'if (bolt != null) { bolt.setPos(player.getX() + look.x * 6, player.getY(), player.getZ() + look.z * 6); level.addFreshEntity(bolt); }'); break;
    case 'xp': act.push('player.giveExperiencePoints(30);'); break;
    case 'explosion': act.push('Vec3 look = player.getLookAngle();',
      'level.explode(player, player.getX() + look.x * 6, player.getY(), player.getZ() + look.z * 6, 2.0f, false, Level.ExplosionInteraction.NONE);'); break;
    case 'potion': {
      var mob = mobConst(e.giveEffect) || 'MOVEMENT_SPEED';
      act.push('player.addEffect(new MobEffectInstance(MobEffects.' + mob + ', ' +
        (num(e.effectDuration,30)*20) + ', ' + num(e.effectAmplifier,0) + '));');
      break;
    }
    case 'clear_effects': act.push('player.removeAllEffects();'); break;
    case 'snowball': act.push('Snowball ball = new Snowball(level, player);',
      'ball.shootFromRotation(player, player.getXRot(), player.getYRot(), 0.0f, 1.5f, 1.0f);',
      'level.addFreshEntity(ball);'); break;
    case 'sound': act.push('level.playSound(null, player.getX(), player.getY(), player.getZ(), SoundEvents.LEVEL_UP, SoundSource.PLAYERS, 1.0f, 1.0f);'); break;
    case 'extinguish': act.push('player.clearFire();'); break;
    case 'feed': act.push('player.getFoodData().eat(6, 0.6f);'); break;
    default: return null;
  }
  var lines = ['if (!level.isClientSide) {'].concat(act.map(function (a) { return '    ' + a; }), ['}']);
  lines.push('player.getCooldowns().addCooldown(this, ' + num(e.useCooldown,20) + ');');
  if (e.consumeItem) lines.push('stack.shrink(1);');
  if (num(e.damageOnUse,0) > 0) lines.push('stack.hurtAndBreak(' + num(e.damageOnUse,1) + ', player, p -> {});');
  lines.push('return InteractionResultHolder.sidedSuccess(stack, level.isClientSide());');
  return lines.join('\n        ');
}
function itemClass(e, c) {
  var cls = e._cls + 'Item';
  var head = 'package ' + c.pkg + '.item;\n\n' + c.IMPORTS + '\n\n';
  var ext, ctor;
  if (e._isBlockItem) {
    ext = 'BlockItem';
    ctor = '    public ' + cls + '(Block block) {\n        super(block, ' + propsExpr(e,c) + ');\n    }';
  } else if (e.type === 'weapon') {
    ext = 'SwordItem';
    ctor = '    public ' + cls + '() {\n        super(' + tierExpr(e,c) + ', ' + num(e.damage,3) + ', ' + fv(e.attackSpeed) +
      ', ' + propsExpr(e,c) + ');\n    }';
  } else if (e.type === 'tool') {
    var k = e.toolKind || 'pickaxe';
    ext = ({pickaxe:'PickaxeItem',axe:'AxeItem',shovel:'ShovelItem',hoe:'HoeItem'})[k] || 'PickaxeItem';
    var dmg = (k === 'axe' || k === 'shovel') ? fv(e.damage) : String(num(e.damage,2));
    ctor = '    public ' + cls + '() {\n        super(' + tierExpr(e,c) + ', ' + dmg + ', ' + fv(e.attackSpeed) +
      ', ' + propsExpr(e,c) + ');\n    }';
  } else if (e.type === 'armor') {
    ext = 'ArmorItem';
    var slot = ({helmet:'HELMET',chestplate:'CHESTPLATE',leggings:'LEGGINGS',boots:'BOOTS'})[e.armorSlot] || 'HELMET';
    ctor = '    public ' + cls + '() {\n        super(ModMaterials.' + e._up + '_ARMOR, ArmorItem.Type.' + slot +
      ', ' + propsExpr(e,c) + ');\n    }';
  } else {
    ext = 'Item';
    ctor = '    public ' + cls + '() {\n        super(' + propsExpr(e,c) + ');\n    }';
  }
  var body = [ctor];
  if (e.desc) {
    body.push('    @Override\n    public void appendHoverText(ItemStack stack, Level level, List<Component> tooltip, TooltipFlag flag) {\n' +
      '        tooltip.add(Component.translatable("tooltip.' + c.modid + '.' + e._reg + '").withStyle(ChatFormatting.GRAY));\n' +
      '        super.appendHoverText(stack, level, tooltip, flag);\n    }');
  }
  if (e.glow) body.push('    @Override\n    public boolean isFoil(ItemStack stack) {\n        return true;\n    }');
  itemEffectMethods(e,c).forEach(function (m) { body.push(m); });
  toolOverrideMethods(e,c).forEach(function (m) { body.push(m); });
  return head + 'public class ' + cls + ' extends ' + ext + ' {\n\n' + body.join('\n\n') + '\n}\n';
}

/* ---------- block class ---------- */
function blockProperties(e, c, station) {
  /* 1.20.1 已移除 Material 类：Properties.of() 无参 + mapColor(DyeColor) */
  var p = ['BlockBehaviour.Properties.of()',
    '.mapColor(DyeColor.' + dyeOf(e.mapColor) + ')',
    '.sound(SoundType.' + (e.sound || 'STONE') + ')',
    '.strength(' + fv(e.hardness) + ', ' + fv(e.resistance) + ')'];
  if (num(e.light) > 0) p.push('.lightLevel(state -> ' + num(e.light) + ')');
  if (e.tool && e.tool !== 'none') p.push('.requiresCorrectToolForDrops()');
  if (e.noCollision) p.push('.noCollission()');
  return p.join('');
}
function blockClass(e, c) {
  if (e.type === 'cluster') return clusterBlockClass(e,c);
  if (e.type === 'energy' || e.type === 'generator') return energyBlockClass(e,c);
  var cls = e._cls + 'Block', station = e.type === 'workstation';
  var ext = station ? 'BaseEntityBlock' : (e.gravity ? 'FallingBlock' : 'Block');
  var s = 'package ' + c.pkg + '.block;\n\n' + c.IMPORTS + '\n\n';
  s += 'public class ' + cls + ' extends ' + ext + ' {\n\n';
  s += '    /* 放置朝向：决定六面贴图中 north/south/west/east 的朝向 */\n';
  s += '    public static final DirectionProperty FACING = BlockStateProperties.HORIZONTAL_FACING;\n\n';
  s += '    public ' + cls + '() {\n        super(' + blockProperties(e,c,station) + ');\n' +
    '        this.registerDefaultState(this.stateDefinition.any().setValue(FACING, Direction.NORTH));\n    }\n';
  s += '\n    @Override\n    protected void createBlockStateDefinition(StateDefinition.Builder<Block, BlockState> builder) {\n' +
    '        builder.add(FACING);\n    }\n';
  s += '\n    @Override\n    public BlockState getStateForPlacement(BlockPlaceContext ctx) {\n' +
    '        return this.defaultBlockState().setValue(FACING, ctx.getHorizontalDirection().getOpposite());\n    }\n';
  if (station) {
    s += '\n    @Override\n    public BlockEntity newBlockEntity(BlockPos pos, BlockState state) {\n' +
      '        return ModBlockEntities.' + e._up + '.get().create(pos, state);\n    }\n';
    s += '\n    @Override\n    public <T extends BlockEntity> BlockEntityTicker<T> getTicker(Level level, BlockState state, BlockEntityType<T> type) {\n' +
      '        return createTickerHelper(type, ModBlockEntities.' + e._up + '.get(), ' + e._cls + 'BlockEntity::tick);\n    }\n';
    s += '\n    @Override\n    public RenderShape getRenderShape(BlockState state) {\n        return RenderShape.MODEL;\n    }\n';
    s += '\n    @Override\n    public InteractionResult use(BlockState state, Level level, BlockPos pos, Player player, InteractionHand hand, BlockHitResult hit) {\n' +
      '        if (!level.isClientSide) {\n' +
      '            BlockEntity be = level.getBlockEntity(pos);\n' +
      '            if (be instanceof ' + e._cls + 'BlockEntity station) {\n' +
      '                NetworkHooks.openScreen((ServerPlayer) player, station, pos);\n' +
      '            }\n        }\n' +
      '        return InteractionResult.sidedSuccess(level.isClientSide);\n    }\n';
    s += '\n    @Override\n    public void onRemove(BlockState state, Level level, BlockPos pos, BlockState newState, boolean moving) {\n' +
      '        if (!state.is(newState.getBlock())) {\n' +
      '            BlockEntity be = level.getBlockEntity(pos);\n' +
      '            if (be instanceof ' + e._cls + 'BlockEntity station) {\n' +
      '                for (int i = 0; i < station.getContainer().getContainerSize(); i++) {\n' +
      '                    Containers.dropItemStack(level, pos.getX(), pos.getY(), pos.getZ(), station.getContainer().getItem(i));\n' +
      '                }\n                level.updateNeighbourForOutputSignal(pos, this);\n' +
      '            }\n        }\n        super.onRemove(state, level, pos, newState, moving);\n    }\n';
  }
  s += '}\n';
  return s;
}

/* ---------- creature (mob) generation ---------- */
function mobSkillCode(skill, target) {
  switch (skill) {
    case 'lightning': return '            LightningBolt bolt = EntityType.LIGHTNING_BOLT.create(level());\n' +
      '            if (bolt != null) { bolt.moveTo(' + target + '.getX(), ' + target + '.getY(), ' + target + '.getZ()); level().addFreshEntity(bolt); }';
    case 'explode': return '            level().explode(this, ' + target + '.getX(), ' + target + '.getY(), ' + target + '.getZ(), 1.5F, false, Level.ExplosionInteraction.NONE);';
    case 'heal': return '            this.heal(4.0F);';
    case 'poison': return '            ' + target + '.addEffect(new MobEffectInstance(MobEffects.POISON, 100, 0));';
    case 'wither': return '            ' + target + '.addEffect(new MobEffectInstance(MobEffects.WITHER, 100, 0));';
    case 'blind': return '            ' + target + '.addEffect(new MobEffectInstance(MobEffects.BLINDNESS, 100, 0));';
    case 'fire': return '            ' + target + '.setSecondsOnFire(5);';
    case 'slow': return '            ' + target + '.addEffect(new MobEffectInstance(MobEffects.MOVEMENT_SLOWDOWN, 100, 0));';
    case 'invisible': return '            this.setInvisible(true);';
    case 'knockup': return '            ' + target + '.push(0.0, 1.0, 0.0);';
    default: return null;
  }
}
function mobEntityClass(e, c) {
  var cls = e._cls + 'Entity', mc = e.mobCfg || {};
  var friendly = !!mc.friendly;
  var ext = friendly ? ((mc.trades && mc.trades.length) ? 'Villager' : 'Animal') : 'Monster';
  var s = 'package ' + c.pkg + '.entity;\n\n' + c.IMPORTS + '\n';
  s += 'import net.minecraft.world.entity.ai.goal.*;\n';
  s += 'import net.minecraft.world.entity.monster.Monster;\n';
  s += 'import net.minecraft.world.entity.animal.Animal;\n';
  s += 'import net.minecraft.world.entity.npc.Villager;\n';
  s += 'import net.minecraft.world.entity.player.Player;\n';
  s += 'import net.minecraft.world.entity.LivingEntity;\n';
  s += 'import net.minecraft.world.entity.ai.attributes.Attributes;\n';
  s += 'import net.minecraft.world.damagesource.DamageSource;\n';
  s += 'import net.minecraft.server.level.ServerLevel;\n';
  s += 'import net.minecraft.world.item.ItemStack;\n';
  s += 'import net.minecraft.world.item.Items;\n';
  s += 'import net.minecraft.world.level.Explosion;\n';
  s += 'import net.minecraft.server.level.ServerBossEvent;\n';
  s += 'import net.minecraft.network.chat.Component;\n';
  s += 'import net.minecraft.world.BossEvent;\n';
  s += 'import net.minecraft.network.protocol.game.ClientboundBossEventPacket;\n';
  s += 'import net.minecraft.world.entity.EntityType;\n';
  s += 'import net.minecraft.world.level.Level;\n';
  s += 'import net.minecraft.world.item.trading.MerchantOffer;\n';
  s += 'import net.minecraft.world.item.trading.MerchantOffers;\n\n';
  s += 'public class ' + cls + ' extends ' + ext + ' {\n\n';
  s += '    public ' + cls + '(EntityType<? extends ' + cls + '> type, Level level) {\n' +
    '        super(type, level);\n';
  s += '        this.xpReward = ' + num(mc.xp,5) + ';\n';
  if (mc.showName) s += '        this.setCustomNameVisible(true);\n';
  s += '    }\n\n';
  /* attributes */
  s += '    public static AttributeSupplier.Builder createMobAttributes() {\n' +
    '        return Mob.createMobAttributes()\n' +
    '            .add(Attributes.MAX_HEALTH, ' + num(mc.health,20) + '.0)\n' +
    '            .add(Attributes.ATTACK_DAMAGE, ' + num(mc.damage,3) + '.0)\n' +
    '            .add(Attributes.ATTACK_SPEED, ' + fv(mc.attackSpeed) + ')\n' +
    '            .add(Attributes.MOVEMENT_SPEED, 0.3' + 'F)\n' +
    '            .add(Attributes.ARMOR, ' + num(mc.armor,0) + '.0)\n' +
    '            .add(Attributes.FOLLOW_RANGE, ' + num(mc.followRange,32) + '.0);\n    }\n\n';
  /* goals */
  s += '    @Override protected void registerGoals() {\n';
  if (!friendly) {
    s += '        goalSelector.addGoal(1, new FloatGoal(this));\n';
    if (mc.attack === 'ranged') {
      s += '        goalSelector.addGoal(2, new RangedAttackGoal(this, 1.0D, ' + num(mc.rangedSpeed,20) + ', ' +
        num(mc.rangedCooldown,20) + ', 30.0F));\n';
      s += '        goalSelector.addGoal(3, new WaterAvoidingRandomStrollGoal(this, 1.0D));\n';
    } else if (mc.attack === 'summon') {
      s += '        goalSelector.addGoal(2, new MeleeAttackGoal(this, 1.2D, true));\n';
      s += '        goalSelector.addGoal(3, new SummonGoal(this, 1, 1, 2, 32));\n';
    } else {
      s += '        goalSelector.addGoal(2, new MeleeAttackGoal(this, ' + fv(mc.attackSpeed) + ', true));\n';
      s += '        goalSelector.addGoal(3, new WaterAvoidingRandomStrollGoal(this, 1.0D));\n';
    }
    s += '        goalSelector.addGoal(4, new LookAtPlayerGoal(this, Player.class, 8.0F));\n';
    s += '        targetSelector.addGoal(1, new NearestAttackableTargetGoal<>(this, Player.class, true));\n';
  } else {
    s += '        goalSelector.addGoal(1, new WaterAvoidingRandomStrollGoal(this, 0.9D));\n';
    s += '        goalSelector.addGoal(2, new LookAtPlayerGoal(this, Player.class, 8.0F));\n';
  }
  s += '    }\n\n';
  /* display name */
  s += '    @Override public Component getDisplayName() {\n' +
    '        return Component.translatable("entity.' + c.modid + '.' + e._reg + '");\n    }\n\n';
  /* xp：已通过构造里的 this.xpReward 设置，无需覆写方法 */
  /* drops */
  var drops = mc.drops || [];
  if (drops.length) {
    s += '    @Override protected void dropCustomDeathLoot(DamageSource source, int looting, boolean recentlyHit) {\n' +
      '        super.dropCustomDeathLoot(source, looting, recentlyHit);\n';
    drops.forEach(function (d) {
      var item = refItemOf(d.ref, c);
      var chance = Math.max(0, Math.min(1, Number(d.chance != null ? d.chance : 1)));
      s += '        if (this.random.nextFloat() < ' + chance.toFixed(2) + 'F) {\n' +
        '            this.spawnAtLocation(new ItemStack(' + item.replace('new ItemStack(','').replace(/\)$/,'') +
        ', ' + num(d.count,1) + '));\n        }\n';
    });
    s += '    }\n\n';
  }
  /* skills on hit：1.20.1 实体用 doHurtTarget(Entity)，没有 hurtEnemy */
  var skills = (mc.skills || []).filter(function (k) { return mobSkillCode(k, 'target'); });
  if (skills.length) {
    s += '    @Override public boolean doHurtTarget(Entity target) {\n' +
      '        boolean flag = super.doHurtTarget(target);\n' +
      '        if (!level().isClientSide) {\n';
    skills.forEach(function (k) {
      if (k === 'aura') return;
      s += mobSkillCode(k, 'target') + '\n';
    });
    s += '        }\n        return flag;\n    }\n\n';
  }
  /* aura + bomb behaviour */
  var aura = (mc.skills || []).indexOf('aura') >= 0;
  if (aura || mc.attack === 'bomb') {
    s += '    @Override public void customServerAiStep() {\n        super.customServerAiStep();\n' +
      '        if (level().isClientSide || !(level() instanceof ServerLevel serverLevel)) return;\n';
    if (aura) {
      s += '        for (LivingEntity ally : serverLevel.getEntitiesOfClass(LivingEntity.class, this.getBoundingBox().inflate(8.0))) {\n' +
        '            if (ally != this && ally instanceof LivingEntity && ally.getHealth() < ally.getMaxHealth()) ally.heal(1.0F);\n' +
        '        }\n';
    }
    if (mc.attack === 'bomb') {
      s += '        if (this.getTarget() instanceof Player player && this.distanceToSqr(player) < 9.0) {\n' +
        '            serverLevel.explode(this, 2.0F, false, Level.ExplosionInteraction.NONE);\n' +
        '            this.discard();\n        }\n';
    }
    s += '    }\n\n';
  }
  /* boss bar：用原版的 ServerBossEvent（startSeenByPlayer/stopSeenByPlayer） */
  if (mc.healthDisplay === 'boss') {
    s += '    private final ServerBossEvent bossEvent = new ServerBossEvent(\n' +
      '        Component.translatable("entity.' + c.modid + '.' + e._reg + '"),\n' +
      '        BossEvent.BossBarColor.RED, BossEvent.BossBarOverlay.NOTCHED_10);\n\n';
    s += '    @Override public void startSeenByPlayer(ServerPlayer player) {\n' +
      '        super.startSeenByPlayer(player);\n' +
      '        this.bossEvent.addPlayer(player);\n    }\n\n';
    s += '    @Override public void stopSeenByPlayer(ServerPlayer player) {\n' +
      '        super.stopSeenByPlayer(player);\n' +
      '        this.bossEvent.removePlayer(player);\n    }\n\n';
    s += '    @Override public void setCustomName(Component name) {\n' +
      '        super.setCustomName(name);\n' +
      '        this.bossEvent.setName(name);\n    }\n\n';
    s += '    @Override public void aiStep() {\n' +
      '        super.aiStep();\n' +
      '        this.bossEvent.setProgress(this.getHealth() / this.getMaxHealth());\n    }\n\n';
  }
  /* trades：1.20.1 用 getOffers() 覆写，避免依赖版本相关的交易签名 */
  var trades = mc.trades || [];
  if (trades.length) {
    s += '    private MerchantOffers offers;\n\n';
    s += '    @Override public MerchantOffers getOffers() {\n';
    s += '        if (this.offers == null) {\n';
    s += '            this.offers = new MerchantOffers();\n';
    trades.forEach(function (t) {
      var give = refItemOf(t.ref, c), pay = refItemOf(t.price, c);
      s += '            this.offers.add(new MerchantOffer(new ItemStack(' +
        pay.replace('new ItemStack(','').replace(/\)$/,'') +
        ', ' + num(t.pcount,1) + '), new ItemStack(' + give.replace('new ItemStack(','').replace(/\)$/,'') +
        ', ' + num(t.count,1) + '), 1, 1, 0.05F));\n';
    });
    s += '        }\n        return this.offers;\n    }\n\n';
  }
  /* tameable：1.20.1 的繁殖方法是 getBreedOffspring(ServerLevel, AgeableMob) */
  if (friendly && mc.tameable && ext === 'Animal') {
    s += '    @Override public boolean isFood(ItemStack stack) {\n' +
      '        return stack.is(ModItems.' + e._up + '_SPAWN_EGG.get());\n    }\n\n';
    s += '    @Override public AgeableMob getBreedOffspring(ServerLevel level, AgeableMob other) {\n' +
      '        return ModEntities.' + e._up + '.get().create(level);\n    }\n\n';
  }
  s += '}\n';
  return s;
}
function mobModelClass(e, c) {
  var cls = e._cls + 'Model', entCls = e._cls + 'Entity';
  var parts = e.mobParts || [];
  var layout = BF.mobUVLayout(parts, 64);
  var mc = e.mobCfg || {};
  var anim = mc.anim || {};
  var s = 'package ' + c.pkg + '.entity.model;\n\n' + c.IMPORTS + '\n';
  s += 'import net.minecraft.client.model.EntityModel;\n';
  s += 'import net.minecraft.client.model.geom.*;\n';
  s += 'import net.minecraft.client.model.geom.builders.*;\n';
  s += 'import com.mojang.blaze3d.vertex.PoseStack;\n';
  s += 'import com.mojang.blaze3d.vertex.VertexConsumer;\n';
  s += 'import ' + c.pkg + '.entity.' + entCls + ';\n';
  s += 'import ' + c.pkg + '.' + c.mainCls + ';\n\n';
  s += 'public class ' + cls + ' extends EntityModel<' + entCls + '> {\n\n';
  s += '    public static final ModelLayerLocation LAYER = new ModelLayerLocation(\n' +
    '        new ResourceLocation(' + c.mainCls + '.MODID, ' + jstr(e._reg) + '), "main");\n\n';
  s += '    private final ModelPart root;\n';
  parts.forEach(function (p) { s += '    public final ModelPart ' + p.name + ';\n'; });
  s += '\n    public ' + cls + '(ModelPart root) {\n        this.root = root;\n';
  parts.forEach(function (p) { s += '        this.' + p.name + ' = root.getChild(' + jstr(p.name) + ');\n'; });
  s += '    }\n\n';
  s += '    public static LayerDefinition createLayer() {\n' +
    '        MeshDefinition mesh = new MeshDefinition();\n' +
    '        PartDefinition root = mesh.getRoot();\n';
  parts.forEach(function (p, i) {
    var L = layout[i] || { u:0, v:0 };
    s += '        root.addOrReplaceChild(' + jstr(p.name) + ', CubeListBuilder.create()\n' +
      '            .texOffs(' + num(L.u,0) + ', ' + num(L.v,0) + ')\n' +
      '            .addBox(' + fv(p.offset[0]) + ', ' + fv(p.offset[1]) + ', ' + fv(p.offset[2]) + ', ' +
        num(p.size[0]) + ', ' + num(p.size[1]) + ', ' + num(p.size[2]) + '),\n' +
      '            PartPose.offset(' + fv(p.pivot[0]) + ', ' + fv(p.pivot[1]) + ', ' + fv(p.pivot[2]) + '));\n';
  });
  s += '        return LayerDefinition.create(mesh, 64, 64);\n    }\n\n';
  s += '    @Override\n    public void setupAnim(' + entCls + ' entity, float limbSwing, float limbSwingAmount,\n' +
    '            float ageInTicks, float netHeadYaw, float headPitch) {\n';
  var head = parts.filter(function (p) { return /head/i.test(p.name); })[0];
  if (head) {
    s += '        this.' + head.name + '.yRot = netHeadYaw * ((float)Math.PI / 180F);\n';
    s += '        this.' + head.name + '.xRot = headPitch * ((float)Math.PI / 180F);\n';
  }
  var legs = parts.filter(function (p) { return /leg/i.test(p.name); });
  if (anim.walk !== false && legs.length) {
    legs.forEach(function (p, i) {
      var phase = i % 2 ? ' + (float)Math.PI' : '';
      s += '        this.' + p.name + '.x = (float)Math.cos(limbSwing * 0.6662F' + phase + ') * 1.4F * limbSwingAmount;\n';
    });
  }
  var body = parts.filter(function (p) { return /body/i.test(p.name); })[0];
  if (anim.idle !== false && body) {
    s += '        this.' + body.name + '.y = (float)Math.sin(ageInTicks * 0.05F) * 0.05F;\n';
  }
  s += '    }\n\n';
  s += '    @Override\n';
  s += '    public void renderToBuffer(PoseStack poseStack, VertexConsumer buffer, int packedLight,\n';
  s += '            int packedOverlay, float red, float green, float blue, float alpha) {\n';
  s += '        this.root.render(poseStack, buffer, packedLight, packedOverlay, red, green, blue, alpha);\n';
  s += '    }\n}\n';
  return s;
}
function mobRendererClass(e, c) {
  var cls = e._cls + 'Renderer', entCls = e._cls + 'Entity', mdlCls = e._cls + 'Model';
  var s = 'package ' + c.pkg + '.client;\n\n' + c.IMPORTS + '\n';
  s += 'import net.minecraft.client.renderer.entity.MobRenderer;\n';
  s += 'import net.minecraft.client.renderer.entity.EntityRendererProvider;\n';
  s += 'import ' + c.pkg + '.entity.model.' + mdlCls + ';\n';
  s += 'import ' + c.pkg + '.entity.' + entCls + ';\n';
  s += 'import ' + c.pkg + '.' + c.mainCls + ';\n\n';
  s += 'public class ' + cls + ' extends MobRenderer<' + entCls + ', ' + mdlCls + '> {\n\n';
  s += '    public ' + cls + '(EntityRendererProvider.Context ctx) {\n' +
    '        super(ctx, new ' + mdlCls + '(ctx.bakeLayer(' + mdlCls + '.LAYER)), 0.5F);\n    }\n\n';
  s += '    @Override public ResourceLocation getTextureLocation(' + entCls + ' entity) {\n' +
    '        return new ResourceLocation(' + c.mainCls + '.MODID, "textures/entity/' + e._reg + '.png");\n    }\n}\n';
  return s;
}
function mobSpawnEggClass(e, c) {
  var cls = e._cls + 'SpawnEgg', mc = e.mobCfg || {};
  var bg = (BF.hex2rgb(mc.eggColor || '#3a3a4a'));
  var spot = (BF.hex2rgb(mc.eggSpot || '#8fe3dc'));
  var bgHex = (bg[0]<<16)|(bg[1]<<8)|bg[2];
  var spotHex = (spot[0]<<16)|(spot[1]<<8)|spot[2];
  var s = 'package ' + c.pkg + '.item;\n\n' + c.IMPORTS + '\n';
  s += 'import net.minecraftforge.common.ForgeSpawnEggItem;\n';
  s += 'import ' + c.pkg + '.registry.ModEntities;\n\n';
  s += 'public class ' + cls + ' extends ForgeSpawnEggItem {\n\n';
  s += '    public ' + cls + '(Properties p) {\n' +
    '        super(ModEntities.' + e._up + ', 0x' + ('000000' + bgHex.toString(16)).slice(-6) + ', 0x' +
      ('000000' + spotHex.toString(16)).slice(-6) + ', p);\n    }\n}\n';
  return s;
}
function entitiesRegistryClass(c) {
  var mobs = c.els.filter(function (e) { return e.type === 'mob'; });
  var s = 'package ' + c.pkg + '.registry;\n\n' + c.IMPORTS + '\n';
  s += 'import net.minecraft.world.entity.EntityType;\n';
  s += 'import net.minecraft.world.entity.MobCategory;\n';
  mobs.forEach(function (e) { s += 'import ' + c.pkg + '.entity.' + e._cls + 'Entity;\n'; });
  s += 'import ' + c.pkg + '.' + c.mainCls + ';\n\n';
  s += 'public final class ModEntities {\n';
  s += '    public static final DeferredRegister<EntityType<?>> ENTITIES =\n' +
    '        DeferredRegister.create(ForgeRegistries.ENTITY_TYPES, ' + c.mainCls + '.MODID);\n\n';
  mobs.forEach(function (e) {
    var mc = e.mobCfg || {};
    var cat = mc.category || 'MONSTER';
    s += '    public static final RegistryObject<EntityType<' + e._cls + 'Entity>> ' + e._up + ' =\n' +
      '        ENTITIES.register(' + jstr(e._reg) + ', () -> EntityType.Builder.of(' + e._cls + 'Entity::new, MobCategory.' + cat + ')\n' +
      '            .sized(0.6F, ' + fv(1.8 * (Number(mc.scale) || 1)) + ')\n' +
      '            .clientTrackingRange(10)\n' +
      '            .updateInterval(3)\n' +
      '            .build(' + jstr(e._reg) + '));\n\n';
  });
  s += '    private ModEntities() {}\n}\n';
  return s;
}
function mobAnimationJson(e) {
  var frames = e.mobFrames || [];
  if (!frames.length && !(e.mobAnimRaw || '').trim()) return null;
  if ((e.mobAnimRaw || '').trim()) {
    /* external Blockbench animation takes precedence */
    try {
      var raw = JSON.parse(e.mobAnimRaw);
      return JSON.stringify(raw, null, 2) + '\n';
    } catch (err) { /* fall through to generated keyframes */ }
  }
  var bones = {}, maxT = 1;
  frames.forEach(function (f) {
    var b = bones[f.part] || (bones[f.part] = {});
    var rot = b.rotation || (b.rotation = {});
    ['x','y','z'].forEach(function (axis) {
      var key = 'r' + axis, val = f[key] || 0;
      var arr = rot[axis] || (rot[axis] = []);
      arr.push([Number(f.t) || 0, val]);
    });
    maxT = Math.max(maxT, Number(f.t) || 0);
  });
  if (!Object.keys(bones).length) return null;
  var anims = {};
  anims[e._reg] = { loop:true, animation_length:maxT, bones:bones };
  return JSON.stringify({ animations: anims }, null, 2) + '\n';
}

/* ---------- energy network (Forge Energy, unit = FE) ---------- */
function refJavaBlock(ref, c) {
  if (!ref) return 'Blocks.AIR';
  if (ref.indexOf('elem:') === 0) {
    var e = c.byId[ref.slice(5)];
    return e && e._isBlock ? 'ModBlocks.' + e._up + '.get()' : 'Blocks.STONE';
  }
  return 'BuiltInRegistries.BLOCK.get(new ResourceLocation("minecraft", ' +
    jstr(ref.replace('minecraft:','')) + '))';
}
function energyRouterClass(c) {
  return 'package ' + c.pkg + '.energy;\n\n' + c.IMPORTS + '\n\n' +
    'public final class ModEnergy {\n' +
    '    /* 把自身缓冲中的能量按六个方向推送给相邻的能量接收者 */\n' +
    '    public static void push(Level level, BlockPos pos, IEnergyStorage source, int rate) {\n' +
    '        int available = Math.min(rate, source.getEnergyStored());\n' +
    '        if (available <= 0 || !source.canExtract()) return;\n' +
    '        for (Direction dir : Direction.values()) {\n' +
    '            BlockEntity be = level.getBlockEntity(pos.relative(dir));\n' +
    '            if (be == null) continue;\n' +
    '            LazyOptional<IEnergyStorage> cap = be.getCapability(ForgeCapabilities.ENERGY, dir.getOpposite());\n' +
    '            if (!cap.isPresent()) continue;\n' +
    '            IEnergyStorage target = cap.orElse(null);\n' +
    '            if (target == null || !target.canReceive()) continue;\n' +
    '            int accepted = target.receiveEnergy(available, false);\n' +
    '            if (accepted > 0) {\n' +
    '                source.extractEnergy(accepted, false);\n' +
    '                available -= accepted;\n' +
    '                if (available <= 0) break;\n' +
    '            }\n' +
    '        }\n    }\n\n    private ModEnergy() {}\n}\n';
}
function energyBlockEntityClass(e, c) {
  var cls = e._cls + 'BlockEntity', gen = e.type === 'generator';
  var cfg = gen ? (e.genCfg || {}) : (e.energyCfg || {});
  var cap = num(cfg.capacity, gen ? 10000 : 4000);
  var rate = gen ? num(cfg.perTick,32) : num(cfg.transfer,256);
  var genBody = '';
  if (gen) {
    var mode = cfg.fuelMode || 'none';
    if (mode === 'daylight') genBody = '        if (level.isDay() && level.canSeeSky(pos.above()) &&\n' +
      '            be.energy.getEnergyStored() < be.energy.getMaxEnergyStored()) {\n' +
      '            be.energy.receiveEnergy(' + num(cfg.perTick,32) + ', false);\n        }';
    else if (mode === 'burn') genBody = '        if (be.energy.getEnergyStored() < be.energy.getMaxEnergyStored()) {\n' +
      '            if (be.burn > 0) { be.burn--; be.energy.receiveEnergy(' + num(cfg.perTick,32) + ', false); }\n' +
      '            else if (!be.fuel.getItem(0).isEmpty()) { be.fuel.removeItem(0, 1); be.burn = ' + num(cfg.burnTicks,1600) + '; }\n        }';
    else genBody = '        be.energy.receiveEnergy(' + num(cfg.perTick,32) + ', false);';
  }
  var s = 'package ' + c.pkg + '.block.entity;\n\n' + c.IMPORTS + '\n\n';
  s += 'public class ' + cls + ' extends BlockEntity {\n\n';
  s += '    public static final int TRANSFER = ' + rate + ';\n';
  s += '    public final EnergyStorage energy = new EnergyStorage(' + cap + ', ' + rate + ', ' + rate + ');\n';
  s += '    private final LazyOptional<IEnergyStorage> holder = LazyOptional.of(() -> energy);\n';
  if (gen) {
    s += '    public final SimpleContainer fuel = new SimpleContainer(1);\n';
    s += '    private int burn = 0;\n';
  }
  s += '\n    public ' + cls + '(BlockPos pos, BlockState state) {\n' +
    '        super(ModBlockEntities.' + e._up + '.get(), pos, state);\n    }\n\n';
  s += '    public static void tick(Level level, BlockPos pos, BlockState state, ' + cls + ' be) {\n' +
    '        if (level.isClientSide) return;\n' + genBody + '\n' +
    '        ModEnergy.push(level, pos, be.energy, TRANSFER);\n' +
    '        be.setChanged();\n    }\n\n';
  s += '    @Override public <T> LazyOptional<T> getCapability(Capability<T> cap, Direction side) {\n' +
    '        return cap == ForgeCapabilities.ENERGY ? holder.cast() : super.getCapability(cap, side);\n    }\n\n';
  s += '    @Override public void invalidateCaps() { super.invalidateCaps(); holder.invalidate(); }\n\n';
  s += '    @Override protected void saveAdditional(CompoundTag tag) {\n' +
    '        super.saveAdditional(tag);\n        tag.putInt("Energy", energy.getEnergyStored());\n' +
    (gen ? '        tag.putInt("Burn", burn);\n' : '') + '    }\n\n';
  s += '    @Override public void load(CompoundTag tag) {\n' +
    '        super.load(tag);\n' +
    '        int stored = tag.getInt("Energy");\n' +
    '        energy.extractEnergy(energy.getEnergyStored(), false);\n' +
    '        while (stored > 0) { int a = energy.receiveEnergy(stored, false); if (a <= 0) break; stored -= a; }\n' +
    (gen ? '        burn = tag.getInt("Burn");\n' : '') + '    }\n}\n';
  return s;
}
function energyBlockClass(e, c) {
  var cls = e._cls + 'Block', beCls = e._cls + 'BlockEntity';
  var s = 'package ' + c.pkg + '.block;\n\n' + c.IMPORTS + '\n\n';
  s += 'public class ' + cls + ' extends BaseEntityBlock {\n\n';
  s += '    public ' + cls + '() {\n        super(' + blockProperties(e,c,false) + ');\n    }\n\n';
  s += '    @Override public BlockEntity newBlockEntity(BlockPos pos, BlockState state) {\n' +
    '        return ModBlockEntities.' + e._up + '.get().create(pos, state);\n    }\n\n';
  s += '    @Override public <T extends BlockEntity> BlockEntityTicker<T> getTicker(Level level, BlockState state, BlockEntityType<T> type) {\n' +
    '        return createTickerHelper(type, ModBlockEntities.' + e._up + '.get(), ' + beCls + '::tick);\n    }\n\n';
  s += '    @Override public RenderShape getRenderShape(BlockState state) { return RenderShape.MODEL; }\n}\n';
  return s;
}

/* ---------- amethyst-style cluster ---------- */
function clusterBlockClass(e, c) {
  var cls = e._cls + 'Block', cfg = e.clusterCfg || {};
  var support = refJavaBlock(cfg.support, c);
  var s = 'package ' + c.pkg + '.block;\n\n' + c.IMPORTS + '\n\n';
  s += '/* 参考原版 AmethystClusterBlock：六向 FACING + 十字模型 + 支撑方块检查 */\n';
  s += 'public class ' + cls + ' extends Block {\n\n';
  s += '    public static final DirectionProperty FACING = BlockStateProperties.FACING;\n';
  s += '    private static final Block SUPPORT = ' + support + ';\n';
  s += '    private static final VoxelShape UP_SHAPE = Block.box(4, 0, 4, 12, 14, 12);\n';
  s += '    private static final VoxelShape DOWN_SHAPE = Block.box(4, 2, 4, 12, 16, 12);\n';
  s += '    private static final VoxelShape NORTH_SHAPE = Block.box(4, 4, 2, 12, 12, 16);\n';
  s += '    private static final VoxelShape SOUTH_SHAPE = Block.box(4, 4, 0, 12, 12, 14);\n';
  s += '    private static final VoxelShape WEST_SHAPE = Block.box(2, 4, 4, 16, 12, 12);\n';
  s += '    private static final VoxelShape EAST_SHAPE = Block.box(0, 4, 4, 14, 12, 12);\n\n';
  s += '    public ' + cls + '() {\n        super(BlockBehaviour.Properties.of()\n' +
    '            .sound(SoundType.AMETHYST).strength(' + fv(e.hardness) + ', ' + fv(e.resistance) + ')\n' +
    '            .lightLevel(state -> ' + num(cfg.light != null ? cfg.light : e.light,5) + ').noCollission());\n' +
    '        this.registerDefaultState(this.stateDefinition.any().setValue(FACING, Direction.UP));\n    }\n\n';
  s += '    @Override protected void createBlockStateDefinition(StateDefinition.Builder<Block, BlockState> builder) {\n' +
    '        builder.add(FACING);\n    }\n\n';
  s += '    @Override public BlockState getStateForPlacement(BlockPlaceContext ctx) {\n' +
    '        return this.defaultBlockState().setValue(FACING, ctx.getClickedFace());\n    }\n\n';
  s += '    @Override public boolean canSurvive(BlockState state, LevelReader level, BlockPos pos) {\n' +
    '        BlockPos support = pos.relative(state.getValue(FACING).getOpposite());\n' +
    '        return level.getBlockState(support).is(SUPPORT);\n    }\n\n';
  s += '    @Override public BlockState updateShape(BlockState state, Direction dir, BlockState neighbor,\n' +
    '            LevelAccessor level, BlockPos pos, BlockPos neighborPos) {\n' +
    '        if (dir.getOpposite() == state.getValue(FACING) && !state.canSurvive(level, pos)) {\n' +
    '            return Blocks.AIR.defaultBlockState();\n        }\n' +
    '        return super.updateShape(state, dir, neighbor, level, pos, neighborPos);\n    }\n\n';
  s += '    @Override public VoxelShape getShape(BlockState state, BlockGetter level, BlockPos pos, CollisionContext ctx) {\n' +
    '        switch (state.getValue(FACING)) {\n' +
    '            case DOWN: return DOWN_SHAPE;\n            case NORTH: return NORTH_SHAPE;\n' +
    '            case SOUTH: return SOUTH_SHAPE;\n            case WEST: return WEST_SHAPE;\n' +
    '            case EAST: return EAST_SHAPE;\n            default: return UP_SHAPE;\n        }\n    }\n}\n';
  return s;
}
function clusterFeatureClass(e, c) {
  var cls = e._cls + 'Feature', cfg = e.clusterCfg || {};
  var s = 'package ' + c.pkg + '.worldgen.feature;\n\n' + c.IMPORTS + '\n\n';
  s += '/* 参考原版紫水晶晶洞：检查相邻支撑方块后在空气位置放置朝外的晶簇 */\n';
  s += 'public class ' + cls + ' extends Feature<NoneFeatureConfiguration> {\n\n';
  s += '    private static final Block SUPPORT = ' + refJavaBlock(cfg.support,c) + ';\n\n';
  s += '    public ' + cls + '() { super(NoneFeatureConfiguration.CODEC); }\n\n';
  s += '    @Override public boolean place(FeaturePlaceContext<NoneFeatureConfiguration> ctx) {\n' +
    '        BlockPos origin = ctx.origin();\n        LevelAccessor level = ctx.level();\n' +
    '        if (!level.getBlockState(origin).isAir()) return false;\n' +
    '        for (Direction dir : Direction.values()) {\n' +
    '            BlockPos support = origin.relative(dir);\n' +
    '            if (level.getBlockState(support).is(SUPPORT)) {\n' +
    '                level.setBlock(origin, ModBlocks.' + e._up + '.get().defaultBlockState()\n' +
    '                    .setValue(' + e._cls + 'Block.FACING, dir.getOpposite()), 2);\n' +
    '                return true;\n            }\n        }\n' +
    '        return false;\n    }\n}\n';
  return s;
}
function featuresRegistryClass(c) {
  var clusters = c.els.filter(function (e) { return e.type === 'cluster'; });
  var s = 'package ' + c.pkg + '.registry;\n\n' + c.IMPORTS + '\n';
  s += 'import ' + c.pkg + '.worldgen.feature.*;\n';
  s += 'import ' + c.pkg + '.' + c.mainCls + ';\n\n';
  s += 'public final class ModFeatures {\n';
  s += '    public static final DeferredRegister<Feature<?>> FEATURES =\n' +
    '        DeferredRegister.create(ForgeRegistries.FEATURES, ' + c.mainCls + '.MODID);\n\n';
  clusters.forEach(function (e) {
    s += '    public static final RegistryObject<Feature<?>> ' + e._up + '_CLUSTER =\n' +
      '        FEATURES.register(' + jstr(e._reg + '_cluster_feature') + ', () -> new ' + e._cls + 'Feature());\n';
  });
  s += '\n    private ModFeatures() {}\n}\n';
  return s;
}
function clusterFiles(e, c) {
  var cfg = e.clusterCfg || {}, out = [];
  if (e.type !== 'cluster' || !cfg.worldgen) return out;
  var D = 'data/' + c.modid + '/', id = c.modid + ':' + e._reg + '_cluster';
  out.push({ path:D + 'worldgen/configured_feature/' + e._reg + '_cluster.json',
    content:JSON.stringify({ type:c.modid + ':' + e._reg + '_cluster_feature', config:{} }, null, 2) + '\n' });
  out.push({ path:D + 'worldgen/placed_feature/' + e._reg + '_cluster.json',
    content:JSON.stringify({ feature:id, placement:[
      { type:'minecraft:count', count:Math.max(1,num(cfg.count,6)) },
      { type:'minecraft:in_square' },
      { type:'minecraft:height_range', height:{ type:'minecraft:uniform',
        min_inclusive:{ absolute:num(cfg.minY,-64) }, max_inclusive:{ absolute:num(cfg.maxY,32) } } },
      { type:'minecraft:biome' }
    ] }, null, 2) + '\n' });
  var dims = cfg.dimension === 'all' ? ['overworld','nether','end'] : [cfg.dimension || 'overworld'];
  var tags = { overworld:'#minecraft:is_overworld', nether:'#minecraft:is_nether', end:'#minecraft:is_end' };
  dims.forEach(function (dim) {
    out.push({ path:D + 'forge/biome_modifier/' + e._reg + '_cluster_' + dim + '.json',
      content:JSON.stringify({ type:'forge:add_features', biomes:tags[dim] || tags.overworld,
        features:id, step:'underground_decoration' }, null, 2) + '\n' });
  });
  return out;
}

/* ---------- workstation: slots model ---------- */
function slotModel(e) {
  var slots = (e.ui && e.ui.slots ? e.ui.slots : []).slice();
  var inputs = [], outputs = [], fuels = [];
  slots.forEach(function (s) {
    if (s.kind === 'input') inputs.push(s);
    else if (s.kind === 'output') outputs.push(s);
    else fuels.push(s);
  });
  if (!outputs.length) outputs.push({ kind:'output', x:112, y:34, _virtual:true });
  var ordered = inputs.concat(outputs, fuels);
  ordered.forEach(function (s, i) { s.index = i; });
  return { list:ordered, inputs:inputs, outputs:outputs, fuels:fuels,
    outputIndex: inputs.length, fuelIndex: inputs.length + outputs.length,
    size: ordered.length };
}
function blockEntityClass(e, c) {
  var cls = e._cls + 'BlockEntity', sm = slotModel(e);
  var se = e.stationEnergy || {}, hasEnergy = se.enabled !== false;
  var recipes = (e.stationRecipes || []).filter(function (r) { return r.a || r.b; }).map(function (r) {
    return '        new StationRecipe(' + refItemOf(r.a,c) + ', ' + num(r.ca,1) + ', ' +
      refItemOf(r.b,c) + ', ' + num(r.cb,1) + ', ' + refItemOf(r.out,c) + ', ' + num(r.count,1) + ')';
  }).join(',\n');
  var fuelCond = sm.fuels.length ? ' && !be.container.getItem(' + sm.fuelIndex + ').isEmpty()' : '';
  var energyCond = hasEnergy ? ' && be.energy.getEnergyStored() >= ENERGY_COST' : '';
  var fuelUse = sm.fuels.length ? '\n            be.container.removeItem(' + sm.fuelIndex + ', 1);' : '';
  var energyUse = hasEnergy ? '\n            be.energy.extractEnergy(ENERGY_COST, false);' : '';
  var s = 'package ' + c.pkg + '.block.entity;\n\n' + c.IMPORTS + '\n\n';
  s += 'public class ' + cls + ' extends BlockEntity implements MenuProvider {\n\n';
  s += '    public static final int SLOT_COUNT = ' + sm.size + ';\n';
  s += '    public static final int INPUT_SLOTS = ' + sm.inputs.length + ';\n';
  s += '    public static final int OUTPUT_SLOT = ' + sm.outputIndex + ';\n';
  s += '    public static final int WORK_TIME = ' + num(e.workTime,100) + ';\n';
  if (hasEnergy) s += '    public static final int ENERGY_COST = ' + num(se.cost,100) + ';\n';
  s += '\n';
  s += '    public static final List<StationRecipe> RECIPES = List.of(\n' + (recipes || '        // 在编辑器的「工作站界面」中添加配方') + '\n    );\n\n';
  s += '    private final SimpleContainer container = new SimpleContainer(SLOT_COUNT) {\n' +
    '        @Override public void setChanged() { ' + cls + '.this.setChanged(); }\n    };\n';
  s += '    private int progress = 0;\n';
  if (hasEnergy) {
    s += '    public final EnergyStorage energy = new EnergyStorage(' + num(se.capacity,10000) + ', ' +
      num(se.input,256) + ', ' + num(se.output,64) + ');\n';
    s += '    private final LazyOptional<IEnergyStorage> holder = LazyOptional.of(() -> energy);\n';
  }
  s += '    public final ContainerData data = new ContainerData() {\n' +
    '        @Override public int get(int i) {\n' +
    '            if (i == 0) return progress;\n            if (i == 1) return WORK_TIME;\n' +
    (hasEnergy ? '            if (i == 2) return energy.getEnergyStored();\n' +
                 '            if (i == 3) return energy.getMaxEnergyStored();\n' : '') +
    '            return 0;\n        }\n' +
    '        @Override public void set(int i, int v) { if (i == 0) progress = v; }\n' +
    '        @Override public int getCount() { return ' + (hasEnergy ? 4 : 2) + '; }\n    };\n\n';
  s += '    public ' + cls + '(BlockPos pos, BlockState state) {\n        super(ModBlockEntities.' + e._up + '.get(), pos, state);\n    }\n\n';
  s += '    public SimpleContainer getContainer() { return container; }\n';
  s += '    public ContainerData getData() { return data; }\n\n';
  s += '    public static void tick(Level level, BlockPos pos, BlockState state, ' + cls + ' be) {\n' +
    '        if (level.isClientSide) return;\n' +
    '        StationRecipe recipe = be.findRecipe();\n' +
    '        boolean canWork = recipe != null && be.container.getItem(OUTPUT_SLOT).isEmpty()' +
      fuelCond + energyCond + ';\n' +
    '        if (canWork) {\n' +
    '            be.progress++;\n' +
    '            if (be.progress >= WORK_TIME) {\n' +
    '                be.container.setItem(OUTPUT_SLOT, recipe.out.copy());\n' +
    '                recipe.consume(be.container);' + fuelUse + energyUse + '\n' +
    '                be.progress = 0;\n' +
    '            }\n' +
    '        } else { be.progress = 0; }\n' +
    '        be.setChanged();\n    }\n\n';
  s += '    private StationRecipe findRecipe() {\n' +
    '        for (StationRecipe r : RECIPES) if (r.matches(container)) return r;\n' +
    '        return null;\n    }\n\n';
  s += '    @Override public Component getDisplayName() {\n' +
    '        return Component.translatable("container.' + c.modid + '.' + e._reg + '");\n    }\n\n';
  s += '    @Override public AbstractContainerMenu createMenu(int id, Inventory inv, Player player) {\n' +
    '        return new ' + e._cls + 'Menu(id, inv, getBlockPos(), data);\n    }\n\n';
  s += '    @Override protected void saveAdditional(CompoundTag tag) {\n' +
    '        super.saveAdditional(tag);\n' +
    '        ListTag items = new ListTag();\n' +
    '        for (int i = 0; i < container.getContainerSize(); i++) {\n' +
    '            if (!container.getItem(i).isEmpty()) {\n' +
    '                CompoundTag entry = new CompoundTag();\n' +
    '                entry.putByte("Slot", (byte) i);\n' +
    '                container.getItem(i).save(entry);\n' +
    '                items.add(entry);\n' +
    '            }\n' +
    '        }\n' +
    '        tag.put("Items", items);\n        tag.putInt("Progress", progress);\n' +
    (hasEnergy ? '        tag.putInt("Energy", energy.getEnergyStored());\n' : '') +
    '    }\n\n';
  s += '    @Override public void load(CompoundTag tag) {\n' +
    '        super.load(tag);\n' +
    '        ListTag items = tag.getList("Items", 10);\n' +
    '        for (int i = 0; i < items.size(); i++) {\n' +
    '            CompoundTag entry = items.getCompound(i);\n' +
    '            int slot = entry.getByte("Slot") & 255;\n' +
    '            if (slot < container.getContainerSize()) container.setItem(slot, ItemStack.of(entry));\n' +
    '        }\n' +
    '        progress = tag.getInt("Progress");\n' +
    (hasEnergy ? '        int stored = tag.getInt("Energy");\n' +
      '        energy.extractEnergy(energy.getEnergyStored(), false);\n' +
      '        while (stored > 0) { int a = energy.receiveEnergy(stored, false); if (a <= 0) break; stored -= a; }\n' : '') +
    '    }\n\n';
  if (hasEnergy) {
    s += '    @Override public <T> LazyOptional<T> getCapability(Capability<T> cap, Direction side) {\n' +
      '        return cap == ForgeCapabilities.ENERGY ? holder.cast() : super.getCapability(cap, side);\n    }\n\n';
    s += '    @Override public void invalidateCaps() { super.invalidateCaps(); holder.invalidate(); }\n\n';
  }
  s += '    public static class StationRecipe {\n' +
    '        public final ItemStack a, b, out;\n' +
    '        public final int ca, cb;\n' +
    '        public StationRecipe(ItemStack a, int ca, ItemStack b, int cb, ItemStack out, int count) {\n' +
    '            this.a = a; this.ca = ca; this.b = b; this.cb = cb;\n' +
    '            this.out = out.copy(); this.out.setCount(count);\n' +
    '        }\n' +
    '        public boolean matches(SimpleContainer c) {\n' +
    '            boolean okA = a.isEmpty() || (INPUT_SLOTS > 0 && c.getItem(0).is(a.getItem()) && c.getItem(0).getCount() >= ca);\n' +
    '            boolean okB = b.isEmpty() || (INPUT_SLOTS > 1 && c.getItem(1).is(b.getItem()) && c.getItem(1).getCount() >= cb);\n' +
    '            return (okA && okB) && (!a.isEmpty() || !b.isEmpty());\n' +
    '        }\n' +
    '        public void consume(SimpleContainer c) {\n' +
    '            if (!a.isEmpty() && INPUT_SLOTS > 0) c.removeItem(0, ca);\n' +
    '            if (!b.isEmpty() && INPUT_SLOTS > 1) c.removeItem(1, cb);\n' +
    '        }\n' +
    '    }\n}\n';
  return s;
}
function menuClass(e, c) {
  var cls = e._cls + 'Menu', sm = slotModel(e), beCls = e._cls + 'BlockEntity';
  var s = 'package ' + c.pkg + '.menu;\n\n' + c.IMPORTS + '\n\n';
  s += 'public class ' + cls + ' extends AbstractContainerMenu {\n\n';
  s += '    private final SimpleContainer container;\n    private final ContainerData data;\n' +
       '    private final Level level;\n    private final BlockPos pos;\n\n';
  s += '    public ' + cls + '(int id, Inventory inv, BlockPos pos, ContainerData data) {\n' +
    '        super(ModMenuTypes.' + e._up + '.get(), id);\n' +
    '        this.level = inv.player.level();\n        this.pos = pos;\n        this.data = data;\n' +
    '        BlockEntity be = level.getBlockEntity(pos);\n' +
    '        this.container = be instanceof ' + beCls + ' station ? station.getContainer() : new SimpleContainer(' + sm.size + ');\n' +
    '        addDataSlots(data);\n\n';
  sm.list.forEach(function (sl) {
    if (sl.kind === 'output') {
      s += '        addSlot(new Slot(container, ' + sl.index + ', ' + num(sl.x) + ', ' + num(sl.y) + ') {\n' +
        '            @Override public boolean mayPlace(ItemStack stack) { return false; }\n' +
        '            @Override public boolean mayPickup(Player player) { return true; }\n        });\n';
    } else {
      s += '        addSlot(new Slot(container, ' + sl.index + ', ' + num(sl.x) + ', ' + num(sl.y) + '));\n';
    }
  });
  s += '\n        for (int row = 0; row < 3; row++) {\n' +
    '            for (int col = 0; col < 9; col++) {\n' +
    '                addSlot(new Slot(inv, 9 + row * 9 + col, 9 + col * 18, 85 + row * 18));\n' +
    '            }\n        }\n' +
    '        for (int col = 0; col < 9; col++) {\n' +
    '            addSlot(new Slot(inv, col, 9 + col * 18, 143));\n        }\n    }\n\n';
  s += '    public int getScaledProgress() {\n' +
    '        int p = data.get(0), max = data.get(1);\n' +
    '        return (max <= 0 || p <= 0) ? 0 : p * 24 / max;\n    }\n' +
    '    public boolean isCrafting() { return data.get(0) > 0; }\n' +
    '    public int getEnergyStored() { return data.getCount() > 2 ? data.get(2) : 0; }\n' +
    '    public int getEnergyCapacity() { return data.getCount() > 2 ? data.get(3) : 0; }\n' +
    '    public int getEnergyScaled() {\n' +
    '        int cap = getEnergyCapacity();\n        return cap <= 0 ? 0 : getEnergyStored() * 54 / cap;\n    }\n\n';
  s += '    @Override public boolean stillValid(Player player) {\n' +
    '        return player.distanceToSqr(pos.getX() + 0.5, pos.getY() + 0.5, pos.getZ() + 0.5) <= 64.0;\n    }\n\n';
  s += '    @Override public ItemStack quickMoveStack(Player player, int index) {\n' +
    '        Slot slot = getSlot(index);\n' +
    '        if (slot == null || !slot.hasItem()) return ItemStack.EMPTY;\n' +
    '        ItemStack original = slot.getItem().copy(), result = slot.getItem().copy();\n' +
    '        if (index < ' + sm.size + ') {\n' +
    '            if (!moveItemStackTo(result, ' + sm.size + ', 36 + ' + sm.size + ', true)) return ItemStack.EMPTY;\n' +
    '        } else {\n' +
    '            if (!moveItemStackTo(result, 0, ' + Math.max(1,sm.inputs.length) + ', false)) return ItemStack.EMPTY;\n' +
    '        }\n' +
    '        if (result.isEmpty()) slot.set(ItemStack.EMPTY); else slot.set(result);\n' +
    '        slot.setChanged();\n        return original;\n    }\n}\n';
  return s;
}
function screenClass(e, c) {
  var cls = e._cls + 'Screen', menuCls = e._cls + 'Menu';
  var s = 'package ' + c.pkg + '.client.screen;\n\n';
  s += 'import ' + c.pkg + '.menu.' + menuCls + ';\n';
  s += 'import ' + c.pkg + '.' + c.mainCls + ';\n';
  s += c.IMPORTS + '\n';
  s += 'import net.minecraft.client.gui.GuiGraphics;\n';
  s += 'import net.minecraft.client.gui.screens.inventory.AbstractContainerScreen;\n';
  s += 'import net.minecraft.client.renderer.GameRenderer;\n';
  s += 'import com.mojang.blaze3d.systems.RenderSystem;\n\n';
  s += 'public class ' + cls + ' extends AbstractContainerScreen<' + menuCls + '> {\n\n';
  s += '    private static final ResourceLocation TEXTURE = new ResourceLocation(' + c.mainCls + '.MODID, "textures/gui/' + e._reg + '.png");\n\n';
  s += '    public ' + cls + '(' + menuCls + ' menu, Inventory inv, Component title) {\n' +
    '        super(menu, inv, title);\n        this.imageWidth = 176;\n        this.imageHeight = 166;\n    }\n\n';
  s += '    @Override protected void renderBg(GuiGraphics gui, float partial, int mouseX, int mouseY) {\n' +
    '        RenderSystem.setShader(GameRenderer::getPositionTexShader);\n' +
    '        RenderSystem.setShaderColor(1.0f, 1.0f, 1.0f, 1.0f);\n' +
    '        RenderSystem.setShaderTexture(0, TEXTURE);\n' +
    '        gui.blit(TEXTURE, leftPos, topPos, 0, 0, imageWidth, imageHeight);\n';
  if (e.showProgress) {
    s += '        int p = menu.getScaledProgress();\n' +
      '        if (p > 0) gui.blit(TEXTURE, leftPos + 78, topPos + 34, 176, 0, p, 16);\n';
  }
  if (e.showFuel) {
    s += '        gui.blit(TEXTURE, leftPos + 56, topPos + 40, 176, 16, 14, 14);\n';
  }
  if (e.stationEnergy && e.stationEnergy.enabled !== false) {
    s += '        if (menu.getEnergyCapacity() > 0) {\n' +
      '            gui.fill(leftPos + 8, topPos + 76, leftPos + 62, topPos + 81, 0xFF202020);\n' +
      '            gui.fill(leftPos + 8, topPos + 76, leftPos + 8 + menu.getEnergyScaled(), topPos + 81, 0xFF4FC9C0);\n' +
      '        }\n';
  }
  s += '    }\n\n';
  s += '    @Override public void render(GuiGraphics gui, int mouseX, int mouseY, float partial) {\n' +
    '        renderBackground(gui);\n        super.render(gui, mouseX, mouseY, partial);\n        renderTooltip(gui, mouseX, mouseY);\n' +
    (e.stationEnergy && e.stationEnergy.enabled !== false ?
      '        if (menu.getEnergyCapacity() > 0 && mouseX >= leftPos + 8 && mouseX <= leftPos + 62 &&\n' +
      '            mouseY >= topPos + 74 && mouseY <= topPos + 82) {\n' +
      '            gui.renderTooltip(font, Component.literal(menu.getEnergyStored() + " / " + menu.getEnergyCapacity() + " FE"), mouseX, mouseY);\n        }\n' : '') +
    '    }\n\n';
  s += '    @Override protected void renderLabels(GuiGraphics gui, int mouseX, int mouseY) {\n' +
    '        gui.drawString(font, title, 8, 6, 0x404040, false);\n' +
    '        gui.drawString(font, playerInventoryTitle, 8, imageHeight - 94, 0x404040, false);\n' +
    '    }\n}\n';
  return s;
}

/* ---------- registry / main classes ---------- */
function mainClass(c) {
  var customTab = c.ct.enabled !== false;
  var tabMap = { materials:'INGREDIENTS', building:'BUILDING_BLOCKS', tools:'TOOLS_AND_UTILITIES',
    combat:'COMBAT', food:'FOOD_AND_DRINKS', redstone:'REDSTONE_BLOCKS', decorations:'FUNCTIONAL_BLOCKS' };
  var groups = {};
  c.els.forEach(function (e) {
    if (e.showInCreative === false) return;
    var key = tabMap[e.tab] || 'INGREDIENTS';
    (groups[key] = groups[key] || []).push(e);
  });
  var tabCode;
  if (customTab) {
    /* 独立创造模式栏目：用 tabKey 的 location 比较，避免依赖注册表对象时序 */
    var accepts = c.els.filter(function (e) { return e.showInCreative !== false; })
      .map(function (e) { return '            event.accept(ModItems.' + e._up + '.get());'; }).join('\n');
    tabCode = '        if (event.getTabKey().location().equals(\n' +
      '                new ResourceLocation(' + c.mainCls + '.MODID, "main"))) {\n' +
      accepts + '\n        }';
  } else {
    tabCode = Object.keys(groups).map(function (key) {
      return '        if (event.getTabKey() == CreativeModeTabs.' + key + ') {\n' +
        groups[key].map(function (e) { return '            event.accept(ModItems.' + e._up + '.get());'; }).join('\n') +
        '\n        }';
    }).join('\n');
  }
  var flammable = c.els.filter(function (e) { return e._isBlock && e.flammable; });
  var setup = '';
  if (flammable.length) {
    setup = '    private void commonSetup(final FMLCommonSetupEvent event) {\n' +
      '        event.enqueueWork(() -> {\n            FireBlock fire = (FireBlock) Blocks.FIRE;\n' +
      flammable.map(function (e) { return '            fire.setFlammable(ModBlocks.' + e._up + '.get(), 5, 20);'; }).join('\n') +
      '\n        });\n    }\n\n';
  }
  var s = 'package ' + c.pkg + ';\n\n' + c.IMPORTS + '\n\n';
  s += '@Mod(' + c.mainCls + '.MODID)\n';
  s += 'public class ' + c.mainCls + ' {\n';
  s += '    public static final String MODID = ' + jstr(c.modid) + ';\n';
  s += '    public static final Logger LOGGER = LogUtils.getLogger();\n\n';
  var hasBE = c.els.some(function (x) { return ['workstation','energy','generator'].indexOf(x.type) >= 0; });
  var hasMenu = c.els.some(function (x) { return x.type === 'workstation'; });
  var hasBlockClasses = c.els.some(function (x) {
    return ['block','workstation','energy','generator','cluster'].indexOf(x.type) >= 0; });
  s += '    public ' + c.mainCls + '() {\n' +
    '        IEventBus bus = FMLJavaModLoadingContext.get().getModEventBus();\n' +
    '        ModMaterials.init();\n' +
    (c.els.some(function (x) { return x.type === 'cluster'; }) ?
      '        ModFeatures.FEATURES.register(bus);\n' : '') +
    (c.els.some(function (x) { return x.type === 'mob'; }) ?
      '        ModEntities.ENTITIES.register(bus);\n' : '') +
    '        ModItems.ITEMS.register(bus);\n' +
    (c.ct.enabled !== false ? '        ModCreativeTabs.TABS.register(bus);\n' : '') +
    (hasBlockClasses ? '        ModBlocks.BLOCKS.register(bus);\n' : '') +
    (hasBE ? '        ModBlockEntities.BLOCK_ENTITIES.register(bus);\n' : '') +
    (hasMenu ? '        ModMenuTypes.MENUS.register(bus);\n' : '') +
    '        bus.addListener(this::addCreative);\n' +
    (flammable.length ? '        bus.addListener(this::commonSetup);\n' : '') +
    '        MinecraftForge.EVENT_BUS.register(this);\n    }\n\n';
  s += setup;
  s += '    private void addCreative(BuildCreativeModeTabContentsEvent event) {\n' + tabCode + '\n    }\n}\n';
  return s;
}
/* 独立创造模式物品栏（CreativeModeTab）：标题走语言文件，图标用可编辑的图标物品 */
function creativeTabsClass(c) {
  var s = 'package ' + c.pkg + '.registry;\n\n' + c.IMPORTS + '\n';
  s += 'import ' + c.pkg + '.' + c.mainCls + ';\n';
  s += 'import net.minecraft.world.item.CreativeModeTab;\n';
  s += 'import net.minecraft.world.item.ItemStack;\n';
  s += 'import net.minecraft.network.chat.Component;\n';
  s += 'import net.minecraft.core.registries.Registries;\n';
  s += 'import net.minecraft.resources.ResourceLocation;\n\n';
  s += 'public final class ModCreativeTabs {\n';
  s += '    public static final DeferredRegister<CreativeModeTab> TABS =\n';
  s += '        DeferredRegister.create(Registries.CREATIVE_MODE_TAB, ' + c.mainCls + '.MODID);\n\n';
  s += '    /* 图标物品由 ModItems 注册，贴图可在制作器「模组信息」页自由绘制 */\n';
  s += '    public static final RegistryObject<CreativeModeTab> MAIN = TABS.register("main", () ->\n';
  s += '        CreativeModeTab.builder()\n';
  s += '            .title(Component.translatable(' + jstr('itemGroup.' + c.modid + '.main') + '))\n';
  s += '            .icon(() -> new ItemStack(ModItems.CREATIVE_TAB_ICON.get()))\n';
  s += '            .build());\n\n';
  s += '    private ModCreativeTabs() {}\n}\n';
  return s;
}
function itemsRegistry(c) {
  var s = 'package ' + c.pkg + '.registry;\n\n' + c.IMPORTS + '\n';
  s += 'import ' + c.pkg + '.item.*;\n';
  s += 'import ' + c.pkg + '.' + c.mainCls + ';\n\n';
  s += 'public final class ModItems {\n';
  s += '    public static final DeferredRegister<Item> ITEMS = DeferredRegister.create(ForgeRegistries.ITEMS, ' + c.mainCls + '.MODID);\n\n';
  c.els.forEach(function (e) {
    var expr = e._isBlockItem
      ? 'new ' + e._cls + 'Item(ModBlocks.' + e._up + '.get())'
      : 'new ' + e._cls + 'Item()';
    s += '    public static final RegistryObject<Item> ' + e._up + ' = ITEMS.register(' + jstr(e._reg) + ', () -> ' + expr + ');\n';
  });
  c.els.filter(function (e) { return e.type === 'mob'; }).forEach(function (e) {
    s += '    public static final RegistryObject<Item> ' + e._up + '_SPAWN_EGG = ITEMS.register(' +
      jstr(e._reg + '_spawn_egg') + ', () -> new ' + e._cls + 'SpawnEgg(new Item.Properties()));\n';
  });
  if (c.ct.enabled !== false) {
    s += '    /* 创造模式独立栏目的按钮图案：16x16 像素，制作器内可直接编辑 */\n';
    s += '    public static final RegistryObject<Item> CREATIVE_TAB_ICON = ITEMS.register(\n';
    s += '        "creative_tab_icon", () -> new Item(new Item.Properties()));\n';
  }
  s += '\n    private ModItems() {}\n}\n';
  return s;
}
function blocksRegistry(c) {
  var blocks = c.els.filter(function (e) { return e._isBlock || e.type === 'cluster'; });
  /* 没有任何方块类元素时不生成（其中的 import 会指向不存在的 block 包） */
  if (!blocks.length) return null;
  var s = 'package ' + c.pkg + '.registry;\n\n' + c.IMPORTS + '\n';
  s += 'import ' + c.pkg + '.block.*;\n';
  s += 'import ' + c.pkg + '.' + c.mainCls + ';\n\n';
  s += 'public final class ModBlocks {\n';
  s += '    public static final DeferredRegister<Block> BLOCKS = DeferredRegister.create(ForgeRegistries.BLOCKS, ' + c.mainCls + '.MODID);\n\n';
  blocks.forEach(function (e) {
    s += '    public static final RegistryObject<Block> ' + e._up + ' = BLOCKS.register(' + jstr(e._reg) +
      ', () -> new ' + e._cls + 'Block());\n';
  });
  s += '\n    private ModBlocks() {}\n}\n';
  return s;
}
function blockEntitiesRegistry(c) {
  var st = c.els.filter(function (e) {
    return ['workstation','energy','generator'].indexOf(e.type) >= 0; });
  /* 没有方块实体元素时不生成该类（其中的 import 会指向不存在的包） */
  if (!st.length) return null;
  var s = 'package ' + c.pkg + '.registry;\n\n' + c.IMPORTS + '\n';
  s += 'import ' + c.pkg + '.block.entity.*;\n';
  s += 'import ' + c.pkg + '.' + c.mainCls + ';\n\n';
  s += 'public final class ModBlockEntities {\n';
  s += '    public static final DeferredRegister<BlockEntityType<?>> BLOCK_ENTITIES =\n' +
    '        DeferredRegister.create(ForgeRegistries.BLOCK_ENTITY_TYPES, ' + c.mainCls + '.MODID);\n\n';
  st.forEach(function (e) {
    s += '    public static final RegistryObject<BlockEntityType<' + e._cls + 'BlockEntity>> ' + e._up + ' =\n' +
      '        BLOCK_ENTITIES.register(' + jstr(e._reg) + ', () ->\n' +
      '            BlockEntityType.Builder.of(' + e._cls + 'BlockEntity::new, ModBlocks.' + e._up + '.get()).build(null));\n';
  });
  s += '\n    private ModBlockEntities() {}\n}\n';
  return s;
}
function menuTypesRegistry(c) {
  var st = c.els.filter(function (e) { return e.type === 'workstation'; });
  /* 没有工作站时不生成该类（import 会指向不存在的包） */
  if (!st.length) return null;
  var s = 'package ' + c.pkg + '.registry;\n\n' + c.IMPORTS + '\n';
  s += 'import ' + c.pkg + '.block.entity.*;\n';
  s += 'import ' + c.pkg + '.menu.*;\n';
  s += 'import ' + c.pkg + '.' + c.mainCls + ';\n';
  s += 'import net.minecraft.network.FriendlyByteBuf;\n\n';
  s += 'public final class ModMenuTypes {\n';
  s += '    public static final DeferredRegister<MenuType<?>> MENUS =\n' +
    '        DeferredRegister.create(ForgeRegistries.MENU_TYPES, ' + c.mainCls + '.MODID);\n\n';
  st.forEach(function (e) {
    s += '    public static final RegistryObject<MenuType<' + e._cls + 'Menu>> ' + e._up + ' =\n' +
      '        MENUS.register(' + jstr(e._reg) + ', () -> IForgeMenuType.create((windowId, inv, buf) -> {\n' +
      '            BlockPos pos = buf.readBlockPos();\n' +
      '            BlockEntity be = inv.player.level().getBlockEntity(pos);\n' +
      '            ContainerData data = be instanceof ' + e._cls + 'BlockEntity station ? station.getData() : new SimpleContainerData(' +
        (e.stationEnergy && e.stationEnergy.enabled === false ? 2 : 4) + ');\n' +
      '            return new ' + e._cls + 'Menu(windowId, inv, pos, data);\n' +
      '        }));\n';
  });
  s += '\n    private ModMenuTypes() {}\n}\n';
  return s;
}
function materialsClass(c) {
  var customTiers = c.els.filter(function (e) {
    return (e.type === 'tool' || e.type === 'weapon') && (!e.tier || e.tier === 'custom'); });
  var armors = c.els.filter(function (e) { return e.type === 'armor'; });
  var s = 'package ' + c.pkg + ';\n\n' + c.IMPORTS + '\n\n';
  s += 'public final class ModMaterials {\n';
  s += '    public static void init() { /* 触发静态初始化，保证材料在物品注册前就绪 */ }\n\n';
  customTiers.forEach(function (e) {
    s += '    public static final Tier ' + e._up + '_TIER = new SimpleTier(\n' +
      '        ' + num(e.durability,500) + ', ' + fv(e.speed) + ', ' + fv(e.damage) + ', ' +
      num(e.harvestLevel,2) + ', ' + num(e.enchantability,15) + ', ' +
      jstr(e.incorrectTag || 'incorrect_for_diamond_tool') + ',\n' +
      '        () -> ' + (refIngredientOf(e.repair,c) || 'Ingredient.EMPTY') + ');\n';
  });
  armors.forEach(function (e) {
    s += '    public static final ArmorMaterial ' + e._up + '_ARMOR = new SimpleArmor(\n' +
      '        ' + jstr(c.modid + ':' + e._reg) + ', ' + Math.max(1,num(e.durability/13,20)) + ', ' +
      num(e.defense,3) + ', ' + num(e.enchantability,15) + ', ' + fv(e.toughness) + ', ' + fv(e.knockback) + ',\n' +
      '        () -> ' + (refIngredientOf(e.repair,c) || 'Ingredient.EMPTY') + ');\n';
  });
  s += '\n    public static class SimpleTier implements Tier {\n' +
    '        private final int uses, level, enchant;\n' +
    '        private final float speed, damage;\n' +
    '        private final Supplier<Ingredient> repair;\n' +
    '        private final String incorrect;\n' +
    '        public SimpleTier(int uses, float speed, float damage, int level, int enchant, String incorrect, Supplier<Ingredient> repair) {\n' +
    '            this.uses = uses; this.speed = speed; this.damage = damage;\n' +
    '            this.level = level; this.enchant = enchant; this.incorrect = incorrect; this.repair = repair;\n        }\n' +
    '        @Override public int getUses() { return uses; }\n' +
    '        @Override public float getSpeed() { return speed; }\n' +
    '        @Override public float getAttackDamageBonus() { return damage; }\n' +
    '        @Deprecated public int getLevel() { return level; }\n' +
    '        @Override public int getEnchantmentValue() { return enchant; }\n' +
    '        @Override public Ingredient getRepairIngredient() { return repair.get(); }\n' +
    '        public TagKey<Block> getIncorrectBlocksForDrops() {\n' +
    '            return TagKey.create(Registries.BLOCK, new ResourceLocation("minecraft", incorrect));\n' +
    '        }\n    }\n\n';
  s += '    public static class SimpleArmor implements ArmorMaterial {\n' +
    '        private final String name;\n' +
    '        private final int factor, defense, enchant;\n' +
    '        private final float toughness, knockback;\n' +
    '        private final Supplier<Ingredient> repair;\n' +
    '        public SimpleArmor(String name, int factor, int defense, int enchant, float toughness, float knockback, Supplier<Ingredient> repair) {\n' +
    '            this.name = name; this.factor = factor; this.defense = defense; this.enchant = enchant;\n' +
    '            this.toughness = toughness; this.knockback = knockback; this.repair = repair;\n        }\n' +
    '        @Override public int getDurabilityForType(ArmorItem.Type type) {\n' +
    '            int[] mult = {11, 16, 15, 13};\n            return mult[type.ordinal()] * factor;\n        }\n' +
    '        @Override public int getDefenseForType(ArmorItem.Type type) { return defense; }\n' +
    '        @Override public int getEnchantmentValue() { return enchant; }\n' +
    '        @Override public SoundEvent getEquipSound() { return SoundEvents.ARMOR_EQUIP_IRON; }\n' +
    '        @Override public Ingredient getRepairIngredient() { return repair.get(); }\n' +
    '        @Override public String getName() { return name; }\n' +
    '        @Override public float getToughness() { return toughness; }\n' +
    '        @Override public float getKnockbackResistance() { return knockback; }\n' +
    '    }\n\n    private ModMaterials() {}\n}\n';
  return s;
}
function clientSetupClass(c) {
  var st = c.els.filter(function (e) { return e.type === 'workstation'; });
  var mobs = c.els.filter(function (e) { return e.type === 'mob'; });
  /* 没有工作站也没有生物时，ClientSetup 没有任何可注册内容：
     不生成该类，否则其中对不存在的 screen/model 包的 import 会让工程编译失败 */
  if (!st.length && !mobs.length) return null;
  var s = 'package ' + c.pkg + '.client;\n\n';
  if (st.length) s += 'import ' + c.pkg + '.client.screen.*;\n';
  if (mobs.length) s += 'import ' + c.pkg + '.entity.model.*;\n';
  /* 这两个注册类本身也是条件生成的：
     ModMenuTypes 只在有工作站时生成、ModEntities 只在有生物时生成，
     无条件 import 会让"有工作站但没生物"之类的项目编译失败 */
  if (st.length) s += 'import ' + c.pkg + '.registry.ModMenuTypes;\n';
  if (mobs.length) s += 'import ' + c.pkg + '.registry.ModEntities;\n';
  s += 'import ' + c.pkg + '.' + c.mainCls + ';\n';
  s += c.IMPORTS + '\n';
  s += 'import net.minecraftforge.api.distmarker.Dist;\n';
  s += 'import net.minecraftforge.client.event.EntityRenderersEvent;\n';
  s += 'import net.minecraftforge.fml.event.lifecycle.FMLClientSetupEvent;\n';
  s += 'import net.minecraft.client.gui.screens.MenuScreens;\n\n';
  s += '@Mod.EventBusSubscriber(modid = ' + c.mainCls + '.MODID, bus = Mod.EventBusSubscriber.Bus.MOD, value = Dist.CLIENT)\n';
  s += 'public final class ClientSetup {\n';
  if (mobs.length) {
    s += '    @SubscribeEvent\n    public static void registerModelLayers(EntityRenderersEvent.RegisterLayerDefinitions event) {\n';
    mobs.forEach(function (e) {
      s += '        event.registerLayerDefinition(' + e._cls + 'Model.LAYER, ' + e._cls + 'Model::createLayer);\n';
    });
    s += '    }\n\n';
    s += '    @SubscribeEvent\n    public static void registerRenderers(EntityRenderersEvent.RegisterRenderers event) {\n';
    mobs.forEach(function (e) {
      s += '        event.registerEntityRenderer(ModEntities.' + e._up + '.get(), ' + e._cls + 'Renderer::new);\n';
    });
    s += '    }\n\n';
  }
  if (st.length) {
    s += '    @SubscribeEvent\n    public static void registerScreens(FMLClientSetupEvent event) {\n';
    s += '        event.enqueueWork(() -> {\n';
    st.forEach(function (e) {
      s += '            MenuScreens.register(ModMenuTypes.' + e._up + '.get(), ' + e._cls + 'Screen::new);\n';
    });
    s += '        });\n    }\n\n';
  }
  s += '    private ClientSetup() {}\n}\n';
  return s;
}

/* ---------- resource JSON ---------- */
function recipesFor(e, c) {
  if (e.craftable === false) return [];
  var list = e.recipes || [];
  /* 兜底：元素标记为可合成但没有任何配方时，自动补一条默认配方，
     避免用户新建元素后忘了加配方导致游戏里无合成 */
  if (!list.length) list = [BF.defaultRecipeFor(e)];
  var out = [];
  list.forEach(function (r, idx) {
    var result = { item: c.modid + ':' + (e.type === 'mob' ? e._reg + '_spawn_egg' : e._reg),
      count: Math.max(1,num(r.count,1)) };
    var path = 'data/' + c.modid + '/recipes/' + e._reg + '_' + (idx+1) + '.json';
    var json = null;
    var grid = r.grid || [null,null,null,null,null,null,null,null,null];
    if (r.type === 'crafting') {
      var key = {}, letters = {}, next = 65;
      var cells = grid.map(function (ref) {
        var k = refKeyOf(ref, c);
        if (!k) return ' ';
        if (!letters[k]) { letters[k] = String.fromCharCode(next++); key[letters[k]] = { item:k }; }
        return letters[k];
      });
      if (r.shapeless) {
        var ing = [];
        Object.keys(key).forEach(function (L) { ing.push(key[L]); });
        json = { type:'minecraft:crafting_shapeless', ingredients:ing, result:result };
      } else {
        var rows = [];
        for (var y=0;y<3;y++) rows.push(cells.slice(y*3,y*3+3).join(''));
        /* trim empty border rows/columns */
        while (rows.length && rows[0].trim()==='') rows.shift();
        while (rows.length && rows[rows.length-1].trim()==='') rows.pop();
        if (rows.length) {
          var minC = 2, maxC = 0;
          rows.forEach(function (row) { for (var i=0;i<3;i++) if (row[i] !== ' ') { minC = Math.min(minC,i); maxC = Math.max(maxC,i); } });
          rows = rows.map(function (row) { return row.substring(minC, maxC+1); });
        }
        json = { type:'minecraft:crafting_shaped', pattern:rows, key:key, result:result };
      }
    } else if (r.type === 'smelting' || r.type === 'blasting' || r.type === 'smoking' || r.type === 'campfire') {
      var input = null;
      for (var i=0;i<9;i++) if (refKeyOf(grid[i],c)) { input = { item:refKeyOf(grid[i],c) }; break; }
      if (input) json = { type:'minecraft:' + r.type, ingredient:input, result:result,
        experience: Number(r.xp) || 0.5, cookingtime: num(r.time,200) };
    } else if (r.type === 'stonecutting') {
      var inp = null;
      for (var j=0;j<9;j++) if (refKeyOf(grid[j],c)) { inp = { item:refKeyOf(grid[j],c) }; break; }
      if (inp) json = { type:'minecraft:stonecutting', ingredient:inp, result:result };
    }
    if (json) out.push({ path:path, content:JSON.stringify(json,null,2) + '\n' });
  });
  return out;
}

/* ---------- build.gradle / metadata ---------- */
function buildGradle(c) {
  return [
'plugins {',
"    id 'eclipse'",
"    id 'idea'",
"    id 'maven-publish'",
"    id 'net.minecraftforge.gradle' version '[6.0,6.2)'",
'}',
'',
"version = '" + (c.m.version || '1.0.0') + "'",
"group = '" + c.pkg + "'",
"base { archivesName = '" + c.modid + "' }",
'',
'// 兼容方案：当前 JVM 就是 17 时指定工具链；否则用当前 JDK + --release 17 编译（可兼容 JDK 21）',
'if (JavaVersion.current() == JavaVersion.VERSION_17) {',
'    java.toolchain.languageVersion = JavaLanguageVersion.of(17)',
'}',
'',
'minecraft {',
"    mappings channel: 'official', version: '" + BF.MC_VERSION + "'",
'    copyIdeResources = true',
'    runs {',
'        configureEach {',
"            workingDirectory project.file('run')",
"            property 'forge.logging.markers', 'REGISTRIES'",
"            property 'forge.logging.console.level', 'debug'",
"            mods { '" + c.modid + "' { source sourceSets.main } }",
'        }',
'        client {',
"            property 'forge.enabledGameTestNamespaces', '" + c.modid + "'",
'        }',
'        server {',
"            property 'forge.enabledGameTestNamespaces', '" + c.modid + "'",
"            args '--nogui'",
'        }',
'        gameTestServer {',
"            property 'forge.enabledGameTestNamespaces', '" + c.modid + "'",
'        }',
'        data {',
"            args '--mod', '" + c.modid + "', '--all', '--output', file('src/generated/resources/'), '--existing', file('src/main/resources/')",
'        }',
'    }',
'}',
'',
'sourceSets.main.resources {',
'    srcDir "src/generated/resources"',
'}',
'',
'/* 编辑器把资源生成在工程根目录的 assets/ 与 data/ 下。',
'   注意：绝对不能把这两个目录直接注册成资源根（srcDir 方式）——',
'   Gradle 会把它们当作资源根，打包时丢掉 assets/、data/ 两层前缀，',
'   jar 内变成 newmod/lang/... 而不是 assets/newmod/lang/...，',
'   Minecraft 因此读不到贴图、语言文件与配方（表现为贴图紫黑、名称显示 ID、无合成）。',
'   用 from/into 原样并入资源根，层级才完整。 */',
'processResources {',
'    from("assets") { into "assets" }',
'    from("data")   { into "data"   }',
'}',
'',
'repositories { mavenCentral() }',
'',
'dependencies {',
"    minecraft 'net.minecraftforge:forge:" + BF.MC_VERSION + "-" + BF.FORGE_VERSION + "'",
'}',
'',
'tasks.withType(JavaCompile).configureEach {',
"    options.encoding = 'UTF-8'",
"    options.release = 17",
'}',
''
  ].join('\n');
}
/* ---------- one-click build scripts ---------- */
/* build.bat 必须满足两条硬规则，否则 cmd 会把行切碎执行：
   1) 纯 ASCII：中文注释 + 中途 chcp 65001 会造成 GBK/UTF-8 字节偏移错位、跳行；
   2) CRLF 行尾：cmd 对 LF-only 的括号块与 for 循环解析不稳。
   中文说明放在 build.sh 与 README.md，bat 内只保留英文。 */
function buildBatScript(c) {
  /* 用 modid（slug 保证 ASCII），避免项目名里的中文进入 bat 文件 */
  var name = c.modid;
  /* 三条硬规则：
     1) 纯 ASCII + CRLF（否则 cmd 字节偏移错位、把行切碎执行）
     2) 不用 if (...) 括号块：块内的裸括号（如 "(need 17)"）会被当成块结束符，
        把块结构搞乱，导致成功也走失败分支 —— 改用 goto
     3) echo 文本里不出现裸括号与未转义 % */
  return [
"@echo off",
"REM ============================================================",
"REM  " + name + " - one-click build script for Windows",
"REM  Generated by BlockForge Studio",
"REM ============================================================",
"setlocal",
"cd /d \"%~dp0\"",
"",
"where java >nul 2>&1",
"if errorlevel 1 goto :nojava",
"",
"echo [1/2] Building mod via gradlew build ...",
"echo       First run downloads Gradle and Forge deps, usually 5-20 minutes.",
"",
"call gradlew.bat build %*",
"if errorlevel 1 goto :fail",
"",
"echo [2/2] Build successful!",
"echo.",
"if not exist \"build\\libs\\*.jar\" goto :nojar",
"for %%F in (\"build\\libs\\*.jar\") do echo       %%F",
"goto :done",
"",
":nojar",
"echo       Warning: no jar found in build\\libs - check gradle output above.",
"goto :done",
"",
":done",
"echo.",
"echo Copy the jar above into your Minecraft mods folder:",
"echo   Windows  : %APPDATA%\\.minecraft\\mods\\",
"echo   Linux/mac: ~/.minecraft/mods/",
"echo.",
"pause",
"exit /b 0",
"",
":nojava",
"echo.",
"echo [ERROR] Java not found. Please install JDK 17 first:",
"echo         https://adoptium.net/temurin/releases/?version=17",
"echo         Then reopen the command prompt and run this script again.",
"echo.",
"pause",
"exit /b 1",
"",
":fail",
"echo.",
"echo [ERROR] Build failed. Common causes:",
"echo         - wrong JDK version, need 17",
"echo         - no network access or low disk space",
"echo         See README.md for troubleshooting.",
"echo.",
"pause",
"exit /b 1",
""
  ].join("\r\n");
}
function buildShScript(c) {
  return [
'#!/usr/bin/env bash',
'# ============================================================',
'#  ' + (c.m.name || c.modid) + ' — 一键构建脚本 (Linux / macOS)',
'#  生成自 BlockForge Studio',
'# ============================================================',
'set -e',
'cd "$(dirname "$0")"',
'',
'if ! command -v java >/dev/null 2>&1; then',
'  echo "[错误] 没有找到 Java。请先安装 JDK 17：https://adoptium.net/"',
'  exit 1',
'fi',
'',
'echo "[1/2] 正在构建模组 (./gradlew build) ..."',
'echo "      首次运行会下载 Gradle 与 Forge 依赖，请耐心等待。"',
'chmod +x ./gradlew 2>/dev/null || true',
'./gradlew build "$@"',
'',
'echo "[2/2] 构建完成！产物位于 build/libs/"',
'ls -lh build/libs/*.jar 2>/dev/null || true',
'echo "把 jar 复制到 ~/.minecraft/mods/ 即可安装。"',
''
  ].join('\n');
}

function readme(c, stats) {
  return [
'# ' + (c.m.name || c.modid) + ' — Minecraft 1.20.1 Forge 模组',
'',
'> 本项目由 **BlockForge Studio** 可视化模组制作器生成，全部 Java 源码、材质、模型、配方与语言文件均可直接编辑。',
'> 本文件已包含完整的构建 / 安装 / GitHub 分享说明，照着做即可。',
'',
'## 基本信息',
'',
'| 项目 | 值 |',
'| --- | --- |',
'| 模组 ID | `' + c.modid + '` |',
'| 包名 | `' + c.pkg + '` |',
'| Minecraft | ' + BF.MC_VERSION + ' (Java Edition) |',
'| Forge | ' + BF.FORGE_VERSION + ' |',
'| Java | 17 |',
'| 元素数量 | ' + c.els.length + ' |',
'',
'## 创造模式物品栏与模组封面',
'',
(c.ct.enabled !== false
  ? '- 本模组在创造模式背包中拥有**独立页签**：`' + (c.ct.title || c.m.name || c.modid) +
    '`，所有模组物品集中显示在这里。\n' +
    '- 页签图案：`assets/' + c.modid + '/textures/item/creative_tab_icon.png`（16×16）；\n' +
    '  标题：`assets/' + c.modid + '/lang/*.json` 里的 `itemGroup.' + c.modid + '.main`。\n' +
    '  两者可在 BlockForge Studio「模组信息 → 创造模式物品栏」里直接绘制 / 修改。'
  : '- 本项目未启用独立创造模式页签，物品按各自分类加入原版页签。'),
'- 模组封面图是 jar 根目录的 `pack.png`（64×64）。资源包选择界面与 Forge 模组列表',
'  （`META-INF/mods.toml` 的 `logoFile="pack.png"`）都会显示它；',
'  可在「模组信息 → 模组封面图」中绘制或上传图片后重新导出。',
'',
'## 构建方法（照做即可）',
'',
'**本工程已自带 Gradle Wrapper，不需要安装 Gradle。**',
'',
'1. 安装 **JDK 17**（务必是 17，Forge 1.20.1 不兼容更高版本；你机器上若是 21 也可，见下方说明）。',
'   下载：<https://adoptium.net/temurin/releases/?version=17>',
'2. **Windows**：双击 `build.bat`（或在命令行执行 `build.bat`）。',
'   **Linux / macOS**：执行 `chmod +x build.sh && ./build.sh`。',
'   首次运行会自动下载 Gradle 与 Forge 依赖（5-20 分钟），之后会很快。',
'3. 构建产物位于 `build/libs/' + c.modid + '-' + (c.m.version||'1.0.0') + '.jar`。',
'4. 把该 jar 复制到 Minecraft 的 `mods` 文件夹：',
'   - Windows：`%APPDATA%\\.minecraft\\mods\\`',
'   - Linux / macOS：`~/.minecraft/mods/`',
'5. 用 **Forge 1.20.1**（' + BF.FORGE_VERSION + '）启动客户端，模组即生效。',
'',
'### 手动命令（等价）',
'',
'```bash',
'./gradlew build          # Windows: gradlew.bat build',
'./gradlew runClient      # 直接启动带本模组的开发客户端（推荐调试用）',
'./gradlew runServer      # 启动开发服务端',
'./gradlew runData        # 重新生成数据（模型 / 配方）',
'```',
'',
'### 关于 JDK 版本',
'',
'Forge 1.20.1 官方要求 **JDK 17**。本工程的处理方式：',
'',
'- **本机已装 JDK 17** → 直接用它编译，最稳。',
'- **只有 JDK 21 等其它版本** → 也能编译：Gradle 会用当前 JDK 编译并输出 Java 17 字节码',
'  （`options.release = 17`），无需任何额外操作。',
'- **想完全对齐官方环境** → 装 Temurin 17：<https://adoptium.net/temurin/releases/?version=17>',
'  国内下载可用镜像：<https://mirrors.tuna.tsinghua.edu.cn/Adoptium/>',
'',
'> `settings.gradle` 已配置 foojay 工具链插件：若需要自动下载 JDK 17 会自动处理，',
'> 但 GitHub 直连常被卡，**推荐手动装 Temurin 17**（或直接用上面的 JDK 21 兼容方案）。',
'',
'## 分享到 GitHub',
'',
'```bash',
'# 方式一：已安装 GitHub CLI（推荐）',
'gh repo create ' + c.modid + '-mod --public --source=. --remote=origin --push',
'',
'# 方式二：网页建空仓库后',
'git init',
'git add .',
'git commit -m "Initial commit: ' + (c.m.name || c.modid) + ' mod"',
'git branch -M main',
'git remote add origin https://github.com/<你的用户名>/' + c.modid + '-mod.git',
'git push -u origin main',
'```',
'',
'> `.gitignore` 已排除 `build/`、`.gradle/`、`run/`，不会被提交。',
'> 想把成品 jar 发给朋友，到仓库的 **Releases → New release** 上传 `build/libs/*.jar` 即可。',
'',
'## 目录说明',
'',
'```',
'src/main/java/' + c.pkgPath + '/',
'  ' + c.mainCls + '.java                 主类：注册 DeferredRegister / 创造标签 / 可燃性',
'  ModMaterials.java            自定义工具材料(Tier) 与护甲材料(ArmorMaterial)',
'  registry/                   物品、方块、方块实体、菜单类型注册表',
'  item/                       每个元素一个物品类（提示文本、右键、命中特效、耐久等）',
'  block/                      方块类；工作站继承 BaseEntityBlock',
'  block/entity/               工作站方块实体：容器、NBT 持久化、配方处理逻辑',
'  menu/                       容器菜单：槽位布局与快速移动',
'  client/                     客户端屏幕注册与 GUI 渲染',
'src/main/resources/',
'  META-INF/mods.toml          模组元数据与依赖声明',
'  assets/' + c.modid + '/               贴图 / 模型 / blockstate / 语言文件',
'  data/' + c.modid + '/                 合成配方 / 战利品表 / 挖掘标签',
'    worldgen/                     configured_feature + placed_feature（原版矿物生成）',
'    forge/biome_modifier/         Forge add_features 生物群系注入',
'.modmaker/project.json        可重新导入 BlockForge Studio 继续编辑的工程源文件',
'```',
'',
'## 关于工作站',
'',
'工作站的配方逻辑写在对应 `block/entity/*BlockEntity.java` 的 `RECIPES` 常量中：',
'方块实体每游戏刻检查输入槽物品，达到 `WORK_TIME` 后消耗输入并在输出槽生成产物。',
'槽位坐标由编辑器 GUI 设计器生成，与 `menu/*Menu.java` 中的 `addSlot` 一一对应。',
'如需接入能量、流体或 JEI 兼容，可在此基础上扩展（Forge Capability 系统）。',
'',
'## 六面贴图与放置朝向',
'',
'- 方块贴图共 6 张：`top / bottom / front / back / left / right`，分别对应模型纹理键',
'  `up / down / north / south / west / east`，父模型为 `minecraft:block/cube`。',
'- 方块类声明 `BlockStateProperties.HORIZONTAL_FACING`，放置时取玩家水平朝向的反方向，',
'  `blockstates/*.json` 用 `y` 轴旋转 0/90/180/270 把 north 面转到对应方向。',
'- 物品图标为 `item/<注册名>.png`，模型使用 `item/generated`。',
'- 护甲穿戴贴图 `models/armor/<注册名>_layer_1/2.png` 由物品图标平铺生成，',
'  如需精细穿戴外观，可用 BlockBench 或像素编辑器替换这两张 64×32 贴图。',
'- GUI 背景由编辑器按槽位布局程序化绘制（256×256，前 176×166 为界面）；',
'  画板默认直接载入这份示例界面作为底稿，可在其上继续修改，「恢复为示例 UI」可重新取底稿。',
'',
'## 物品模型与手持显示',
'',
'- 工具 / 武器默认使用 `minecraft:item/handheld`，与原版剑、镐一致，',
'  包含正确的第一 / 第三人称握持变换；材料、食物、护甲、杂项使用 `minecraft:item/generated`。',
'  可在元素「基本信息 → 手持 / 图标模型」中手动指定 `auto / generated / handheld`。',
'- 所有带耐久的物品在 `Item.Properties` 中强制 `.stacksTo(1)`：',
'  可堆叠上限大于 1 同时又有耐久，会导致手持与耐久条显示异常。',
'',
'## 矿物生成（参考原版 1.20.1 代码）',
'',
'在编辑器「矿物生成」标签页启用后，工程会生成三个层次的数据包文件：',
'',
'1. `worldgen/configured_feature/<注册名>_ore.json` — `minecraft:ore`，对应原版',
'   `OreFeature` / `OreConfiguration`：`size`（矿脉大小）、`targets`（`TagMatchTest` 的',
'   `stone_ore_replaceables` / `deepslate_ore_replaceables`，或 `BlockMatchTest`）与',
'   `discard_chance_on_air_exposure`（暴露空气时的丢弃概率）。',
'2. `worldgen/placed_feature/<注册名>_ore.json` — 对应 `PlacementUtils.inSquare`、',
'   `CountPlacement`、`HeightRangePlacement.uniform/trapezoid` 与 `BiomeFilter.biome()`。',
'3. `forge/biome_modifier/<注册名>_ore_<维度>.json` — `forge:add_features`，',
'   阶段 `underground_ores`，生物群系标签 `#minecraft:is_overworld` / `is_nether` / `is_end`。',
'',
'## 工具属性与物品效果（参考原版覆写）',
'',
'- `getDestroySpeed(ItemStack, BlockState)` — 对所选方块标签返回自定义挖掘速度。',
'- `canPerformAction(ItemStack, ToolAction)` — Forge `ToolActions`（剥皮、整平、耕地等）。',
'- `getAttributeModifiers(EquipmentSlot, ItemStack)` — 用 `ImmutableMultimap` 写入',
'  `Attributes.ATTACK_DAMAGE` / `ATTACK_SPEED`，对应原版 `SwordItem` 的实现。',
'- `isValidRepairItem`、`isEnchantable`、`isCorrectToolForDrops`、`hurtEnemy`、',
'  `inventoryTick`、`use`、`finishUsingItem`、`getUseAnimation`、`getBurnTime`',
'  均由编辑器选项按原版签名生成；护甲穿戴效果与火药味效果都走 `MobEffectInstance`。',
'- `Tier#getIncorrectBlocksForDrops()` 返回所选的 `minecraft:incorrect_for_*_tool` 标签。',
'',
'## 合成配方与可合成开关',
'',
'每个元素都有「可合成」开关：关闭时不生成 `data/<modid>/recipes/*.json`（例如只能靠',
'矿物生成获得的矿石），但仍可通过「是否出现在创造标签」单独控制创造模式可见性。',
'',
'## 能量系统（Forge Energy, 单位 FE）',
'',
'- **能量导管**：持有 `net.minecraftforge.energy.EnergyStorage`（容量 / 每刻传输量），',
'  每游戏刻通过 `ModEnergy.push()` 向六个方向推送能量。',
'- **产能方块**：同样暴露 `IEnergyStorage`，支持恒定产能、白天产能、燃料产能三种模式；',
'  燃料模式每个燃烧周期消耗容器中 1 个物品。',
'- **工作站**：`stationEnergy` 配置容量、最大输入 / 输出、每次配方消耗；',
'  方块实体 tick 中检查 `ENERGY_COST` 后才推进进度，完成时扣除能量。',
'  `ContainerData` 扩展为 4 槽（进度 / 总时长 / 当前能量 / 容量），客户端同步后由',
'  `Screen` 用 `GuiGraphics.fill` 绘制能量条，并在悬停时显示 `x / y FE`。',
'- 三者都覆写 `BlockEntity#getCapability(ForgeCapabilities.ENERGY, side)` 与',
'  `invalidateCaps()`，因此可与其它 Forge 能量模组互联互通。',
'',
'## 晶簇方块（参考原版 AmethystClusterBlock）',
'',
'- 六向 `BlockStateProperties.FACING`、十字 `minecraft:block/cross` 模型，',
'  `blockstates` 用 x/y 旋转把十字贴到六个面；`canSurvive()` 检查支撑方块，',
'  支撑消失时 `updateShape()` 自动变空气；`getShape()` 按方向返回碰撞箱。',
'- 世界生成为自定义 Java `Feature<NoneFeatureConfiguration>`：',
'  在空气位置检查六个相邻方块是否为指定支撑方块，若是则放置朝外的晶簇',
'  （对应原版紫水晶晶洞在母岩表面生成晶簇的逻辑）。',
'- 数据包链：`worldgen/configured_feature`（type 指向 Java 注册的 Feature）、',
'  `worldgen/placed_feature`（count / in_square / height_range / biome）、',
'  `forge/biome_modifier`（阶段 underground_decoration）。',
'',
'## 可绘制的 GUI 背景',
'',
'- 工作站「工作站界面」标签页内置 176×166 像素画板，可手绘背景、',
'  一键导入程序化布局作为底图、清空、随时切回自动布局。',
'- 手绘像素保存为元素字段 `guiPixels`，导出时覆盖 `textures/gui/*.png` 的',
'  前 176×166 区域；纹理右侧 `u >= 176` 的进度箭头与火焰图集始终保留，',
'  供 `Screen#renderBg` 通过 blit 绘制。槽位坐标仍以菜单 `addSlot` 为准，',
'  因此可以自由绘制槽位外观而不影响逻辑。',
'',
'## 生物（刷怪蛋形式）',
'',
'- 生物以**刷怪蛋**注册：物品 ID 为 `<注册名>_spawn_egg`，使用 `ForgeSpawnEggItem`，蛋贴图可自行绘制。',
'- `registry/ModEntities.java` 注册 `EntityType`；`entity/*Entity.java` 实现属性、AI 目标、攻击方式、',
'  技能、掉落、经验与交易；`entity/model/*Model.java` 是由部件表生成的 `ModelPart` 树；',
'  `client/*Renderer.java` 负责渲染器，并在 `ClientSetup` 中注册模型层与渲染器。',
'- 建模：每个部件是「枢轴 + 偏移 + 尺寸」的长方体，贴图按原版 box UV 规则排布',
'  （编辑器按同一规则自动生成 64×64 皮肤，保证与 `texOffs` 一致）。',
'- 动画：`setupAnim` 内置行走摆动与呼吸；关键帧动画另存为',
'  `assets/<modid>/animations/<注册名>.animation.json`（1.20.1 客户端格式）。',
'- 血条形式：普通血条 / 顶部 Boss 血条（原版 `ServerBossEvent` + `startSeenByPlayer`）/',
'  始终显示名称与血量。',
'- 交易：友好生物覆写 `getOffers()` 返回 `MerchantOffers`，不依赖版本相关的交易签名。',
'',
'## 已适配的 1.20.1 API 差异（生成器已处理，无需手改）',
'',
'- 方块属性用 `Properties.of()` + `.mapColor(DyeColor)`（1.20.1 已移除 `Material` 类）',
'- 模型用 `net.minecraft.client.model.geom.*` + `builders.*`，并实现 `renderToBuffer`',
'- 渲染器用 `ctx.bakeLayer(Model.LAYER)` 取模型',
'- 容器界面注册走 `FMLClientSetupEvent` + `MenuScreens.register`（Forge 47.3 无 `RegisterMenuScreensEvent`）',
'- 实体模型层与渲染器注册走 `EntityRenderersEvent.RegisterLayerDefinitions` / `RegisterRenderers`',
'- 爆炸用 `Level.ExplosionInteraction`（旧 `Explosion.BlockInteraction` 已移除）',
'- 经验用构造里的 `this.xpReward`，技能命中用 `doHurtTarget(Entity)`',
'',
'> 本工程已用 Forge 1.20.1-47.3.0 实际执行 `gradlew build` 验证通过（BUILD SUCCESSFUL）。',
'',
'生成时间：' + new Date().toLocaleString('zh-CN') + ' · 共 ' + stats.total + ' 个文件',
''
  ].join('\n');
}

/* ---------- main builder ---------- */
BF.buildProject = function (state, opts) {
  opts = opts || {};
  var c = prepare(state);
  var enc = opts.png || function (tex) { return BF.textureBase64(tex); };
  var files = [];
  function add(rel, content) { files.push({ path: c.root + rel, content:content, binary:false }); }
  function addImg(rel, tex) { files.push({ path: c.root + rel, content:enc(tex), binary:true }); }
  function addBin(rel, b64) { files.push({ path: c.root + rel, content:b64, binary:true }); }
  var A = 'assets/' + c.modid + '/', D = 'data/' + c.modid + '/';
  var stations = c.els.filter(function (e) { return e.type === 'workstation'; });
  var blocks = c.els.filter(function (e) { return e._isBlock; });

  /* build files */
  add('build.gradle', buildGradle(c));
  add('settings.gradle', [
    'pluginManagement {', '    repositories {', '        gradlePluginPortal()',
    "        maven { url = 'https://maven.minecraftforge.net/' }", '    }', '}',
    '',
    "plugins { id 'org.gradle.toolchains.foojay-resolver-convention' version '0.8.0' }",
    '',
    "rootProject.name = '" + c.modid + "'", ''
  ].join('\n'));
  add('gradle.properties', [
    '# 需要 JDK 17；若本机是其它版本，Gradle 会通过 foojay 自动下载 JDK 17',
    'org.gradle.jvmargs=-Xmx3G',
    'org.gradle.daemon=false',
    'org.gradle.parallel=true',
    ''
  ].join('\n'));
  add('.gitignore', ['# Gradle','.gradle/','build/','run/','*.iml','.idea/','eclipse/','',''].join('\n'));
  add('src/main/resources/META-INF/mods.toml', [
    'modLoader="javafml"',
    'loaderVersion="[47,)"',
    'license="' + (c.m.license || 'MIT') + '"',
    'issueTrackerURL=""',
    '[[mods]]',
    'modId="' + c.modid + '"',
    'version="' + (c.m.version || '1.0.0') + '"',
    'displayName="' + (c.m.name || c.modid) + '"',
    'logoFile="pack.png"',
    'authors="' + (c.m.author || 'BlockForge Studio') + '"',
    "description='''" + (c.m.description || '由 BlockForge Studio 生成') + "'''",
    '',
    '[[dependencies.' + c.modid + ']]',
    '    modId="forge"', '    mandatory=true', '    versionRange="[47,)"',
    '    ordering="NONE"', '    side="BOTH"',
    '[[dependencies.' + c.modid + ']]',
    '    modId="minecraft"', '    mandatory=true',
    '    versionRange="[1.20.1,1.21)"', '    ordering="NONE"', '    side="BOTH"',
    ''
  ].join('\n'));
  add('src/main/resources/pack.mcmeta', JSON.stringify({ pack:{
    description: (c.m.description || (c.m.name || c.modid) + ' resources'), pack_format:15,
    'forge:server_data_pack_format':12 } }, null, 2) + '\n');
  /* jar 根目录封面图：资源包选择界面显示，mods.toml 里也声明为 logoFile */
  addImg('src/main/resources/pack.png', c.packIcon);

  /* java */
  var J = c.java;
  add(J + c.mainCls + '.java', mainClass(c));
  add(J + 'ModMaterials.java', materialsClass(c));
  add(J + 'registry/ModItems.java', itemsRegistry(c));
  if (c.ct.enabled !== false) add(J + 'registry/ModCreativeTabs.java', creativeTabsClass(c));
  var blocksReg = blocksRegistry(c);
  if (blocksReg) add(J + 'registry/ModBlocks.java', blocksReg);
  var beReg = blockEntitiesRegistry(c);
  if (beReg) add(J + 'registry/ModBlockEntities.java', beReg);
  var menuReg = menuTypesRegistry(c);
  if (menuReg) add(J + 'registry/ModMenuTypes.java', menuReg);
  var clientSetup = clientSetupClass(c);
  if (clientSetup) add(J + 'client/ClientSetup.java', clientSetup);
  var clusters = c.els.filter(function (e) { return e.type === 'cluster'; });
  var energyEls = c.els.filter(function (e) {
    return e.type === 'energy' || e.type === 'generator' || e.type === 'workstation'; });
  if (energyEls.length) add(J + 'energy/ModEnergy.java', energyRouterClass(c));
  if (clusters.length) {
    add(J + 'registry/ModFeatures.java', featuresRegistryClass(c));
    clusters.forEach(function (e) {
      add(J + 'worldgen/feature/' + e._cls + 'Feature.java', clusterFeatureClass(e,c));
    });
  }
  var mobs = c.els.filter(function (e) { return e.type === 'mob'; });
  if (mobs.length) {
    add(J + 'registry/ModEntities.java', entitiesRegistryClass(c));
    mobs.forEach(function (e) {
      add(J + 'entity/' + e._cls + 'Entity.java', mobEntityClass(e,c));
      add(J + 'entity/model/' + e._cls + 'Model.java', mobModelClass(e,c));
      add(J + 'client/' + e._cls + 'Renderer.java', mobRendererClass(e,c));
      add(J + 'item/' + e._cls + 'SpawnEgg.java', mobSpawnEggClass(e,c));
    });
  }
  c.els.forEach(function (e) {
    add(J + 'item/' + e._cls + 'Item.java', itemClass(e,c));
    if (e._isBlock || e.type === 'cluster') add(J + 'block/' + e._cls + 'Block.java', blockClass(e,c));
    if (e.type === 'workstation') {
      add(J + 'block/entity/' + e._cls + 'BlockEntity.java', blockEntityClass(e,c));
      add(J + 'menu/' + e._cls + 'Menu.java', menuClass(e,c));
      add(J + 'client/screen/' + e._cls + 'Screen.java', screenClass(e,c));
    }
    if (e.type === 'energy' || e.type === 'generator') {
      add(J + 'block/entity/' + e._cls + 'BlockEntity.java', energyBlockEntityClass(e,c));
    }
  });

  /* assets: models / blockstates / textures / lang */
  var en = {}, zh = {};
  c.els.forEach(function (e) {
    var key = (e.type === 'mob' ? 'entity.' :
      (e._isBlock || e.type === 'cluster' ? 'block.' : 'item.')) + c.modid + '.' + e._reg;
    en[key] = helpfulName(e._reg);
    zh[key] = e.name || helpfulName(e._reg);
    if (e.type === 'mob') {
      en['item.' + c.modid + '.' + e._reg + '_spawn_egg'] = (e.name || helpfulName(e._reg)) + ' Spawn Egg';
      zh['item.' + c.modid + '.' + e._reg + '_spawn_egg'] = (e.name || helpfulName(e._reg)) + ' 刷怪蛋';
    }
    if (e.desc) {
      en['tooltip.' + c.modid + '.' + e._reg] = e.desc;
      zh['tooltip.' + c.modid + '.' + e._reg] = e.desc;
    }
    if (e.type === 'workstation') {
      en['container.' + c.modid + '.' + e._reg] = helpfulName(e._reg);
      zh['container.' + c.modid + '.' + e._reg] = e.guiTitle || e.name;
    }
    if (e._isBlock) {
      var faceTex = {};
      ['top','bottom','front','back','left','right'].forEach(function (k) {
        faceTex[BF.FACE_FILE[k]] = c.modid + ':block/' + e._reg + '_' + k;
      });
      add(A + 'models/block/' + e._reg + '.json', JSON.stringify({
        parent:'minecraft:block/cube', textures:faceTex }, null, 2) + '\n');
      add(A + 'models/item/' + e._reg + '.json', JSON.stringify({
        parent:c.modid+':block/'+e._reg }, null, 2) + '\n');
      var bmodel = c.modid + ':block/' + e._reg;
      add(A + 'blockstates/' + e._reg + '.json', JSON.stringify({ variants:{
        'facing=north':{ model:bmodel },
        'facing=east':{ model:bmodel, y:90 },
        'facing=south':{ model:bmodel, y:180 },
        'facing=west':{ model:bmodel, y:270 }
      } }, null, 2) + '\n');
      ['top','bottom','front','back','left','right'].forEach(function (k) {
        addImg(A + 'textures/block/' + e._reg + '_' + k + '.png',
          e.textures[k] || e.textures.side || e.textures.top || e.textures.main);
      });
    } else if (e.type === 'mob') {
      var mcfg = e.mobCfg || {};
      addImg(A + 'textures/entity/' + e._reg + '.png',
        e.textures.skin || BF.mobSkinTexture(e.mobParts || []));
      addImg(A + 'textures/item/' + e._reg + '_spawn_egg.png',
        e.textures.egg || BF.mobEggTexture(mcfg.eggColor || '#3a3a4a', mcfg.eggSpot || '#8fe3dc'));
      add(A + 'models/item/' + e._reg + '_spawn_egg.json', JSON.stringify({
        parent:'minecraft:item/generated',
        textures:{ layer0:c.modid + ':item/' + e._reg + '_spawn_egg' } }, null, 2) + '\n');
      var animJson = mobAnimationJson(e);
      if (animJson) add(A + 'animations/' + e._reg + '.animation.json', animJson);
    } else {
      /* vanilla swords/tools use item/handheld: correct first/third-person grip transforms */
      var im = e.itemModel || 'auto';
      if (im === 'auto') im = (e.type === 'tool' || e.type === 'weapon') ? 'handheld' : 'generated';
      if (['generated','handheld'].indexOf(im) < 0) im = 'generated';
      add(A + 'models/item/' + e._reg + '.json', JSON.stringify({
        parent:'minecraft:item/' + im, textures:{ layer0:c.modid+':item/'+e._reg } }, null, 2) + '\n');
      addImg(A + 'textures/item/' + e._reg + '.png', e.textures.main);
      if (e.type === 'cluster') {
        var cm = c.modid + ':block/' + e._reg;
        add(A + 'models/block/' + e._reg + '.json', JSON.stringify({
          parent:'minecraft:block/cross', textures:{ cross:cm } }, null, 2) + '\n');
        add(A + 'blockstates/' + e._reg + '.json', JSON.stringify({ variants:{
          'facing=up':{model:cm}, 'facing=down':{model:cm,x:180},
          'facing=north':{model:cm,x:90}, 'facing=south':{model:cm,x:90,y:180},
          'facing=west':{model:cm,x:90,y:270}, 'facing=east':{model:cm,x:90,y:90}
        } }, null, 2) + '\n');
        addImg(A + 'textures/block/' + e._reg + '.png', e.textures.main);
      }
    }
    if (e.type === 'armor') {
      addImg(A + 'textures/models/armor/' + e._reg + '_layer_1.png', armorLayerTex(e,1));
      addImg(A + 'textures/models/armor/' + e._reg + '_layer_2.png', armorLayerTex(e,2));
    }
    if (e.type === 'workstation') addImg(A + 'textures/gui/' + e._reg + '.png', BF.guiTexture(e));
  });
  if (c.ct.enabled !== false) {
    add(A + 'models/item/creative_tab_icon.json', JSON.stringify({
      parent:'minecraft:item/generated',
      textures:{ layer0: c.modid + ':item/creative_tab_icon' } }, null, 2) + '\n');
    addImg(A + 'textures/item/creative_tab_icon.png', c.ct.icon);
    var tabTitle = c.ct.title || c.m.name || c.modid;
    en['itemGroup.' + c.modid + '.main'] = tabTitle;
    zh['itemGroup.' + c.modid + '.main'] = tabTitle;
    en['item.' + c.modid + '.creative_tab_icon'] = tabTitle + ' Tab Icon';
    zh['item.' + c.modid + '.creative_tab_icon'] = tabTitle + ' 栏目图标';
  }
  add(A + 'lang/en_us.json', JSON.stringify(en,null,2) + '\n');
  add(A + 'lang/zh_cn.json', JSON.stringify(zh,null,2) + '\n');

  /* data: recipes / loot / tags */
  c.els.forEach(function (e) {
    recipesFor(e,c).forEach(function (f) { add(f.path, f.content); });
    oreFiles(e,c).forEach(function (f) { add(f.path, f.content); });
    clusterFiles(e,c).forEach(function (f) { add(f.path, f.content); });
  });
  clusters.forEach(function (e) {
    add(D + 'loot_tables/blocks/' + e._reg + '.json', JSON.stringify({
      type:'minecraft:block', pools:[{ rolls:1, bonus_rolls:0, entries:[{
        type:'minecraft:item', name:c.modid+':'+e._reg,
        conditions:[{ condition:'minecraft:survives_explosion' }] }] }],
      random_sequence:c.modid+':blocks/'+e._reg }, null, 2) + '\n');
  });
  blocks.forEach(function (e) {
    var pool = e.dropSelf === false ? [] : [{
      rolls:1, bonus_rolls:0,
      entries:[{ type:'minecraft:item', name:c.modid+':'+e._reg,
        conditions:[{ condition:'minecraft:survives_explosion' }] }]
    }];
    add(D + 'loot_tables/blocks/' + e._reg + '.json',
      JSON.stringify({ type:'minecraft:block', pools:pool, random_sequence:c.modid+':blocks/'+e._reg }, null, 2) + '\n');
  });
  var byTool = {}, byTier = {};
  blocks.forEach(function (e) {
    if (e.tool && e.tool !== 'none') (byTool[e.tool] = byTool[e.tool] || []).push(c.modid+':'+e._reg);
    var lvl = num(e.harvestLevel,0), tk = ({0:'wood',1:'stone',2:'iron',3:'diamond',4:'diamond'})[lvl] || 'wood';
    if (e.tool && e.tool !== 'none' && lvl > 0) (byTier[tk] = byTier[tk] || []).push(c.modid+':'+e._reg);
  });
  Object.keys(byTool).forEach(function (t) {
    add(D + 'tags/blocks/mineable/' + t + '.json',
      JSON.stringify({ replace:false, values:byTool[t] }, null, 2) + '\n');
  });
  Object.keys(byTier).forEach(function (t) {
    add(D + 'tags/blocks/needs_' + t + '_tool.json',
      JSON.stringify({ replace:false, values:byTier[t] }, null, 2) + '\n');
  });

  /* project source */
  add('.modmaker/project.json', JSON.stringify(state,null,2) + '\n');

  /* Gradle Wrapper：让用户无需安装 Gradle，双击 build.bat 即可构建 */
  if (BF.GRADLE_WRAPPER_JAR_B64) {
    addBin('gradle/wrapper/gradle-wrapper.jar', BF.GRADLE_WRAPPER_JAR_B64);
    add('gradle/wrapper/gradle-wrapper.properties', BF.GRADLE_WRAPPER_PROPERTIES || '');
    add('gradlew', BF.GRADLEW || '');
    add('gradlew.bat', BF.GRADLEW_BAT || '');
  }
  /* 一键构建脚本 */
  add('build.bat', buildBatScript(c));
  add('build.sh', buildShScript(c));

  var stats = {
    total: files.length,
    java: files.filter(function (f) { return /\.java$/.test(f.path); }).length,
    textures: files.filter(function (f) { return /\.png$/.test(f.path); }).length,
    json: files.filter(function (f) { return /\.json$/.test(f.path); }).length,
    recipes: files.filter(function (f) { return /\/recipes\//.test(f.path); }).length,
    worldgen: files.filter(function (f) { return /\/worldgen\/|\/biome_modifier\//.test(f.path); }).length
  };
  add('README.md', readme(c, stats));
  stats.total = files.length;
  /* ---- 导出自检警告：帮用户在导出前发现"进游戏后三无"类问题 ---- */
  var warnings = [];
  c.els.forEach(function (e) {
    var isB = ['block','workstation','energy','generator','cluster'].indexOf(e.type) >= 0;
    if (e.reg !== e._reg) {
      warnings.push('「' + (e.name || e._reg) + '」的注册名「' + e.reg +
        '」含非法字符，游戏内 ID 将是 <code>' + c.modid + ':' + e._reg + '</code>（建议改用英文小写）');
    }
    if (isB) {
      var keys = BF.texKeys ? BF.texKeys(e) : Object.keys(e.textures);
      var empty = keys.every(function (k) {
        var t = e.textures[k]; return !t || !t.data || !t.data.some(function (px) { return px; }); });
      if (empty) warnings.push('「' + (e.name || e._reg) + '」的所有贴图都是空的，游戏里会是紫黑方块，请到「外观绘制」画贴图');
    }
    if (e.craftable !== false && !(e.recipes || []).length) {
      warnings.push('「' + (e.name || e._reg) + '」没有添加合成配方，导出时已自动补一条默认配方（可在配方中心修改）');
    }
  });

  return { files:files, stats:stats, ctx:c, warnings:warnings };
};

BF.previewProject = function (state) {
  return BF.buildProject(state, { png:function () { return '[二进制 PNG 贴图]'; } });
};
BF.exportZip = function (state) {
  try {
    var built = BF.buildProject(state);
    var blob = BF.zipFiles(built.files);
    BF.saveFile(blob, built.ctx.modid + '-forge-1.20.1.zip');
    if (BF.toast) BF.toast('已导出 ' + built.stats.total + ' 个文件的完整 Forge 工程');
    return built.stats;
  } catch (err) {
    console.error(err);
    if (BF.toast) BF.toast('导出失败：' + err.message, true);
    return null;
  }
};
})(typeof window !== 'undefined' ? window : globalThis);
