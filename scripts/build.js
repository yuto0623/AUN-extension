const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

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
          id: "aun-task-counter@phonogram.co.jp",
          strict_min_version: "109.0",
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

function createArchive(sourceDir, archivePath) {
  fs.rmSync(archivePath, { force: true });
  const archiveDir = path.dirname(archivePath);
  const archiveBaseName = path.basename(archivePath, path.extname(archivePath));
  const zipPath = path.join(archiveDir, `${archiveBaseName}.zip`);
  fs.rmSync(zipPath, { force: true });

  const escapedSourceDir = sourceDir.replace(/'/g, "''");
  const escapedZipPath = zipPath.replace(/'/g, "''");
  const result = spawnSync(
    "powershell",
    [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      [
        "Add-Type -AssemblyName System.IO.Compression.FileSystem",
        `[System.IO.Compression.ZipFile]::CreateFromDirectory('${escapedSourceDir}', '${escapedZipPath}')`,
      ].join("; "),
    ],
    { stdio: "inherit" }
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  if (zipPath !== archivePath) {
    fs.renameSync(zipPath, archivePath);
  }
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
