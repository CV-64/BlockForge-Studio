/* Inject an interaction probe into index.html for headless browser testing */
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const probe = `
<script>
window.__errs = [];
window.addEventListener('error', function (e) { window.__errs.push('ERROR: ' + e.message + ' @line ' + e.lineno); });
window.addEventListener('unhandledrejection', function (e) { window.__errs.push('REJECTION: ' + e.reason); });
window.addEventListener('load', function () {
  setTimeout(function () {
    var out = [];
    function log(k, v) { out.push(k + '=' + v); }
    function tab(label) {
      var b = Array.prototype.slice.call(document.querySelectorAll('#tabs button'))
        .filter(function (x) { return x.textContent.trim() === label; })[0];
      if (!b) { log('tab:' + label, 'MISSING'); return null; }
      b.click();
      log('tab:' + label, document.querySelector('.tab-panel.active') ? document.querySelector('.tab-panel.active').id : 'NONE');
      return b;
    }
    function click(sel) { var el = document.querySelector(sel); if (el) { el.click(); return true; } return false; }
    try {
      log('boot', !!window.BF && !!BF.state ? 'ok' : 'FAIL');
      log('usageTemplate', BF.USAGE_MD ? BF.USAGE_MD.length : 'missing');
      log('elements', BF.state.elements.length);
      log('library', BF.listProjects().length);
      log('palette', BF.PALETTE.length);
      log('types', Object.keys(BF.TYPES).length);

      /* --- all tabs on the workstation --- */
      ['功能属性','矿物生成','能量网络','合成配方','工作站界面','配方中心','Java 预览','外观绘制']
        .forEach(tab);
      log('codeFiles', BF._files ? BF._files.length : 0);
      /* tool/effect tabs only exist on tool/item/armor/misc elements */
      var toolEl0 = BF.state.elements.filter(function (e) { return e.type === 'tool'; })[0];
      BF.state.selected = toolEl0.id; BF.state.tab = 'paint'; BF.rebuild();
      tab('工具属性'); tab('物品效果');
      BF.state.tab = 'props'; BF.renderAll();
      var imSel = document.querySelector('[data-field="itemModel"]');
      log('itemModelField', imSel ? imSel.value : 'missing');
      /* energy conduit + cluster config panels */
      var energyEl0 = BF.state.elements.filter(function (e) { return e.type === 'energy'; })[0];
      BF.state.selected = energyEl0.id; BF.state.tab = 'power'; BF.rebuild();
      tab('能量网络');
      var capEl = document.querySelector('[data-cfg="energyCfg"][data-key="capacity"]');
      if (capEl) { capEl.value = '9000'; capEl.dispatchEvent(new Event('change', {bubbles:true})); }
      log('energyCapacity', energyEl0.energyCfg.capacity);
      var clusterEl0 = BF.state.elements.filter(function (e) { return e.type === 'cluster'; })[0];
      BF.state.selected = clusterEl0.id; BF.state.tab = 'cluster'; BF.rebuild();
      tab('晶簇设置');
      var cntEl = document.querySelector('[data-cfg="clusterCfg"][data-key="count"]');
      if (cntEl) { cntEl.value = '11'; cntEl.dispatchEvent(new Event('change', {bubbles:true})); }
      log('clusterCount', clusterEl0.clusterCfg.count);
      /* creature modelling / animation / attributes */
      var mobEl = BF.state.elements.filter(function (e) { return e.type === 'mob'; })[0];
      BF.state.selected = mobEl.id; BF.state.tab = 'mob'; BF.rebuild();
      tab('生物建模');
      log('mobParts', document.querySelectorAll('.mob-table tbody tr').length);
      log('mobCanvas', !!document.querySelector('#mob-3d') && !!document.querySelector('#mob-uv'));
      click('[data-act="mob-kf-walk"]');
      log('keyframes', mobEl.mobFrames.length);
      var colorIn = document.querySelector('[data-mob-part="color"]');
      if (colorIn) { colorIn.value = '#ff0000'; colorIn.dispatchEvent(new Event('change', {bubbles:true})); }
      log('partColor', mobEl.mobParts[0].color);
      click('[data-act="mob-skin-auto"]');
      log('skinPixels', mobEl.textures.skin ? mobEl.textures.skin.data.filter(Boolean).length : 0);
      BF.state.tab = 'mobprops'; BF.renderAll();
      tab('生物属性');
      var hpIn = document.querySelector('[data-cfg="mobCfg"][data-key="health"]');
      if (hpIn) { hpIn.value = '250'; hpIn.dispatchEvent(new Event('change', {bubbles:true})); }
      log('mobHealth', mobEl.mobCfg.health);
      var skillIn = document.querySelector('[data-multi="mobCfg.skills"][data-v="heal"]');
      if (skillIn) { skillIn.checked = true; skillIn.dispatchEvent(new Event('change', {bubbles:true})); }
      log('mobSkills', (mobEl.mobCfg.skills||[]).join(','));
      click('[data-act="mob-drop-add"]');
      log('mobDrops', mobEl.mobCfg.drops.length);
      BF.state.selected = toolEl0.id; BF.state.tab = 'paint'; BF.renderAll();

      /* --- pixel editor --- */
      BF.state.tab = 'paint'; BF.renderAll();
      log('peReady', !!BF.pe && !!BF.pe.tex);
      click('[data-act="tool"][data-tool="spray"]');
      click('[data-act="brush"][data-v="3"]');
      click('[data-act="sym"][data-v="both"]');
      log('brush', BF.pe.brush + '/' + BF.pe.symmetry + '/' + BF.pe.tool);
      BF.pe.plot(4, 4, '#ff0000'); BF.pe.render();
      log('pixel', BF.pe.tex.data[4 * BF.pe.tex.w + 4]);
      click('[data-act="paint-action"][data-name="noise"]');
      click('[data-act="paint-action"][data-name="mirror"]');
      click('[data-act="paint-action"][data-name="shift"][data-arg="1,0"]');
      var al = document.querySelector('#adj-light'); if (al) al.value = '10';
      click('[data-act="apply-adjust"]');
      log('afterActions', BF.pe.undoStack.length > 0);
      var ore = BF.state.elements.filter(function (e) { return e.type === 'block' && e.ore && e.ore.enabled; })[0];
      BF.state.selected = ore.id; BF.state.texKey = 'top'; BF.state.tab = 'paint'; BF.rebuild();
      click('[data-act="face-copy"]');
      log('faces', Object.keys(ore.textures).length);
      log('faceUnified', ore.textures.top.data[0] === ore.textures.right.data[0]);
      log('sixFaceKeys', Object.keys(ore.textures).join(','));

      /* --- ore panel --- */
      if (ore) {
        BF.state.selected = ore.id; BF.state.tab = 'ore'; BF.rebuild();
        var preset = document.querySelector('[data-act="ore-preset"]');
        if (preset) { preset.value = 'coal'; preset.dispatchEvent(new Event('change', {bubbles:true})); }
        log('orePreset', ore.ore.preset + '/' + ore.ore.size);
        var size = document.querySelector('[data-ore="size"]');
        if (size) { size.value = '13'; size.dispatchEvent(new Event('change', {bubbles:true})); }
        log('oreSize', ore.ore.size);
      }

      /* --- tool / effect panels --- */
      var tool = BF.state.elements.filter(function (e) { return e.type === 'tool'; })[0];
      BF.state.selected = tool.id; BF.state.tab = 'tool'; BF.rebuild();
      var cb = document.querySelector('[data-multi="fastTags"][data-v="logs"]');
      if (cb) { cb.checked = true; cb.dispatchEvent(new Event('change', {bubbles:true})); }
      log('fastTags', tool.fastTags.join(','));
      var dmg = document.querySelector('[data-field="knockbackPower"]');
      if (dmg) { dmg.value = '0.8'; dmg.dispatchEvent(new Event('change', {bubbles:true})); }
      log('knockback', tool.knockbackPower);
      BF.state.tab = 'effect'; BF.renderAll();
      var rc = document.querySelector('[data-field="rightClick"]');
      if (rc) { rc.value = 'snowball'; rc.dispatchEvent(new Event('change', {bubbles:true})); }
      log('rightClick', tool.rightClick);

      /* --- recipe center --- */
      BF.state.tab = 'recipes'; BF.renderAll();
      log('recRows', document.querySelectorAll('.rec-row').length);
      click('[data-act="rec-fill"]');
      var recCb = document.querySelector('[data-rec="craftable"]');
      if (recCb) { recCb.checked = false; recCb.dispatchEvent(new Event('change', {bubbles:true})); }
      log('craftToggle', BF.state.elements[0].craftable);
      recCb.checked = true; recCb.dispatchEvent(new Event('change', {bubbles:true}));

      /* --- craftable switch inside recipe tab --- */
      BF.state.tab = 'recipe'; BF.renderAll();
      var cr = document.querySelector('[data-field="craftable"]');
      if (cr) { cr.checked = false; cr.dispatchEvent(new Event('change', {bubbles:true})); }
      log('craftableField', BF.cur().craftable);
      cr.checked = true; cr.dispatchEvent(new Event('change', {bubbles:true}));

      /* --- GUI designer --- */
      var ws = BF.state.elements.filter(function (e) { return e.type === 'workstation'; })[0];
      BF.state.selected = ws.id; BF.state.tab = 'gui'; BF.rebuild();
      log('guiSlots', document.querySelectorAll('.gui-slot').length);
      click('[data-act="gui-add"][data-kind="input"]');
      log('guiSlotsAfter', ws.ui.slots.length);
      /* hand-drawn GUI background */
      log('guiPaintCanvas', !!document.querySelector('#gui-paint-canvas'));
      log('guiScratchBase', BF.gpe ? (BF.gpe.tex.data[0] !== null) : 'no');
      click('[data-act="gui-paint-import"]');
      log('guiPixels', ws.guiPixels ? ws.guiPixels.w + 'x' + ws.guiPixels.h : 'none');
      if (BF.gpe) { BF.gpe.plot(10, 10, '#abcdef'); BF.gpe.render(); }
      log('guiPixelValue', ws.guiPixels ? ws.guiPixels.data[10*176+10] : 'none');
      click('[data-act="gui-swatch"][data-color="#e05c4b"]');
      var gpt = document.querySelector('[data-act="gui-paint-toggle"]');
      if (gpt) { gpt.checked = false; gpt.dispatchEvent(new Event('change', {bubbles:true})); }
      log('guiPaintOff', ws.guiPixels === null);
      BF.state.tab = 'gui'; BF.rebuild();
      var gpt2 = document.querySelector('[data-act="gui-paint-toggle"]');
      if (gpt2) { gpt2.checked = true; gpt2.dispatchEvent(new Event('change', {bubbles:true})); }
      log('guiPaintOn', !!ws.guiPixels);

      /* --- preview rotation --- */
      BF.state.tab = 'paint'; BF.renderAll();
      var rot = document.querySelector('[data-act="rotate"][data-v="2"]');
      if (rot) rot.click();
      log('facing', BF.state.previewFacing);

      /* --- project library --- */
      var before = BF.listProjects().length;
      click('#btn-library');
      log('libraryPanel', document.querySelectorAll('.proj-card').length);
      click('[data-lib="new"]');
      var pn = document.querySelector('[data-prompt="name"]');
      var pm = document.querySelector('[data-prompt="modid"]');
      if (pn) pn.value = '探针项目';
      if (pm) pm.value = 'probe_mod';
      click('#p-yes');
      log('libraryAfterNew', BF.listProjects().length + '/' + BF.state.meta.modid);
      log('newProjectElements', BF.state.elements.length);
      var curId = BF.library.activeId;
      click('#btn-library');
      var dupBtn = document.querySelector('[data-lib="dup"][data-id="' + curId + '"]');
      if (dupBtn) dupBtn.click(); else log('dupBtn', 'MISSING');
      log('libraryAfterDup', BF.listProjects().length);
      var list = BF.listProjects();
      var other = list.filter(function (p) { return p.id !== BF.library.activeId; })[0];
      if (other) { BF.switchProject(other.id); BF.renderAll(); }
      log('switchBack', BF.state.meta.modid);
      log('libDelta', BF.listProjects().length - before);
      var starP = BF.listProjects().filter(function (p) {
        return p.data.meta.modid === 'starcraft'; })[0];
      if (starP) { BF.switchProject(starP.id); BF.renderAll(); }

      /* --- real export path --- */
      var built = BF.buildProject(BF.state);
      var tm = built.files.filter(function (x) {
        return x.path.indexOf('models/item/star_pickaxe.json') >= 0; })[0];
      log('toolModel', tm ? JSON.parse(tm.content).parent : 'missing');
      log('realPng', built.files.filter(function (f) { return f.binary; })[0].content.length);
      var blob = BF.zipFiles(built.files);
      log('zipBlob', blob && blob.size ? blob.size : 'FAIL');
      log('worldgen', built.stats.worldgen);
      log('javaFiles', built.stats.java);
    } catch (err) {
      window.__errs.push('THROWN: ' + err.message + ' | ' + (err.stack||'').split('\\n').slice(0,3).join(' | '));
    }
    var div = document.createElement('div');
    div.id = 'probe-out'; div.style.display = 'none';
    div.textContent = JSON.stringify({ out: out, errs: window.__errs });
    document.body.appendChild(div);
  }, 500);
});
` + '<' + '/script>';

fs.writeFileSync(path.join(__dirname, '_probe.html'),
  html.replace('</body>', probe + '\n</body>'), 'utf8');
console.log('probe written');
