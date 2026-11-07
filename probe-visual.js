/* Generate visual-check pages (default paint view + GUI background painter) */
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
function make(file, script) {
  const inject = '<script>window.addEventListener("load",function(){setTimeout(function(){' +
    script + '},350);});' + '<' + '/script>';
  fs.writeFileSync(path.join(__dirname, file),
    html.replace('</body>', inject + '</body>'), 'utf8');
}
make('_visual_paint.html', `
  try {
    var ws = BF.state.elements.filter(function(e){return e.type==='workstation';})[0];
    BF.state.selected=ws.id; BF.state.view='element'; BF.state.tab='paint'; BF.rebuild();
  } catch(e) {}
`);
make('_visual_gui.html', `
  try {
    var ws = BF.state.elements.filter(function(e){return e.type==='workstation';})[0];
    BF.state.selected=ws.id; BF.state.view='element'; BF.state.tab='gui'; BF.rebuild();
    var btn=document.querySelector('[data-act="gui-paint-import"]'); if(btn) btn.click();
    var c=document.querySelector('#ws-content'); if(c) c.scrollTop=760;
  } catch(e) {}
`);
make('_visual_mob.html', `
  try {
    var mob = BF.state.elements.filter(function(e){return e.type==='mob';})[0];
    BF.state.selected=mob.id; BF.state.view='element'; BF.state.tab='mob'; BF.rebuild();
  } catch(e) {}
`);
console.log('visual pages written');
