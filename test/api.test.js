import assert from "node:assert/strict";
import test from "node:test";
import { auditSkills } from "../src/index.js";

test("auditSkills returns summary and results", () => {
  const payload = auditSkills(["fixtures/complete-skill"]);
  assert.equal(payload.summary.status, "pass");
  assert.equal(payload.results.length, 1);
});
