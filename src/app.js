/* ============================================================
   BlockForge Studio — app bootstrap & event delegation (v2)
   ============================================================ */
(function (root) {
'use strict';
var BF = root.BF;
var $ = function (s) { return document.querySelector(s); };

function initMenu() {
  $('#add-menu').innerHTML = BF.TYPE_ORDER.map(function (t) {
    var m = BF.TYPES[t];
    return '<button data-new="' + t + '"><span class="di" style="color:' + m.color + '">' + m.icon +
      '</span><span>' + m.label + '<small>' + m.desc + '</small></span></button>';
  }).join('');
}
function materialRef() {
  var m = BF.state.elements.filter(function (e) { return e.type === 'item' || e.type === 'misc'; })[0];
  return m ? 'elem:' + m.id : 'minecraft:iron_ingot';
}
function newElement(type) {
  var e = BF.defaultElement(type);
  var n = BF.state.elements.filter(function (x) { return x.type===type; }).length + 1;
  e.name = BF.TYPES[type].label + ' ' + n;
  e.reg = type + '_' + n;
  var used = {}; BF.state.elements.forEach(function (x) { used[BF.slug(x.reg)] = 1; });
  while (used[BF.slug(e.reg)]) e.reg = type + '_' + (++n);
  e.recipes = [BF.defaultRecipeFor(e, materialRef())];
  BF.state.elements.push(e);
  BF.state.selected = e.id;
  BF.state.view = 'element';
  BF.state.tab = 'paint';
  BF.state.texKey = null;
  BF.state.recipeIdx = 0;
  BF.rebuild(); BF.dirty();
  BF.toast('已创建「' + e.name + '」，并附带一条默认合成配方');
  $('#add-menu').classList.remove('open');
}
function deleteElement(id) {
  var e = BF.get(id); if (!e) return;
  BF.confirm('删除元素', '确定删除「<b>' + BF.esc(e.name) + '</b>」吗？<br>相关配方引用会显示为「已删除元素」。<br><br>此操作不可撤销。', function () {
    BF.state.elements = BF.state.elements.filter(function (x) { return x.id !== id; });
    if (BF.state.selected === id) BF.state.selected = BF.state.elements.length ? BF.state.elements[0].id : null;
    BF.rebuild(); BF.dirty();
  });
}
function saveProjectFile() {
  BF.persist();
  BF.exportProjectFile(BF.library.activeId);
  BF.toast('当前项目已备份为 .mcmproj 文件');
}
function exportWithConfirm() {
  var prev = BF.previewProject(BF.state);
  var st = prev.stats;
  var html = '<div class="export-stats">' +
    '<div><b>' + st.java + '</b><small>Java 类</small></div>' +
    '<div><b>' + st.textures + '</b><small>PNG 贴图</small></div>' +
    '<div><b>' + st.total + '</b><small>总文件</small></div></div>' +
    '<div>将导出 <b>' + BF.esc(BF.state.meta.name) + '</b>（' + BF.esc(BF.state.meta.modid) +
    '）的完整 <b>Minecraft 1.20.1 / Forge 47.x</b> 源码工程：Java 类、六面模型、' +
    '矿物生成数据包、配方、战利品表、语言文件与全部贴图。</div>' +
    '<div class="warn">构建需 JDK 17；工程已自带 Gradle Wrapper 与一键构建脚本，' +
    'Windows 双击 <code>build.bat</code> 即可。详见压缩包内 README。</div>' +
    (BF.state.elements.length === 0 ?
      '<div class="warn">当前项目还没有任何元素，导出的是只有注册骨架的空模组。' +
      '可先点右上角「新建元素」添加内容。</div>' : '');
  /* 导出自检：把"进游戏后才发现"的问题提前暴露 */
  (prev.warnings || []).forEach(function (w) {
    html += '<div class="warn">⚠ ' + w + '</div>';
  });
  BF.confirm('导出 Forge Java 工程', html, function () { BF.exportZip(BF.state); });
}

/* ---------- project library ---------- */
function afterProjectChange(msg) {
  BF._renderedFor = null;
  BF.renderAll(); BF.persist();
  if (msg) BF.toast(msg);
}
function libAction(act, id) {
  switch (act) {
    case 'new':
      BF.prompt('新建空白项目（不含任何示例元素）', [
        {label:'项目名称',key:'name',value:'新模组'},
        {label:'模组 ID（英文小写、数字、下划线）',key:'modid',value:'newmod'}
      ], function (v) {
        BF.createProject(v.name || '新模组', v.modid || 'newmod');
        afterProjectChange('已创建空白项目，从右上角「新建元素」开始添加内容');
      });
      break;
    case 'template':
      BF.prompt('从示例模板新建项目', [
        {label:'项目名称',key:'name',value:'星辉工艺 副本'},
        {label:'模组 ID',key:'modid',value:'starcraft_copy'}
      ], function (v) {
        var name = v.name || '星辉工艺 副本', modid = v.modid || 'starcraft_copy';
        BF.createProject(name, modid, BF.defaultProject(name, modid));
        afterProjectChange('已从示例模板创建项目');
      });
      break;
    case 'open':
      if (id === BF.library.activeId) { afterProjectChange('已是当前项目'); break; }
      BF.switchProject(id);
      afterProjectChange('已切换到「' + BF.currentProject().name + '」');
      break;
    case 'dup': {
      var p = BF.duplicateProject(id);
      if (p) { BF.switchProject(p.id); afterProjectChange('已复制项目'); }
      break;
    }
    case 'rename': {
      var target = id || BF.library.activeId;
      var rec = BF.listProjects().filter(function (x) { return x.id === target; })[0];
      BF.prompt('重命名项目', [{label:'项目名称',key:'name',value:rec ? rec.name : ''}], function (v) {
        if (!v.name) return;
        BF.renameProject(target, v.name);
        afterProjectChange('项目已重命名');
      });
      break;
    }
    case 'export':
      BF.persist();
      BF.exportProjectFile(id || BF.library.activeId);
      BF.toast('项目文件已导出');
      break;
    case 'del': {
      var r = BF.listProjects().filter(function (x) { return x.id === id; })[0];
      BF.confirm('删除项目', '确定删除「<b>' + BF.esc(r ? r.name : '') + '</b>」及其全部元素吗？<br>' +
        '建议先点「导出」备份为 .mcmproj。<br><br>此操作不可撤销。', function () {
        if (BF.deleteProject(id)) afterProjectChange('项目已删除');
        else BF.toast('至少需要保留一个项目', true);
      });
      break;
    }
    case 'import': $('#file-import').click(); break;
    case 'manage':
      BF.state.view = 'library'; BF.state.tab = 'library';
      afterProjectChange();
      break;
  }
}

/* ---------- field input ---------- */
function numVal(el) {
  if (el.type === 'checkbox') return el.checked;
  if (el.type === 'number' || el.type === 'range') return Number(el.value);
  return el.value;
}
function onFieldChange(el) {
  var e = BF.cur();
  /* nested config objects: energyCfg / genCfg / clusterCfg / stationEnergy */
  if (el.dataset.cfg && e) {
    var obj = e[el.dataset.cfg] || (e[el.dataset.cfg] = {});
    obj[el.dataset.key] = numVal(el);
    BF.dirty(); BF.renderFileList(); return;
  }
  /* recipe center */
  if (el.dataset.rec && el.dataset.id) {
    var target = BF.get(el.dataset.id);
    if (target) {
      if (el.dataset.rec === 'craftable') target.craftable = el.checked;
      if (el.dataset.rec === 'creative') target.showInCreative = el.checked;
      BF.dirty(); BF.renderFileList();
    }
    return;
  }
  /* ore target array */
  if (el.dataset.oreTarget && e) {
    if (!e.ore) e.ore = BF.defaultOre();
    e.ore.targets = e.ore.targets || [];
    var t = el.dataset.oreTarget, idx = e.ore.targets.indexOf(t);
    if (el.checked && idx < 0) e.ore.targets.push(t);
    if (!el.checked && idx >= 0) e.ore.targets.splice(idx,1);
    el.parentNode.classList.toggle('on', el.checked);
    BF.dirty(); BF.renderFileList(); return;
  }
  /* generic array field (supports dotted paths like mobCfg.skills) */
  if (el.dataset.multi && e) {
    var key = el.dataset.multi, v = el.dataset.v;
    var mpath = key.split('.'), mobj = e;
    for (var mi=0; mi<mpath.length-1; mi++) mobj = mobj[mpath[mi]] || (mobj[mpath[mi]] = {});
    var arr = mobj[mpath[mpath.length-1]] || (mobj[mpath[mpath.length-1]] = []);
    var i = arr.indexOf(v);
    if (el.checked && i < 0) arr.push(v);
    if (!el.checked && i >= 0) arr.splice(i,1);
    el.parentNode.classList.toggle('on', el.checked);
    BF.dirty(); BF.renderFileList(); return;
  }
  /* creature part editor */
  if (el.dataset.mobPart && e) {
    var mpart = (e.mobParts||[])[+el.dataset.i]; if (!mpart) return;
    var pk = el.dataset.mobPart;
    if (pk === 'name') mpart.name = el.value;
    else if (pk === 'color') mpart.color = el.value;
    else if (pk === 'px' || pk === 'py' || pk === 'pz') mpart.pivot[['px','py','pz'].indexOf(pk)] = Number(el.value)||0;
    else if (pk === 'ox' || pk === 'oy' || pk === 'oz') mpart.offset[['ox','oy','oz'].indexOf(pk)] = Number(el.value)||0;
    else if (pk === 'w' || pk === 'h' || pk === 'd') mpart.size[['w','h','d'].indexOf(pk)] = Math.max(1, Number(el.value)||1);
    BF.dirty(); BF.refreshMobViews(e);
    return;
  }
  if (el.dataset.mobRaw && e) {
    e[el.dataset.mobRaw === 'model' ? 'mobModelRaw' : 'mobAnimRaw'] = el.value;
    BF.dirty(); return;
  }
  if (el.dataset.ore && e) {
    if (!e.ore) e.ore = BF.defaultOre();
    e.ore[el.dataset.ore] = numVal(el);
    BF.dirty(); BF.renderFileList(); return;
  }
  if (el.dataset.field && e) {
    e[el.dataset.field] = numVal(el);
    var lab = $('#val-' + el.dataset.field); if (lab) lab.textContent = el.value;
    BF.dirty(); BF.refreshPreview(); BF.renderFileList(); return;
  }
  if (el.dataset.meta) {
    BF.state.meta[el.dataset.meta] = el.value;
    if (el.dataset.meta === 'name') BF.renameProject(BF.library.activeId, el.value);
    BF.dirty(); BF.renderFileList(); BF.refreshPreview(); return;
  }
}
var CHANGE_ACTS = ['texsize','zoom','recipe-type','recipe-shapeless','recipe-count','recipe-time',
  'recipe-xp','station-num','gui-kind','ore-preset','gui-paint-toggle'];

/* ---------- action dispatcher ---------- */
function action(act, el, ev) {
  var e = BF.cur();
  switch (act) {
    /* ---- paint ---- */
    case 'tool':
      BF.state.paintTool = el.dataset.tool;
      BF.pe.tool = el.dataset.tool;
      document.querySelectorAll('[data-act="tool"]').forEach(function (b) {
        b.classList.toggle('active', b.dataset.tool === el.dataset.tool); });
      break;
    case 'paint-action': {
      var name = el.dataset.name;
      if (name === 'shift') {
        var a = (el.dataset.arg || '0,0').split(',').map(Number);
        BF.pe.action('shift', a);
      } else BF.pe.action(name);
      BF.dirty(); BF.refreshPreview();
      break;
    }
    case 'brush': {
      var b = Number(el.dataset.v);
      BF.state.brushSize = b; BF.pe.brush = b;
      document.querySelectorAll('[data-act="brush"]').forEach(function (n) {
        n.classList.toggle('active', +n.dataset.v === b); });
      break;
    }
    case 'sym': {
      var s = el.dataset.v;
      BF.state.symmetry = s; BF.pe.symmetry = s;
      document.querySelectorAll('[data-act="sym"]').forEach(function (n) {
        n.classList.toggle('active', n.dataset.v === s); });
      break;
    }
    case 'swatch': case 'hist':
      BF.selectColor(el.dataset.color); BF.addHistory(el.dataset.color); BF.dirty(); break;
    case 'pick-secondary': {
      var input = document.createElement('input');
      input.type = 'color'; input.value = BF.state.paintSecondary || '#ffffff';
      input.style.position = 'fixed'; input.style.opacity = '0';
      document.body.appendChild(input);
      input.addEventListener('change', function () {
        BF.state.paintSecondary = input.value;
        BF.pe.secondary = input.value;
        var box = $('#secondary-box'); if (box) box.style.background = input.value;
        BF.addHistory(input.value); BF.dirty(); input.remove();
      });
      input.click();
      break;
    }
    case 'add-color': {
      var hex = ($('#custom-hex').value || '').trim();
      if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
        BF.PALETTE.push(hex);
        var d = document.createElement('div');
        d.className = 'swatch'; d.dataset.act = 'swatch'; d.dataset.color = hex;
        d.style.background = hex; d.title = hex;
        var sw = $('#swatches'); if (sw) sw.appendChild(d);
        BF.selectColor(hex); BF.addHistory(hex); BF.toast('已加入调色板');
      } else BF.toast('请输入 #RRGGBB 格式的颜色', true);
      break;
    }
    case 'apply-adjust': {
      var l = Number($('#adj-light').value||0)/100, s2 = Number($('#adj-sat').value||100)/100,
          h = Number($('#adj-hue').value||0)/100;
      BF.pe.action('adjust', [l,s2,h]);
      ['adj-light','adj-sat','adj-hue'].forEach(function (id) {
        var n = $('#'+id); if (n) n.value = id==='adj-sat'?100:0; });
      var ll=$('#light-label'), sl=$('#sat-label'), hl=$('#hue-label');
      if (ll) ll.textContent='0'; if (sl) sl.textContent='1.0×'; if (hl) hl.textContent='0';
      BF.dirty(); BF.refreshPreview(); BF.toast('已应用整体调色');
      break;
    }
    case 'texkey':
      BF.state.texKey = el.dataset.key;
      BF.pe.load(e.textures[el.dataset.key]);
      document.querySelectorAll('.tex-tabs button').forEach(function (b) {
        b.classList.toggle('active', b.dataset.key === el.dataset.key); });
      break;
    case 'face-copy': case 'face-all': {
      var keys = BF.texKeys(e), key = BF.state.texKey || keys[0];
      if (keys.indexOf(key) < 0) key = keys[0];
      var src = BF.clone(e.textures[key]);
      keys.forEach(function (k) { if (k !== key || act === 'face-all') e.textures[k] = BF.clone(src); });
      if (act === 'face-all') BF.state.texKey = keys[0];
      BF.rebuild(); BF.dirty(); BF.toast('六面贴图已统一');
      break;
    }
    case 'texsize': BF.pe.resize(Number(el.value)); break;
    case 'zoom': BF.pe.setZoom(Number(el.value)); $('#zoom-label').textContent = BF.pe.zoom + '×'; break;
    case 'grid': BF.pe.grid = !BF.pe.grid; BF.pe.render(); BF.toast('网格：' + (BF.pe.grid?'开':'关')); break;
    case 'undo': BF.pe.undo(); break;
    case 'redo': BF.pe.redo(); break;
    case 'img-import': $('#paint-file').click(); break;
    case 'img-export': BF.pe.exportPNG(BF.slug(e.reg) + '_' + (BF.state.texKey||'main') + '.png'); break;

    /* ---- ore ---- */
    case 'ore-preset': {
      var p = BF.ORE_PRESETS[el.value];
      if (p && e) {
        e.ore = BF.clone(e.ore || BF.defaultOre());
        Object.keys(p).forEach(function (k) { e.ore[k] = BF.clone(p[k]); });
        e.ore.preset = el.value;
        BF.rebuild(); BF.dirty(); BF.toast('已套用原版预设');
      }
      break;
    }

    /* ---- recipes ---- */
    case 'recipe-sel': BF.state.recipeIdx = +el.dataset.i; BF.rebuild(); break;
    case 'recipe-del': e.recipes.splice(+el.dataset.i,1); BF.state.recipeIdx = 0; BF.rebuild(); BF.dirty(); break;
    case 'recipe-add': {
      e.recipes = e.recipes || [];
      e.recipes.push(BF.defaultRecipeFor(e, materialRef()));
      BF.state.recipeIdx = e.recipes.length-1; BF.rebuild(); BF.dirty(); break;
    }
    case 'grid-cell': {
      var i = +el.dataset.i, r = (e.recipes||[])[BF.state.recipeIdx||0];
      if (!r) break;
      if (ev.target.classList.contains('clr')) {
        r.grid[i] = null; rebuildThumbs(e); BF.dirty(); break;
      }
      BF.openRefPicker(el, r.grid[i], function (ref) {
        r.grid[i] = ref; rebuildThumbs(e); BF.dirty();
      });
      break;
    }
    case 'open-ref': {
      var k = el.dataset.field;
      BF.openRefPicker(el, e[k], function (ref) {
        e[k] = ref; el.textContent = BF.refLabel(ref) + ' ▾'; el.dataset.ref = ref || '';
        BF.dirty(); BF.refreshPreview(); BF.renderFileList();
      });
      break;
    }
    case 'recipe-type': case 'recipe-shapeless': case 'recipe-count':
    case 'recipe-time': case 'recipe-xp': {
      var rr = (e.recipes||[])[BF.state.recipeIdx||0]; if (!rr) break;
      if (act === 'recipe-type') rr.type = el.value;
      if (act === 'recipe-shapeless') rr.shapeless = el.checked;
      if (act === 'recipe-count') rr.count = Math.max(1,Number(el.value)||1);
      if (act === 'recipe-time') rr.time = Math.max(0,Number(el.value)||0);
      if (act === 'recipe-xp') rr.xp = Number(el.value)||0;
      BF.dirty();
      if (act === 'recipe-type' || act === 'recipe-shapeless') BF.rebuild();
      break;
    }
    case 'station-add': {
      e.stationRecipes = e.stationRecipes || [];
      e.stationRecipes.push({ id:BF.uid(), a:null, ca:1, b:null, cb:1,
        out:'elem:'+BF.state.elements[0].id, count:1 });
      BF.rebuild(); BF.dirty(); break;
    }
    case 'station-del': e.stationRecipes.splice(+el.dataset.i,1); BF.rebuild(); BF.dirty(); break;
    case 'station-ref': {
      var si = +el.dataset.i, sk = el.dataset.k, sr = (e.stationRecipes||[])[si];
      BF.openRefPicker(el, sr[sk], function (ref) { sr[sk] = ref; BF.rebuild(); BF.dirty(); });
      break;
    }
    case 'station-num':
      (e.stationRecipes||[])[+el.dataset.i][el.dataset.k] = Math.max(1,Number(el.value)||1);
      BF.dirty(); break;
    case 'rec-fill': {
      var cnt = 0, mat = materialRef();
      BF.state.elements.forEach(function (x) {
        if (x.craftable !== false && (!x.recipes || !x.recipes.length)) {
          x.recipes = [BF.defaultRecipeFor(x, mat)]; cnt++;
        }
      });
      BF.rebuild(); BF.dirty(); BF.toast('已为 ' + cnt + ' 个元素补齐默认配方');
      break;
    }
    case 'rec-all-on': case 'rec-all-off':
      BF.state.elements.forEach(function (x) { x.craftable = act === 'rec-all-on'; });
      BF.rebuild(); BF.dirty(); break;

    /* ---- GUI ---- */
    case 'gui-add': {
      var kind = el.dataset.kind;
      var count = e.ui.slots.filter(function (s) { return s.kind===kind; }).length;
      var max = kind === 'input' ? 6 : 1;
      if (count >= max) { BF.toast('该类型槽位已达上限 ' + max, true); break; }
      e.ui.slots.push({ kind:kind, x:32 + (count%3)*24, y:26 + Math.floor(count/3)*24 });
      BF.dirty(); paintAndSlots(e); BF.refreshPreview(); break;
    }
    case 'gui-del': {
      var di = +el.dataset.i, s0 = e.ui.slots[di];
      if (s0.kind === 'output' && e.ui.slots.filter(function (s) { return s.kind==='output'; }).length<=1) {
        BF.toast('至少保留一个输出槽', true); break;
      }
      e.ui.slots.splice(di,1); BF.state.guiSel = 0;
      BF.dirty(); paintAndSlots(e); BF.refreshPreview(); break;
    }
    case 'gui-kind': {
      var gk = +el.dataset.i, nk = el.value;
      if (nk !== 'input' && e.ui.slots.filter(function (s,i2) { return s.kind===nk && i2!==gk; }).length) {
        BF.toast('输出槽与燃料槽各只能有一个', true); BF.rebuild(); break;
      }
      e.ui.slots[gk].kind = nk;
      BF.dirty(); paintAndSlots(e); break;
    }

    /* ---- code / elements / export ---- */
    case 'code-file': BF.showCodeFile(+el.dataset.i); break;
    case 'code-copy': {
      var f1 = BF._files && BF._files[BF._codeSel]; if (!f1) break;
      try { navigator.clipboard.writeText(f1.content); BF.toast('已复制文件内容'); }
      catch (err) {
        var ta = document.createElement('textarea'); ta.value = f1.content;
        document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
        BF.toast('已复制文件内容');
      }
      break;
    }
    case 'code-download': {
      var f2 = BF._files && BF._files[BF._codeSel]; if (!f2) break;
      BF.saveFile(new Blob([f2.content], {type:'text/plain'}), f2.path.split('/').pop());
      break;
    }
    case 'duplicate-element': {
      var c = BF.clone(e); c.id = BF.uid(); c.name = e.name + ' 副本'; c.reg = BF.slug(e.reg) + '_copy';
      var used2 = {}; BF.state.elements.forEach(function (x) { used2[BF.slug(x.reg)] = 1; });
      var q = 2; while (used2[BF.slug(c.reg)]) c.reg = BF.slug(e.reg) + '_copy' + (q++);
      BF.state.elements.push(c); BF.state.selected = c.id;
      BF.rebuild(); BF.dirty(); BF.toast('已复制元素'); break;
    }
    case 'delete-element': deleteElement(e.id); break;
    case 'reset-project':
      BF.confirm('恢复示例项目', '这会<b>清空当前项目的所有元素</b>并恢复内置的 8 个示例元素。' +
        '其它项目不受影响；建议先备份。', function () {
        var meta = BF.clone(BF.state.meta);
        BF.state = BF.defaultProject(meta.name, meta.modid);
        BF.state.meta = meta;
        BF.state.view = 'element';
        BF.rebuild(); BF.persist(); BF.toast('当前项目已恢复为示例内容');
      });
      break;
    /* ---- hand-drawn GUI background ---- */
    case 'gui-tool':
      BF.state.guiPaintTool = el.dataset.tool;
      if (BF.gpe) BF.gpe.tool = el.dataset.tool;
      document.querySelectorAll('[data-act="gui-tool"]').forEach(function (b) {
        b.classList.toggle('active', b.dataset.tool === el.dataset.tool); });
      break;
    case 'gui-swatch':
      BF.state.paintColor = el.dataset.color;
      if (BF.gpe) BF.gpe.color = el.dataset.color;
      var gc = $('#gui-color'); if (gc) gc.value = el.dataset.color;
      el.parentNode.querySelectorAll('.swatch').forEach(function (s) {
        s.classList.toggle('active', s.dataset.color === el.dataset.color); });
      break;
    case 'gui-paint-toggle':
      if (el.checked) {
        if (!e.guiPixels) e.guiPixels = BF.proceduralGuiPixels(e);
      } else e.guiPixels = null;
      BF.rebuild(); BF.dirty();
      BF.toast(el.checked ? '已启用手绘 GUI 背景（以示例 UI 为底稿）' : '已恢复程序化 GUI 背景');
      break;
    case 'gui-paint-import': {
      e.guiPixels = BF.proceduralGuiPixels(e);
      if (BF.gpe) { BF.gpe.load(e.guiPixels); BF.gpe.setZoom(2); }
      var cb2 = document.querySelector('[data-act="gui-paint-toggle"]');
      if (cb2) cb2.checked = true;
      BF.paintGuiBg(e); BF.refreshPreview(); BF.dirty();
      BF.toast('已恢复为示例 UI 底稿');
      break;
    }
    case 'gui-paint-clear': if (BF.gpe) BF.gpe.clear(); break;
    case 'gui-paint-undo': if (BF.gpe) BF.gpe.undo(); break;
    case 'gui-paint-redo': if (BF.gpe) BF.gpe.redo(); break;
    case 'open-cfg-ref': {
      var cfg = e[el.dataset.cfg] || (e[el.dataset.cfg] = {});
      BF.openRefPicker(el, cfg[el.dataset.key], function (ref) {
        cfg[el.dataset.key] = ref;
        el.textContent = BF.refLabel(ref) + ' ▾';
        BF.dirty(); BF.renderFileList();
      });
      break;
    }

    /* ---- creature (mob) ---- */
    case 'mob-part-add': {
      e.mobParts = e.mobParts || [];
      var mp = e.mobParts.length;
      e.mobParts.push({ name:'part'+(mp+1), pivot:[0,12,0], offset:[0,-6,-2], size:[4,12,4], color:'#8fb8e8' });
      BF.rebuild(); BF.dirty(); break;
    }
    case 'mob-part-del': e.mobParts.splice(+el.dataset.i,1); BF.rebuild(); BF.dirty(); break;
    case 'mob-parts-reset': e.mobParts = BF.defaultMobParts(); BF.rebuild(); BF.dirty(); break;
    case 'mob-skin-auto':
      e.textures.skin = BF.mobSkinTexture(e.mobParts || []);
      BF.rebuild(); BF.dirty(); BF.toast('已按当前部件重新生成 64×64 皮肤贴图'); break;
    case 'mob-kf-add': {
      var kfPart = ($('#kf-part')||{}).value, kfT = Number(($('#kf-time')||{}).value)||0;
      var kfRx = Number(($('#kf-rx')||{}).value)||0, kfRy = Number(($('#kf-ry')||{}).value)||0;
      var kfRz = Number(($('#kf-rz')||{}).value)||0;
      var frames = e.mobFrames || (e.mobFrames = []);
      var same = frames.filter(function(f){ return f.part===kfPart && Math.abs(f.t-kfT)<0.0001; })[0];
      if (same) { same.rx=kfRx; same.ry=kfRy; same.rz=kfRz; }
      else frames.push({ part:kfPart, t:kfT, rx:kfRx, ry:kfRy, rz:kfRz });
      BF.rebuild(); BF.dirty(); break;
    }
    case 'mob-kf-walk': {
      e.mobFrames = [];
      var legs = (e.mobParts||[]).filter(function(p){ return /leg/i.test(p.name); })
        .map(function(p){ return p.name; });
      if (!legs.length) legs = ['legFrontLeft','legFrontRight'];
      legs.forEach(function(L, li){
        var sg = li % 2 ? -1 : 1;
        [[0,0],[0.5,25*sg],[1,0]].forEach(function(k){
          e.mobFrames.push({ part:L, t:k[0], rx:k[1], ry:0, rz:0 });
        });
      });
      BF.rebuild(); BF.dirty(); BF.toast('已生成行走摆动关键帧'); break;
    }
    case 'mob-kf-clear': e.mobFrames = []; BF.rebuild(); BF.dirty(); break;
    case 'mob-kf-del': e.mobFrames.splice(+el.dataset.i,1); BF.rebuild(); BF.dirty(); break;
    case 'mob-drop-add':
      e.mobCfg.drops = e.mobCfg.drops || [];
      e.mobCfg.drops.push({ ref:'minecraft:iron_ingot', count:1, chance:1 });
      BF.rebuild(); BF.dirty(); break;
    case 'mob-drop-del': e.mobCfg.drops.splice(+el.dataset.i,1); BF.rebuild(); BF.dirty(); break;
    case 'mob-drop-ref': {
      var dref = (e.mobCfg.drops||[])[+el.dataset.i];
      BF.openRefPicker(el, dref.ref, function(ref){ dref.ref = ref; BF.rebuild(); BF.dirty(); });
      break;
    }
    case 'mob-drop-num': {
      var dnum = (e.mobCfg.drops||[])[+el.dataset.i];
      dnum[el.dataset.k] = Number(el.value);
      BF.dirty(); break;
    }
    case 'mob-trade-add':
      e.mobCfg.trades = e.mobCfg.trades || [];
      e.mobCfg.trades.push({ ref:'minecraft:iron_ingot', count:1, price:'minecraft:emerald', pcount:1 });
      BF.rebuild(); BF.dirty(); break;
    case 'mob-trade-del': e.mobCfg.trades.splice(+el.dataset.i,1); BF.rebuild(); BF.dirty(); break;
    case 'mob-trade-ref': {
      var tref = (e.mobCfg.trades||[])[+el.dataset.i];
      BF.openRefPicker(el, tref[el.dataset.k], function(ref){
        tref[el.dataset.k] = ref; BF.rebuild(); BF.dirty();
      });
      break;
    }
    case 'mob-trade-num': {
      var tnum = (e.mobCfg.trades||[])[+el.dataset.i];
      tnum[el.dataset.k] = Number(el.value);
      BF.dirty(); break;
    }

    case 'do-export': exportWithConfirm(); break;
    case 'do-save': saveProjectFile(); break;
    case 'rotate':
      BF.state.previewFacing = Number(el.dataset.v);
      BF.refreshPreview(); break;
  }
}
function rebuildThumbs(e) {
  if (BF.fillRecipeThumbs) BF.fillRecipeThumbs(e);
}
function paintAndSlots(e) { BF.paintGuiBg(e); BF.renderGuiSlots(e); }
function handleRecClick(el) {
  var target = BF.get(el.dataset.id); if (!target) return;
  if (el.dataset.rec === 'edit') {
    BF.state.selected = target.id; BF.state.view = 'element'; BF.state.tab = 'recipe';
    BF.state.recipeIdx = 0; BF.rebuild();
  } else if (el.dataset.rec === 'add') {
    target.recipes = target.recipes || [];
    target.recipes.push(BF.defaultRecipeFor(target, materialRef()));
    BF.rebuild(); BF.dirty(); BF.toast('已添加默认配方');
  }
}

/* ---------- bootstrap ---------- */
function boot() {
  BF.state = BF.load();
  if (!BF.state.view) BF.state.view = 'element';
  if (!BF.state.tab) BF.state.tab = 'paint';
  if (!BF.state.paintTool) BF.state.paintTool = 'pencil';
  if (!BF.state.paintColor) BF.state.paintColor = '#7ac74f';
  if (!BF.state.paintSecondary) BF.state.paintSecondary = '#ffffff';
  initMenu(); BF.renderAll();

  $('#proj-name').addEventListener('input', function () {
    BF.state.meta.name = this.value;
    BF.renameProject(BF.library.activeId, this.value);
    BF.dirty();
  });
  $('#elem-search').addEventListener('input', function () { BF.renderSidebar(); });
  $('#btn-library').addEventListener('click', function () {
    BF.state.view = 'library'; BF.state.tab = 'library'; BF.rebuild();
  });
  $('#btn-project').addEventListener('click', function () {
    BF.state.view = 'project'; BF.state.tab = 'project'; BF.rebuild();
  });
  $('#btn-lib-menu').addEventListener('click', function (ev) {
    ev.stopPropagation(); BF.renderLibMenu(); $('#lib-menu').classList.toggle('open');
  });
  $('#lib-menu').addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-lib]'); if (!b) return;
    ev.__bfLibHandled = true;
    $('#lib-menu').classList.remove('open');
    libAction(b.dataset.lib, b.dataset.id);
  });
  $('#btn-add').addEventListener('click', function (ev) {
    ev.stopPropagation(); $('#add-menu').classList.toggle('open');
  });
  $('#add-menu').addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-new]'); if (b) newElement(b.dataset.new);
  });
  $('#elem-list').addEventListener('click', function (ev) {
    var del = ev.target.closest('[data-del]');
    if (del) { ev.stopPropagation(); deleteElement(del.dataset.del); return; }
    var item = ev.target.closest('[data-eid]');
    if (item) {
      BF.state.selected = item.dataset.eid; BF.state.view = 'element';
      BF.state.tab = 'paint'; BF.state.recipeIdx = 0; BF.state.texKey = null;
      BF.rebuild(); BF.dirty();
    }
  });
  $('#btn-export').addEventListener('click', exportWithConfirm);
  $('#btn-save').addEventListener('click', saveProjectFile);
  $('#btn-import').addEventListener('click', function () { $('#file-import').click(); });
  $('#file-import').addEventListener('change', function () {
    var f = this.files[0]; if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      try {
        var data = JSON.parse(rd.result);
        if (!data.meta || !Array.isArray(data.elements)) throw new Error('不是有效的 BlockForge 项目文件');
        BF.importProjectFile(data);
        afterProjectChange('项目已导入：' + data.meta.name);
      } catch (err) { BF.toast('导入失败：' + err.message, true); }
    };
    rd.readAsText(f); this.value = '';
  });
  /* 生物：Blockbench 文件导入（.bbmodel / .java / 动画 JSON） */
  $('#ws-content').addEventListener('change', function (ev) {
    if (ev.target.id !== 'mob-import-file') return;
    var f = ev.target.files[0]; if (!f) return;
    var e = BF.cur();
    if (!e || e.type !== 'mob') { BF.toast('请先选中一个生物元素', true); return; }
    var rd = new FileReader();
    rd.onload = function () {
      try {
        var text = String(rd.result || '');
        var lower = (f.name || '').toLowerCase();
        if (lower.endsWith('.bbmodel')) {
          var parsed = BF.parseBBModel(text);
          if (!parsed.parts.length) throw new Error('模型里没有可导入的长方体部件');
          e.mobParts = parsed.parts;
          if (parsed.animJson) e.mobAnimRaw = parsed.animJson;
          e.mobModelRaw = '';
          e.textures.skin = BF.mobSkinTexture(e.mobParts);
          BF.rebuild(); BF.dirty();
          BF.toast('已从 .bbmodel 导入 ' + parsed.count + ' 个部件' +
            (parsed.animJson ? ' 与动画（组级嵌套已拍平到根）' : '') +
            '；UV 已重排，建议点「按部件重新生成皮肤」');
        } else if (lower.endsWith('.java')) {
          e.mobModelRaw = text;
          BF.rebuild(); BF.dirty();
          BF.toast('已导入 Java 模型代码（导出时原样写入工程）');
        } else if (lower.endsWith('.json')) {
          var obj = JSON.parse(text);
          if (obj.animations) {
            e.mobAnimRaw = JSON.stringify(obj, null, 2);
            BF.rebuild(); BF.dirty();
            BF.toast('已导入动画 JSON（' + Object.keys(obj.animations).length + ' 条动画）');
          } else if (obj.elements) {
            var parsed2 = BF.parseBBModel(text);
            if (!parsed2.parts.length) throw new Error('模型里没有可导入的长方体部件');
            e.mobParts = parsed2.parts;
            e.textures.skin = BF.mobSkinTexture(e.mobParts);
            BF.rebuild(); BF.dirty();
            BF.toast('已从 JSON 导入 ' + parsed2.count + ' 个部件');
          } else {
            throw new Error('不是可识别的动画或模型 JSON');
          }
        } else {
          throw new Error('支持的格式：.bbmodel / .java / .json');
        }
      } catch (err) { BF.toast('导入失败：' + err.message, true); }
    };
    rd.readAsText(f); ev.target.value = '';
  });
  $('#tabs').addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-tab]'); if (!b) return;
    BF.state.tab = b.dataset.tab;
    BF.renderAll();
  });

  /* global clicks: library actions anywhere + close menus */
  document.addEventListener('click', function (ev) {
    if (!ev.target.closest('.dropdown')) $('#add-menu').classList.remove('open');
    if (!ev.target.closest('.top-proj')) $('#lib-menu').classList.remove('open');
    var lib = ev.target.closest('[data-lib]');
    if (lib && !ev.__bfLibHandled && !lib.closest('#lib-menu') && !lib.closest('#ws-content')) {
      ev.__bfLibHandled = true;
      libAction(lib.dataset.lib, lib.dataset.id);
    }
  });
  $('#ws-head').addEventListener('click', function (ev) {
    /* data-lib here is handled by the global document delegate */
    var act = ev.target.closest('[data-act]');
    if (act) action(act.dataset.act, act, ev);
  });
  $('#pv-rotate').addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-act="rotate"]');
    if (b) action('rotate', b, ev);
  });

  var content = $('#ws-content');
  content.addEventListener('click', function (ev) {
    var lib = ev.target.closest('[data-lib]');
    if (lib) { ev.__bfLibHandled = true; libAction(lib.dataset.lib, lib.dataset.id); return; }
    var rec = ev.target.closest('[data-rec]');
    if (rec && rec.tagName === 'BUTTON') { handleRecClick(rec); return; }
    var el = ev.target.closest('[data-act]');
    if (!el) return;
    if (el.tagName === 'SELECT' || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return;
    action(el.dataset.act, el, ev);
  });
  content.addEventListener('change', function (ev) {
    var el = ev.target;
    if (el.dataset.rec || el.dataset.oreTarget || el.dataset.multi || el.dataset.ore ||
        el.dataset.cfg || el.dataset.field || el.dataset.meta || el.dataset.mobPart ||
        el.dataset.mobRaw) { onFieldChange(el); return; }
    if (el.dataset.act && CHANGE_ACTS.indexOf(el.dataset.act) >= 0) { action(el.dataset.act, el, ev); return; }
    if (el.id === 'paint-file' && el.files[0]) {
      BF.pe.importImage(el.files[0], function () { BF.toast('图片已导入画布'); BF.refreshPreview(); });
      el.value = ''; return;
    }
    if (el.id === 'custom-color') { BF.selectColor(el.value); BF.addHistory(el.value); return; }
    if (el.id === 'gui-color') {
      BF.state.paintColor = el.value; if (BF.gpe) BF.gpe.color = el.value; return;
    }
    if (el.id === 'custom-hex') {
      var v = el.value.trim();
      if (/^#[0-9a-fA-F]{6}$/.test(v)) { BF.selectColor(v); BF.addHistory(v); }
      else el.value = BF.state.paintColor;
      return;
    }
  });
  content.addEventListener('input', function (ev) {
    var el = ev.target;
    if (el.dataset.rec || el.dataset.oreTarget || el.dataset.multi || el.dataset.ore ||
        el.dataset.cfg || el.dataset.field || el.dataset.meta || el.dataset.mobPart ||
        el.dataset.mobRaw) { onFieldChange(el); return; }
    if (el.dataset.act === 'zoom') {
      BF.pe.setZoom(Number(el.value)); $('#zoom-label').textContent = BF.pe.zoom + '×'; return;
    }
    if (el.id === 'custom-color') { BF.selectColor(el.value); return; }
    if (el.id === 'adj-light') { var l=$('#light-label'); if (l) l.textContent = el.value; return; }
    if (el.id === 'adj-sat') { var s=$('#sat-label'); if (s) s.textContent = (Number(el.value)/100).toFixed(1)+'×'; return; }
    if (el.id === 'adj-hue') { var h=$('#hue-label'); if (h) h.textContent = el.value; return; }
  });

  document.addEventListener('keydown', function (ev) {
    var tag = (ev.target.tagName||'').toLowerCase();
    var typing = tag === 'input' || tag === 'textarea' || tag === 'select';
    if (ev.key === 'Escape') { $('#modal-root').innerHTML = ''; BF.closeRefPicker(); return; }
    if ((ev.ctrlKey||ev.metaKey) && ev.key.toLowerCase() === 's') { ev.preventDefault(); saveProjectFile(); return; }
    if (!typing && (ev.ctrlKey||ev.metaKey) && ev.key.toLowerCase() === 'z' && BF.pe) {
      ev.preventDefault(); ev.shiftKey ? BF.pe.redo() : BF.pe.undo();
    }
    if (!typing && (ev.ctrlKey||ev.metaKey) && ev.key.toLowerCase() === 'y' && BF.pe) {
      ev.preventDefault(); BF.pe.redo();
    }
  });
  window.addEventListener('beforeunload', function () { try { BF.persist(); } catch (e) {} });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})(typeof window !== 'undefined' ? window : globalThis);
