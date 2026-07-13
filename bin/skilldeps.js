#!/usr/bin/env node
import { analyzeSkill, summarize } from "../src/analyze.js";
import { renderJson, renderMarkdown } from "../src/report.js";
import { findSkillFiles, parseSkillFile } from "../src/scan.js";

const SEVERITY = { info: 0, warning: 1, error: 2 };

function parseArgs(argv) {
  const args = {
    paths: [],
    format: "markdown",
    failOn: "error"
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--format") args.format = argv[++index];
    else if (value === "--fail-on") args.failOn = argv[++index];
    else if (value === "--help" || value === "-h") args.help = true;
    else args.paths.push(value);
  }
  return args;
}

function usage() {
  return `skilldeps <path...> [--format markdown|json] [--fail-on info|warning|error]

Audit agent SKILL.md files for missing references and weak contracts.
`;
}

export function run(argv = process.argv.slice(2), io = process) {
  const args = parseArgs(argv);
  if (args.help || args.paths.length === 0) {
    io.stdout.write(usage());
    return 0;
  }
  if (!["markdown", "json"].includes(args.format)) {
    io.stderr.write(`Unsupported format: ${args.format}\n`);
    return 2;
  }
  if (!(args.failOn in SEVERITY)) {
    io.stderr.write(`Unsupported severity gate: ${args.failOn}\n`);
    return 2;
  }

  const files = findSkillFiles(args.paths);
  if (files.length === 0) {
    io.stderr.write("No SKILL.md files found.\n");
    return 2;
  }

  const results = files.map((file) => analyzeSkill(parseSkillFile(file)));
  const payload = { summary: summarize(results), results };
  io.stdout.write(args.format === "json" ? renderJson(payload) : renderMarkdown(payload));

  const hasBlockingFinding = results.some((result) =>
    result.findings.some((finding) => SEVERITY[finding.severity] >= SEVERITY[args.failOn])
  );
  return hasBlockingFinding ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = run();
}
