# skilldeps PRD

## Problem

Agent skills often depend on local scripts, fixtures, tools, approval boundaries, and validation workflows that are only described in prose. A reviewer needs a fast read-only check before sharing or installing a skill.

## Goals

- Inspect one `SKILL.md`, a skill directory, or a root containing multiple skills.
- Extract references to relative files and directories.
- Identify sections that describe tools, inputs, side effects, approvals, examples, and validation.
- Report missing relative references and weak operational contracts.
- Produce JSON for automation and Markdown for review.

## Non-Goals

- Running skill scripts.
- Installing or approving skills.
- Calling external APIs.
- Mutating inspected folders.

## Users

- Agent builders preparing a public skill.
- Reviewers checking a skill pack before installation.
- CI jobs guarding reusable agent workflows.

## Acceptance Criteria

- Fixture-backed tests cover complete and incomplete skills.
- CLI exits non-zero when findings exceed the configured severity gate.
- Markdown output includes evidence lines for missing references.
- JSON output is stable enough for downstream checks.
