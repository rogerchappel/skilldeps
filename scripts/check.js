import { run } from "../bin/skilldeps.js";

const code = run(["fixtures/complete-skill", "fixtures/incomplete-skill", "--format", "json", "--fail-on", "error"]);

if (code !== 1) {
  console.error(`Expected fixture check to fail on the intentionally incomplete fixture, got ${code}`);
  process.exit(1);
}

console.log("check passed: incomplete fixture produced expected error gate");
