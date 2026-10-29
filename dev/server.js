// Serves the web app locally with a stand-in for google.script.run.
// Usage: node dev/server.js [port]
const http = require('http');
const fs = require('fs');
const path = require('path');
const { load, ROOT } = require('./gas');

const gas = load();
const port = Number(process.argv[2] || 8080);

const shim = `<script>
  // Local stand-in for google.script.run: forwards calls to the dev server.
  window.google = { script: { run: (function make(ok, fail) {
    return new Proxy({}, { get: function (_, name) {
      if (name === 'withSuccessHandler') return function (f) { return make(f, fail); };
      if (name === 'withFailureHandler') return function (f) { return make(ok, f); };
      return function () {
        fetch('/rpc/' + name, { method: 'POST', body: JSON.stringify([].slice.call(arguments)) })
          .then(function (r) { return r.json(); })
          .then(function (j) { j.error ? fail && fail(new Error(j.error)) : ok && ok(j.result); });
      };
    }});
  })() } };
</script>`;

function page() {
  const read = n => fs.readFileSync(path.join(ROOT, 'apps-script', n + '.html'), 'utf8');
  return read('Index')
    .replace(/<\?!= include\('(\w+)'\); \?>/g, (_, n) => (n === 'Client' ? shim : '') + read(n))
    .replace('<head>', '<head><meta name="viewport" content="width=device-width, initial-scale=1">');
}

http.createServer((req, res) => {
  if (req.method === 'POST' && req.url.startsWith('/rpc/')) {
    let body = '';
    req.on('data', c => (body += c));
    req.on('end', () => {
      const name = req.url.slice(5);
      let out;
      try {
        if (!/^api_\w+$/.test(name)) throw new Error('Not an api function');
        out = { result: JSON.parse(JSON.stringify(gas[name](...JSON.parse(body || '[]')))) };
      } catch (e) { out = { error: e.message }; }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(out));
    });
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(page());
}).listen(port, () => console.log('Dev server on http://localhost:' + port));
