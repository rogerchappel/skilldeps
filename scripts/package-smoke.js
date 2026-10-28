import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = mkdtempSync(join(tmpdir(), "skilldeps-pack-"));
try {
  const pack = spawnSync("npm", ["pack", "--json", "--pack-destination", root], { encoding: "utf8" });
  if (pack.status !== 0) throw new Error(pack.stderr || "npm pack failed");
  const [{ filename, files }] = JSON.parse(pack.stdout);
  const packed = new Set(files.map(({ path }) => path));
  const required = ["package.json", "README.md", "SKILL.md", "bin/skilldeps.js", "src/index.js"];
  for (const path of required) {
    if (!packed.has(path)) throw new Error(`package is missing required file: ${path}`);
  }
  const archive = gunzipSync(readFileSync(join(root, filename)));
  const tar = archive.toString("binary");
  const entry = tar.indexOf("package/package.json");
  if (entry < 0) throw new Error("packed archive is missing package/package.json");
  const headerOffset = Math.floor(entry / 512) * 512;
  const header = archive.subarray(headerOffset, headerOffset + 512);
  const dataOffset = headerOffset + 512;
  const size = parseInt(header.toString("utf8", 124, 136).replace(/\0.*$/, "").trim(), 8);
  const manifest = JSON.parse(archive.subarray(dataOffset, dataOffset + size).toString("utf8"));
  for (const field of ["name", "version", "description", "type", "exports", "bin", "engines", "license"]) {
    if (!(field in manifest)) throw new Error(`packed package.json is missing required metadata: ${field}`);
  }
  console.log(`package smoke passed: ${filename} contains required runtime files and metadata`);
} finally {
  rmSync(root, { recursive: true, force: true });
}
