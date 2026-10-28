const http = require('http');
const fs = require('fs');
const path = require('path');

let port = parseInt(process.env.PORT || '3000', 10);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  req.on('error', (err) => {
    console.error('Request error:', err.message);
  });
  res.on('error', (err) => {
    console.error('Response error:', err.message);
  });

  let reqPath;
  try {
    reqPath = decodeURIComponent(req.url.split('?')[0]);
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('400 Bad Request');
    return;
  }
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  
  const safeRoot = path.resolve(__dirname) + path.sep;
  const filePath = path.resolve(__dirname, '.' + reqPath);
  if (filePath !== __dirname && !filePath.startsWith(safeRoot)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const isSw = path.basename(filePath) === 'sw.js';

    const headers = {
      'Content-Type': contentType,
      'Cache-Control': isSw ? 'no-cache, no-store, must-revalidate' : 'no-cache'
    };
    if (isSw) {
      headers['Service-Worker-Allowed'] = '/';
    }

    res.writeHead(200, headers);

    const readStream = fs.createReadStream(filePath);
    readStream.on('error', (streamErr) => {
      console.error('Stream error:', streamErr.message);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('500 Internal Server Error');
      }
    });

    res.on('close', () => {
      readStream.destroy();
    });

    readStream.pipe(res);
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${port} in use, trying port ${port + 1}...`);
    port++;
    server.listen(port);
  } else {
    console.error('Server error:', err);
  }
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});

server.listen(port, () => {
  console.log(`Portfolio running locally at http://localhost:${port}/`);
});
