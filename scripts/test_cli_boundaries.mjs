import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scripts = dirname(fileURLToPath(import.meta.url));

for (const [script, code] of [
  ["patch-background-execute-script.mjs", "WBLOCK_BACKGROUND_PATCH_ARGUMENT_INVALID"],
  ["remove-content-scriptlet-registry.mjs", "WBLOCK_SCRIPTLET_REGISTRY_ARGUMENT_INVALID"],
]) {
  for (const args of [[], ["one.js", "two.js"]]) {
    const result = spawnSync(process.execPath, [join(scripts, script), ...args], {
      encoding: "utf8",
    });
    assert.equal(result.status, 2, `${script}: ${args.length} arguments`);
    assert.match(result.stderr, new RegExp(`^\\[${code}\\] Usage:`));
    assert.equal(result.stdout, "");
  }
}

console.log("CLI argument boundaries passed");
