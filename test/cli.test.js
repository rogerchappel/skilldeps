import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { run } from "../bin/skilldeps.js";

function capture() {
  let stdout = "";
  let stderr = "";
  return {
    io: {
      stdout: { write: (chunk) => { stdout += chunk; } },
      stderr: { write: (chunk) => { stderr += chunk; } }
    },
    output: () => ({ stdout, stderr })
  };
}

test("cli renders markdown and passes complete fixture", () => {
  const c = capture();
  const code = run(["fixtures/complete-skill", "--format", "markdown"], c.io);
  assert.equal(code, 0);
  assert.match(c.output().stdout, /Status: pass/);
});

test("cli renders json and fails on missing reference", () => {
  const c = capture();
  const code = run(["fixtures/incomplete-skill", "--format", "json"], c.io);
  assert.equal(code, 1);
  const payload = JSON.parse(c.output().stdout);
  assert.equal(payload.summary.status, "fail");
});

test("cli validates format", () => {
  const c = capture();
  const code = run(["fixtures/complete-skill", "--format", "xml"], c.io);
  assert.equal(code, 2);
  assert.match(c.output().stderr, /Unsupported format/);
});

test("cli fails for a missing angle-bracket Markdown destination", (t) => {
  const skill = fs.mkdtempSync(path.join(os.tmpdir(), "skilldeps-cli-angle-"));
  t.after(() => fs.rmSync(skill, { recursive: true, force: true }));
  fs.writeFileSync(
    path.join(skill, "SKILL.md"),
    "# angle links\n\nSee [missing guide](<references/missing guide.md>).\n"
  );

  const c = capture();
  const code = run([skill, "--format", "json"], c.io);
  const payload = JSON.parse(c.output().stdout);

  assert.equal(code, 1);
  assert.equal(payload.summary.status, "fail");
  assert.equal(payload.summary.findings.error, 1);
  assert.equal(
    payload.results[0].findings.find(
      (finding) => finding.code === "missing-reference"
    )?.reference,
    "references/missing guide.md"
  );
});
