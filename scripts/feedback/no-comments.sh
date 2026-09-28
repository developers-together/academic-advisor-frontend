#!/usr/bin/env sh
# Deterministic no-comments gate. Single source of truth; the plugin
# (interactive feedback) and code-review (authoritative check) both
# defer to this script.
#
# Detection is token-based (TypeScript scanner via no-comments.mjs):
# only real comment tokens on added lines count, so string or JSX text
# content starting with // or /* never trips the gate. Only files
# matched by the config pathspecs are checked.
#
# Usage:
#   no-comments.sh --config            Worktree diff.
#   no-comments.sh --staged --config   Staged diff (verify chain).
# Exit 0 CLEAN, 1 COMMENTS_FOUND.
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
exec node "$script_dir/no-comments.mjs" "$@"
