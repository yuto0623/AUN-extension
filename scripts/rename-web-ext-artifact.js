const fs = require("fs");
const path = require("path");

const artifactsDir = path.join(__dirname, "..", "web-ext-artifacts");

if (!fs.existsSync(artifactsDir)) {
  console.error(`Artifacts directory not found: ${artifactsDir}`);
  process.exit(1);
}

const artifactFiles = fs
  .readdirSync(artifactsDir)
  .map((name) => {
    const filePath = path.join(artifactsDir, name);
    const stats = fs.statSync(filePath);
    return { name, filePath, mtimeMs: stats.mtimeMs, isFile: stats.isFile() };
  })
  .filter((entry) => entry.isFile)
  .sort((a, b) => b.mtimeMs - a.mtimeMs);

const latestZip = artifactFiles.find((entry) => entry.name.endsWith(".zip"));

if (latestZip) {
  const xpiPath = latestZip.filePath.replace(/\.zip$/i, ".xpi");
  if (fs.existsSync(xpiPath)) {
    fs.unlinkSync(xpiPath);
  }
  fs.renameSync(latestZip.filePath, xpiPath);
  console.log(`Renamed ${path.basename(latestZip.filePath)} -> ${path.basename(xpiPath)}`);
  process.exit(0);
}

const latestXpi = artifactFiles.find((entry) => entry.name.endsWith(".xpi"));

if (latestXpi) {
  console.log(`Latest artifact already uses .xpi: ${latestXpi.name}`);
  process.exit(0);
}

console.error("No .zip or .xpi artifact found in web-ext-artifacts.");
process.exit(1);
