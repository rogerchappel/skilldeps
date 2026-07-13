import path from "node:path";

export function renderJson(payload) {
  return `${JSON.stringify(payload, null, 2)}\n`;
}

export function renderMarkdown(payload) {
  const lines = [
    "# skilldeps report",
    "",
    `Status: ${payload.summary.status}`,
    `Skills scanned: ${payload.summary.skills}`,
    `Findings: ${payload.summary.findings.error} error, ${payload.summary.findings.warning} warning, ${payload.summary.findings.info} info`,
    ""
  ];

  for (const result of payload.results) {
    lines.push(`## ${result.title}`, "");
    lines.push(`File: \`${path.relative(process.cwd(), result.file)}\``, "");
    lines.push("### Contracts", "");
    for (const [name, present] of Object.entries(result.contracts)) {
      lines.push(`- ${present ? "x" : " "} ${name}`);
    }
    lines.push("");
    lines.push("### References", "");
    if (result.references.length === 0) {
      lines.push("- No relative references found.");
    } else {
      for (const ref of result.references) {
        lines.push(`- ${ref.exists ? "ok" : "missing"} line ${ref.line}: \`${ref.value}\``);
      }
    }
    lines.push("");
    lines.push("### Findings", "");
    if (result.findings.length === 0) {
      lines.push("- No findings.");
    } else {
      for (const finding of result.findings) {
        lines.push(`- ${finding.severity.toUpperCase()} ${finding.code} line ${finding.line}: ${finding.message}`);
      }
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}
