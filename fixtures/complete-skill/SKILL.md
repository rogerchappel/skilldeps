# complete-skill

Use this skill when an agent needs a fixture with complete contracts.

## Inputs

- A local markdown file.

## Required Tools

- Shell read access.
- `node`.

## Side-Effect Boundaries

Read-only. Do not write to external systems.

## Approval Requirements

Approval is required before sending messages, publishing packages, or mutating repositories.

## Examples

Run `scripts/check.js` against `fixtures/sample.md`.

## Validation

Run `npm test`.
