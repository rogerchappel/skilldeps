import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { analyzeSkill } from "../src/analyze.js";
import { auditSkills } from "../src/index.js";
import { findSkillFiles, parseSkillFile } from "../src/scan.js";

test("finds direct and nested SKILL.md files", () => {
  const files = findSkillFiles(["fixtures"]);
  assert.equal(files.length, 2);
  assert.ok(files.every((file) => file.endsWith("SKILL.md")));
});

test("recursively audits root, child, and grandchild skills", (t) => {
  const pack = fs.mkdtempSync(path.join(os.tmpdir(), "skilldeps-pack-"));
  t.after(() => fs.rmSync(pack, { recursive: true, force: true }));

  const validSkill = fs.readFileSync("fixtures/complete-skill/SKILL.md", "utf8");
  for (const relative of ["", "child", "child/grandchild"]) {
    const directory = path.join(pack, relative);
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, "SKILL.md"), validSkill);
    fs.mkdirSync(path.join(directory, "fixtures"), { recursive: true });
    fs.writeFileSync(path.join(directory, "fixtures/sample.md"), "fixture");
    fs.mkdirSync(path.join(directory, "scripts"), { recursive: true });
    fs.writeFileSync(path.join(directory, "scripts/check.js"), "");
  }
  fs.appendFileSync(
    path.join(pack, "child/grandchild/SKILL.md"),
    "\nMissing fixture: fixtures/not-found.md\n"
  );

  const payload = auditSkills([pack]);
  assert.deepEqual(
    payload.results.map((result) => path.relative(pack, result.file)),
    ["SKILL.md", "child/SKILL.md", "child/grandchild/SKILL.md"]
  );
  assert.equal(payload.summary.skills, 3);
  assert.equal(payload.summary.status, "fail");
  assert.ok(
    payload.results[2].findings.some(
      (finding) => finding.code === "missing-reference"
    )
  );
});

test("skips dependency and version-control trees", (t) => {
  const pack = fs.mkdtempSync(path.join(os.tmpdir(), "skilldeps-excluded-"));
  t.after(() => fs.rmSync(pack, { recursive: true, force: true }));

  for (const relative of ["node_modules/package", ".git/hooks"]) {
    const directory = path.join(pack, relative);
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, "SKILL.md"), "# ignored");
  }

  assert.deepEqual(findSkillFiles([pack]), []);
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

test("resolves angle-bracket Markdown destinations containing spaces", (t) => {
  const skill = fs.mkdtempSync(path.join(os.tmpdir(), "skilldeps-angle-present-"));
  t.after(() => fs.rmSync(skill, { recursive: true, force: true }));

  fs.mkdirSync(path.join(skill, "references"));
  fs.writeFileSync(path.join(skill, "references/present guide.md"), "# Present");
  fs.writeFileSync(
    path.join(skill, "SKILL.md"),
    "# angle links\n\nSee [the guide](<references/present guide.md>).\n"
  );

  const parsed = parseSkillFile(path.join(skill, "SKILL.md"));
  assert.deepEqual(
    parsed.references.map(({ value, line, exists }) => ({ value, line, exists })),
    [{ value: "references/present guide.md", line: 3, exists: true }]
  );
});

test("reports missing angle-bracket Markdown destinations on the source line", (t) => {
  const skill = fs.mkdtempSync(path.join(os.tmpdir(), "skilldeps-angle-missing-"));
  t.after(() => fs.rmSync(skill, { recursive: true, force: true }));

  fs.writeFileSync(
    path.join(skill, "SKILL.md"),
    "# angle links\n\nSee [the guide](<references/missing guide.md>).\n"
  );

  const result = analyzeSkill(parseSkillFile(path.join(skill, "SKILL.md")));
  const finding = result.findings.find(
    (candidate) => candidate.code === "missing-reference"
  );
  assert.equal(finding?.reference, "references/missing guide.md");
  assert.equal(finding?.line, 3);
});
