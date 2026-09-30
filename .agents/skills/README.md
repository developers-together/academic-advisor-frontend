# Skills

AI agent skills for this repo, in two groups:

1. **Engineering skills (30)** installed and hash-tracked by the skills tool. `skills-lock.json` is their source of truth; update them through that tool, not by hand.
2. **Design and UX skills (16)** vendored manually on 2026-09-30 to back the design system in `design.md`. Each is registered in `skills-lock.json` as a `sourceType: local` entry pointing at its in-repo path (`.agents/skills/<name>`); refresh by re-copying from the sources below, then recomputing the folder hash.

Routing for every situation lives in `design.md` section 10 (routing table, process rules, craft attributions).

## Vendored design and UX skills

| Skill | Source | Governs |
|---|---|---|
| `ui-typography` | `~/.agents/skills/ui-typography` | Typography rules for any generated UI; CSS baseline template |
| `ui-ux-pro-max` | `~/.agents/skills/ui-ux-pro-max` | Searchable UI/UX databases + the 119-guideline priority table used for review order |
| `superdesign` | zcode plugin cache, superdesign 0.6.0 | Canvas/mockup workflow; token-first init; logo invariant |
| `using-superpowers` | zcode plugin cache, superpowers 6.3.0 | The meta-skill: check and invoke skills before any response |
| `brainstorming` | zcode plugin cache, superpowers 6.3.0 | Idea to approved design; spike / bounded / architectural paths |
| `implement` | `~/.agents/skills/implement` | Spec/ticket to verified code: TDD, review, commit |
| `doc` | `~/.agents/skills/doc` | .docx creation with visual fidelity loop |
| `bencium-controlled-ux-designer` | `~/.agents/skills/bencium-controlled-ux-designer` | Controlled, accessible craft: tokens, motion spec, decision checklists |
| `bencium-innovative-ux-designer` | `~/.agents/skills/bencium-innovative-ux-designer` | Original visual languages: ten isolated directions, human lock |
| `agentic-ux-design-relationship-centric-interfaces` | `~/.agents/skills/agentic-ux-design-relationship-centric-interfaces` | Relationship-centric AI surfaces (student AI chat) |
| `design-audit` | `~/.agents/skills/design-audit` | 15-dimension visual audit, reduction filter, phased fix plan |
| `impeccable` | `~/.agents/skills/impeccable` | Design-director playbooks: critique, polish, harden, onboard; craft floor |
| `design-an-interface` | `~/.agents/skills/design-an-interface` | Design-it-twice method for component and module APIs |
| `design-taste-frontend` | `~/.agents/skills/design-taste-frontend` | Anti-slop frontend rules for landing/marketing pages |
| `customer-research` | `~/.agents/skills/customer-research` | Interviews, VOC, JTBD, personas from evidence |
| `competitor-profiling` | `~/.agents/skills/competitor-profiling` | Evidence-based competitor profiles from URLs |

Notes:

- `ask-matt`, `research`, and `wayfinder` were requested alongside these, but identical copies already existed here as engineering skills, so nothing was duplicated.
- `ui-ux-pro-max` ships its searchable databases under `data/` (about 3.7 MB); `scripts/__pycache__` was excluded.
- `impeccable` value is concentrated in `reference/*.md` playbooks; it also carries a detector engine under `scripts/`.
- `design-audit/SKILL.md` points at `references/design-principles.md` and `references/audit-template.md`, but upstream places those files at the skill root. Preserved as-is.
