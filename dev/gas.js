// Loads the real apps-script/*.gs files into a Node.js sandbox with a fake
// SpreadsheetApp built from seed/seed.json. Development aid only.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

function fakeSpreadsheet(seed) {
  const sheets = {};
  for (const [name, cols] of Object.entries(seed.columns)) {
    const values = [cols.slice(), ...seed.tables[name].map(r => cols.map(c => r[c]))];
    sheets[name] = {
      values,
      getDataRange: () => ({ getValues: () => values.map(r => r.slice()) }),
      getLastColumn: () => values[0].length,
      getRange: (row, col, nr, nc) => ({
        getValues: () => values.slice(row - 1, row - 1 + (nr || 1)).map(r => r.slice(col - 1, col - 1 + (nc || 1))),
        setValue: v => { values[row - 1][col - 1] = v; }
      }),
      appendRow: r => values.push(r.slice())
    };
  }
  return { getSheetByName: n => sheets[n] || null, _sheets: sheets };
}

function load() {
  const seed = JSON.parse(fs.readFileSync(path.join(ROOT, 'seed', 'seed.json'), 'utf8'));
  const ss = fakeSpreadsheet(seed);
  const pad = n => String(n).padStart(2, '0');
  const context = {
    console,
    SpreadsheetApp: { getActiveSpreadsheet: () => ss, openById: () => ss },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => null }) },
    Utilities: { formatDate: d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}` },
    Logger: { log: m => console.log(m) }
  };
  vm.createContext(context);
  const dir = path.join(ROOT, 'apps-script');
  const code = fs.readdirSync(dir).filter(f => f.endsWith('.gs')).sort()
    .map(f => `// ${f}\n` + fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
  // Apps Script shares one global scope across files; expose the modules for the harness.
  vm.runInContext(code + '\n;this.Data = Data; this.Access = Access; this.CONFIG = CONFIG;', context, { filename: 'apps-script' });
  context._ss = ss;
  return context;
}

module.exports = { load, ROOT };
