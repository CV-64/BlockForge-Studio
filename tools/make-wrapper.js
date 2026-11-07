/* Build src/wrapper.js from the extracted Gradle wrapper files.
   Usage: node tools/make-wrapper.js                                        */
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..');
const w = path.join(dir, 'wrapper');

const jar = fs.readFileSync(path.join(w, 'gradle', 'wrapper', 'gradle-wrapper.jar'));
const props = fs.readFileSync(path.join(w, 'gradle', 'wrapper', 'gradle-wrapper.properties'), 'utf8');
const sh = fs.readFileSync(path.join(w, 'gradlew'), 'utf8');
const bat = fs.readFileSync(path.join(w, 'gradlew.bat'), 'utf8');

const b64 = jar.toString('base64');
const chunks = [];
for (let i = 0; i < b64.length; i += 120) chunks.push("  '" + b64.slice(i, i + 120) + "',");

const js = `/* ============================================================
   BlockForge Studio — Gradle Wrapper 内置资源
   来自 Forge 1.20.1-47.3.0 MDK（Apache-2.0），让导出包自带 wrapper，
   用户无需安装 Gradle 即可直接 ./gradlew build。
   由 tools/make-wrapper.js 生成，请勿手改。
   ============================================================ */
(function (root) {
'use strict';
var BF = root.BF = root.BF || {};

BF.GRADLE_WRAPPER_JAR_B64 = [
${chunks.join('\n')}
].join('');

BF.GRADLE_WRAPPER_PROPERTIES = ${JSON.stringify(props)};

BF.GRADLEW = ${JSON.stringify(sh)};

BF.GRADLEW_BAT = ${JSON.stringify(bat)};

})(typeof window !== 'undefined' ? window : globalThis);
`;

fs.writeFileSync(path.join(dir, 'src', 'wrapper.js'), js, 'utf8');
console.log('src/wrapper.js written:', js.length, 'chars | jar b64:', b64.length);
