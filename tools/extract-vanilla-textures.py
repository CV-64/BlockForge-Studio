# -*- coding: utf-8 -*-
"""从本机 Minecraft 客户端 jar 提取原版物品/方块贴图，生成 src/vanilla.js。

用法：python tools/extract-vanilla-textures.py [客户端 jar 路径]
不传路径时自动在常见 .minecraft 目录里找 1.20.1 客户端 jar。

贴图仅作为编辑器里的「原版模板」供用户参考/二次创作，不随导出的模组分发。
"""
import base64
import glob
import io
import json
import os
import sys
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'src', 'vanilla.js')

ITEMS = """
iron_ingot gold_ingot copper_ingot netherite_ingot diamond emerald amethyst_shard quartz
lapis_lazuli redstone coal charcoal raw_iron raw_gold raw_copper iron_nugget gold_nugget
netherite_scrap echo_shard stick string feather flint leather rabbit_hide paper book
writable_book slime_ball gunpowder glowstone_dust blaze_powder blaze_rod ender_pearl
ender_eye ghast_tear magma_cream nether_star sugar wheat wheat_seeds bread apple
golden_apple carrot potato baked_potato beetroot melon_slice pumpkin_pie cookie egg bucket
water_bucket lava_bucket milk_bucket honeycomb honey_bottle experience_bottle fire_charge
name_tag saddle elytra trident bow arrow shield totem_of_undying compass clock shears
flint_and_steel fishing_rod iron_helmet iron_chestplate iron_leggings iron_boots
diamond_sword diamond_pickaxe diamond_axe diamond_shovel diamond_hoe golden_carrot
""".split()

BLOCKS = """
stone cobblestone mossy_cobblestone stone_bricks smooth_stone granite diorite andesite
deepslate dirt grass_block_top grass_block_side sand red_sand gravel clay oak_log
oak_log_top oak_planks oak_leaves spruce_log spruce_planks birch_log birch_planks
coal_ore iron_ore copper_ore gold_ore redstone_ore lapis_ore diamond_ore emerald_ore
deepslate_iron_ore deepslate_diamond_ore netherrack soul_sand soul_soil obsidian
crying_obsidian glowstone glass crafting_table_top crafting_table_front crafting_table_side
furnace_front furnace_top furnace_side blast_furnace_front chest_top chest_front chest_side
bookshelf iron_block gold_block diamond_block emerald_block netherite_block amethyst_block
amethyst_cluster calcite brick torch lantern soul_lantern iron_bars ladder water_still
lava_still
""".split()


def find_jar():
    roots = [
        r'C:/Users/cv64/Desktop/新建文件夹/.minecraft',
        r'G:/新建文件夹/PCL/.minecraft',
        os.path.expanduser('~/.minecraft'),
    ]
    pats = []
    for r in roots:
        if os.path.isdir(r):
            pats += [
                os.path.join(r, 'versions', '1.20.1*', '1.20.1*.jar'),
                os.path.join(r, 'versions', '1.20.1', '*.jar'),
            ]
    for pat in pats:
        for p in glob.glob(pat):
            try:
                with zipfile.ZipFile(p) as z:
                    if any(n.startswith('assets/minecraft/textures/item/') for n in z.namelist()):
                        return p
            except Exception:
                pass
    return None


def load_lang(z, name):
    try:
        raw = z.read('assets/minecraft/lang/%s.json' % name)
        return json.loads(raw.decode('utf-8'))
    except Exception:
        return {}


def main():
    jar = sys.argv[1] if len(sys.argv) > 1 else find_jar()
    if not jar or not os.path.isfile(jar):
        print('未找到 Minecraft 客户端 jar，请显式传入路径')
        return 1
    print('使用客户端:', jar)
    out = {'item': {}, 'block': {}, 'lang': {}}
    with zipfile.ZipFile(jar) as z:
        zh = load_lang(z, 'zh_cn')
        en = load_lang(z, 'en_us')
        for kind, names in (('item', ITEMS), ('block', BLOCKS)):
            folder = 'assets/minecraft/textures/%s/' % kind
            for name in names:
                path = folder + name + '.png'
                try:
                    data = z.read(path)
                except KeyError:
                    continue
                if not data.startswith(b'\x89PNG'):
                    continue
                out[kind][name] = base64.b64encode(data).decode('ascii')
                key = '%s.minecraft.%s' % (kind, name)
                label = zh.get(key) or en.get(key)
                if label:
                    out['lang'][key] = label
    total = len(out['item']) + len(out['block'])
    if total < 30:
        print('提取到的贴图太少（%d），请检查 jar 路径' % total)
        return 1

    def dump(obj, indent=0):
        pad = ' ' * indent
        lines = ['{']
        keys = list(obj.keys())
        for i, k in enumerate(keys):
            comma = ',' if i < len(keys) - 1 else ''
            v = obj[k]
            if isinstance(v, dict):
                lines.append('%s  %s: %s%s' % (pad, json.dumps(k, ensure_ascii=False), dump(v, indent + 2), comma))
            else:
                lines.append('%s  %s: %s%s' % (pad, json.dumps(k, ensure_ascii=False), json.dumps(v), comma))
        lines.append(pad + '}')
        return '\n'.join(lines)

    body = '\n'.join([
        '/* 自动生成，请勿手改：node tools/extract-vanilla-textures.py',
        '   数据来源：用户本机安装的 Minecraft %s 客户端（仅作为编辑器内的原版模板参考） */' % os.path.basename(jar),
        "(function (root) {",
        "  'use strict';",
        '  var BF = root.BF;',
        '  BF.VANILLA_TEXTURES = ' + dump(out) + ';',
        '  BF.VANILLA_KEYS = { item: ' + json.dumps(list(out['item'].keys())) + ', block: ' + json.dumps(list(out['block'].keys())) + ' };',
        '})(typeof window !== "undefined" ? window : globalThis);',
        '',
    ])
    with io.open(OUT, 'w', encoding='utf-8', newline='\n') as f:
        f.write(body)
    print('写入 %s：物品 %d 张，方块 %d 张，%d 字节' % (
        OUT, len(out['item']), len(out['block']), len(body.encode('utf-8'))))
    return 0


if __name__ == '__main__':
    sys.exit(main())
