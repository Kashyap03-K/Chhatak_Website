const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const DIST = path.join(__dirname, "dist");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

http
  .createServer((req, res) => {
    // Strip query string before resolving to a file.
    const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    const requested = path.join(DIST, urlPath === "/" ? "index.html" : urlPath);

    let filePath = requested;
    let ext = path.extname(filePath);
    // For SPA routes (no extension, or unknown path) fall through to index.html.
    // Never fall through for known static asset extensions — those must 404 or serve correctly.
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      if (ext && ext !== ".html") {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
        return;
      }
      filePath = path.join(DIST, "index.html");
      ext = ".html";
    }
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(res);
  })
  .listen(PORT, () => console.log(`Serving on port ${PORT}`));
