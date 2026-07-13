# Orchestration

`skilldeps` is designed for read-only automation.

1. Point the CLI at a skill directory or root.
2. Parse `SKILL.md` files and collect relative references.
3. Check references against disk without executing them.
4. Score missing contracts and missing files.
5. Emit Markdown for humans or JSON for CI.

## Side Effects

The analyzer only reads files under the supplied paths. It does not execute scripts, install packages, fetch network resources, or write reports unless shell redirection is used by the caller.

## Suggested CI

```bash
npm ci
npm test
npm run smoke
node bin/skilldeps.js ./skills --fail-on warning
```
