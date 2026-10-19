// 빌드: js/*.js 모듈을 하나로 합쳐 서버 없이 더블클릭으로 실행되는 index.html 을 만든다.
// 사용법: node build.js
const fs = require('fs'), path = require('path');
const dir = __dirname;
const order = ['data.js', 'models.js', 'audio.js', 'game.js'];
let code = "import * as THREE from 'three';\n";
for (const f of order) {
  const src = fs.readFileSync(path.join(dir, 'js', f), 'utf8')
    .replace(/^import .*$/gm, '')
    .replace(/^export /gm, '');
  code += `\n// ───── ${f} ─────\n${src}\n`;
}
const html = fs.readFileSync(path.join(dir, 'dev.html'), 'utf8')
  .replace('<script type="module" src="js/game.js"></script>', () => `<script type="module">\n${code}</script>`);
fs.writeFileSync(path.join(dir, 'index.html'), html);
console.log('index.html built (' + Math.round(html.length / 1024) + ' KB)');
