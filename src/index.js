import { analyzeSkill, summarize } from "./analyze.js";
import { findSkillFiles, parseSkillFile } from "./scan.js";

export { analyzeSkill, findSkillFiles, parseSkillFile, summarize };

export function auditSkills(paths) {
  const files = findSkillFiles(paths);
  const results = files.map((file) => analyzeSkill(parseSkillFile(file)));
  return {
    summary: summarize(results),
    results
  };
}
