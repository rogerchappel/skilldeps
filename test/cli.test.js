import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { run } from "../bin/skilldeps.js";

const cliPath = fileURLToPath(new URL("../bin/skilldeps.js", import.meta.url));
const projectRoot = fileURLToPath(new URL("..", import.meta.url));

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

for (const [option, value, diagnostic] of [
  ["--format", "xml", "Unsupported format: xml\n"],
  ["--fail-on", "bogus", "Unsupported severity gate: bogus\n"]
]) {
  test(`run validates ${option} without a path`, () => {
    const c = capture();
    const code = run([option, value], c.io);

    assert.equal(code, 2);
    assert.equal(c.output().stdout, "");
    assert.equal(c.output().stderr, diagnostic);
  });

  test(`executable validates ${option} without a path`, () => {
    const result = spawnSync(process.execPath, [cliPath, option, value], {
      cwd: projectRoot,
      encoding: "utf8"
    });

    assert.equal(result.status, 2);
    assert.equal(result.stdout, "");
    assert.equal(result.stderr, diagnostic);
  });
}

test("help does not hide an invalid option value", () => {
  const c = capture();
  const code = run(["--help", "--format", "xml"], c.io);

  assert.equal(code, 2);
  assert.equal(c.output().stdout, "");
  assert.equal(c.output().stderr, "Unsupported format: xml\n");
});

test("cli rejects all invalid inputs with a usage diagnostic", () => {
  const c = capture();
  const code = run(["does-not-exist", "README.md"], c.io);
  assert.equal(code, 2);
  assert.match(c.output().stderr, /Invalid skill inputs:/);
  assert.match(c.output().stderr, /does-not-exist: path does not exist/);
  assert.match(c.output().stderr, /README\.md: expected a SKILL\.md file/);
});

test("cli rejects mixed valid and invalid inputs", () => {
  const c = capture();
  const code = run(["fixtures/complete-skill", "does-not-exist"], c.io);
  assert.equal(code, 2);
  assert.equal(c.output().stdout, "");
  assert.match(c.output().stderr, /does-not-exist: path does not exist/);
});

test("cli audits multiple paths when every input is valid", () => {
  const c = capture();
  const code = run(["fixtures/complete-skill", "fixtures/incomplete-skill", "--format", "json"], c.io);
  assert.equal(code, 1);
  assert.equal(JSON.parse(c.output().stdout).summary.skills, 2);
  assert.equal(c.output().stderr, "");
});

test("cli fails on a missing shortcut-reference destination", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "skilldeps-cli-reference-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, "SKILL.md"), [
    "# CLI reference fixture",
    "See [guide].",
    "[guide]: ./missing.md"
  ].join("\n"));

  const c = capture();
  const code = run([root, "--format", "json"], c.io);
  const payload = JSON.parse(c.output().stdout);
  assert.equal(code, 1);
  assert.ok(payload.results[0].findings.some(({ code: findingCode, line }) => findingCode === "missing-reference" && line === 3));
});

test("cli rejects an unsupported option", () => {
  const c = capture();
  const code = run(["--bogus"], c.io);
  assert.equal(code, 2);
  assert.equal(c.output().stdout, "");
  assert.equal(c.output().stderr, "Unsupported option: --bogus\n");
});

test("cli rejects an unsupported option mixed with a valid path", () => {
  const c = capture();
  const code = run(["fixtures/complete-skill", "--bogus"], c.io);
  assert.equal(code, 2);
  assert.equal(c.output().stdout, "");
  assert.equal(c.output().stderr, "Unsupported option: --bogus\n");
});

test("cli accepts the documented format and fail-on options", () => {
  const c = capture();
  const code = run([
    "--format", "json",
    "fixtures/complete-skill",
    "--fail-on", "warning"
  ], c.io);
  assert.equal(code, 0);
  assert.equal(JSON.parse(c.output().stdout).summary.status, "pass");
  assert.equal(c.output().stderr, "");
});

for (const option of ["--format", "--fail-on"]) {
  for (const [scenario, argv] of [
    ["at the end of argv", ["fixtures/complete-skill", option]],
    ["before another option", ["fixtures/complete-skill", option, "--help"]]
  ]) {
    test(`run rejects ${option} without a value ${scenario}`, () => {
      const c = capture();
      const code = run(argv, c.io);

      assert.equal(code, 2);
      assert.equal(c.output().stdout, "");
      assert.equal(c.output().stderr, `Option requires a value: ${option}\n`);
    });

    test(`executable rejects ${option} without a value ${scenario}`, () => {
      const result = spawnSync(process.execPath, [cliPath, ...argv], {
        cwd: projectRoot,
        encoding: "utf8"
      });

      assert.equal(result.status, 2);
      assert.equal(result.stdout, "");
      assert.equal(result.stderr, `Option requires a value: ${option}\n`);
    });
  }
}

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

test("cli ignores code-context paths but reports an adjacent prose link", (t) => {
  const skill = fs.mkdtempSync(path.join(os.tmpdir(), "skilldeps-cli-code-contexts-"));
  t.after(() => fs.rmSync(skill, { recursive: true, force: true }));
  fs.writeFileSync(path.join(skill, "SKILL.md"), [
    "# code contexts",
    "## Usage",
    "## Tools",
    "## Side effects",
    "## Validation",
    "`[ignored](references/inline-missing.md)`",
    "    [ignored too](fixtures/indented-missing.md)",
    "[reported](references/prose-missing.md)"
  ].join("\n"));

  const c = capture();
  const code = run([skill, "--format", "json"], c.io);
  const payload = JSON.parse(c.output().stdout);
  const missing = payload.results[0].findings.filter(({ code: findingCode }) => findingCode === "missing-reference");

  assert.equal(code, 1);
  assert.deepEqual(
    missing.map(({ reference, line }) => ({ reference, line })),
    [{ reference: "references/prose-missing.md", line: 8 }]
  );
});

test("cli accepts normalized local destinations and preserves their spelling", (t) => {
  const skill = fs.mkdtempSync(path.join(os.tmpdir(), "skilldeps-cli-normalized-"));
  t.after(() => fs.rmSync(skill, { recursive: true, force: true }));
  fs.mkdirSync(path.join(skill, "references"));
  for (const file of ["encoded guide.md", "fragment.md", "combined guide.md", "bad%ZZ.md"]) {
    fs.writeFileSync(path.join(skill, "references", file), "# Present");
  }
  fs.writeFileSync(
    path.join(skill, "SKILL.md"),
    [
      "# normalized links",
      "## Usage",
      "## Tools",
      "## Side effects",
      "## Validation",
      "[encoded](<references/encoded%20guide.md>)",
      "[fragment](<references/fragment.md#intro>)",
      "[combined](<references/combined%20guide.md#intro>)",
      "[malformed](<references/bad%ZZ.md>)"
    ].join("\n")
  );

  const c = capture();
  const code = run([skill, "--format", "json"], c.io);
  const payload = JSON.parse(c.output().stdout);

  assert.equal(code, 0);
  assert.deepEqual(
    payload.results[0].references.map(({ value, exists }) => ({ value, exists })),
    [
      { value: "references/encoded%20guide.md", exists: true },
      { value: "references/fragment.md#intro", exists: true },
      { value: "references/combined%20guide.md#intro", exists: true },
      { value: "references/bad%ZZ.md", exists: true }
    ]
  );
});

test("cli accepts an existing balanced-parentheses Markdown destination", (t) => {
  const skill = fs.mkdtempSync(path.join(os.tmpdir(), "skilldeps-cli-parentheses-"));
  t.after(() => fs.rmSync(skill, { recursive: true, force: true }));
  fs.mkdirSync(path.join(skill, "references"));
  fs.writeFileSync(path.join(skill, "references/guide(v2).md"), "# Present");
  fs.writeFileSync(
    path.join(skill, "SKILL.md"),
    [
      "# parenthesized link",
      "## Usage",
      "## Tools",
      "## Side effects",
      "## Validation",
      "[guide](references/guide(v2).md)"
    ].join("\n")
  );

  const c = capture();
  const code = run([skill, "--format", "json"], c.io);
  const payload = JSON.parse(c.output().stdout);

  assert.equal(code, 0);
  assert.deepEqual(
    payload.results[0].references.map(({ value, exists }) => ({ value, exists })),
    [{ value: "references/guide(v2).md", exists: true }]
  );
});

for (const [label, destination] of [
  ["unbracketed double-quoted", 'references/missing.md "Setup guide"'],
  ["unbracketed single-quoted", "references/missing.md 'Setup guide'"],
  ["unbracketed parenthesized", "references/missing.md (Setup guide)"],
  ["angle double-quoted", '<references/missing.md> "Setup guide"'],
  ["angle single-quoted", "<references/missing.md> 'Setup guide'"],
  ["angle parenthesized", "<references/missing.md> (Setup guide)"]
]) {
  test(`cli reports a missing destination with a ${label} title`, (t) => {
    const skill = fs.mkdtempSync(path.join(os.tmpdir(), "skilldeps-cli-title-"));
    t.after(() => fs.rmSync(skill, { recursive: true, force: true }));
    fs.writeFileSync(
      path.join(skill, "SKILL.md"),
      `# titled link\n\nSee [missing guide](${destination}).\n`
    );

    const c = capture();
    const code = run([skill, "--format", "json"], c.io);
    const payload = JSON.parse(c.output().stdout);
    const finding = payload.results[0].findings.find(
      (candidate) => candidate.code === "missing-reference"
    );

    assert.equal(code, 1);
    assert.equal(finding?.reference, "references/missing.md");
    assert.equal(finding?.line, 3);
  });
}
