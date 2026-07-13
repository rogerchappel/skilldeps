# Exit Codes

- `0`: audit completed and no finding met the `--fail-on` severity gate.
- `1`: audit completed and one or more findings met the gate.
- `2`: CLI usage error, unsupported option, or no `SKILL.md` files found.

The default gate is `error`, so warnings are visible without failing the command.
