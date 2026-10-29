/**
 * Data.gs
 * The ONLY file that reads or writes the Google Sheet.
 * Every other file asks Data for rows as plain objects, for example
 *   Data.all('Students')  ->  [{ student_id: 'S2027-0001', display_name: '...', ... }, ...]
 * To move to another platform later, rewrite this file and keep the same functions.
 *
 * Data does not check permissions. Access.gs decides what a user may see.
 */

var Data = (function () {
  // Rows already read during this request, so each tab is read once per request.
  var cache = {};

  function spreadsheet_() {
    var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  }

  function sheet_(table) {
    if (!CONFIG.TABLES[table]) throw new Error('Unknown table: ' + table);
    var sh = spreadsheet_().getSheetByName(table);
    if (!sh) throw new Error('The Sheet has no tab named ' + table + '.');
    return sh;
  }

  // Dates and numbers are turned into plain text or numbers that the browser can receive.
  function clean_(value) {
    if (value instanceof Date) {
      return Utilities.formatDate(value, 'Asia/Singapore', 'yyyy-MM-dd HH:mm').replace(' 00:00', '');
    }
    return value === null || value === undefined ? '' : value;
  }

  // Text is written with a leading apostrophe, which tells Sheets to keep it exactly as typed.
  // Without it, Sheets would turn "3/4" into a date and run text starting with = as a formula.
  // The apostrophe is not stored; reading the cell back gives the original text.
  function safe_(value) {
    return typeof value === 'string' && value !== '' ? "'" + value : value;
  }

  /** All rows of a table, as objects keyed by column name. Returns copies. */
  function all(table) {
    if (!cache[table]) {
      var values = sheet_(table).getDataRange().getValues();
      var header = values.shift();
      cache[table] = values
        .filter(function (row) { return row.join('') !== ''; })
        .map(function (row) {
          var obj = {};
          header.forEach(function (col, i) { obj[col] = clean_(row[i]); });
          return obj;
        });
    }
    return cache[table].map(function (r) { return Object.assign({}, r); });
  }

  /** Rows of a table for which test(row) is true. */
  function where(table, test) {
    return all(table).filter(test);
  }

  /** Adds one row. Missing columns are left blank. Returns the stored object. */
  function insert(table, record) {
    var cols = CONFIG.TABLES[table];
    sheet_(table).appendRow(cols.map(function (c) { return record[c] === undefined ? '' : safe_(record[c]); }));
    delete cache[table];
    return record;
  }

  /** Adds several rows in one write, which is much faster than one insert per row. */
  function insertMany(table, records) {
    if (!records.length) return records;
    var cols = CONFIG.TABLES[table];
    var sh = sheet_(table);
    var rows = records.map(function (rec) {
      return cols.map(function (c) { return rec[c] === undefined ? '' : safe_(rec[c]); });
    });
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, cols.length).setValues(rows);
    delete cache[table];
    return records;
  }

  /** Runs fn while holding a lock, so two people saving at once cannot get the same new id. */
  function withLock(fn) {
    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try { return fn(); } finally { lock.releaseLock(); }
  }

  /** Changes some columns of the row whose first column equals id. */
  function update(table, id, changes) {
    var sh = sheet_(table);
    var values = sh.getDataRange().getValues();
    var header = values[0];
    for (var r = 1; r < values.length; r++) {
      if (String(values[r][0]) === String(id)) {
        Object.keys(changes).forEach(function (col) {
          var c = header.indexOf(col);
          if (c < 0) throw new Error('Unknown column ' + col + ' in ' + table);
          sh.getRange(r + 1, c + 1).setValue(safe_(changes[col]));
        });
        delete cache[table];
        return true;
      }
    }
    throw new Error(table + ' has no row with id ' + id);
  }

  /** Next id such as R00313, based on the highest existing id with that prefix. */
  function nextId(table, prefix, width) {
    var idCol = CONFIG.TABLES[table][0];
    var max = 0;
    all(table).forEach(function (r) {
      var s = String(r[idCol]);
      if (s.indexOf(prefix) === 0) max = Math.max(max, parseInt(s.slice(prefix.length), 10) || 0);
    });
    var n = String(max + 1);
    while (n.length < width) n = '0' + n;
    return prefix + n;
  }

  /** Checks that every tab exists with the expected header row. Returns a list of problems. */
  function checkSchema() {
    var problems = [];
    var ss = spreadsheet_();
    Object.keys(CONFIG.TABLES).forEach(function (table) {
      var sh = ss.getSheetByName(table);
      if (!sh) { problems.push('Missing tab: ' + table); return; }
      var header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
      var expected = CONFIG.TABLES[table];
      if (header.join('|') !== expected.join('|')) {
        problems.push(table + ' header is "' + header.join(', ') + '" but should be "' + expected.join(', ') + '"');
      }
    });
    return problems;
  }

  /** Forgets cached rows. Called at the start of each request. */
  function reset() { cache = {}; }

  return {
    all: all, where: where, insert: insert, insertMany: insertMany, update: update,
    nextId: nextId, withLock: withLock, checkSchema: checkSchema, reset: reset
  };
})();
