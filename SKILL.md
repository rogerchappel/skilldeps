# skilldeps

Use this skill when an agent needs to audit one or more agent `SKILL.md` folders for missing references, unclear tool requirements, weak side-effect boundaries, or absent validation instructions.

## Inputs

- A path to a `SKILL.md` file, a skill directory, or a directory containing multiple skills.
- Optional severity gate: `info`, `warning`, or `error`.
- Optional output format: `json` or `markdown`.

## Required Tools

- Local filesystem read access.
- Node.js 18 or newer when using the CLI.

## Side-Effect Boundaries

This skill is read-only. Do not execute scripts mentioned by the inspected skill. Do not install dependencies, approve skills, write into live skill directories, or call external services as part of this audit.

## Approval Requirements

No approval is needed for local read-only analysis. Ask for explicit approval before combining this report with any action that mutates a skill, installs it, applies a proposal, or writes to a remote service.

## Workflow

1. Run `skilldeps <path> --format markdown`.
2. Review missing references and contract warnings.
3. If using CI, rerun with `--fail-on warning` or `--fail-on error`.
4. Fix the skill separately and rerun the audit.

## Examples

```bash
skilldeps ~/.openclaw/agents/main/agent/codex-home/skills/.system/imagegen
skilldeps ./skills --format json --fail-on warning
```

## Validation

Run:

```bash
npm test
npm run smoke
```
