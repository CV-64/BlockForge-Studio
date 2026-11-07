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
node smoke.js          # 全量自检（794 条断言，0 FAIL 才算通过）
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
├── smoke.js                            无头冒烟测试（794 条断言）
├── demo-export.js                      导出全类型示例工程
├── probe.js / probe-visual.js          可视化探针（可选调试工具）
├── src/
│   ├── core.js       数据模型、项目库、贴图工具、Blockbench 解析
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
| 双击 `build.bat` 闪退 | 脚本是纯 ASCII + CRLF + goto 风格；若仍异常，在工程目录手动执行 `gradlew.bat build` 看完整报错 |
| 项目数据丢了 | 从「项目库 → 备份当前项目」导出的 `.mcmproj` 重新导入 |

---

## 版本与状态

- 目标平台：Minecraft Java 1.20.1 / Forge 47.3.0 / Java 17 / ForgeGradle 6.x / official mappings
- 生成器输出：`pack_format 15`，server data pack format 12
- 自检：794 条断言 0 失败；示例工程与空白模板均通过真实 `gradlew build`
- 最新改动（2026-11-07）：新增可编辑的独立创造模式物品栏与 jar 封面图

详细的架构说明、修复历史、待办与交接清单见 [项目交接索引.md](./项目交接索引.md)。
