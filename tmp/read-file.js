const fs = require('fs');
const path = process.argv[2];
const start = parseInt(process.argv[3] || '1', 10);
const count = parseInt(process.argv[4] || '200', 10);
const number = process.argv[5] === 'n';
const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);
const out = lines.slice(start - 1, start - 1 + count);
if (number) {
  console.log(out.map((l, i) => String(start + i).padStart(4, ' ') + ': ' + l).join('\n'));
} else {
  console.log(out.join('\n'));
}
