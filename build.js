/* Build the single-file deliverable: inline CSS + JS into shell.html */
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const src = path.join(dir, 'src');
const read = f => fs.readFileSync(path.join(src, f), 'utf8');

const css = read('styles.css');
const jsFiles = ['core.js', 'zip.js', 'pixel.js', 'usage.js', 'wrapper.js', 'export.js', 'ui.js', 'app.js'];
const js = jsFiles.map(f => '\n/* ===== ' + f + ' ===== */\n' + read(f)).join('\n');

if (js.indexOf('</script') >= 0) throw new Error('JS bundle contains a script closing tag');

let html = read('shell.html');
html = html.replace('@@CSS@@', () => css).replace('@@JS@@', () => js);
const out = path.join(dir, 'index.html');
fs.writeFileSync(out, html, 'utf8');
console.log('Built ' + out);
console.log('  CSS ' + css.length + ' chars, JS ' + js.length + ' chars, total ' + html.length + ' chars');
console.log('  JS modules: ' + jsFiles.join(', '));

/* same tutorial content is also written as a standalone GitHub-ready Markdown file */
require(path.join(src, 'usage.js'));
const usage = globalThis.BF.USAGE_MD;
const usagePath = path.join(dir, '使用教程.md');
fs.writeFileSync(usagePath, usage, 'utf8');
console.log('Wrote ' + usagePath + ' (' + usage.length + ' chars)');
