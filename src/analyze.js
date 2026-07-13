const REQUIRED_CONTRACTS = [
  ["usage", "Document when the skill should be used."],
  ["tools", "List required tools or runtime dependencies."],
  ["sideEffects", "State side-effect boundaries."],
  ["validation", "Describe validation or smoke checks."]
];

export function analyzeSkill(parsed) {
  const findings = [];

  for (const [contract, message] of REQUIRED_CONTRACTS) {
    if (!parsed.contracts[contract]) {
      findings.push({
        severity: "warning",
        code: `missing-${contract}`,
        message,
        file: parsed.file,
        line: 1
      });
    }
  }

  for (const ref of parsed.references) {
    if (!ref.exists) {
      findings.push({
        severity: "error",
        code: "missing-reference",
        message: `Referenced path does not exist: ${ref.value}`,
        file: parsed.file,
        line: ref.line,
        reference: ref.value
      });
    }
  }

  if (/publish|send|delete|deploy|merge|approve|install/i.test(parsed.text) && !parsed.contracts.approvals) {
    findings.push({
      severity: "warning",
      code: "approval-boundary-missing",
      message: "Skill mentions external or mutating actions without an approval section.",
      file: parsed.file,
      line: 1
    });
  }

  return {
    title: parsed.title,
    file: parsed.file,
    contracts: parsed.contracts,
    references: parsed.references,
    findings
  };
}

export function summarize(results) {
  const counts = { info: 0, warning: 0, error: 0 };
  for (const result of results) {
    for (const finding of result.findings) {
      counts[finding.severity] += 1;
    }
  }
  return {
    skills: results.length,
    findings: counts,
    status: counts.error > 0 ? "fail" : counts.warning > 0 ? "warn" : "pass"
  };
}
