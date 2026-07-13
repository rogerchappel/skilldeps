import fs from "node:fs";
import path from "node:path";

const SECTION_PATTERNS = {
  usage: /when to use|use this skill|trigger/i,
  tools: /required tools|tools|dependencies/i,
  inputs: /inputs|required inputs/i,
  sideEffects: /side.?effect|boundaries|external actions/i,
  approvals: /approval|permission/i,
  examples: /examples?/i,
  validation: /validation|verification|test|smoke/i
};

const REF_PATTERN = /(?:\]\(|(?:file|path|script|fixture|template|asset)s?\s*[:=-]\s*|`)(\.{1,2}\/[^`)`\s]+|[A-Za-z0-9_.-]+\/[A-Za-z0-9_./-]+)(?:\)|`)?/gi;

export function findSkillFiles(inputs) {
  const found = [];
  for (const input of inputs) {
    const absolute = path.resolve(input);
    if (!fs.existsSync(absolute)) continue;
    const stat = fs.statSync(absolute);
    if (stat.isFile() && path.basename(absolute) === "SKILL.md") {
      found.push(absolute);
      continue;
    }
    if (stat.isDirectory()) {
      const direct = path.join(absolute, "SKILL.md");
      if (fs.existsSync(direct)) {
        found.push(direct);
        continue;
      }
      for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const nested = path.join(absolute, entry.name, "SKILL.md");
        if (fs.existsSync(nested)) found.push(nested);
      }
    }
  }
  return [...new Set(found)].sort();
}

export function parseSkillFile(file) {
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);
  const sections = {};
  let current = "preamble";

  lines.forEach((line, index) => {
    const heading = line.match(/^#{1,4}\s+(.+?)\s*$/);
    if (heading) current = heading[1].trim();
    sections[current] ??= [];
    sections[current].push({ number: index + 1, text: line });
  });

  return {
    file,
    root: path.dirname(file),
    title: extractTitle(lines) ?? path.basename(path.dirname(file)),
    text,
    lines,
    sections,
    contracts: detectContracts(sections, text),
    references: extractReferences(text, file)
  };
}

function extractTitle(lines) {
  const heading = lines.find((line) => /^#\s+/.test(line));
  return heading?.replace(/^#\s+/, "").trim();
}

function detectContracts(sections, text) {
  const contracts = {};
  for (const [name, pattern] of Object.entries(SECTION_PATTERNS)) {
    contracts[name] = Object.keys(sections).some((section) => pattern.test(section));
  }
  contracts.usage ||= /use this skill when|when an agent needs|trigger/i.test(text);
  return contracts;
}

function extractReferences(text, file) {
  const refs = [];
  for (const match of text.matchAll(REF_PATTERN)) {
    const value = cleanReference(match[1]);
    if (!value || shouldIgnore(value)) continue;
    const line = text.slice(0, match.index).split(/\r?\n/).length;
    const resolved = path.resolve(path.dirname(file), value);
    refs.push({
      value,
      line,
      exists: fs.existsSync(resolved),
      resolved
    });
  }
  return uniqueRefs(refs);
}

function cleanReference(value) {
  return value.replace(/[.,;:]+$/, "").replace(/^['"]|['"]$/g, "");
}

function shouldIgnore(value) {
  return /^https?:/i.test(value) || value.includes("://") || value.startsWith("#");
}

function uniqueRefs(refs) {
  const seen = new Set();
  return refs.filter((ref) => {
    const key = `${ref.value}:${ref.line}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
