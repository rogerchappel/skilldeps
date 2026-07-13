# skilldeps

`skilldeps` audits agent `SKILL.md` folders for missing file references and weak operational contracts. It is local-first and read-only, so it can run before a skill is installed, shared, or wired into CI.

## Quickstart

```bash
npm install
npm test
node bin/skilldeps.js fixtures/complete-skill --format markdown
```

Audit a skill pack:

```bash
skilldeps ./skills --format json --fail-on warning
```

## What It Checks

- Required usage, tools, side-effect, approval, example, and validation sections.
- Relative references such as `scripts/check.js` and `fixtures/sample.md`.
- Missing referenced files.
- Mutating or external-action language without an approval section.

## Output

Markdown is intended for pull-request review. JSON is stable enough for scripts and CI checks.

```bash
node bin/skilldeps.js fixtures/incomplete-skill --format json
```

## Safety Notes

`skilldeps` never executes referenced scripts, installs skills, calls external services, or mutates inspected folders. It only reads `SKILL.md` files and checks whether referenced local paths exist.

## Limitations

- Markdown parsing is intentionally lightweight.
- It detects common relative-reference patterns, not every possible prose reference.
- It reports contract presence, not whether the prose is high quality.

## Verification

```bash
npm test
npm run check
npm run smoke
```
