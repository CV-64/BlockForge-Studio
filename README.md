# BlockForge Studio

一个**单文件、纯前端**的 Minecraft 模组可视化制作器。在浏览器里画像素、配方、模型与界面，一键导出可直接 `gradlew build` 的 **Minecraft 1.20.1 / Forge 47.3.0** Java 工程 ZIP。

> 打开 `index.html` 即可使用，无需安装、无需联网、无需后端。所有项目数据保存在浏览器本地存储，可随时导出 `.mcmproj` 备份。

---

## 能做什么

| 能力 | 说明 |
| --- | --- |
| 11 种元素 | 方块、特殊工作站、晶簇、能量导管、产能方块、物品、杂项物品、工具、武器、装备、生物 |
| 像素贴图编辑 | 六面贴图、72 色调色板、铅笔/填充/渐变/镜像/反色等工具，支持导入 PNG |
| 配方与数据 | 有序/无序合成、熔炼、战利品表、矿物生成（configured / placed feature / biome modifier） |
| 界面设计 | 工作站 GUI 背景可直接手绘，自动生成 Menu / Screen / BlockEntity |
| 生物建模 | 部件化建模 + 3D 预览，支持导入 Blockbench `.bbmodel` / `.java` / 动画 `.json` |
| **独立创造模式栏目** | 自定义 Tab，栏目文字与 16×16 图标图案可编辑，模组物品集中显示 |
| **模组封面图** | 可绘制/上传 64×64 `pack.png`，写入 `mods.toml` 的 `logoFile`，资源包与模组列表可见 |
| 语言与名称 | 自动生成中英文 `lang` 文件、方块/物品/容器名与提示文本 |
| 一键构建 | 导出包自带 Gradle Wrapper，Windows 双击 `build.bat`，Linux/macOS 运行 `build.sh` |

---

## 快速开始（使用制作器）

1. 用 Chrome / Edge 打开 `index.html`（**不要用 IE**）。
2. 左侧「项目库」新建项目 → 右上角「新建元素」选类型 → 在右侧标签页编辑属性、贴图、配方。
3. 点「模组信息」可设置名称、modid、作者，以及**创造模式栏目标题/图标**和**模组封面图**。
4. 点「导出完整 Java 工程 (.zip)」→ 解压 → 双击 `build.bat`（需 JDK 17）→ 得到 `build/libs/<modid>-1.0.0.jar`。
5. 把 jar 放进 `%APPDATA%\.minecraft\mods\`，用 Forge 1.20.1 启动。

完整图文步骤见 [使用教程.md](./使用教程.md)。导出 ZIP 内也自带一份 README，包含构建、安装、GitHub 分享说明。

---

## 开发 / 重建

源码按模块拆分在 `src/`，`build.js` 把它们内联进 `src/shell.html` 生成单文件 `index.html`。**改完源码必须重新构建**，直接编辑 `index.html` 会在下次构建时被覆盖。

```bash
node build.js          # 重建 index.html + 使用教程.md
node smoke.js          # 全量自检（906 条断言，0 FAIL 才算通过）
node demo-export.js    # 生成 starcraft-demo-forge-1.20.1.zip（全类型示例）
node tools/export-newmod.js newmod "新模组"   # 生成 newmod-forge-1.20.1.zip（空白模板）
```

本机使用的运行时：`C:/Users/cv64/.workbuddy/binaries/node/versions/22.22.2-6/node.exe`。

验证导出工程是否真能编译（建议每次改生成器后都做）：

```bash
# 解压 ZIP 到干净目录后，在工程根目录执行
gradlew.bat build --no-daemon --console=plain    # Windows
./gradlew build                                  # Linux / macOS
# 并且检查 jar 内路径必须是 assets/<modid>/... 与 data/<modid>/...
```

---

## 目录结构

```
minecraft-mod-maker/
├── index.html                          单文件成品（唯一需要分发的文件）
├── README.md                           本文件：项目介绍
├── 项目交接索引.md                      交接用技术档案（架构 / 坑 / 待办）
├── 使用教程.md                          面向最终用户的图文教程
├── build.js                            把 src/ 内联成 index.html
├── smoke.js                            无头冒烟测试（906 条断言）
├── demo-export.js                      导出全类型示例工程
├── probe.js / probe-visual.js          可视化探针（可选调试工具）
├── src/
│   ├── core.js       数据模型、项目库、贴图工具、Blockbench 解析
│   ├── vanilla.js    原版贴图模板库（80 物品 + 64 方块，自动生成）
│   ├── zip.js        ZIP 写入（CRC32 + 压缩）
│   ├── pixel.js      PixelEditor 像素画布、PNG 编码、图片导入
│   ├── usage.js      使用教程 Markdown 源
│   ├── wrapper.js    Gradle Wrapper 二进制（base64 内联资源）
│   ├── export.js     ★ 生成器：Java 源码 / 资源 / 配方 / 语言文件 / 构建脚本
│   ├── ui.js         界面渲染、项目设置面板、品牌编辑器
│   ├── app.js        事件层、动作分发、导入导出交互
│   ├── styles.css    样式
│   └── shell.html    HTML 外壳（@@CSS@@ / @@JS@@ 占位）
├── tools/export-newmod.js              导出空白模板工程
├── tools/extract-vanilla-textures.py   从本机 MC 客户端提取原版贴图 → src/vanilla.js
├── tools/patch-particle.js             给已导出的旧工程补挖掘粒子贴图（textures.particle）
├── wrapper/                            Gradle Wrapper 源资源
└── *-forge-1.20.1.zip                  已生成的示例工程包
```

---

## 导出工程的结构（重要）

生成器的资源路径必须是 Minecraft 认识的形式：

```
<modid>/
├── src/main/java/<pkg>/...             Java 源码
├── src/main/resources/
│   ├── META-INF/mods.toml               含 logoFile="pack.png"
│   ├── pack.mcmeta                      pack_format 15
│   └── pack.png                         ★ 可编辑封面图
├── assets/<modid>/                      ★ 必须带 assets/ 前缀
│   ├── lang/{en_us,zh_cn}.json
│   ├── textures/{block,item,gui,entity}/...
│   ├── models/{block,item}/...
│   └── blockstates/
├── data/<modid>/                        ★ 必须带 data/ 前缀
│   ├── recipes/  loot_tables/  worldgen/  forge/biome_modifier/
└── build.gradle / gradlew / build.bat / build.sh / README.md
```

`build.gradle` 用 `processResources { from("assets") { into "assets" } ... }` 把根目录的 `assets/`、`data/` **原样**并入资源集合。绝对不能写成 `srcDir "assets"`——那会丢掉前缀，导致贴图紫黑、名称显示 ID、配方消失（历史上踩过，详见交接索引）。

---

## 常见问题

| 现象 | 处理 |
| --- | --- |
| 改了源码但页面没变化 | 重新运行 `node build.js`，并**刷新/重开** `index.html`（旧页面内存里是旧代码） |
| 构建报错找不到 Java | 安装 JDK 17（Temurin），重开命令行再运行 `build.bat` |
| 游戏里贴图紫黑 / 名称显示 ID / 没有配方 | 检查 jar 内路径是否为 `assets/<modid>/...`；用最新 `index.html` 重新导出并清理 `.gradle/` 后重建 |
| **挖方块时飞出的粒子是紫黑乱码** | 模型缺 `textures.particle`（原版 `block/cube` 父模型不会自动给粒子贴图）。最新版本已自动写入 `assets/<modid>/models/block/<reg>.json` 的 `"particle": "#north"`；旧工程请重新导出 |
| 双击 `build.bat` 闪退 | 脚本是纯 ASCII + CRLF + goto 风格；若仍异常，在工程目录手动执行 `gradlew.bat build` 看完整报错 |
| 项目数据丢了 | 从「项目库 → 备份当前项目」导出的 `.mcmproj` 重新导入 |

---

## 生物模块（原版标准链路）

生物采用 Minecraft / Forge 官方链路，不依赖 GeckoLib 等第三方库：

- `ModEntities` 注册 `EntityType`；**`ModEntityAttributes` 在 `EntityAttributeCreationEvent` 里注册属性表**（缺它实体无法生成）
- `EntityModel` + `MeshDefinition` / `LayerDefinition` / `ModelPart`：部件坐标在导出时从 Blockbench 约定（y 向上、脚底 0）转换为原版约定（y 向下、地面 24）
- 皮肤贴图按原版 box UV 排布，尺寸随部件数量自动取 64/128/256，`texOffs` 与贴图严格对齐，不会取样越界变紫黑
- 行走 / 呼吸动画与**编辑器关键帧一起烘焙进 `setupAnim`**（原版不读取 `.animation.json`）；导入 `.bbmodel` 或动画 JSON 会自动转成关键帧
- 刷怪蛋可在「生物建模 → 刷怪蛋外观」或「外观绘制 → 刷怪蛋贴图」里绘制；动态染色设为白色，图案原样显示

> 几何请用 `.bbmodel` 导入；粘贴 Blockbench 的 Java 模型代码只作参考，不会写进工程（导出时会给出警告）。

---

## 护甲、封面与 3D 预览

- 装备元素有 **3 个可绘贴图**：`main`（16×16 物品图标）、`armor1`、`armor2`（各 64×32，按原版护甲 UV 模板绘制）。穿戴在身上时 Forge 读取 `assets/<modid>/textures/models/armor/<注册名>_layer_1|2.png`，直接采用编辑器里画的内容；旧项目会自动补齐这两层，改过画布尺寸也会自动缩放保住绘制。
- 生物默认模型是 **6 部件人形**（头 / 身 / 双臂 / 双腿，肩髋为旋转枢轴），自带 9 条待机关键帧；行走时腿与手臂反相摆动，关键帧烘焙进 `setupAnim`。
- 3D 预览对 6 个面统一做画家算法深度排序，不再出现断裂碎片。
- jar 封面输出在**根目录 `pack.png` 与 `assets/<modid>/pack.png` 两处**，并在 `mods.toml` 声明 `logoFile`。「模组信息 → 模组封面图」支持点击「导入封面图」或直接把 PNG/JPG 拖到画布上。

---

## 原版贴图模板 · 工作站配方 · 多方块核心

- **原版贴图模板**：绘制面板的「从原版模板开始」会打开模板库（80 张物品 / 64 张方块，来自你本机 Minecraft 安装，含中文名）。点击即可铺到画布上继续修改；也可以「导入自己的图片」或清空从零画。模板数据在 `src/vanilla.js`，可用 `python tools/extract-vanilla-textures.py` 从客户端 jar 重新提取。
- **工作站自定义配方**：每条处理配方独立配置三个输入（物品 + 数量）、产物、**能量消耗**与**处理时间**（tick）。同一个工作站可以挂任意多条互不相同的配方，运行时按输入槽自动匹配。
- **多方块核心**（新元素类型）：用「多方块结构」页定义相对核心的方块布局，再配置成型后执行的动作 —— 召唤生物、生成掉落物、给予 Buff、召唤闪电、执行指令、生成方块。支持「右键触发」与「放下即成型的自动触发」，可设置 Buff 半径与右键冷却。
- **生物模板与第三方建模**：内置 14 套原版生物骨架（僵尸/骷髅/苦力怕/蜘蛛/牛/猪/羊/鸡/狼/猫/村民/铁傀儡/末影人/蝙蝠），「生物建模 → 从原版生物模板开始」一键套用；也支持导入 `.bbmodel`、GeckoLib `.geo.json` 几何与动画 `.json`，导出仍是零依赖的原版 `EntityModel`。

---

## 版本与状态

- 目标平台：Minecraft Java 1.20.1 / Forge 47.3.0 / Java 17 / ForgeGradle 6.x / official mappings
- 生成器输出：`pack_format 15`，server data pack format 12
- 自检：**906 条断言 0 失败**；全类型示例、单生物+关键帧项目、空白模板均通过真实 `gradlew build`
- 最新改动（2026-11-16）：方块模型补 `textures.particle`（**挖掘粒子不再乱码**）；像素编辑器旋转不再写坏 64×32 等非正方形贴图；空材料格配方导出时跳过并提示（原版会拒绝）；右键道具的消耗/耐久只在服务端执行

详细的架构说明、修复历史、待办与交接清单见 [项目交接索引.md](./项目交接索引.md)。
