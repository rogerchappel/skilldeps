# skilldeps

`skilldeps` audits agent `SKILL.md` folders for missing file references and weak operational contracts. It is local-first and read-only, so it can run before a skill is installed, shared, or wired into CI.

## Quickstart

```bash
npm ci
npm test
node bin/skilldeps.js fixtures/complete-skill --format markdown
```

Audit a skill pack:

```bash
skilldeps ./skills --format json --fail-on warning
```

The supported options are `--format markdown|json`,
`--fail-on info|warning|error`, and `--help` (`-h`). Unsupported options are
reported as usage errors with exit code `2`; they are never treated as paths.

Directory inputs are searched recursively, including packs that contain both a
root `SKILL.md` and nested skills. Discovery skips `.git` and `node_modules`
directories and does not follow directory symlinks. Pass a specific `SKILL.md`
file to audit only that file.

## What It Checks

- Required usage, tools, side-effect, approval, example, and validation sections.
- Relative references such as `scripts/check.js`, `fixtures/sample.md`, and
  Markdown links with angle-bracket destinations such as
  `[guide](<references/setup guide.md>)`.
- Local Markdown destinations with percent-encoded characters, fragments, or
  query strings, such as `[guide](<references/setup%20guide.md#install>)`.
- Unbracketed Markdown destinations with balanced or escaped parentheses, such
  as `[guide](references/setup(v2).md)` or `[guide](references/setup\(v2\).md)`.
- Optional double-quoted, single-quoted, or parenthesized titles after local
  destinations, such as `[guide](references/setup.md "Setup instructions")`.
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

- References inside valid backtick or tilde fenced code blocks are ignored.
- Markdown parsing is intentionally lightweight. Standard local inline-link
  destinations are supported, including angle brackets when a path contains
  spaces, unbracketed destinations with balanced or escaped parentheses, and
  optional titles wrapped in double quotes, single quotes, or parentheses.
  Backslash-escaped punctuation is unescaped, percent escapes are decoded, and
  fragment or query suffixes are ignored for filesystem checks. Malformed
  percent escapes are checked literally; reference-style links and escaped
  closing angle brackets are not supported.
- It also detects common backtick and prose relative-reference patterns, not
  every possible prose reference.
- It reports contract presence, not whether the prose is high quality.
- Directory traversal is synchronous and intended for local skill folders and packs.

## Verification

```bash
npm ci
npm run check
npm test
npm run smoke
npm run package:smoke
```
