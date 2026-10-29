// Writes the Seed.gs demo data to seed/seed.json, then seed/to_xlsx.py turns it into Excel.
// Usage: npm run seed
const fs = require('fs');
const path = require('path');
const { load, ROOT } = require('./gas');

const gas = load();
const out = { columns: gas.CONFIG.TABLES, tables: gas.buildDemoData_() };
fs.writeFileSync(path.join(ROOT, 'seed', 'seed.json'), JSON.stringify(out));
console.log(Object.entries(out.tables).map(([t, r]) => `${t} ${r.length}`).join(', '));
