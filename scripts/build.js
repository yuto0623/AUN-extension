const fs = require("fs");
const path = require("path");
const rootDir = path.join(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const artifactsDir = path.join(rootDir, "web-ext-artifacts");
const sourceManifestPath = path.join(rootDir, "manifest.json");
const sourceManifest = JSON.parse(fs.readFileSync(sourceManifestPath, "utf8"));

const browsers = {
  chrome: {
    artifactExtension: "zip",
    manifest: sourceManifest,
  },
  firefox: {
    artifactExtension: "xpi",
    manifest: {
      ...sourceManifest,
      browser_specific_settings: {
        gecko: {
          id: "{15ed1514-aa04-4baa-9a62-bc7365ac9f58}",
          strict_min_version: "109.0",
          data_collection_permissions: {
            required: ["websiteContent"],
            personally_identifiable: false,
            health: false,
            financial: false,
            authentication: false,
            location: false,
            browsing_activity: false,
            search_history: false,
            technical_and_interaction: false,
            website_content: true,
          },
        },
      },
    },
  },
};

const assetPaths = ["content.js", "overlay.css", "icons"];

function ensureEmptyDir(targetDir) {
  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(targetDir, { recursive: true });
}

function copyRecursive(sourcePath, destinationPath) {
  const stats = fs.statSync(sourcePath);

  if (stats.isDirectory()) {
    fs.mkdirSync(destinationPath, { recursive: true });
    for (const entry of fs.readdirSync(sourcePath)) {
      copyRecursive(
        path.join(sourcePath, entry),
        path.join(destinationPath, entry)
      );
    }
    return;
  }

  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  fs.copyFileSync(sourcePath, destinationPath);
}

function collectFiles(dir, base) {
  const entries = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      entries.push(...collectFiles(path.join(dir, entry.name), rel));
    } else {
      entries.push({ rel, abs: path.join(dir, entry.name) });
    }
  }
  return entries;
}

function createArchive(sourceDir, archivePath) {
  fs.rmSync(archivePath, { force: true });

  const files = collectFiles(sourceDir, "");
  const parts = [];

  for (const { rel, abs } of files) {
    const data = fs.readFileSync(abs);
    const nameBuffer = Buffer.from(rel, "utf8");

    // Local file header
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);  // signature
    header.writeUInt16LE(20, 4);          // version needed
    header.writeUInt16LE(0, 6);           // flags
    header.writeUInt16LE(0, 8);           // compression (store)
    header.writeUInt16LE(0, 10);          // mod time
    header.writeUInt16LE(0, 12);          // mod date
    header.writeUInt32LE(crc32(data), 14);
    header.writeUInt32LE(data.length, 18);
    header.writeUInt32LE(data.length, 22);
    header.writeUInt16LE(nameBuffer.length, 26);
    header.writeUInt16LE(0, 28);          // extra field length

    parts.push({ header, nameBuffer, data, rel });
  }

  const output = [];
  const centralDir = [];
  let offset = 0;

  for (const { header, nameBuffer, data } of parts) {
    // Central directory entry
    const cdEntry = Buffer.alloc(46);
    cdEntry.writeUInt32LE(0x02014b50, 0);   // signature
    cdEntry.writeUInt16LE(20, 4);           // version made by
    cdEntry.writeUInt16LE(20, 6);           // version needed
    cdEntry.writeUInt16LE(0, 8);            // flags
    cdEntry.writeUInt16LE(0, 10);           // compression
    cdEntry.writeUInt16LE(0, 12);           // mod time
    cdEntry.writeUInt16LE(0, 14);           // mod date
    header.copy(cdEntry, 16, 14, 30);       // crc, sizes, name/extra lengths
    cdEntry.writeUInt16LE(0, 32);           // comment length
    cdEntry.writeUInt16LE(0, 34);           // disk number
    cdEntry.writeUInt16LE(0, 36);           // internal attrs
    cdEntry.writeUInt32LE(0, 38);           // external attrs
    cdEntry.writeUInt32LE(offset, 42);      // local header offset
    centralDir.push(cdEntry, nameBuffer);

    output.push(header, nameBuffer, data);
    offset += header.length + nameBuffer.length + data.length;
  }

  const cdOffset = offset;
  const cdBuffers = Buffer.concat(centralDir);

  // End of central directory
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);                // disk number
  eocd.writeUInt16LE(0, 6);                // cd disk number
  eocd.writeUInt16LE(parts.length, 8);     // entries on this disk
  eocd.writeUInt16LE(parts.length, 10);    // total entries
  eocd.writeUInt32LE(cdBuffers.length, 12);
  eocd.writeUInt32LE(cdOffset, 16);
  eocd.writeUInt16LE(0, 20);               // comment length

  fs.writeFileSync(archivePath, Buffer.concat([...output, cdBuffers, eocd]));
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function buildBrowser(browserName, config) {
  const browserDistDir = path.join(distDir, browserName);
  ensureEmptyDir(browserDistDir);

  for (const assetPath of assetPaths) {
    copyRecursive(
      path.join(rootDir, assetPath),
      path.join(browserDistDir, assetPath)
    );
  }

  fs.writeFileSync(
    path.join(browserDistDir, "manifest.json"),
    `${JSON.stringify(config.manifest, null, 2)}\n`
  );

  const artifactPath = path.join(
    artifactsDir,
    `aun-task-counter-${browserName}.${config.artifactExtension}`
  );
  createArchive(browserDistDir, artifactPath);
  console.log(`Built ${path.basename(artifactPath)}`);
}

fs.mkdirSync(artifactsDir, { recursive: true });
fs.rmSync(artifactsDir, { recursive: true, force: true });
fs.mkdirSync(artifactsDir, { recursive: true });
ensureEmptyDir(distDir);

for (const [browserName, config] of Object.entries(browsers)) {
  buildBrowser(browserName, config);
}
