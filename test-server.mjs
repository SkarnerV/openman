import http from 'http';

const PORT = 3001;

const server = http.createServer((req, res) => {
  // Log incoming request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // Handle CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // /users endpoint
  if (url.pathname === '/users' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify({
      users: [
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' },
        { id: 3, name: 'Charlie', email: 'charlie@example.com' }
      ]
    }, null, 2));
    return;
  }

  // /delay/:ms endpoint
  if (url.pathname.startsWith('/delay/')) {
    const ms = parseInt(url.pathname.split('/')[2]) || 1000;
    res.setHeader('Content-Type', 'application/json');
    setTimeout(() => {
      res.writeHead(200);
      res.end(JSON.stringify({
        message: `Delayed by ${ms}ms`,
        timestamp: new Date().toISOString()
      }, null, 2));
    }, Math.min(ms, 10000));
    return;
  }

  // /status/:code endpoint
  if (url.pathname.startsWith('/status/')) {
    const code = parseInt(url.pathname.split('/')[2]) || 200;
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(code);
    res.end(JSON.stringify({
      status: code,
      message: `Returned status code ${code}`,
      timestamp: new Date().toISOString()
    }, null, 2));
    return;
  }

  // Default endpoint - echo request
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    const params = Object.fromEntries(url.searchParams);

    const headers = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (key.toLowerCase() !== 'host') {
        headers[key] = value;
      }
    }

    const response = {
      message: 'Hello, World!',
      timestamp: new Date().toISOString(),
      request: {
        method: req.method,
        path: url.pathname,
        query: params,
        headers: headers,
        body: body || null
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify(response, null, 2));
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 Test API server running at http://localhost:${PORT}`);
  console.log('\nEndpoints:');
  console.log('  GET  /           - Echo request');
  console.log('  GET  /users      - Mock users list');
  console.log('  GET  /delay/:ms  - Delayed response');
  console.log('  GET  /status/:code - Custom status code');
  console.log('\nPress Ctrl+C to stop\n');
});