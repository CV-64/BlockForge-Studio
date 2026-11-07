/* ============================================================
   BlockForge Studio — UI layer (v2)
   ============================================================ */
(function (root) {
'use strict';
var BF = root.BF;
var $ = function (s) { return document.querySelector(s); };
var esc = BF.esc;

var TABS = [
  { k:'paint',   l:'外观绘制' },
  { k:'props',   l:'功能属性' },
  { k:'ore',     l:'矿物生成', types:['block','workstation','energy','generator'] },
  { k:'power',   l:'能量网络', types:['energy','generator','workstation'] },
  { k:'cluster', l:'晶簇设置', types:['cluster'] },
  { k:'mob',     l:'生物建模', types:['mob'] },
  { k:'mobprops',l:'生物属性', types:['mob'] },
  { k:'tool',    l:'工具属性', types:['tool','weapon','armor','misc'] },
  { k:'effect',  l:'物品效果', types:['item','misc','tool','weapon','armor'] },
  { k:'recipe',  l:'合成配方' },
  { k:'gui',     l:'工作站界面', types:['workstation'] },
  { k:'recipes', l:'配方中心' },
  { k:'code',    l:'Java 预览' }
];
var RECIPE_TYPES = [
  {v:'crafting',l:'工作台合成'},{v:'smelting',l:'熔炉冶炼'},{v:'blasting',l:'高炉'},
  {v:'smoking',l:'烟熏炉'},{v:'campfire',l:'营火烹饪'},{v:'stonecutting',l:'切石机'}
];
var PAINT_TOOLS = [
  { g:'基础', items:[
    {k:'pencil',i:'✎',l:'铅笔'},{k:'eraser',i:'⌫',l:'橡皮'},
    {k:'fill',i:'▣',l:'填充'},{k:'picker',i:'◎',l:'吸管'},
    {k:'replace',i:'⇆',l:'换色'},{k:'spray',i:'⁂',l:'喷枪'},
    {k:'darken',i:'◐',l:'加深'},{k:'lighten',i:'◑',l:'减淡'} ]},
  { g:'形状', items:[
    {k:'line',i:'╱',l:'直线'},{k:'rect',i:'▭',l:'矩形'},
    {k:'fillrect',i:'■',l:'实心矩形'},{k:'ellipse',i:'◯',l:'椭圆'},
    {k:'gradient',i:'▤',l:'渐变'} ]},
  { g:'画布', items:[
    {k:'mirror',i:'⇄',l:'水平镜像'},{k:'flipV',i:'⇵',l:'垂直翻转'},
    {k:'rotate',i:'⟳',l:'旋转 90°'},{k:'invert',i:'◨',l:'反色'},
    {k:'noise',i:'▧',l:'噪点'},{k:'checker',i:'▦',l:'棋盘'},
    {k:'clear',i:'✕',l:'清空'} ]}
];
var SIDES = [['left','front'],['front','right'],['right','back'],['back','left']];

/* ================= top / sidebar ================= */
function renderHeader() {
  var meta = BF.state.meta, inp = $('#proj-name');
  if (inp && document.activeElement !== inp) inp.value = meta.name || '';
  renderLibMenu();
}
function renderLibMenu() {
  var m = $('#lib-menu'); if (!m) return;
  var list = BF.listProjects();
  m.innerHTML = '<div class="lm-head">项目库 · ' + list.length + ' 个项目</div>' +
    list.map(function (p) {
      return '<button data-lib="open" data-id="' + p.id + '" class="' +
        (p.id===BF.library.activeId?'lm-cur':'') + '">' +
        '<span>' + esc(p.name) + '</span><small>' + p.data.elements.length + ' 元素</small></button>';
    }).join('') + '<div class="lm-head" style="border-top:1px solid var(--line);margin-top:5px;padding-top:9px">操作</div>' +
    '<button data-lib="new">＋ 新建空白项目</button>' +
    '<button data-lib="manage">▦ 打开项目库管理</button>' +
    '<button data-lib="import">⇧ 导入 .mcmproj 项目</button>' +
    '<button data-lib="export">⇩ 备份当前项目</button>';
}
function renderSidebar() {
  var kw = ($('#elem-search').value || '').trim().toLowerCase();
  var html = '', total = 0;
  BF.TYPE_ORDER.forEach(function (type) {
    var t = BF.TYPES[type];
    var list = BF.state.elements.filter(function (e) {
      return e.type === type && (!kw || (e.name||'').toLowerCase().indexOf(kw)>=0 ||
        (e.reg||'').toLowerCase().indexOf(kw)>=0);
    });
    if (!list.length) return;
    total += list.length;
    html += '<div class="elem-group"><h4><span>' + t.icon + ' ' + t.label + '</span><span>' + list.length + '</span></h4>';
    list.forEach(function (e) {
      html += '<div class="elem-item' + (BF.state.selected===e.id && BF.state.view==='element' ? ' active' : '') +
        '" data-eid="' + e.id + '">' +
        '<span class="ico" style="color:' + t.color + '">' + t.icon + '</span>' +
        '<span class="nm">' + esc(e.name) + '<span class="rn">' + esc(BF.slug(e.reg)) + '</span></span>' +
        '<button class="del" data-del="' + e.id + '" title="删除元素">×</button></div>';
    });
    html += '</div>';
  });
  if (!total) html = '<div class="hint" style="padding:18px;text-align:center">没有匹配的元素<br><br>点击右上角「新建元素」开始创作</div>';
  $('#elem-list').innerHTML = html;
  $('#elem-count').textContent = BF.state.elements.length;
  var libBtn = $('#btn-library'), projBtn = $('#btn-project');
  libBtn.classList.toggle('active', BF.state.view === 'library');
  projBtn.classList.toggle('active', BF.state.view === 'project');
}
function renderHead() {
  var h = $('#ws-head');
  if (BF.state.view === 'library') {
    h.innerHTML = '<span class="title">项目库</span><span class="badge">' + BF.listProjects().length +
      ' 个项目</span><span class="spacer"></span>' +
      '<button class="btn btn-sm btn-primary" data-lib="new">＋ 新建空白项目</button>';
    return;
  }
  if (BF.state.view === 'project') {
    h.innerHTML = '<span class="title">模组信息 / 项目设置</span>' +
      '<span class="badge">MC ' + BF.MC_VERSION + ' · Forge ' + BF.FORGE_VERSION + '</span>' +
      '<span class="spacer"></span>' +
      '<button class="btn btn-sm" data-act="reset-project">恢复示例项目</button>';
    return;
  }
  var e = BF.cur();
  if (!e) { h.innerHTML = '<span class="title">未选择元素</span>'; return; }
  var t = BF.TYPES[e.type];
  h.innerHTML = '<span class="title">' + esc(e.name) + '</span>' +
    '<span class="badge" style="color:' + t.color + ';border-color:' + t.color + '">' + t.icon + ' ' + t.label + '</span>' +
    '<span class="reg">' + esc(BF.state.meta.modid) + ':' + esc(BF.slug(e.reg)) + '</span>' +
    '<span class="spacer"></span>' +
    '<button class="btn btn-sm" data-act="duplicate-element">复制元素</button>' +
    '<button class="btn btn-sm btn-danger" data-act="delete-element">删除</button>';
}
function visibleTabs(e) {
  if (BF.state.view === 'library') return [{k:'library',l:'项目库'}];
  if (BF.state.view === 'project') return [{k:'project',l:'模组信息'}];
  return TABS.filter(function (t) { return !t.types || (e && t.types.indexOf(e.type)>=0); });
}
function renderTabs() {
  var list = visibleTabs(BF.cur());
  if (!list.some(function (t) { return t.k === BF.state.tab; })) BF.state.tab = list[0].k;
  $('#tabs').innerHTML = list.map(function (t) {
    return '<button data-tab="' + t.k + '" class="' + (BF.state.tab===t.k?'active':'') + '">' + t.l + '</button>';
  }).join('');
}

/* ================= generic field helpers ================= */
function fieldHTML(d, e) {
  if (d.note) return '<div class="section-note">' + esc(d.note) + '</div>';
  var v = e[d.k], id = 'fld-' + d.k, common = 'data-field="' + d.k + '" id="' + id + '"';
  var inner = '';
  switch (d.t) {
    case 'text': inner = '<input type="text" ' + common + ' value="' + esc(v) + '" spellcheck="false">'; break;
    case 'textarea': inner = '<textarea ' + common + '>' + esc(v) + '</textarea>'; break;
    case 'number': inner = '<input type="number" ' + common + ' value="' + esc(v) + '"' +
      (d.min!=null?' min="'+d.min+'"':'') + (d.max!=null?' max="'+d.max+'"':'') +
      (d.step!=null?' step="'+d.step+'"':'') + '>'; break;
    case 'range': inner = '<input type="range" ' + common + ' value="' + esc(v) + '" min="' + d.min + '" max="' + d.max + '">' +
      '<span class="val" id="val-' + d.k + '">' + esc(v) + '</span>'; break;
    case 'select': inner = '<select ' + common + '>' + (d.o||[]).map(function (o) {
      return '<option value="' + esc(o.v) + '"' + (String(v)===String(o.v)?' selected':'') + '>' + esc(o.l) + '</option>';
    }).join('') + '</select>'; break;
    case 'check': return '<div class="field check"><input type="checkbox" ' + common + (v?' checked':'') +
      '><label for="' + id + '">' + esc(d.l) + '</label></div>';
    case 'color': inner = '<input type="color" ' + common + ' value="' + esc(v) + '">'; break;
    case 'ref': inner = '<button class="btn btn-sm" style="text-align:left" data-act="open-ref" data-field="' + d.k +
      '" data-ref="' + esc(v) + '">' + esc(BF.refLabel(v)) + ' ▾</button>'; break;
  }
  return '<div class="field"><label for="' + id + '">' + esc(d.l) +
    (d.help ? ' <span class="q" title="' + esc(d.help) + '">?</span>' : '') + '</label>' + inner + '</div>';
}
function fText(label, key, val, type, extra) {
  var custom = extra && /data-(field|ore|meta)=/.test(extra);
  var attr = custom ? '' : 'data-field="' + key + '"';
  return '<div class="field"><label>' + esc(label) + '</label><input type="' + (type||'text') +
    '" ' + attr + ' value="' + esc(val) + '" ' + (extra||'') + '></div>';
}
function fSelect(label, key, val, opts, attr) {
  return '<div class="field"><label>' + esc(label) + '</label><select ' + (attr||('data-field="'+key+'"')) + '>' +
    opts.map(function (o) {
      return '<option value="' + esc(o.v) + '"' + (String(val)===String(o.v)?' selected':'') + '>' + esc(o.l) + '</option>';
    }).join('') + '</select></div>';
}
function fCheck(label, key, val, attr) {
  return '<div class="field check"><input type="checkbox" ' + (attr||('data-field="'+key+'"')) +
    (val?' checked':'') + '><label>' + esc(label) + '</label></div>';
}
function fRef(label, key, val) {
  return '<div class="field"><label>' + esc(label) + '</label><button class="btn btn-sm" style="text-align:left" ' +
    'data-act="open-ref" data-field="' + key + '" data-ref="' + esc(val||'') + '">' +
    esc(BF.refLabel(val)) + ' ▾</button></div>';
}
function multiGrid(title, key, list, selected) {
  var sel = selected || [];
  return '<div class="panel-title"><span class="dot"></span>' + esc(title) + '</div><div class="multi-grid">' +
    list.map(function (o) {
      var on = sel.indexOf(o.v) >= 0;
      return '<label class="multi-item' + (on?' on':'') + '"><input type="checkbox" data-multi="' + key +
        '" data-v="' + esc(o.v) + '"' + (on?' checked':'') + '>' + esc(o.l) + '</label>';
    }).join('') + '</div>';
}
function propsPanel(e) {
  var defs = BF.FIELD_DEFS.filter(function (d) { return d.all || (d.types && d.types.indexOf(e.type)>=0); });
  var groups = {}, order = [];
  defs.forEach(function (d) { if (!groups[d.g]) { groups[d.g] = []; order.push(d.g); } groups[d.g].push(d); });
  return '<div class="card"><h3>功能属性编辑器 <span class="sub">所有数值都会写入生成的 Java 类与 JSON 数据文件</span></h3><div class="inner">' +
    order.map(function (g) {
      return '<div class="panel-title"><span class="dot"></span>' + esc(g) + '</div>' +
        '<div class="form-grid">' + groups[g].map(function (d) { return fieldHTML(d,e); }).join('') + '</div>' +
        '<div style="height:15px"></div>';
    }).join('') + '</div></div>';
}

/* ================= pixel panel ================= */
function currentTexKey(e) {
  var keys = BF.texKeys(e);
  if (!BF.state.texKey || keys.indexOf(BF.state.texKey) < 0) BF.state.texKey = keys[0];
  return BF.state.texKey;
}
function paintPanel(e) {
  var keys = BF.texKeys(e);
  var toolGroups = PAINT_TOOLS.map(function (g) {
    return '<div class="tool-group"><h5>' + g.g + '</h5><div class="paint-tools four">' +
      g.items.map(function (t) {
        var instant = ['mirror','flipV','rotate','invert','noise','checker','clear'].indexOf(t.k)>=0;
        return '<button class="tool-btn' + (!instant && BF.state.paintTool===t.k?' active':'') + '" ' +
          (instant ? 'data-act="paint-action" data-name="' + t.k + '"' : 'data-act="tool" data-tool="' + t.k + '"') +
          '><span class="ti">' + t.i + '</span>' + t.l + '</button>';
      }).join('') + '</div></div>';
  }).join('');
  var brush = BF.state.brushSize || 1, sym = BF.state.symmetry || 'none';
  return '<div class="paint-layout">' +
    '<div class="card"><h3>绘图工具 <span class="sub">' + BF.PALETTE.length + ' 色 · 对称绘制</span></h3><div class="inner">' +
      toolGroups +
      '<div class="tool-group"><h5>画笔大小</h5><div class="seg">' +
        [1,2,3,5].map(function (n) {
          return '<button data-act="brush" data-v="' + n + '" class="' + (brush===n?'active':'') + '">' + n + 'px</button>';
        }).join('') + '</div></div>' +
      '<div class="tool-group"><h5>对称绘制</h5><div class="seg">' +
        [['none','关闭'],['h','左右'],['v','上下'],['both','四向']].map(function (o) {
          return '<button data-act="sym" data-v="' + o[0] + '" class="' + (sym===o[0]?'active':'') + '">' + o[1] + '</button>';
        }).join('') + '</div></div>' +
      '<div class="field"><label>贴图分辨率</label><select data-act="texsize">' +
        [16,32,64].map(function (n) { return '<option value="'+n+'"'+(e.textures[currentTexKey(e)].w===n?' selected':'')+'>'+n+' × '+n+'</option>'; }).join('') +
      '</select></div>' +
      '<div class="mini-row"><button class="btn" data-act="undo">撤销</button><button class="btn" data-act="redo">重做</button>' +
        '<span class="hint" id="hist-label" style="align-self:center"></span></div>' +
      '<div class="mini-row">' +
        '<button class="btn" data-act="grid">网格</button>' +
        '<button class="btn" data-act="img-import">导入图片</button><button class="btn" data-act="img-export">导出 PNG</button>' +
      '</div>' +
      '<div class="tool-group" style="margin-top:10px"><h5>画布平移</h5><div class="seg">' +
        '<button data-act="paint-action" data-name="shift" data-arg="-1,0">←</button>' +
        '<button data-act="paint-action" data-name="shift" data-arg="1,0">→</button>' +
        '<button data-act="paint-action" data-name="shift" data-arg="0,-1">↑</button>' +
        '<button data-act="paint-action" data-name="shift" data-arg="0,1">↓</button>' +
      '</div></div>' +
      '<input type="file" id="paint-file" accept="image/*" hidden>' +
      '<div class="hint" style="margin-top:8px">左键用主色，右键用次色；右键空白处取次色。所有操作支持撤销。</div>' +
    '</div></div>' +

    '<div class="card"><h3>像素画布 <span class="sub" id="paint-sub"></span></h3><div class="inner">' +
      '<div class="tex-tabs">' + keys.map(function (k) {
        return '<button data-act="texkey" data-key="' + k + '" class="' + (currentTexKey(e)===k?'active':'') + '">' +
          '<span class="mini" id="mini-' + k + '"></span>' + BF.TEX_LABEL[k] + '</button>'; }).join('') + '</div>' +
      (keys.length > 1 ? '<div class="face-actions">' +
        '<button class="btn btn-sm" data-act="face-copy">复制当前面到其它 5 个面</button>' +
        '<button class="btn btn-sm" data-act="face-all">六面统一为当前面</button>' +
        '<span class="hint" style="align-self:center">面朝向按放置方向旋转（facing）</span></div>' : '') +
      '<div class="paint-canvas-wrap"><canvas id="paint-canvas" width="336" height="336"></canvas>' +
        '<div class="zoom-row">缩放 <input type="range" data-act="zoom" min="6" max="34" value="20"><span id="zoom-label">20×</span></div>' +
      '</div></div></div>' +

    '<div class="card"><h3>调色板</h3><div class="inner">' +
      '<div class="swatches eight" id="swatches">' + BF.PALETTE.map(function (c) {
        return '<div class="swatch' + (BF.state.paintColor===c?' active':'') + '" data-act="swatch" data-color="' + c +
          '" style="background:' + c + '" title="' + c + '"></div>'; }).join('') + '</div>' +
      '<div class="color-row"><input type="color" id="custom-color" value="' + esc(BF.state.paintColor) + '">' +
        '<input type="text" id="custom-hex" value="' + esc(BF.state.paintColor) + '" spellcheck="false"></div>' +
      '<div class="dual-color"><div class="box" id="secondary-box" style="background:' + esc(BF.state.paintSecondary||'#ffffff') +
        '" data-act="pick-secondary" title="点击设置次色"></div><small>主色 / 次色（右键使用）</small></div>' +
      '<div class="color-history" id="color-history"></div>' +
      '<div class="mini-slider">明度 <input type="range" id="adj-light" min="-50" max="50" value="0"><span id="light-label">0</span></div>' +
      '<div class="mini-slider">饱和 <input type="range" id="adj-sat" min="0" max="200" value="100"><span id="sat-label">1.0×</span></div>' +
      '<div class="mini-slider">色相 <input type="range" id="adj-hue" min="-50" max="50" value="0"><span id="hue-label">0</span></div>' +
      '<div class="mini-row"><button class="btn" data-act="apply-adjust">应用整体调色</button>' +
        '<button class="btn" data-act="add-color">加入调色板</button></div>' +
      '<div class="hint" style="margin-top:10px"><b style="color:var(--tx2)">六面贴图</b><br>' +
      '方块的 up/down/north/south/west/east 六面可独立绘制，导出时使用 minecraft:block/cube 模型；' +
      '透明像素保留 Alpha 通道。</div>' +
    '</div></div></div>';
}
function initPaint(e) {
  var canvas = $('#paint-canvas'); if (!canvas) return;
  BF.pe = new BF.PixelEditor(canvas, function () {
    BF.dirty(); BF.refreshPreview(); updateTexTabs(e);
  });
  BF.pe.tool = BF.state.paintTool || 'pencil';
  BF.pe.color = BF.state.paintColor || '#7ac74f';
  BF.pe.secondary = BF.state.paintSecondary || '#ffffff';
  BF.pe.brush = BF.state.brushSize || 1;
  BF.pe.symmetry = BF.state.symmetry || 'none';
  BF.pe.onHistory = function (u,r) {
    var l = $('#hist-label'); if (l) l.textContent = '可撤销 ' + u + ' 步 / 重做 ' + r + ' 步';
  };
  BF.pe.onPickColor = function (c) { selectColor(c); addHistory(c); };
  BF.pe.onPickSecondary = function (c) {
    BF.state.paintSecondary = c;
    var box = $('#secondary-box'); if (box) box.style.background = c;
    addHistory(c); BF.dirty();
  };
  BF.pe.load(e.textures[currentTexKey(e)]);
  var z = $('[data-act="zoom"]'); if (z) z.value = BF.pe.zoom;
  var zl = $('#zoom-label'); if (zl) zl.textContent = BF.pe.zoom + '×';
  BF.pe._hist();
  updateTexTabs(e); renderHistory(); renderFaceMinis(e);
}
function updateTexTabs(e) {
  var key = currentTexKey(e);
  var sub = $('#paint-sub');
  if (sub) sub.textContent = BF.TEX_LABEL[key] + ' · ' + e.textures[key].w + '×' + e.textures[key].h;
  renderFaceMinis(e);
}
function renderFaceMinis(e) {
  BF.texKeys(e).forEach(function (k) {
    var span = $('#mini-' + k); if (!span) return;
    span.style.background = '#222';
    var t = e.textures[k];
    if (!t) return;
    var c = BF.textureCanvas(t, 11);
    span.style.background = 'url(' + c.toDataURL('image/png') + ') center/contain no-repeat';
  });
}
function addHistory(c) {
  BF.state.colorHistory = BF.state.colorHistory || [];
  var h = BF.state.colorHistory.filter(function (x) { return x !== c; });
  h.unshift(c); BF.state.colorHistory = h.slice(0,16);
  renderHistory();
}
function renderHistory() {
  var box = $('#color-history'); if (!box) return;
  box.innerHTML = (BF.state.colorHistory||[]).map(function (c) {
    return '<div class="hist-dot" data-act="hist" data-color="' + c + '" style="background:' + c + '" title="' + c + '"></div>';
  }).join('');
}
function selectColor(c) {
  BF.state.paintColor = c;
  if (BF.pe) BF.pe.color = c;
  var cc = $('#custom-color'), hh = $('#custom-hex');
  if (cc) cc.value = c; if (hh) hh.value = c;
  document.querySelectorAll('.swatch').forEach(function (s) {
    s.classList.toggle('active', s.dataset.color.toLowerCase() === c.toLowerCase()); });
}

/* ================= ore panel ================= */
function orePanel(e) {
  var o = e.ore || BF.defaultOre();
  var dims = [{v:'overworld',l:'主世界 (is_overworld)'},{v:'nether',l:'下界 (is_nether)'},
    {v:'end',l:'末地 (is_end)'},{v:'all',l:'所有维度（生成 3 个 modifier）'}];
  var presets = Object.keys(BF.ORE_PRESETS).map(function (k) {
    return {v:k,l:({custom:'自定义 / 不套用',coal:'煤矿石',iron:'铁矿石',diamond:'钻石矿石',
      redstone:'红石矿石',quartz:'下界石英',debris:'远古残骸'})[k]};
  });
  var targets = (o.targets||[]);
  return '<div class="card"><h3>矿物生成配置 <span class="sub">参考 Minecraft 1.20.1 原版 OreFeature / PlacementUtils</span></h3><div class="inner">' +
    '<div class="switch-line"><input type="checkbox" data-ore="enabled" ' + (o.enabled?'checked':'') +
      '><div><b>启用自然生成</b><br><span>关闭后不导出 configured_feature / placed_feature / biome_modifier</span></div></div>' +
    '<div class="form-grid three">' +
      fSelect('原版风格预设', 'preset', o.preset||'custom', presets, 'data-act="ore-preset"') +
      fText('矿脉大小 (size)', 'size', o.size, 'number', 'data-ore="size" min="1" max="64"') +
      fText('每区块尝试次数 (count)', 'count', o.count, 'number', 'data-ore="count" min="1" max="256"') +
      fText('最低高度', 'minY', o.minY, 'number', 'data-ore="minY" min="-64" max="320"') +
      fText('最高高度', 'maxY', o.maxY, 'number', 'data-ore="maxY" min="-64" max="320"') +
      fSelect('高度分布', 'shape', o.shape||'uniform',
        [{v:'uniform',l:'均匀分布 uniform'},{v:'trapezoid',l:'梯形分布 trapezoid'}], 'data-ore="shape"') +
      fSelect('维度 / 生物群系', 'dimension', o.dimension||'overworld', dims, 'data-ore="dimension"') +
      fText('暴露空气丢弃概率 (0~1)', 'air', o.air, 'number', 'data-ore="air" min="0" max="1" step="0.05"') +
      fSelect('生成阶段 (step)', 'step', o.step||'underground_ores',
        [{v:'underground_ores',l:'underground_ores'},{v:'underground_decoration',l:'underground_decoration'},
         {v:'vegetal_decoration',l:'vegetal_decoration'},{v:'top_layer_modification',l:'top_layer_modification'}], 'data-ore="step"') +
    '</div>' +
    '<div class="panel-title" style="margin-top:16px"><span class="dot"></span>可被替换的方块（OreConfiguration.targets）</div>' +
    '<div class="multi-grid">' + BF.ORE_TARGETS.map(function (t) {
      var on = targets.indexOf(t.v)>=0;
      return '<label class="multi-item' + (on?' on':'') + '"><input type="checkbox" data-ore-target="' + t.v + '"' +
        (on?' checked':'') + '>' + esc(t.l) + '</label>';
    }).join('') + '</div>' +
    '<div class="api-note"><b>导出结构（对应原版类）</b><br>' +
    '<code>worldgen/configured_feature/' + esc(BF.slug(e.reg)) + '_ore.json</code> → <code>OreFeature</code> + <code>OreConfiguration</code>：' +
    '<code>TagMatchTest</code> / <code>BlockMatchTest</code>、<code>discard_chance_on_air_exposure</code><br>' +
    '<code>worldgen/placed_feature/…</code> → <code>CountPlacement</code> · <code>InSquarePlacement</code> · ' +
    '<code>HeightRangePlacement.uniform/trapezoid</code> · <code>BiomeFilter.biome()</code><br>' +
    '<code>forge/biome_modifier/…</code> → Forge <code>forge:add_features</code>（阶段 underground_ores）</div>' +
    '</div></div>';
}

/* ================= tool attributes panel ================= */
function toolPanel(e) {
  var eff = BF.MOB_EFFECTS.concat([{v:'fire',l:'点燃'},{v:'lightning',l:'召唤闪电'}]);
  return '<div class="card"><h3>工具 / 武器属性 <span class="sub">按原版 DiggerItem / SwordItem / Tier 的覆写方式生成 Java</span></h3><div class="inner">' +
    '<div class="form-grid">' +
      fSelect('不可破坏标签 (Tier)', 'incorrectTag', e.incorrectTag, BF.INCORRECT_TAGS) +
      fText('快速挖掘速度', 'fastSpeed', e.fastSpeed, 'number', 'data-field="fastSpeed" min="0" step="0.5"') +
      fSelect('挖掘等级', 'harvestLevel', e.harvestLevel,
        [0,1,2,3,4].map(function(n){ return {v:n,l:'等级 '+n}; })) +
      fText('击退力度 (hurtEnemy)', 'knockbackPower', e.knockbackPower, 'number', 'data-field="knockbackPower" min="0" max="5" step="0.1"') +
      fCheck('覆写属性修饰符 (getAttributeModifiers)', 'overrideAttributes', e.overrideAttributes) +
      fCheck('覆写正确工具判定 (isCorrectToolForDrops)', 'overrideCorrectTool', e.overrideCorrectTool) +
      fCheck('可附魔 (isEnchantable)', 'enchantable', e.enchantable) +
      fCheck('可修复 (isValidRepairItem)', 'repairable', e.repairable) +
      fRef('修复材料', 'repair', e.repair) +
    '</div>' +
    multiGrid('快速挖掘的方块标签 (getDestroySpeed)', 'fastTags', BF.FAST_TAGS, e.fastTags) +
    '<div style="height:12px"></div>' +
    multiGrid('支持的 ToolAction (canPerformAction)', 'toolActions', BF.TOOL_ACTIONS, e.toolActions) +
    '<div class="panel-title" style="margin-top:16px"><span class="dot"></span>命中效果 (hurtEnemy)</div>' +
    '<div class="form-grid three">' +
      fSelect('效果', 'effect', e.effect, eff) +
      fText('持续（秒）', 'effectSeconds', e.effectSeconds, 'number', 'data-field="effectSeconds" min="1"') +
      fText('效果等级', 'effectPower', e.effectPower, 'number', 'data-field="effectPower" min="0" max="5"') +
    '</div>' +
    '<div class="api-note"><b>与原版代码的对应关系</b><br>' +
    '· <code>getDestroySpeed(ItemStack, BlockState)</code> 代替 <code>DiggerItem</code> 的默认标签判断<br>' +
    '· <code>getAttributeModifiers</code> 用 <code>ImmutableMultimap</code> + <code>Attributes.ATTACK_DAMAGE/ATTACK_SPEED</code>，' +
    '与 <code>SwordItem</code> 同源<br>' +
    '· <code>Tier#getIncorrectBlocksForDrops()</code> 返回所选 <code>incorrect_for_*_tool</code> 标签<br>' +
    '· <code>canPerformAction</code> 使用 Forge <code>ToolActions</code>（剥皮 / 整平 / 耕地…）</div>' +
    '</div></div>';
}

/* ================= item effect panel ================= */
function effectPanel(e) {
  var anims = [{v:'none',l:'无（点击即触发）'},{v:'eat',l:'食用 EAT'},{v:'drink',l:'饮用 DRINK'},
    {v:'bow',l:'蓄力 BOW'},{v:'block',l:'格挡 BLOCK'},{v:'spear',l:'长矛 SPEAR'},
    {v:'crossbow',l:'弩 CROSSBOW'},{v:'spyglass',l:'望远镜 SPYGLASS'},
    {v:'toot_horn',l:'号角 TOOT_HORN'},{v:'brush',l:'刷子 BRUSH'}];
  return '<div class="card"><h3>物品效果 <span class="sub">use() / finishUsingItem() / inventoryTick() 由选项自动生成</span></h3><div class="inner">' +
    '<div class="form-grid three">' +
      fSelect('右键动作', 'rightClick', e.rightClick, BF.USE_ACTIONS) +
      fSelect('给予 / 携带状态效果', 'giveEffect', e.giveEffect, BF.MOB_EFFECTS) +
      fSelect('穿戴 / 携带效果 (inventoryTick)', 'armorEffect', e.armorEffect, BF.MOB_EFFECTS) +
      fText('效果持续（秒）', 'effectDuration', e.effectDuration, 'number', 'data-field="effectDuration" min="1"') +
      fText('效果等级', 'effectAmplifier', e.effectAmplifier, 'number', 'data-field="effectAmplifier" min="0" max="5"') +
      fText('冷却（刻）', 'useCooldown', e.useCooldown, 'number', 'data-field="useCooldown" min="0"') +
      fSelect('使用动画', 'useAnim', e.useAnim, anims) +
      fText('使用时长（刻）', 'useDuration', e.useDuration, 'number', 'data-field="useDuration" min="1"') +
      fText('每次使用损耗耐久', 'damageOnUse', e.damageOnUse, 'number', 'data-field="damageOnUse" min="0"') +
      fCheck('使用后消耗 1 个物品', 'consumeItem', e.consumeItem) +
      fCheck('可食用 (FoodProperties)', 'food', e.food) +
      fCheck('附魔光效', 'glow', e.glow) +
      fText('恢复饥饿值', 'hunger', e.hunger, 'number', 'data-field="hunger" min="0" max="20"') +
      fText('饱和度', 'saturation', e.saturation, 'number', 'data-field="saturation" min="0" step="0.1"') +
      fText('燃料燃烧时间（刻，0=不可燃烧）', 'fuelTime', e.fuelTime, 'number', 'data-field="fuelTime" min="0"') +
      fRef('合成后剩余物品（如桶）', 'craftingRemaining', e.craftingRemaining) +
    '</div>' +
    '<div class="api-note"><b>生成的方法</b><br>' +
    '· 设置了「使用动画」→ 生成 <code>use()</code> 调用 <code>startUsingItem</code>，' +
    '并在 <code>finishUsingItem()</code> 中给予药水效果 / 消耗 / 损耗耐久<br>' +
    '· 未设置使用动画 → <code>use()</code> 直接执行右键动作（治疗、瞬移、火球、闪电、经验、爆炸、雪球、音效…）<br>' +
    '· 「穿戴 / 携带效果」→ <code>inventoryTick()</code>；装备槽位会自动判断头盔/胸甲/护腿/靴子<br>' +
    '· 燃料 → <code>getBurnTime()</code>；剩余物 → <code>getCraftingRemainingItem()</code>；食物 → <code>FoodProperties</code></div>' +
    '</div></div>';
}

/* ================= recipe panel ================= */
function refThumb(ref, size) {
  var c = null;
  if (ref && ref.indexOf('elem:')===0) {
    var e = BF.get(ref.slice(5));
    if (e) {
      var t = e.textures.main || e.textures.top || e.textures.skin || e.textures.egg;
      if (t) c = BF.textureCanvas(t, size);
    }
  }
  if (!c) {
    c = document.createElement('canvas'); c.width=size; c.height=size;
    var cx = c.getContext('2d');
    cx.fillStyle='#2b323c'; cx.fillRect(0,0,size,size);
    cx.fillStyle='#7f8b9a'; cx.font='bold ' + Math.floor(size/3) + 'px monospace';
    cx.textAlign='center'; cx.textBaseline='middle';
    cx.fillText(BF.refLabel(ref).slice(0,3), size/2, size/2);
  }
  return c;
}
function recipePanel(e) {
  var rs = e.recipes || [];
  var idx = Math.min(BF.state.recipeIdx || 0, Math.max(0, rs.length-1));
  BF.state.recipeIdx = idx;
  var r = rs[idx];
  var html = '<div class="card"><h3>获取方式 / 合成配方 <span class="sub">生成的 JSON 位于 data/' +
    esc(BF.state.meta.modid) + '/recipes/</span></h3><div class="inner">' +
    '<div class="switch-line"><input type="checkbox" data-field="craftable" ' + (e.craftable!==false?'checked':'') +
      '><div><b>是否可合成</b><br><span>关闭后不生成该元素的任何配方 JSON（例如只能通过矿物生成获得的矿石），但仍可保留在创造模式标签。</span></div></div>' +
    '<div class="switch-line"><input type="checkbox" data-field="showInCreative" ' + (e.showInCreative!==false?'checked':'') +
      '><div><b>出现在创造模式标签</b><br><span>关闭后不会注册进 BuildCreativeModeTabContentsEvent。</span></div></div>';
  if (e.craftable === false) {
    html += '<div class="warn">此元素当前不可合成。勾选上方开关即可编辑并导出配方。</div></div></div>';
  } else {
    html += '<div class="recipe-list">' + rs.map(function (x,i) {
      return '<div class="recipe-chip' + (i===idx?' active':'') + '" data-act="recipe-sel" data-i="' + i + '">' +
        (RECIPE_TYPES.find(function(t){return t.v===x.type;})||{l:x.type}).l + ' #' + (i+1) +
        ' <span class="x" data-act="recipe-del" data-i="' + i + '">×</span></div>';
    }).join('') + '<button class="btn btn-sm" data-act="recipe-add">＋ 添加配方</button></div>';
    if (!r) {
      html += '<div class="hint">还没有配方。点击「添加配方」定义玩家如何获得这个元素，' +
        '或到「配方中心」一键补齐。</div>';
    } else {
      var isCook = ['smelting','blasting','smoking','campfire'].indexOf(r.type)>=0;
      var isSingle = isCook || r.type === 'stonecutting';
      html += '<div class="form-grid three" style="margin-bottom:14px">' +
        '<div class="field"><label>配方类型</label><select data-act="recipe-type">' +
          RECIPE_TYPES.map(function(t){ return '<option value="'+t.v+'"'+(r.type===t.v?' selected':'')+'>'+t.l+'</option>'; }).join('') +
        '</select></div>' +
        '<div class="field"><label>输出数量</label><input type="number" min="1" max="64" data-act="recipe-count" value="' + (r.count||1) + '"></div>' +
        (isCook ? '<div class="field"><label>耗时（刻）</label><input type="number" min="0" data-act="recipe-time" value="' + (r.time||200) + '"></div>' +
                  '<div class="field"><label>经验值</label><input type="number" step="0.1" min="0" data-act="recipe-xp" value="' + (r.xp||0.5) + '"></div>' : '') +
        (r.type==='crafting' ? '<div class="field check"><input type="checkbox" data-act="recipe-shapeless" ' +
          (r.shapeless?'checked':'') + '><label>无序合成（shapeless）</label></div>' : '') +
        '</div>';
      html += '<div class="craft-area"><div>' +
        '<div class="panel-title"><span class="dot"></span>' + (isSingle ? '输入材料（任意一格）' : '3 × 3 合成网格') + '</div>' +
        '<div class="craft-grid">' + (r.grid||[]).map(function (ref,i) {
          return '<div class="craft-slot" data-act="grid-cell" data-i="' + i + '" title="' + esc(BF.refLabel(ref)) + '">' +
            '<span class="clr">×</span></div>';
        }).join('') + '</div>' +
        '<div class="hint" style="margin-top:8px">点击格子选择物品；悬停右上角 × 可清空。</div>' +
        '</div><div class="arrow">➜</div>' +
        '<div><div class="panel-title"><span class="dot"></span>产物（当前元素）</div>' +
        '<div class="result-box"><div id="result-thumb"></div><small>× ' + (r.count||1) + '</small></div></div></div>';
    }
    html += '</div></div>';
  }
  if (e.type === 'workstation') {
    html += '<div class="card"><h3>工作站处理配方 <span class="sub">硬编码进 BlockEntity，运行时按输入槽自动处理</span></h3><div class="inner">';
    var srs = e.stationRecipes || [];
    if (!srs.length) html += '<div class="hint">暂无处理配方，点击下方添加。</div>';
    srs.forEach(function (sr, i) {
      html += '<div class="station-recipe"><span class="lbl">#' + (i+1) + '</span>' +
        '<button class="ref-btn" data-act="station-ref" data-i="' + i + '" data-k="a">' + esc(BF.refLabel(sr.a)) + '</button>' +
        '<input type="number" min="1" max="64" data-act="station-num" data-i="' + i + '" data-k="ca" value="' + (sr.ca||1) + '" title="数量">' +
        '<span class="lbl">＋</span>' +
        '<button class="ref-btn" data-act="station-ref" data-i="' + i + '" data-k="b">' + esc(BF.refLabel(sr.b)) + '</button>' +
        '<input type="number" min="1" max="64" data-act="station-num" data-i="' + i + '" data-k="cb" value="' + (sr.cb||1) + '" title="数量">' +
        '<span class="lbl">➜</span>' +
        '<button class="ref-btn" data-act="station-ref" data-i="' + i + '" data-k="out">' + esc(BF.refLabel(sr.out)) + '</button>' +
        '<input type="number" min="1" max="64" data-act="station-num" data-i="' + i + '" data-k="count" value="' + (sr.count||1) + '" title="产物数量">' +
        '<button class="btn btn-sm btn-danger" data-act="station-del" data-i="' + i + '">删除</button></div>';
    });
    html += '<div class="btn-row"><button class="btn btn-primary btn-sm" data-act="station-add">＋ 添加处理配方</button></div>' +
      '<div class="hint" style="margin-top:9px">输入 A 对应第 1 个输入槽，输入 B 对应第 2 个输入槽；留空表示该槽不需要物品。</div>' +
      '</div></div>';
  }
  return html;
}
function fillRecipeThumbs(e) {
  var r = (e.recipes||[])[BF.state.recipeIdx||0];
  if (!r) return;
  document.querySelectorAll('.craft-slot').forEach(function (el) {
    var i = +el.dataset.i, ref = r.grid[i];
    el.innerHTML = '<span class="clr">×</span>';
    if (ref) el.insertBefore(refThumb(ref, 44), el.firstChild);
    else { var s=document.createElement('span'); s.className='sname'; s.textContent='点击选择'; el.insertBefore(s,el.firstChild); }
  });
  var box = $('#result-thumb');
  if (box) { box.innerHTML=''; box.appendChild(refThumb('elem:'+e.id, 56)); }
}

/* ================= recipe center ================= */
function recipesPanel() {
  var rows = BF.state.elements.map(function (e) {
    var t = BF.TYPES[e.type];
    return '<div class="rec-row"><span class="ic" style="color:' + t.color + '">' + t.icon + '</span>' +
      '<span><b>' + esc(e.name) + '</b><br><small style="color:var(--tx3)">' + esc(BF.slug(e.reg)) + '</small></span>' +
      '<span>' + t.label + '</span>' +
      '<label title="是否可合成"><input type="checkbox" data-rec="craftable" data-id="' + e.id + '"' +
        (e.craftable!==false?' checked':'') + '></label>' +
      '<label title="创造模式可见"><input type="checkbox" data-rec="creative" data-id="' + e.id + '"' +
        (e.showInCreative!==false?' checked':'') + '></label>' +
      '<span>' + (e.recipes||[]).length + ' 条配方</span>' +
      '<span><button class="btn" data-rec="edit" data-id="' + e.id + '">编辑</button> ' +
        '<button class="btn" data-rec="add" data-id="' + e.id + '">补默认配方</button></span></div>';
  }).join('');
  return '<div class="card"><h3>配方中心 <span class="sub">统一管理所有元素的可合成性与默认配方</span></h3><div class="inner">' +
    '<div class="lib-toolbar">' +
      '<button class="btn btn-primary btn-sm" data-act="rec-fill">一键补齐所有缺失配方</button>' +
      '<button class="btn btn-sm" data-act="rec-all-on">全部设为可合成</button>' +
      '<button class="btn btn-sm" data-act="rec-all-off">全部设为不可合成</button>' +
      '<span class="sp"></span><span class="hint">共 ' + BF.state.elements.length + ' 个元素</span>' +
    '</div>' +
    '<div class="rec-table"><div class="rec-row head"><span></span><span>元素</span><span>类型</span>' +
      '<span>可合成</span><span>创造可见</span><span>配方数</span><span>操作</span></div>' + rows + '</div>' +
    '<div class="api-note" style="margin-top:12px">所有元素类型（方块、工作站、物品、杂项、工具、武器、装备）都支持合成配方。' +
    '新建元素时会自动附带一条默认配方；关闭「可合成」后导出工程不会包含该元素的配方 JSON。</div>' +
    '</div></div>';
}

/* ================= energy network / cluster / GUI paint ================= */
function cfgField(label, cfg, key, val, type, extra) {
  return '<div class="field"><label>' + esc(label) + '</label><input type="' + (type||'text') +
    '" data-cfg="' + cfg + '" data-key="' + key + '" value="' + esc(val) + '" ' + (extra||'') + '></div>';
}
function cfgCheck(label, cfg, key, val) {
  return '<div class="field check"><input type="checkbox" data-cfg="' + cfg + '" data-key="' + key +
    '"' + (val?' checked':'') + '><label>' + esc(label) + '</label></div>';
}
function cfgSelect(label, cfg, key, val, opts) {
  return '<div class="field"><label>' + esc(label) + '</label><select data-cfg="' + cfg +
    '" data-key="' + key + '">' + opts.map(function (o) {
      return '<option value="' + esc(o.v) + '"' + (String(val)===String(o.v)?' selected':'') + '>' + esc(o.l) + '</option>';
    }).join('') + '</select></div>';
}
function cfgRef(label, cfg, key, val) {
  return '<div class="field"><label>' + esc(label) + '</label><button class="btn btn-sm" style="text-align:left" ' +
    'data-act="open-cfg-ref" data-cfg="' + cfg + '" data-key="' + key + '">' + esc(BF.refLabel(val)) + ' ▾</button></div>';
}
function powerPanel(e) {
  var html = '<div class="card"><h3>能量网络 <span class="sub">Forge Energy (FE) · IEnergyStorage capability</span></h3><div class="inner">';
  if (e.type === 'workstation') {
    var s = e.stationEnergy || {};
    html += '<div class="switch-line"><input type="checkbox" data-cfg="stationEnergy" data-key="enabled"' +
      (s.enabled!==false?' checked':'') + '><div><b>工作站接受 / 输出能量</b><br>' +
      '<span>关闭后配方处理不消耗能量，GUI 也不显示能量条。</span></div></div>' +
      '<div class="form-grid three">' +
      cfgField('能量容量 (FE)','stationEnergy','capacity',s.capacity,'number','min="0"') +
      cfgField('最大输入 / 刻','stationEnergy','input',s.input,'number','min="0"') +
      cfgField('最大输出 / 刻','stationEnergy','output',s.output,'number','min="0"') +
      cfgField('每次配方消耗 FE','stationEnergy','cost',s.cost,'number','min="0"') +
      '</div>';
  } else if (e.type === 'energy') {
    var q = e.energyCfg || {};
    html += '<div class="form-grid three">' +
      cfgField('内部缓冲容量 (FE)','energyCfg','capacity',q.capacity,'number','min="0"') +
      cfgField('每刻传输量 (FE)','energyCfg','transfer',q.transfer,'number','min="0"') +
      cfgField('传输损耗（预留）','energyCfg','loss',q.loss,'number','min="0"') +
      '</div>';
  } else {
    var g = e.genCfg || {};
    html += '<div class="form-grid three">' +
      cfgField('能量容量 (FE)','genCfg','capacity',g.capacity,'number','min="0"') +
      cfgField('每刻产能 (FE)','genCfg','perTick',g.perTick,'number','min="0"') +
      cfgSelect('产能模式','genCfg','fuelMode',g.fuelMode,
        [{v:'none',l:'恒定产能'},{v:'daylight',l:'仅白天 / 可见天空'},{v:'burn',l:'消耗燃料物品'}]) +
      cfgField('燃烧周期（刻 / 个燃料）','genCfg','burnTicks',g.burnTicks,'number','min="1"') +
      cfgRef('燃料物品（容器内 1 格）','genCfg','fuel',g.fuel) +
      '</div>';
  }
  html += '<div class="api-note"><b>生成的 Java 结构</b><br>' +
    '· 三类方块都持有 <code>net.minecraftforge.energy.EnergyStorage</code>，' +
    '覆写 <code>getCapability(ForgeCapabilities.ENERGY, side)</code> 与 <code>invalidateCaps()</code><br>' +
    '· <code>ModEnergy.push()</code> 沿六个方向查找相邻 capability 并传输能量<br>' +
    '· 工作站 tick 检查 <code>ENERGY_COST</code> 后才推进进度；完成时扣除能量，' +
    '通过 4 槽 <code>ContainerData</code> 同步到客户端 GUI 能量条<br>' +
    '· 能量单位使用 Forge 通用的 FE，可与其它能量模组互联</div>';
  return html + '</div></div>';
}
function clusterPanel(e) {
  var q = e.clusterCfg || {};
  var dims = [{v:'overworld',l:'主世界'},{v:'nether',l:'下界'},{v:'end',l:'末地'},{v:'all',l:'所有维度'}];
  return '<div class="card"><h3>晶簇设置 <span class="sub">参考原版 AmethystClusterBlock 与紫水晶晶洞</span></h3><div class="inner">' +
    '<div class="switch-line"><input type="checkbox" data-cfg="clusterCfg" data-key="worldgen"' +
      (q.worldgen?' checked':'') + '><div><b>启用自然生成</b><br><span>在指定支撑方块表面的空气位置生成晶簇</span></div></div>' +
    '<div class="form-grid three">' +
      cfgRef('支撑方块（可附着 / 自然生成的母岩）','clusterCfg','support',q.support) +
      cfgField('发光等级','clusterCfg','light',q.light,'number','min="0" max="15"') +
      cfgField('每区块生成尝试','clusterCfg','count',q.count,'number','min="1"') +
      cfgField('最低高度','clusterCfg','minY',q.minY,'number','min="-64" max="320"') +
      cfgField('最高高度','clusterCfg','maxY',q.maxY,'number','min="-64" max="320"') +
      cfgSelect('维度','clusterCfg','dimension',q.dimension,dims) +
      cfgCheck('含水（预留）','clusterCfg','waterlogged',q.waterlogged) +
    '</div>' +
    '<div class="api-note"><b>与原版代码的对应关系</b><br>' +
    '· 方块：六向 <code>BlockStateProperties.FACING</code>、<code>canSurvive()</code> 检查支撑方块、' +
    '<code>updateShape()</code> 支撑消失即掉落、按方向返回 <code>VoxelShape</code><br>' +
    '· 模型：<code>minecraft:block/cross</code> 十字贴图 + blockstates 六向 x/y 旋转<br>' +
    '· 世界生成：自定义 Java <code>Feature&lt;NoneFeatureConfiguration&gt;</code>（对应原版晶洞在母岩上放置晶簇），' +
    '由 <code>ModFeatures</code> 注册，再由 configured_feature / placed_feature / biome_modifier 注入世界</div>' +
    '</div></div>';
}

/* ================= creature (mob) ================= */
var MOB_SKILLS = [
  {v:'lightning',l:'召唤闪电'},{v:'explode',l:'范围爆炸'},{v:'heal',l:'自我治疗'},
  {v:'poison',l:'使目标中毒'},{v:'wither',l:'施加凋零'},{v:'blind',l:'致盲目标'},
  {v:'fire',l:'点燃目标'},{v:'slow',l:'减缓目标'},{v:'invisible',l:'隐身'},
  {v:'knockup',l:'击飞目标'},{v:'aura',l:'光环：周围友军回血'}
];
function mobPartRow(p, i) {
  function num(key, val, step) {
    return '<td><input type="number" data-mob-part="' + key + '" data-i="' + i + '" value="' + val + '" step="' + (step||1) + '" style="width:52px"></td>';
  }
  return '<tr>' +
    '<td><input type="text" data-mob-part="name" data-i="' + i + '" value="' + esc(p.name) + '" style="width:92px"></td>' +
    num('px', p.pivot[0]) + num('py', p.pivot[1]) + num('pz', p.pivot[2]) +
    num('ox', p.offset[0]) + num('oy', p.offset[1]) + num('oz', p.offset[2]) +
    num('w', p.size[0]) + num('h', p.size[1]) + num('d', p.size[2]) +
    '<td><input type="color" data-mob-part="color" data-i="' + i + '" value="' + esc(p.color) + '" style="width:34px;height:24px;padding:0"></td>' +
    '<td><button class="btn btn-sm btn-danger" data-act="mob-part-del" data-i="' + i + '">×</button></td>' +
  '</tr>';
}
function keyframeUI(e) {
  var frames = e.mobFrames || [];
  var parts = (e.mobParts || []).map(function (p) { return p.name; });
  return '<div class="form-grid three">' +
    '<div class="field"><label>部件</label><select id="kf-part">' +
      parts.map(function (n) { return '<option value="' + esc(n) + '">' + esc(n) + '</option>'; }).join('') + '</select></div>' +
    '<div class="field"><label>时间（秒）</label><input id="kf-time" type="number" step="0.05" value="0"></div>' +
    '<div class="field"><label>绕 X 旋转（度）</label><input id="kf-rx" type="number" step="1" value="0"></div>' +
    '<div class="field"><label>绕 Y 旋转（度）</label><input id="kf-ry" type="number" step="1" value="0"></div>' +
    '<div class="field"><label>绕 Z 旋转（度）</label><input id="kf-rz" type="number" step="1" value="0"></div>' +
    '<div class="field"><label>时长（秒）</label><input id="kf-length" type="number" step="0.1" value="1"></div>' +
    '</div>' +
    '<div class="btn-row">' +
      '<button class="btn btn-sm" data-act="mob-kf-add">添加 / 更新关键帧</button>' +
      '<button class="btn btn-sm" data-act="mob-kf-walk">行走摆动预设</button>' +
      '<button class="btn btn-sm" data-act="mob-kf-clear">清空</button>' +
    '</div>' +
    '<div class="mini-row" style="margin-top:8px">' + (frames.length ? frames.map(function (f,i) {
      return '<span class="recipe-chip active" data-act="mob-kf-del" data-i="' + i + '">' + esc(f.part) +
        ' @' + f.t + 's (' + f.rx + '/' + f.ry + '/' + f.rz + ') <span class="x">×</span></span>';
    }).join('') : '<span class="hint">还没有关键帧；添加后会导出为 animations/' + esc(BF.slug(e.reg)) + '.animation.json</span>') + '</div>';
}
function mobPanel(e) {
  var parts = e.mobParts || [];
  return '<div class="card"><h3>生物建模 <span class="sub">部件式建模 · 原版 box UV 规则 · 皮肤与蛋贴图在「外观绘制」里绘制</span></h3><div class="inner">' +
    '<div class="split" style="grid-template-columns:minmax(0,1fr) 350px">' +
      '<div>' +
        '<div class="panel-title"><span class="dot"></span>部件列表（坐标以脚底为原点，向上为 +Y，实体朝 +Z）</div>' +
        '<div style="overflow-x:auto"><table class="mob-table"><thead><tr><th>名称</th><th>枢轴X</th><th>枢轴Y</th><th>枢轴Z</th>' +
        '<th>偏移X</th><th>偏移Y</th><th>偏移Z</th><th>宽</th><th>高</th><th>深</th><th>颜色</th><th></th></tr></thead><tbody>' +
        parts.map(mobPartRow).join('') + '</tbody></table></div>' +
        '<div class="btn-row">' +
          '<button class="btn btn-sm" data-act="mob-part-add">＋ 添加部件</button>' +
          '<button class="btn btn-sm" data-act="mob-skin-auto">按部件重新生成皮肤</button>' +
          '<button class="btn btn-sm" data-act="mob-parts-reset">恢复默认体型</button>' +
        '</div>' +
        '<div class="panel-title" style="margin-top:16px"><span class="dot"></span>关键帧动画</div>' +
        keyframeUI(e) +
      '</div>' +
      '<div>' +
        '<div class="panel-title"><span class="dot"></span>3D 预览（等距）</div>' +
        '<div class="gui-stage"><canvas id="mob-3d" width="340" height="300"></canvas></div>' +
        '<div class="panel-title" style="margin-top:14px"><span class="dot"></span>皮肤贴图 UV 布局</div>' +
        '<div class="gui-stage"><canvas id="mob-uv" width="340" height="340"></canvas></div>' +
      '</div>' +
    '</div>' +
    '<div class="api-note"><b>建模与贴图规则</b><br>' +
    '· 每个部件是一个长方体：<code>枢轴</code>是旋转中心，<code>偏移</code>是盒子相对枢轴的位置，<code>宽高深</code>是盒子尺寸。<br>' +
    '· 贴图按 Minecraft 原版 box UV 规则排布（每个立方体占 2×(深+宽) 宽、(深+高) 高的区域），' +
    '「按部件重新生成皮肤」会按当前部件尺寸与颜色重绘 64×64 皮肤，保证与导出的 texOffs 一致。<br>' +
    '· 生成的 Java 使用 <code>ModelPart</code> 树、<code>MeshDefinition</code> 与 <code>LayerDefinition</code>，' +
    '行走摆动 / 呼吸 / 攻击动画直接写在 <code>setupAnim</code> 里，关键帧动画另存为客户端动画 JSON。</div>' +
    '</div></div>';
}
function mobPropsPanel(e) {
  var c = e.mobCfg;
  var drops = c.drops || [], trades = c.trades || [];
  return '<div class="card"><h3>生物属性 <span class="sub">血量 / AI / 掉落 / 经验 / 交易 / 技能 / 外部导入</span></h3><div class="inner">' +
    '<div class="form-grid three">' +
      cfgField('最大生命值','mobCfg','health',c.health,'number','min="1"') +
      cfgSelect('血条形式','mobCfg','healthDisplay',c.healthDisplay,[
        {v:'normal',l:'普通血条'},{v:'boss',l:'顶部 Boss 血条'},{v:'always',l:'始终显示名称与血量'}]) +
      cfgCheck('是否为 Boss','mobCfg','boss',c.boss) +
      cfgCheck('友好生物（不主动攻击）','mobCfg','friendly',c.friendly) +
      cfgCheck('可驯服（喂食驯服）','mobCfg','tameable',c.tameable) +
      cfgField('实体缩放','mobCfg','scale',c.scale,'number','step="0.1" min="0.1"') +
      cfgSelect('生物分类','mobCfg','category',c.category,[
        {v:'MONSTER',l:'MONSTER 怪物'},{v:'CREATURE',l:'CREATURE 生物'},{v:'AMBIENT',l:'AMBIENT 环境'},
        {v:'AXOLOTLS',l:'AXOLOTLS 蝾螈'},{v:'MISC',l:'MISC 杂项'}]) +
      cfgField('攻击伤害','mobCfg','damage',c.damage,'number','step="0.5"') +
      cfgField('攻击速度','mobCfg','attackSpeed',c.attackSpeed,'number','step="0.1"') +
      cfgField('护甲值','mobCfg','armor',c.armor,'number') +
      cfgField('追踪范围','mobCfg','followRange',c.followRange,'number') +
      cfgField('击退强度','mobCfg','knockback',c.knockback,'number','step="0.1"') +
      cfgSelect('攻击方式','mobCfg','attack',c.attack,[
        {v:'melee',l:'近战冲撞'},{v:'ranged',l:'远程弹射'},{v:'bomb',l:'靠近后自爆'},{v:'summon',l:'召唤援军'}]) +
      (c.attack === 'ranged' ? cfgField('远程伤害','mobCfg','rangedDamage',c.rangedDamage,'number') +
        cfgField('射击间隔（刻）','mobCfg','rangedSpeed',c.rangedSpeed,'number') : '') +
      cfgField('掉落经验值','mobCfg','xp',c.xp,'number') +
      cfgSelect('经验球类型','mobCfg','xpType',c.xpType,[
        {v:'diamond',l:'钻石经验球'},{v:'emerald',l:'绿宝石经验球'},{v:'xp',l:'普通经验球'},{v:'xp_bottle',l:'附魔之瓶'}]) +
      cfgField('蛋壳颜色','mobCfg','eggColor',c.eggColor,'color') +
      cfgField('蛋壳斑点','mobCfg','eggSpot',c.eggSpot,'color') +
      cfgCheck('始终显示名称','mobCfg','showName',c.showName) +
    '</div>' +
    '<div class="panel-title" style="margin-top:16px"><span class="dot"></span>特殊技能</div>' +
    '<div class="multi-grid">' + MOB_SKILLS.map(function (s) {
      var on = (c.skills||[]).indexOf(s.v) >= 0;
      return '<label class="multi-item' + (on?' on':'') + '"><input type="checkbox" data-multi="mobCfg.skills" data-v="' + s.v + '"' +
        (on?' checked':'') + '>' + esc(s.l) + '</label>';
    }).join('') + '</div>' +
    '<div class="panel-title" style="margin-top:16px"><span class="dot"></span>掉落物</div>' +
    (drops.length ? drops.map(function (d,i) {
      return '<div class="station-recipe"><span class="lbl">#' + (i+1) + '</span>' +
        '<button class="ref-btn" data-act="mob-drop-ref" data-i="' + i + '" data-k="ref">' + esc(BF.refLabel(d.ref)) + '</button>' +
        '<input type="number" min="1" data-act="mob-drop-num" data-i="' + i + '" data-k="count" value="' + (d.count||1) + '" title="数量">' +
        '<span class="lbl">×</span>' +
        '<input type="number" min="0" max="1" step="0.05" data-act="mob-drop-num" data-i="' + i + '" data-k="chance" value="' + (d.chance!=null?d.chance:1) + '" title="概率">' +
        '<span class="lbl">概率</span>' +
        '<button class="btn btn-sm btn-danger" data-act="mob-drop-del" data-i="' + i + '">删除</button></div>';
    }).join('') : '<div class="hint">暂无掉落物。</div>') +
    '<div class="btn-row"><button class="btn btn-sm" data-act="mob-drop-add">＋ 添加掉落</button></div>' +
    '<div class="panel-title" style="margin-top:16px"><span class="dot"></span>交易内容（友好生物）</div>' +
    (trades.length ? trades.map(function (t,i) {
      return '<div class="station-recipe"><span class="lbl">#' + (i+1) + '</span>' +
        '<button class="ref-btn" data-act="mob-trade-ref" data-i="' + i + '" data-k="ref">' + esc(BF.refLabel(t.ref)) + '</button>' +
        '<input type="number" min="1" data-act="mob-trade-num" data-i="' + i + '" data-k="count" value="' + (t.count||1) + '" title="数量">' +
        '<span class="lbl">← 售价</span>' +
        '<button class="ref-btn" data-act="mob-trade-ref" data-i="' + i + '" data-k="price">' + esc(BF.refLabel(t.price)) + '</button>' +
        '<input type="number" min="1" data-act="mob-trade-num" data-i="' + i + '" data-k="pcount" value="' + (t.pcount||1) + '" title="价格数量">' +
        '<button class="btn btn-sm btn-danger" data-act="mob-trade-del" data-i="' + i + '">删除</button></div>';
    }).join('') : '<div class="hint">暂无交易条目。</div>') +
    '<div class="btn-row"><button class="btn btn-sm" data-act="mob-trade-add">＋ 添加交易</button></div>' +
    '<div class="panel-title" style="margin-top:16px"><span class="dot"></span>外部导入（Blockbench 等）</div>' +
    '<div class="hint" style="margin:-4px 0 10px">刷怪蛋的合成配方在「合成配方」标签页编辑（产物即刷怪蛋）。</div>' +
    '<div class="field"><label>导入文件（自动识别格式）</label>' +
      '<input type="file" id="mob-import-file" accept=".bbmodel,.java,.json" data-act="mob-import-file">' +
      '<div class="hint" style="margin-top:6px">支持三种文件：<br>' +
      '· <code>.bbmodel</code> —— 解析其中的长方体部件到部件表（组级嵌套会拍平到根），含动画时一并导入；' +
      '导入后 UV 布局会重排，建议点一次「按部件重新生成皮肤」<br>' +
      '· <code>.java</code> —— Blockbench「Java Entity」导出的模型代码，原样写入工程（优先级最高）<br>' +
      '· <code>.json</code> —— Blockbench 导出的动画文件，写入 assets 动画目录</div></div>' +
    '<div class="split">' +
      '<div class="field"><label>Blockbench 导出的 Java 模型代码（可选，将原样写入工程）</label>' +
        '<textarea data-mob-raw="model" rows="7">' + esc(e.mobModelRaw||'') + '</textarea></div>' +
      '<div class="field"><label>Blockbench 导出的动画 JSON（可选，写入 assets 动画目录）</label>' +
        '<textarea data-mob-raw="anim" rows="7">' + esc(e.mobAnimRaw||'') + '</textarea></div>' +
    '</div>' +
    '<div class="api-note"><b>生成内容</b><br>' +
    '· <code>entity/&lt;类名&gt;Entity.java</code>：AI 目标、攻击方式、技能、掉落、经验、交易、Boss 血条<br>' +
    '· <code>entity/model/&lt;类名&gt;Model.java</code>：由部件表生成的 ModelPart 树与 setupAnim 动画<br>' +
    '· <code>client/&lt;类名&gt;Renderer.java</code>：MobRenderer（注册模型层与渲染器）<br>' +
    '· <code>item/&lt;类名&gt;SpawnEgg.java</code>：ForgeSpawnEggItem，蛋贴图可自行绘制<br>' +
    '· <code>assets/&lt;modid&gt;/animations/&lt;注册名&gt;.animation.json</code>：关键帧动画（1.20.1 客户端格式）</div>' +
    '</div></div>';
}
/* Grab the procedural example GUI (slot recesses + player inventory) as a 176x166 pixel buffer.
   Used as the starting canvas so users edit the example UI instead of a blank slate. */
function proceduralGuiPixels(e) {
  var t = BF.guiTexture(e, true), d = new Array(176*166).fill(null);
  for (var y=0;y<166;y++) for (var x=0;x<176;x++) {
    d[y*176+x] = t.data[y*256+x] || null;
  }
  return { w:176, h:166, data:d };
}
var GUI_TOOLS = [
  {k:'pencil',i:'✎',l:'铅笔'},{k:'eraser',i:'⌫',l:'橡皮'},{k:'fill',i:'▣',l:'填充'},
  {k:'picker',i:'◎',l:'吸管'},{k:'line',i:'╱',l:'直线'},{k:'rect',i:'▭',l:'矩形'},
  {k:'fillrect',i:'■',l:'实心矩形'},{k:'ellipse',i:'◯',l:'椭圆'}
];
function guiPaintPanel(e) {
  return '<div class="card"><h3>GUI 背景绘制 <span class="sub">176 × 166 手绘贴图 · 默认直接基于示例界面修改</span></h3><div class="inner">' +
    '<div class="switch-line"><input type="checkbox" data-act="gui-paint-toggle"' + (e.guiPixels?' checked':'') +
      '><div><b>启用手绘背景</b><br><span>画板默认载入当前槽位布局生成的示例界面作为底稿，' +
      '可直接在其上改色、加装饰；关闭则回到自动布局。随时可「恢复为示例 UI」。</span></div></div>' +
    '<div class="gui-layout"><div class="gui-stage"><canvas id="gui-paint-canvas" width="352" height="332"></canvas></div>' +
    '<div><div class="panel-title"><span class="dot"></span>绘制工具</div>' +
      '<div class="paint-tools four">' + GUI_TOOLS.map(function (t) {
        return '<button class="tool-btn' + ((BF.state.guiPaintTool||'pencil')===t.k?' active':'') +
          '" data-act="gui-tool" data-tool="' + t.k + '"><span class="ti">' + t.i + '</span>' + t.l + '</button>';
      }).join('') + '</div>' +
      '<div class="panel-title" style="margin-top:12px"><span class="dot"></span>调色板</div>' +
      '<div class="swatches eight">' + BF.PALETTE.map(function (c) {
        return '<div class="swatch" data-act="gui-swatch" data-color="' + c + '" style="background:' + c + '" title="' + c + '"></div>';
      }).join('') + '</div>' +
      '<div class="color-row"><input type="color" id="gui-color" value="' + esc(BF.state.paintColor) + '"></div>' +
      '<div class="mini-row">' +
        '<button class="btn" data-act="gui-paint-import">恢复为示例 UI</button>' +
        '<button class="btn" data-act="gui-paint-clear">清空</button>' +
        '<button class="btn" data-act="gui-paint-undo">撤销</button>' +
        '<button class="btn" data-act="gui-paint-redo">重做</button>' +
      '</div>' +
      '<div class="hint" style="margin-top:10px">绘制区域对应 GUI 左上角 176×166。' +
      '打开本页即显示示例界面底稿，落笔后自动启用手绘；改动槽位布局后点「恢复为示例 UI」可重新取底稿。</div>' +
    '</div></div>' +
    '<div class="api-note">手绘像素保存为 <code>element.guiPixels</code>；导出时覆盖 GUI 纹理前 176×166，' +
    '纹理右侧 <code>u ≥ 176</code> 的进度箭头 / 火焰图集保持不变，供 <code>Screen#renderBg</code> blit 使用。' +
    '槽位坐标与 <code>Menu#addSlot</code> 一一对应，绘制槽位外观不会改变逻辑。</div>' +
    '</div></div>';
}
function initGuiPaint(e) {
  var canvas = $('#gui-paint-canvas'); if (!canvas) return;
  /* Scratch texture starts from the example UI, but opening the panel does NOT enable hand-drawing.
     The first stroke assigns it to e.guiPixels, so users are always editing the example layout. */
  var tex = e.guiPixels || proceduralGuiPixels(e);
  BF.gpe = new BF.PixelEditor(canvas, function () {
    if (!e.guiPixels) {
      e.guiPixels = tex;
      var cb = document.querySelector('[data-act="gui-paint-toggle"]');
      if (cb) cb.checked = true;
    }
    BF.dirty(); paintGuiBg(e); BF.refreshPreview();
  });
  BF.gpe.tool = BF.state.guiPaintTool || 'pencil';
  BF.gpe.color = BF.state.paintColor;
  BF.gpe.load(tex);
  BF.gpe.setZoom(2);
  BF.gpe.onPickColor = function (c) {
    BF.state.paintColor = c;
    var ci = $('#gui-color'); if (ci) ci.value = c;
  };
}

/* ================= GUI designer ================= */
function guiPanel(e) {
  return '<div class="card"><h3>工作站界面设计器 <span class="sub">176 × 166 标准容器 · 拖动槽位即可改变 Java 代码中的坐标</span></h3><div class="inner">' +
    '<div class="gui-layout"><div class="gui-stage"><div class="gui-wrap" id="gui-wrap">' +
      '<canvas id="gui-canvas" width="352" height="332"></canvas><div id="gui-slots"></div>' +
    '</div></div><div>' +
      '<div class="panel-title"><span class="dot"></span>槽位列表</div><div id="gui-slot-list"></div>' +
      '<div class="btn-row"><button class="btn btn-sm" data-act="gui-add" data-kind="input">＋ 输入槽</button>' +
        '<button class="btn btn-sm" data-act="gui-add" data-kind="output">＋ 输出槽</button>' +
        '<button class="btn btn-sm" data-act="gui-add" data-kind="fuel">＋ 燃料槽</button></div>' +
      '<div class="hint" style="margin-top:12px">输入槽最多 6 个；输出槽与燃料槽各 1 个。输出槽禁止放入物品。</div>' +
      '<div class="panel-title" style="margin-top:16px"><span class="dot"></span>界面参数</div>' +
      '<div class="form-grid">' +
        fText('界面标题','guiTitle',e.guiTitle,'text','data-field="guiTitle"') +
        fText('处理耗时（刻）','workTime',e.workTime,'number','data-field="workTime" min="0"') +
        fCheck('显示进度箭头','showProgress',e.showProgress) +
        fCheck('显示燃料火焰','showFuel',e.showFuel) +
      '</div></div></div></div></div>' + guiPaintPanel(e);
}
function paintGuiBg(e) {
  var canvas = $('#gui-canvas'); if (!canvas) return;
  var t = BF.guiTexture(e), scale = 2;
  canvas.width = 176*scale; canvas.height = 166*scale;
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0d1014'; ctx.fillRect(0,0,canvas.width,canvas.height);
  for (var y=0;y<166;y++) for (var x=0;x<176;x++) {
    var c = t.data[y*256+x];
    if (c) { ctx.fillStyle=c; ctx.fillRect(x*scale,y*scale,scale,scale); }
  }
}
function renderGuiSlots(e) {
  var wrap = $('#gui-slots'); if (!wrap) return;
  wrap.innerHTML = '';
  (e.ui.slots||[]).forEach(function (s,i) {
    var d = document.createElement('div');
    d.className = 'gui-slot ' + s.kind + (BF.state.guiSel===i?' sel':'');
    d.style.left = ((s.x-1)*2) + 'px'; d.style.top = ((s.y-1)*2) + 'px';
    d.innerHTML = '<span class="idx">' + i + '</span>' + ({input:'输入',output:'输出',fuel:'燃料'})[s.kind];
    d.dataset.i = i; wrap.appendChild(d); bindSlotDrag(e,d,i);
  });
  var list = $('#gui-slot-list');
  if (list) list.innerHTML = (e.ui.slots||[]).map(function (s,i) {
    return '<div class="slot-row"><span class="sp">#' + i + '</span>' +
      '<select data-act="gui-kind" data-i="' + i + '">' +
        [['input','输入'],['output','输出'],['fuel','燃料']].map(function(k){
          return '<option value="'+k[0]+'"'+(s.kind===k[0]?' selected':'')+'>'+k[1]+'</option>'; }).join('') +
      '</select><code>(' + s.x + ',' + s.y + ')</code>' +
      '<button class="btn btn-sm btn-danger" data-act="gui-del" data-i="' + i + '">×</button></div>';
  }).join('');
}
function bindSlotDrag(e, node, i) {
  var start = null;
  node.addEventListener('pointerdown', function (ev) {
    if (ev.target.tagName === 'SELECT') return;
    ev.preventDefault(); ev.stopPropagation();
    try { node.setPointerCapture(ev.pointerId); } catch (err) {}
    var s = e.ui.slots[i];
    start = { mx:ev.clientX, my:ev.clientY, x:s.x, y:s.y };
    BF.state.guiSel = i; BF.dirty();
  });
  node.addEventListener('pointermove', function (ev) {
    if (!start) return;
    var s = e.ui.slots[i];
    s.x = Math.max(4, Math.min(158, Math.round(start.x + (ev.clientX-start.mx)/2)));
    s.y = Math.max(4, Math.min(148, Math.round(start.y + (ev.clientY-start.my)/2)));
    node.style.left = ((s.x-1)*2)+'px'; node.style.top = ((s.y-1)*2)+'px';
  });
  node.addEventListener('pointerup', function () {
    if (!start) return;
    start = null; BF.dirty(); renderGuiSlots(e); BF.refreshPreview();
  });
}

/* ================= code preview ================= */
function codePanel() {
  return '<div class="code-layout"><div class="file-tree" id="file-tree"></div>' +
    '<div class="code-view"><div class="cv-head"><span id="cv-path">—</span><span class="sp"></span>' +
    '<button class="btn btn-sm" data-act="code-copy">复制</button>' +
    '<button class="btn btn-sm" data-act="code-download">下载此文件</button></div>' +
    '<div id="cv-body"><pre>正在生成工程文件…</pre></div></div></div>';
}
function renderCode() {
  var built = BF.previewProject(BF.state);
  BF._files = built.files; BF._stats = built.stats;
  var groups = {}, order = [];
  built.files.forEach(function (f,i) {
    var parts = f.path.split('/');
    var dir = parts.slice(0,-1).join('/').replace(built.ctx.root,'');
    if (!groups[dir]) { groups[dir] = []; order.push(dir); }
    groups[dir].push({ f:f, i:i, name:parts[parts.length-1] });
  });
  $('#file-tree').innerHTML = order.map(function (g) {
    return '<div class="dir">▸ ' + esc(g || '/') + '</div>' + groups[g].map(function (o) {
      return '<div class="file" data-act="code-file" data-i="' + o.i + '" title="' + esc(o.f.path) + '">' +
        esc(o.name) + '</div>'; }).join('');
  }).join('');
  showCodeFile(0);
}
function showCodeFile(i) {
  var f = BF._files[i]; if (!f) return;
  BF._codeSel = i;
  document.querySelectorAll('.file-tree .file').forEach(function (n) {
    n.classList.toggle('active', +n.dataset.i === i); });
  $('#cv-path').textContent = f.path;
  if (f.binary) {
    var e = BF.cur(), thumb = '', t = null;
    var m = /_(top|bottom|front|back|left|right)\.png$/.exec(f.path);
    if (e) {
      if (m) t = e.textures[m[1]];
      else if (/gui\//.test(f.path)) t = e.textures.front || e.textures.top;
      else if (/\/item\//.test(f.path)) t = e.textures.main;
      else t = e.textures.main || e.textures.top;
      if (t) {
        var c = BF.textureCanvas(t, 96);
        thumb = '<canvas id="bin-thumb" width="96" height="96"></canvas>';
        setTimeout(function () {
          var dst = $('#bin-thumb');
          if (dst) { var cx = dst.getContext('2d'); cx.imageSmoothingEnabled=false; cx.drawImage(c,0,0,96,96); }
        }, 0);
      }
    }
    $('#cv-body').innerHTML = '<div class="binary-note"><b>二进制 PNG 贴图</b>' + thumb +
      '导出时会把画布中的像素数据编码为真正的 PNG 文件。<br>此处仅预览内容。</div>';
  } else $('#cv-body').innerHTML = '<pre>' + esc(f.content) + '</pre>';
}

/* ================= project / library panels ================= */
function projectPanel() {
  var m = BF.state.meta, st = BF.previewProject(BF.state).stats;
  var p = BF.currentProject();
  return '<div class="card"><h3>模组基本信息 <span class="sub">当前项目：' + esc(p ? p.name : '') + '</span></h3><div class="inner">' +
    '<div class="form-grid">' +
      '<div class="field"><label>模组名称</label><input type="text" data-meta="name" value="' + esc(m.name) + '"></div>' +
      '<div class="field"><label>模组 ID (modid)</label><input type="text" data-meta="modid" value="' + esc(m.modid) + '" spellcheck="false"></div>' +
      '<div class="field"><label>版本号</label><input type="text" data-meta="version" value="' + esc(m.version) + '"></div>' +
      '<div class="field"><label>作者</label><input type="text" data-meta="author" value="' + esc(m.author) + '"></div>' +
      '<div class="field"><label>Java 包名</label><input type="text" data-meta="pkg" value="' + esc(m.pkg) + '" spellcheck="false"></div>' +
      '<div class="field"><label>许可证</label><input type="text" data-meta="license" value="' + esc(m.license) + '"></div>' +
      '<div class="field"><label>Minecraft 版本</label><input type="text" value="' + BF.MC_VERSION + '" disabled></div>' +
      '<div class="field"><label>Forge 版本</label><input type="text" value="' + BF.FORGE_VERSION + '" disabled></div>' +
    '</div>' +
    '<div class="field" style="margin-top:12px"><label>模组描述</label><textarea data-meta="description">' + esc(m.description) + '</textarea></div>' +
    '<div class="warn">modid 只能包含英文小写字母、数字与下划线。多个项目可各自拥有独立 modid；' +
      '所有项目都保存在浏览器本地，建议定期用「备份当前项目」导出 .mcmproj 文件。</div>' +
    '</div></div>' +
    '<div class="card"><h3>工程概览</h3><div class="inner">' +
      '<div class="export-stats"><div><b>' + st.java + '</b><small>Java 源文件</small></div>' +
      '<div><b>' + st.textures + '</b><small>PNG 贴图</small></div>' +
      '<div><b>' + st.json + '</b><small>JSON 配置</small></div></div>' +
      '<div class="export-stats"><div><b>' + BF.state.elements.length + '</b><small>元素总数</small></div>' +
      '<div><b>' + st.recipes + '</b><small>合成配方</small></div>' +
      '<div><b>' + st.worldgen + '</b><small>世界生成文件</small></div></div>' +
      '<div class="tagline"><span class="tag g">Java 17</span><span class="tag">ForgeGradle 6.x</span>' +
      '<span class="tag">official mappings</span><span class="tag y">pack_format 15</span></div>' +
      '<div class="btn-row"><button class="btn btn-accent" data-act="do-export">导出完整 Java 工程 (.zip)</button>' +
      '<button class="btn" data-act="do-save">备份当前项目 (.mcmproj)</button></div>' +
    '</div></div>' +
    brandPanel(m);
}
/* ================= brand editors: creative tab + jar cover ================= */
function brandCanvas(key, size, hint) {
  return '<div class="brand-editor">' +
    '<div class="brand-canvas-box"><canvas id="brand-' + key + '-canvas" title="点击或拖动绘制"></canvas></div>' +
    '<div class="brand-tools">' +
      '<div class="field"><label>画笔颜色</label><input type="color" data-brand-color="' + key + '" value="' +
        esc(BF.state.paintColor || '#7ac74f') + '"></div>' +
      '<div class="btn-row">' +
        '<button class="btn btn-sm" data-brand-act="clear" data-target="' + key + '">清空</button>' +
        '<button class="btn btn-sm" data-brand-act="reset" data-target="' + key + '">默认图案</button>' +
        '<button class="btn btn-sm" data-brand-act="copy" data-target="' + key + '">复制元素贴图</button>' +
        '<button class="btn btn-sm btn-primary" data-brand-act="upload" data-target="' + key + '">上传图片</button>' +
      '</div>' +
      '<input type="file" accept="image/*" id="brand-' + key + '-file" style="display:none">' +
      '<div class="hint">' + hint + '</div>' +
    '</div></div>';
}
function brandPanel(m) {
  var ct = m.creativeTab || (m.creativeTab = BF.defaultCreativeTab(m.name));
  return '<div class="card"><h3>创造模式物品栏 <span class="sub">独立 Tab · 图案与文字可编辑</span></h3><div class="inner">' +
    '<div class="form-grid">' +
      '<div class="field"><label>启用独立栏目</label><label class="brand-check">' +
        '<input type="checkbox" data-brand="enabled"' + (ct.enabled !== false ? ' checked' : '') +
        '><span>在创造模式背包中占据一个独立页签</span></label></div>' +
      '<div class="field"><label>栏目标题（游戏内显示文字）</label>' +
        '<input type="text" data-brand="title" value="' + esc(ct.title || '') + '"></div>' +
    '</div>' +
    '<div class="hint" style="margin:8px 0 12px">启用后本模组的所有物品集中显示在这个页签里；' +
      '关闭则按各元素的「创造栏分类」加入原版页签。标题与图标写进语言文件和物品模型，导出即可生效。</div>' +
    brandCanvas('tab', 16, '16×16 像素。导出为 <code>assets/&lt;modid&gt;/textures/item/creative_tab_icon.png</code>，' +
      '作为栏目按钮上的图案。上传任意图片会自动缩放。') +
    '</div></div>' +
    '<div class="card"><h3>模组封面图 <span class="sub">jar 内 pack.png · 可编辑</span></h3><div class="inner">' +
    '<div class="hint" style="margin:0 0 12px">这张图会打包到 jar 根目录的 <code>pack.png</code>，' +
      '并在 <code>mods.toml</code> 里声明为 <code>logoFile</code> —— ' +
      '资源包选择界面与 Forge 模组列表都会显示它。推荐 64×64 像素。</div>' +
    brandCanvas('pack', 64, '64×64 像素。导出为 jar 根目录的 <code>pack.png</code>。') +
    '</div></div>';
}
/* 每次渲染项目设置页后重新绑定画布（innerHTML 会重建 canvas 节点） */
BF.initBrandEditors = function () {
  if (!BF.PixelEditor) return;
  var m = BF.state.meta;
  var defs = [
    { key:'tab', get:function () { return m.creativeTab.icon; },
      reset:function () { return BF.defaultCreativeTabIcon(); } },
    { key:'pack', get:function () { return m.packIcon; },
      reset:function () { return BF.defaultPackIcon(); } }
  ];
  BF._brandEditors = {};
  defs.forEach(function (d) {
    var cv = document.getElementById('brand-' + d.key + '-canvas');
    if (!cv) return;
    var ed = new BF.PixelEditor(cv, function () { BF.dirty(); });
    ed.tool = 'pencil';
    ed.color = BF.state.paintColor || '#7ac74f';
    ed.load(d.get());
    BF._brandEditors[d.key] = ed;
    var color = document.querySelector('[data-brand-color="' + d.key + '"]');
    if (color) color.addEventListener('input', function () { ed.color = this.value; });
    var file = document.getElementById('brand-' + d.key + '-file');
    if (file) file.addEventListener('change', function () {
      if (!this.files[0]) return;
      ed.importImage(this.files[0], function () { BF.toast('图片已导入画布'); });
      this.value = '';
    });
  });
  var title = document.querySelector('[data-brand="title"]');
  if (title) title.addEventListener('input', function () {
    m.creativeTab.title = this.value; BF.dirty();
  });
  var enabled = document.querySelector('[data-brand="enabled"]');
  if (enabled) enabled.addEventListener('change', function () {
    m.creativeTab.enabled = this.checked; BF.dirty();
  });
  document.querySelectorAll('[data-brand-act]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.dataset.target, ed = BF._brandEditors[key];
      if (!ed) return;
      var act = btn.dataset.brandAct;
      if (act === 'upload') {
        var f = document.getElementById('brand-' + key + '-file');
        if (f) f.click();
        return;
      }
      if (act === 'clear') {
        ed.pushHistory(); ed.tex.data = new Array(ed.tex.w * ed.tex.h).fill(null);
      } else if (act === 'reset') {
        ed.pushHistory(); ed.tex.data = (key === 'tab' ? BF.defaultCreativeTabIcon() : BF.defaultPackIcon()).data;
      } else if (act === 'copy') {
        var e = BF.cur();
        var src = e && e.textures && (e.textures.main || e.textures.front || e.textures.top || e.textures.skin);
        if (!src || !Array.isArray(src.data)) { BF.toast('当前元素没有可复制的贴图', true); return; }
        var t = BF.resizeTex(src, ed.tex.w);
        ed.pushHistory(); ed.tex.data = t.data;
      }
      ed.render(); ed.onChange();
    });
  });
};
function libraryPanel() {
  var list = BF.listProjects();
  var cards = list.map(function (p) {
    var d = p.data, active = p.id === BF.library.activeId;
    var date = new Date(p.updated||Date.now()).toLocaleString('zh-CN');
    return '<div class="proj-card' + (active?' active':'') + '">' +
      '<h4>' + esc(p.name) + (active?'<span class="pill">当前项目</span>':'') + '</h4>' +
      '<div class="meta">modid: ' + esc(d.meta.modid) + '<br>包名: ' + esc(d.meta.pkg) +
      '<br>元素: ' + d.elements.length + ' 个 · 版本 ' + esc(d.meta.version || '1.0.0') +
      '<br>更新: ' + esc(date) + '</div>' +
      '<div class="acts">' +
        '<button class="btn btn-primary" data-lib="open" data-id="' + p.id + '">打开</button>' +
        '<button class="btn" data-lib="dup" data-id="' + p.id + '">复制</button>' +
        '<button class="btn" data-lib="rename" data-id="' + p.id + '">重命名</button>' +
        '<button class="btn" data-lib="export" data-id="' + p.id + '">导出</button>' +
        (list.length>1 ? '<button class="btn btn-danger" data-lib="del" data-id="' + p.id + '">删除</button>' : '') +
      '</div></div>';
  }).join('');
  return '<div class="card"><h3>项目库 <span class="sub">每个项目拥有独立的模组 ID、元素、贴图与配方，数据保存在浏览器本地</span></h3><div class="inner">' +
    '<div class="lib-toolbar">' +
      '<button class="btn btn-primary" data-lib="new">＋ 新建空白项目</button>' +
      '<button class="btn" data-lib="import">⇧ 导入 .mcmproj 项目</button>' +
      '<button class="btn" data-lib="template">＋ 从示例模板新建</button>' +
      '<span class="sp"></span><span class="hint">共 ' + list.length + ' 个项目</span>' +
    '</div><div class="proj-grid">' + cards + '</div>' +
    '<div class="api-note" style="margin-top:14px"><b>项目数据</b><br>' +
    '所有项目自动保存到浏览器 localStorage（键 <code>blockforge_library_v1</code>）。' +
    '「导出」会生成 <code>.mcmproj</code> 文件，可在其它电脑或浏览器中通过「导入」继续编辑；' +
    '删除项目不可撤销，请先导出备份。旧版单项目存档会自动迁移为项目库的第一个项目。</div>' +
    '</div></div>';
}

/* ================= panels orchestration ================= */
BF._renderedFor = null;
function buildPanels(e) {
  var panels = {
    paint:paintPanel(e), props:propsPanel(e), ore:orePanel(e),
    power:powerPanel(e), cluster:clusterPanel(e), tool:toolPanel(e),
    mob:mobPanel(e), mobprops:mobPropsPanel(e),
    effect:effectPanel(e), recipe:recipePanel(e), gui:guiPanel(e),
    recipes:recipesPanel(), code:codePanel()
  };
  $('#ws-content').innerHTML = visibleTabs(e).map(function (t) {
    return '<section class="tab-panel" id="tab-' + t.k + '">' + (panels[t.k] || '') + '</section>';
  }).join('') + '<section class="tab-panel" id="tab-project"></section><section class="tab-panel" id="tab-library"></section>';
  initPaint(e); fillRecipeThumbs(e);
  BF._renderedFor = e ? e.id : null;
}
function showTab(tab) {
  document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
  var p = $('#tab-' + tab); if (!p) p = $('#tab-paint');
  if (p) p.classList.add('active');
  document.querySelectorAll('#tabs button').forEach(function (b) {
    b.classList.toggle('active', b.dataset.tab === tab); });
  if (tab === 'paint' && BF.pe && BF.cur()) {
    BF.pe.load(BF.cur().textures[currentTexKey(BF.cur())], true);
    updateTexTabs(BF.cur());
  }
  if (tab === 'recipe' && BF.cur()) fillRecipeThumbs(BF.cur());
  if (tab === 'gui' && BF.cur()) {
    paintGuiBg(BF.cur()); renderGuiSlots(BF.cur()); initGuiPaint(BF.cur());
  }
  if (tab === 'mob' && BF.cur()) {
    var c3 = $('#mob-3d'); if (c3) drawMob3D(c3.getContext('2d'), BF.cur());
    var c4 = $('#mob-uv'); if (c4) drawMobUv(c4.getContext('2d'), BF.cur());
  }
  if (tab === 'code') renderCode();
  else BF.syncFields();
}
BF.renderAll = function () {
  renderHeader(); renderSidebar(); renderHead(); renderTabs();
  var c = $('#ws-content');
  if (BF.state.view === 'library') {
    c.innerHTML = '<section class="tab-panel active" id="tab-library">' + libraryPanel() + '</section>';
    BF._renderedFor = null;
  } else if (BF.state.view === 'project') {
    c.innerHTML = '<section class="tab-panel active" id="tab-project">' + projectPanel() + '</section>';
    BF._renderedFor = null;
    BF.initBrandEditors();
  } else if (!BF.cur()) {
    c.innerHTML = '<div class="empty"><div><div class="big">▣</div>选择或新建一个元素开始创作<br>' +
      '<span class="hint">支持方块、特殊工作站、物品、杂项物品、工具、武器与装备</span></div></div>';
    BF._renderedFor = null;
  } else {
    if (BF._renderedFor !== BF.cur().id) buildPanels(BF.cur());
    showTab(BF.state.tab);
  }
  BF.refreshPreview(); BF.renderFileList();
};
BF.rebuild = function () { BF._renderedFor = null; BF.renderAll(); };

/* ================= live preview ================= */
function quad(ctx, pts, color) {
  ctx.fillStyle = color; ctx.beginPath();
  ctx.moveTo(pts[0][0],pts[0][1]);
  for (var i=1;i<pts.length;i++) ctx.lineTo(pts[i][0],pts[i][1]);
  ctx.closePath(); ctx.fill();
}
function face(ctx, tex, A, U, V, cx0, cy0, shade) {
  var w=tex.w,h=tex.h;
  for (var j=0;j<h;j++) for (var i=0;i<w;i++) {
    var col=tex.data[j*w+i]; if (!col) continue;
    var u0=i/w,u1=(i+1)/w,v0=j/h,v1=(j+1)/h;
    function P(u,v){ return [cx0+A[0]+u*U[0]+v*V[0], cy0+A[1]+u*U[1]+v*V[1]]; }
    quad(ctx,[P(u0,v0),P(u1,v0),P(u1,v1),P(u0,v1)],BF.shade(col,shade));
  }
}
function drawIso(ctx, e, cx0, cy0, size) {
  var W=size*2,H=size,HH=size;
  var top=e.textures.top||e.textures.main||{w:16,h:16,data:[]};
  var r=(BF.state.previewFacing||0)%4, pair=SIDES[r];
  var leftT=e.textures[pair[0]]||top, rightT=e.textures[pair[1]]||top;
  var A=[0,-H/2],B=[W/2,0],C=[0,H/2],D=[-W/2,0];
  face(ctx,leftT,D,[C[0]-D[0],C[1]-D[1]],[0,HH],cx0,cy0,.72);
  face(ctx,rightT,C,[B[0]-C[0],B[1]-C[1]],[0,HH],cx0,cy0,.55);
  face(ctx,top,A,[B[0]-A[0],B[1]-A[1]],[D[0]-A[0],D[1]-A[1]],cx0,cy0,1);
  ctx.strokeStyle='rgba(0,0,0,.35)'; ctx.lineWidth=1; ctx.beginPath();
  ctx.moveTo(cx0+A[0],cy0+A[1]); ctx.lineTo(cx0+B[0],cy0+B[1]);
  ctx.lineTo(cx0+B[0],cy0+B[1]+HH); ctx.lineTo(cx0+C[0],cy0+C[1]+HH);
  ctx.lineTo(cx0+D[0],cy0+D[1]+HH); ctx.lineTo(cx0+D[0],cy0+D[1]);
  ctx.closePath(); ctx.stroke();
}
function drawTextureLarge(ctx, tex, x, y, px) {
  for (var j=0;j<tex.h;j++) for (var i=0;i<tex.w;i++) {
    var c=tex.data[j*tex.w+i]; if (c) { ctx.fillStyle=c; ctx.fillRect(x+i*px,y+j*px,px,px); }
  }
}
/* isometric preview of the creature part list */
function drawMob3D(ctx, e) {
  var W=340,H=300;
  ctx.clearRect(0,0,W,H);
  var parts=(e.mobParts||[]).slice().sort(function(a,b){
    return (a.pivot[0]+a.pivot[2])-(b.pivot[0]+b.pivot[2]); });
  var s=5.2;
  function P(x,y,z){ return [(x-z)*s+170, (x+z)*s*0.5-y*s+258]; }
  parts.forEach(function(p){
    var x0=p.pivot[0]+p.offset[0], y0=p.pivot[1]+p.offset[1], z0=p.pivot[2]+p.offset[2];
    var w=p.size[0],h=p.size[1],d=p.size[2],c=p.color||'#cccccc';
    var A=P(x0,y0+h,z0),B=P(x0+w,y0+h,z0),C=P(x0+w,y0+h,z0+d),D=P(x0,y0+h,z0+d);
    var E=P(x0,y0,z0),F=P(x0+w,y0,z0),G=P(x0+w,y0,z0+d),H=P(x0,y0,z0+d);
    quad(ctx,[F,G,C,B],BF.shade(c,0.74));
    quad(ctx,[E,F,B,A],BF.shade(c,0.9));
    quad(ctx,[A,B,C,D],BF.shade(c,1.0));
  });
}
/* texture preview with per-part UV boxes */
function drawMobUv(ctx, e) {
  var tex = e.textures.skin || BF.mobSkinTexture(e.mobParts||[]);
  var W=340,H=340;
  ctx.clearRect(0,0,W,H);
  var sc = Math.min(W/tex.w, H/tex.h);
  var ox = Math.floor((W-tex.w*sc)/2), oy = Math.floor((H-tex.h*sc)/2);
  for (var j=0;j<tex.h;j++) for (var i=0;i<tex.w;i++) {
    var c=tex.data[j*tex.w+i]; if (c) { ctx.fillStyle=c; ctx.fillRect(ox+i*sc,oy+j*sc,sc,sc); }
  }
  BF.mobUVLayout(e.mobParts||[]).forEach(function(L){
    ctx.strokeStyle='rgba(255,90,90,.9)'; ctx.lineWidth=1.5;
    ctx.strokeRect(ox+L.u*sc+1, oy+L.v*sc+1, 2*(L.d+L.w)*sc-2, (L.d+L.h)*sc-2);
    ctx.fillStyle='rgba(0,0,0,.65)'; ctx.fillRect(ox+L.u*sc, oy+L.v*sc-12, 62, 12);
    ctx.fillStyle='#ffe9a0'; ctx.font='9px monospace'; ctx.fillText(L.name, ox+L.u*sc+3, oy+L.v*sc-3);
  });
}
BF.refreshPreview = function () {
  var cv=$('#pv-canvas'); if (!cv) return;
  var ctx=cv.getContext('2d'); ctx.clearRect(0,0,300,300);
  var e=BF.cur(), rot=$('#pv-rotate');
  if (!e || BF.state.view!=='element') {
    $('#pv-type').textContent='—';
    $('#pv-hint').textContent='选择一个元素查看实时预览';
    $('#pv-info').innerHTML='<div class="hint">预览会随像素绘制与属性编辑实时刷新。</div>';
    if (rot) rot.innerHTML='';
    return;
  }
  var t=BF.TYPES[e.type];
  $('#pv-type').textContent=t.label;
  var isBlock=(['block','workstation','energy','generator'].indexOf(e.type)>=0);
  if (rot) {
    rot.innerHTML = isBlock ? '<span>朝向</span>' + ['北','东','南','西'].map(function (n,i) {
      return '<button data-act="rotate" data-v="' + i + '" class="' + ((BF.state.previewFacing||0)===i?'active':'') + '">' + n + '</button>';
    }).join('') : '';
  }
  if (isBlock) {
    $('#pv-hint').textContent='等距方块预览 · 六面贴图按朝向旋转';
    drawIso(ctx,e,150,118,62);
    if (e.type==='workstation') {
      var g=BF.guiTexture(e),sx=100,sy=218,sc=.5;
      ctx.fillStyle='rgba(0,0,0,.4)'; ctx.fillRect(sx-2,sy-2,92,87);
      for (var y=0;y<166;y++) for (var x=0;x<176;x++) {
        var c=g.data[y*256+x]; if (c) { ctx.fillStyle=c; ctx.fillRect(sx+x*sc,sy+y*sc,sc+.4,sc+.4); }
      }
    }
  } else {
    $('#pv-hint').textContent='物品图标预览 · 像素放大';
    var tex=e.textures.main||e.textures.skin||e.textures.egg||{w:16,h:16,data:[]};
    var px=Math.floor(190/tex.w),ox=Math.floor((300-tex.w*px)/2),oy=Math.floor((280-tex.h*px)/2);
    ctx.fillStyle='rgba(0,0,0,.35)'; ctx.fillRect(ox-8,oy-8,tex.w*px+16,tex.h*px+16);
    drawTextureLarge(ctx,tex,ox,oy,px);
    if (e.glow) { ctx.strokeStyle='rgba(168,135,232,.6)'; ctx.lineWidth=3;
      ctx.strokeRect(ox-6,oy-6,tex.w*px+12,tex.h*px+12); }
  }
  var main=e.textures.main||e.textures.top||e.textures.skin||e.textures.egg||{w:16,h:16};
  var rows=[
    ['注册名',BF.state.meta.modid+':'+BF.slug(e.reg)],
    ['贴图',main.w+'×'+main.h+(isBlock?' · 6 面':'')],
    ['可合成',e.craftable===false?'否':'是'],
    [e.type==='tool'||e.type==='weapon'?'耐久 / 伤害':e.type==='armor'?'防御 / 韧性':'硬度 / 发光',
      e.type==='tool'||e.type==='weapon'?(e.durability+' / '+e.damage):
      e.type==='armor'?(e.defense+' / '+e.toughness):(e.hardness+' / '+e.light)],
    ['配方',(e.recipes||[]).length+' 条'+(e.ore&&e.ore.enabled?' · 矿物生成':'')]
  ];
  $('#pv-info').innerHTML=rows.map(function(r){
    return '<div class="row"><span>'+esc(r[0])+'</span><span>'+esc(r[1])+'</span></div>'; }).join('');
};
BF.renderFileList = function () {
  var box=$('#pv-files'); if (!box) return;
  var built;
  try { built=BF.previewProject(BF.state); } catch (err) { box.textContent='工程生成失败：'+err.message; return; }
  box.innerHTML='<div style="margin-bottom:6px;color:var(--green)">共 '+built.stats.total+' 个文件 · '+
    built.stats.java+' 个 Java 类 · '+built.stats.textures+' 张贴图 · '+built.stats.worldgen+' 个世界生成文件</div>'+
    built.files.slice(0,26).map(function(f){
      return '<div class="f"><i>'+(f.binary?'IMG':' ')+'</i> '+esc(f.path.split('/').slice(-2).join('/'))+'</div>';
    }).join('')+(built.files.length>26?'<div class="f">… 其余 '+(built.files.length-26)+' 个文件</div>':'');
};

/* ================= ref picker ================= */
BF.closeRefPicker = function () { var p=$('.ref-picker'); if (p) p.remove(); };
function refOptions(kw) {
  var out=[];
  BF.state.elements.forEach(function(e){ out.push({g:'本模组元素',l:e.name+' ('+BF.slug(e.reg)+')',r:'elem:'+e.id}); });
  BF.VANILLA.forEach(function(v){ out.push({g:'原版常用物品',l:(BF.VANILLA_NAMES[v]||v)+' ('+v+')',r:v}); });
  if (kw) out=out.filter(function(o){ return (o.l+' '+o.r).toLowerCase().indexOf(kw)>=0; });
  return out;
}
BF.openRefPicker = function (anchor, current, cb) {
  BF.closeRefPicker();
  var div=document.createElement('div'); div.className='ref-picker';
  var rect=anchor.getBoundingClientRect();
  div.style.left=Math.max(8,Math.min(rect.left,window.innerWidth-262))+'px';
  div.style.top=Math.max(8,Math.min(rect.bottom+4,window.innerHeight-330))+'px';
  document.body.appendChild(div);
  function list(kw) {
    var opts=refOptions(kw),g='';
    var html='<input id="rp-search" placeholder="搜索物品…" value="'+esc(kw||'')+'">'+
      '<button data-r="__clear__">（清空 / 无物品）</button>'+
      '<button data-r="__custom__">使用自定义 ID：minecraft:xxx</button>';
    opts.slice(0,140).forEach(function(o){
      if (o.g!==g) { g=o.g; html+='<div class="grp">'+g+'</div>'; }
      html+='<button data-r="'+esc(o.r)+'"'+(o.r===current?' style="color:var(--green)"':'')+'>'+esc(o.l)+'</button>';
    });
    div.innerHTML=html;
    var search=div.querySelector('#rp-search');
    search.addEventListener('input',function(){
      var v=this.value.trim().toLowerCase(),pos=this.selectionStart;
      list(v); var ns=div.querySelector('#rp-search'); ns.focus(); ns.setSelectionRange(pos,pos);
    });
    div.querySelectorAll('button[data-r]').forEach(function(b){
      b.addEventListener('click',function(ev){
        ev.stopPropagation();
        var r=b.dataset.r;
        if (r==='__custom__') {
          var txt=(div.querySelector('#rp-search').value||'').trim();
          r=txt.indexOf(':')>0?txt:'minecraft:'+(txt||'air');
        }
        if (r==='__clear__') r=null;
        cb(r); BF.closeRefPicker();
      });
    });
  }
  list('');
  setTimeout(function(){
    document.addEventListener('pointerdown',function handler(ev){
      if (!div.contains(ev.target) && ev.target!==anchor) {
        BF.closeRefPicker(); document.removeEventListener('pointerdown',handler);
      }
    });
  },0);
};

/* ================= modal / prompt ================= */
BF.confirm = function (title, text, onYes) {
  var r=$('#modal-root');
  r.innerHTML='<div class="modal-mask"><div class="modal"><h3>'+esc(title)+'</h3>'+
    '<div class="mc hint" style="font-size:12px">'+text+'</div>'+
    '<div class="mf"><button class="btn" id="m-no">取消</button><button class="btn btn-primary" id="m-yes">确定</button></div></div></div>';
  $('#m-no').onclick=function(){ r.innerHTML=''; };
  $('#m-yes').onclick=function(){ r.innerHTML=''; onYes(); };
};
BF.prompt = function (title, fields, onOk) {
  var r=$('#modal-root');
  r.innerHTML='<div class="modal-mask"><div class="modal"><h3>'+esc(title)+'</h3><div class="mc">'+
    fields.map(function(f){ return '<div class="field"><label>'+esc(f.label)+'</label><input type="text" '+
      'data-prompt="'+esc(f.key)+'" value="'+esc(f.value||'')+'" spellcheck="false"></div>'; }).join('')+
    '</div><div class="mf"><button class="btn" id="p-no">取消</button><button class="btn btn-primary" id="p-yes">确定</button></div></div></div>';
  $('#p-no').onclick=function(){ r.innerHTML=''; };
  $('#p-yes').onclick=function(){
    var vals={};
    r.querySelectorAll('[data-prompt]').forEach(function(i){ vals[i.dataset.prompt]=i.value.trim(); });
    r.innerHTML=''; onOk(vals);
  };
  var first=r.querySelector('[data-prompt]'); if (first) { first.focus(); first.select(); }
};

/* public handles */
BF.renderSidebar=renderSidebar;
BF.showCodeFile=showCodeFile;
BF.paintGuiBg=paintGuiBg;
BF.renderGuiSlots=renderGuiSlots;
BF.fillRecipeThumbs=fillRecipeThumbs;
BF.renderLibMenu=renderLibMenu;
BF.proceduralGuiPixels=proceduralGuiPixels;
BF.drawMob3D=drawMob3D;
BF.drawMobUv=drawMobUv;
BF.refreshMobViews=function(e){
  var el = e || BF.cur(); if (!el) return;
  var c3 = $('#mob-3d'); if (c3) drawMob3D(c3.getContext('2d'), el);
  var c4 = $('#mob-uv'); if (c4) drawMobUv(c4.getContext('2d'), el);
};
BF.selectColor=selectColor;
BF.addHistory=addHistory;
BF.syncFields=function(){
  var e=BF.cur(); if (!e) return;
  document.querySelectorAll('[data-field]').forEach(function(el){
    var k=el.dataset.field,v=e[k];
    if (el.type==='checkbox') el.checked=!!v; else el.value=(v==null?'':v);
    var lab=$('#val-'+k); if (lab) lab.textContent=v;
  });
  document.querySelectorAll('[data-ore]').forEach(function(el){
    if (!e.ore) return;
    var k=el.dataset.ore,v=e.ore[k];
    if (el.type==='checkbox') el.checked=!!v; else el.value=(v==null?'':v);
  });
  document.querySelectorAll('[data-multi]').forEach(function(el){
    var arr=e[el.dataset.multi]||[];
    el.checked=arr.indexOf(el.dataset.v)>=0;
    el.parentNode.classList.toggle('on',el.checked);
  });
  document.querySelectorAll('[data-cfg]').forEach(function(el){
    var obj=e[el.dataset.cfg]||{}, v=obj[el.dataset.key];
    if (el.tagName==='BUTTON') return;
    if (el.type==='checkbox') el.checked=!!v; else el.value=(v==null?'':v);
  });
};
})(typeof window !== 'undefined' ? window : globalThis);
