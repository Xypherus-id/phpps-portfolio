// Loads the real apps-script/*.gs files into a Node.js sandbox with a fake
// SpreadsheetApp filled by buildDemoData_() in Seed.gs. Development aid only.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

function fakeSpreadsheet(columns, data) {
  const sheets = {};
  for (const [name, cols] of Object.entries(columns)) {
    const values = [cols.slice(), ...data[name].map(r => r.slice())];
    // Like Sheets, a leading apostrophe marks text and is not part of the value read back.
    const read = v => (typeof v === 'string' && v[0] === "'" ? v.slice(1) : v);
    sheets[name] = {
      values,
      getDataRange: () => ({ getValues: () => values.map(r => r.map(read)) }),
      getLastColumn: () => values[0].length,
      getLastRow: () => values.length,
      getRange: (row, col, nr, nc) => ({
        getValues: () => values.slice(row - 1, row - 1 + (nr || 1)).map(r => r.slice(col - 1, col - 1 + (nc || 1))),
        setValue: v => { values[row - 1][col - 1] = v; },
        setValues: rows => rows.forEach((r, i) => { values[row - 1 + i] = r.slice(); })
      }),
      appendRow: r => values.push(r.slice())
    };
  }
  return { getSheetByName: n => sheets[n] || null, _sheets: sheets };
}

function load() {
  const ss = { getSheetByName: () => null };
  const pad = n => String(n).padStart(2, '0');
  const props = {};
  const files = {};
  const blob = (bytes, type, name) => ({ getBytes: () => bytes, getContentType: () => type, getName: () => name });
  const context = {
    console,
    SpreadsheetApp: { getActiveSpreadsheet: () => ss, openById: () => ss },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] || null, setProperty: (k, v) => { props[k] = v; } }) },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
    DriveApp: {
      createFolder: name => ({ getId: () => 'folder1', createFile: b => { const id = 'file' + (Object.keys(files).length + 1); files[id] = b; return { getId: () => id }; } }),
      getFolderById: () => context.DriveApp.createFolder(),
      getFileById: id => { if (!files[id]) throw new Error('No file'); return { getBlob: () => files[id] }; }
    },
    Utilities: {
      formatDate: d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`,
      base64Decode: s => Array.from(Buffer.from(s, 'base64')),
      base64Encode: bytes => Buffer.from(bytes).toString('base64'),
      newBlob: blob
    },
    Logger: { log: m => console.log(m) },
    Session: { getActiveUser: () => ({ getEmail: () => '' }), getEffectiveUser: () => ({ getEmail: () => 'owner@example.com' }) }
  };
  vm.createContext(context);
  const dir = path.join(ROOT, 'apps-script');
  const code = fs.readdirSync(dir).filter(f => f.endsWith('.gs')).sort()
    .map(f => `// ${f}\n` + fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
  // Apps Script shares one global scope across files; expose the modules for the harness.
  vm.runInContext(code + '\n;this.Data = Data; this.Access = Access; this.CONFIG = CONFIG; this.Scan = Scan; this.Portfolio = Portfolio;', context, { filename: 'apps-script' });
  // Fill the fake Sheet with the same demo data that Seed.gs writes in Google.
  const filled = fakeSpreadsheet(context.CONFIG.TABLES, context.buildDemoData_());
  Object.assign(ss, filled);
  context._ss = ss;
  context._files = files;
  return context;
}

module.exports = { load, ROOT };
