import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { auditSkills } from "../src/index.js";

test("auditSkills returns summary and results", () => {
  const payload = auditSkills(["fixtures/complete-skill"]);
  assert.equal(payload.summary.status, "pass");
  assert.equal(payload.results.length, 1);
});

test("auditSkills reports a missing reference-style destination", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "skilldeps-api-reference-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, "SKILL.md"), [
    "# API reference fixture",
    "See [the guide][guide].",
    "[guide]: ./missing.md"
  ].join("\n"));

  const payload = auditSkills([root]);
  assert.equal(payload.summary.status, "fail");
  assert.ok(payload.results[0].findings.some(({ code, line }) => code === "missing-reference" && line === 3));
});
