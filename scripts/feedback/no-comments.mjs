#!/usr/bin/env node
// Deterministic no-comments gate. Single source of truth; the plugin
// (interactive feedback) and code-review (authoritative check) both
// defer to this script.
//
// Comment detection is token-based via the TypeScript scanner: the
// post-image is scanned and only real comment tokens on added lines
// count, so string, JSX text, or regex content starting with // or /*
// never trips the gate. Only files matched by the config pathspecs are
// checked.
//
// Usage:
//   no-comments.mjs --config            Worktree diff.
//   no-comments.mjs --staged --config   Staged diff (verify chain).
// Exit 0 CLEAN, 1 COMMENTS_FOUND.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const configPath = join(scriptDir, "no-comments.config.json");

const args = process.argv.slice(2);
let staged = false;
if (args[0] === "--staged") {
  staged = true;
  args.shift();
}
if (args[0] === "--config") {
  args.shift();
}

const cfg = JSON.parse(readFileSync(configPath, "utf8"));
const specs = [...(cfg.include ?? []), ...(cfg.exclude ?? [])];
const extensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];

const diffArgs = staged ? ["--cached"] : [];

function git(...gitArgs) {
  return execFileSync("git", gitArgs, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

const files = git("diff", ...diffArgs, "--diff-filter=ACM", "--name-only", "--", ...specs)
  .split("\n")
  .map((line) => line.trim())
  .filter((file) => file && extensions.some((ext) => file.endsWith(ext)));

function scriptKindFor(file) {
  if (file.endsWith(".tsx")) return ts.ScriptKind.TSX;
  if (file.endsWith(".jsx")) return ts.ScriptKind.JSX;
  if (file.endsWith(".ts") || file.endsWith(".mts") || file.endsWith(".cts")) return ts.ScriptKind.TS;
  return ts.ScriptKind.JS;
}

function addedLines(unifiedDiff) {
  const added = new Set();
  for (const line of unifiedDiff.split("\n")) {
    if (!line.startsWith("@@ ")) continue;
    const plus = line.split(" ")[2];
    const [start, count] = plus.slice(1).split(",").map((n) => parseInt(n, 10));
    const len = Number.isNaN(count) ? 1 : count;
    for (let i = 0; i < len; i++) added.add(start + i);
  }
  return added;
}

const hits = [];

for (const file of files) {
  const added = addedLines(git("diff", ...diffArgs, "--unified=0", "--", file));
  if (added.size === 0) continue;

  const post = staged ? git("show", `:${file}`) : readFileSync(file, "utf8");

  const scanner = ts.createScanner(scriptKindFor(file), false, ts.LanguageVariant.Standard, post);
  if (file.endsWith(".tsx") || file.endsWith(".jsx")) {
    scanner.setLanguageVariant(ts.LanguageVariant.JSX);
  }

  let token;
  while ((token = scanner.scan()) !== ts.SyntaxKind.EndOfFileToken) {
    if (token !== ts.SyntaxKind.SingleLineCommentTrivia && token !== ts.SyntaxKind.MultiLineCommentTrivia) {
      continue;
    }
    const start = scanner.getTokenStart();
    const text = post.slice(start, scanner.getTokenEnd());
    const startLine = post.slice(0, start).split("\n").length;
    text.split("\n").forEach((commentLine, offset) => {
      const line = startLine + offset;
      if (added.has(line)) {
        hits.push(`${file}:${line}: ${commentLine.trim()}`);
      }
    });
  }
}

if (hits.length > 0) {
  process.stdout.write(hits.join("\n") + "\nCOMMENTS_FOUND\n");
  process.exit(1);
}
process.stdout.write("CLEAN\n");
