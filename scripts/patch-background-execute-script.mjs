#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";

const arguments_ = process.argv.slice(2);
if (arguments_.length !== 1) {
  console.error("[WBLOCK_BACKGROUND_PATCH_ARGUMENT_INVALID] Usage: patch-background-execute-script.mjs <background-source.js>");
  process.exit(2);
}
const [file] = arguments_;

const source = readFileSync(file, "utf8");
const upstream = `    static async executeScript(scriptInjection) {
      const results = await browser.scripting.executeScript(scriptInjection);
      if (results.length === 0) {
        log$1.error('Failed to execute script in target', scriptInjection.target);
        return;
      }
      const result = results[0];
      if (result.error) {
        log$1.error('Failed to execute script in target', scriptInjection.target, 'error', result.error);
      }
    }`;
const patched = `    static async executeScript(scriptInjection) {
      let results;
      try {
        results = await browser.scripting.executeScript(scriptInjection);
      } catch (error) {
        const message = String((error === null || error === void 0 ? void 0 : error.message) || error || '').toLowerCase();
        const expectedPermissionFailure = message.includes('permission') || message.includes('not allowed') || message.includes('denied') || message.includes('cannot access') || message.includes('not granted') || message.includes('not permitted') || message.includes('does not have access');
        if (expectedPermissionFailure) {
          log$1.debug('Skipped script injection without website access', scriptInjection.target);
        } else {
          log$1.error('Failed to execute script in target', scriptInjection.target, 'error', error);
        }
        return;
      }
      if (results.length === 0) {
        log$1.debug('Skipped script injection in unavailable target', scriptInjection.target);
        return;
      }
      const result = results[0];
      if (result.error) {
        log$1.error('Failed to execute script in target', scriptInjection.target, 'error', result.error);
      }
    }`;

const occurrences = source.split(upstream).length - 1;
if (occurrences !== 1) {
  console.error(`[WBLOCK_BACKGROUND_PATCH_TARGET_INVALID] expected exactly one upstream executeScript wrapper, found ${occurrences}: ${file}`);
  process.exit(1);
}

writeFileSync(file, source.replace(upstream, patched));
console.log(`[ok] restored wBlock executeScript wrapper in ${file}`);
