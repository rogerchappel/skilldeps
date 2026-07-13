import assert from "node:assert/strict";
import test from "node:test";
import { analyzeSkill } from "../src/analyze.js";
import { findSkillFiles, parseSkillFile } from "../src/scan.js";

test("finds direct and nested SKILL.md files", () => {
  const files = findSkillFiles(["fixtures"]);
  assert.equal(files.length, 2);
  assert.ok(files.every((file) => file.endsWith("SKILL.md")));
});

test("complete fixture has no findings", () => {
  const parsed = parseSkillFile("fixtures/complete-skill/SKILL.md");
  const result = analyzeSkill(parsed);
  assert.equal(result.findings.length, 0);
  assert.equal(result.references.length, 2);
});

test("incomplete fixture reports missing contracts and references", () => {
  const parsed = parseSkillFile("fixtures/incomplete-skill/SKILL.md");
  const result = analyzeSkill(parsed);
  assert.ok(result.findings.some((finding) => finding.code === "missing-reference"));
  assert.ok(result.findings.some((finding) => finding.code === "missing-tools"));
  assert.ok(result.findings.some((finding) => finding.code === "approval-boundary-missing"));
});
