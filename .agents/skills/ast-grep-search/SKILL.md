---
name: ast-grep-search
description: ast-grep structural code search. Reach for locating code by syntax (callers, definitions, patterns).
---

# ast-grep search

Use the `ast_grep` tool for code. It wraps the `ast-grep` CLI with shell-safe
invocation and capped output, so one call works on zsh, bash, and PowerShell.

## Steps

### 1. Scope to files with matches

Scope to one source directory at a time, never the tree root. Run one `files`
query per pattern before fetching match bodies, always passing `lang`.

Done when the file list is fixed and every later `matches` call reuses it —
no unbounded directory-wide body fetch.

```ts
ast_grep({ mode: "files", pattern: "console.log($$$)", lang: "js", paths: ["<src-dir>"] })
```

Dependency and build output is excluded by default; oversized results return
counts plus the narrowed call to make — follow it instead of widening.

### 2. Fetch capped match bodies

Fetch bodies only inside the scoped files, one pattern at a time, context zero
unless the edit needs surrounding lines.

Done when every reported match carries `file:line` plus a trimmed snippet,
and the count is at or under the requested cap.

```ts
ast_grep({ mode: "matches", pattern: "function $NAME($$$) { $$$ }", lang: "ts", paths: ["<scoped-dir>"], max: 30 })
```

## Pattern reference

| Write | Matches | Example |
|---|---|---|
| `$NAME` (uppercase) | one syntax node | `console.log($MSG)` matches `console.log('hi')`, skips comments and strings |
| `$$$` / `$$$ARGS` | zero or more nodes | `console.log($$$)` matches `()`, `(a)`, `(a, b)` |
| Reused name | same subtree twice | `$A == $A` matches `a == a`, skips `a == b` |
| `$_HINT` | any node, no capture | faster; use when the binding is never reused |

Patterns must parse as valid code for the target language. Keep the default
smart strictness; relax the pattern itself instead of tuning flags.

## Language reference

Always pass `lang`. Common aliases: `ts`, `tsx`, `js`, `jsx`, `py`, `go`,
`rs`, `java`, `rb`, `php`, `cs`, `css`, `html`, `json`, `yml`, `bash`, `c`,
`cpp`. When omitted, `ast-grep` infers from file extension only — explicit
beats inferred for mixed trees.

## Recovery

Zero hits: relax once (`$NAME` to `$VAR` to `$$$`, drop body specifics), then
run `glob` for filenames and `read` one candidate range. `glob` is the code
fallback; plain-text search stays for prose, logs, and generated output.
Match ranges from JSON output are zero-based when computing read offsets.
