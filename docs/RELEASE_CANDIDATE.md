# Release Candidate

## Classification

ship

## Verification

- `npm test` - pass, 7 tests.
- `npm run check` - pass; intentionally incomplete fixture trips the expected error gate.
- `npm run smoke` - pass; complete fixture reports `Status: pass`.
- `npm pack --dry-run` - pass; tarball contains CLI, source, docs, fixtures, README, and `SKILL.md`.

## Notes

Initial public build includes a read-only scanner, contract analyzer, Markdown/JSON reporters, fixtures, tests, and agent-facing `SKILL.md`.
