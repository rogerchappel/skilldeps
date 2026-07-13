# Output Schema

JSON output has this top-level shape:

```json
{
  "summary": {
    "skills": 1,
    "findings": { "info": 0, "warning": 0, "error": 0 },
    "status": "pass"
  },
  "results": []
}
```

Each result contains:

- `title`: skill title from the first H1.
- `file`: absolute path to the inspected `SKILL.md`.
- `contracts`: booleans for detected operational sections.
- `references`: relative references with line number and existence status.
- `findings`: severity-coded audit findings.
