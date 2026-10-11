const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'frontend', 'src', 'components');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

const darkClassRegex = /\b(bg-slate-[789]\d\d?|bg-slate-950|bg-slate-900|bg-slate-800|bg-slate-700|bg-gray-[789]\d\d?|bg-zinc-[789]\d\d?)\b/g;

const report = {};

for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const matches = content.match(darkClassRegex);
  if (matches) {
    report[file] = {};
    for (const m of matches) {
      report[file][m] = (report[file][m] || 0) + 1;
    }
  }
}

console.log('Dark classes across components:');
console.log(JSON.stringify(report, null, 2));
