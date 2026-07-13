# skilldeps report

Status: fail
Skills scanned: 1
Findings: 1 error, 5 warning, 0 info

## incomplete-skill

File: `fixtures/incomplete-skill/SKILL.md`

### Contracts

-   usage
-   tools
-   inputs
-   sideEffects
-   approvals
-   examples
-   validation

### References

- missing line 5: `scripts/missing.js`
- ok line 5: `fixtures/example.md`

### Findings

- WARNING missing-usage line 1: Document when the skill should be used.
- WARNING missing-tools line 1: List required tools or runtime dependencies.
- WARNING missing-sideEffects line 1: State side-effect boundaries.
- WARNING missing-validation line 1: Describe validation or smoke checks.
- ERROR missing-reference line 5: Referenced path does not exist: scripts/missing.js
- WARNING approval-boundary-missing line 1: Skill mentions external or mutating actions without an approval section.

