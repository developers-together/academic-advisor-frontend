# Agent Instructions

### Design system

`design.md` is the UI/UX source of truth for this product: design tokens, component inventory, screen states, accessibility, and UX writing rules. Read it before any UI work and follow its rule IDs. Precedence: `docs/product` for product truth, then `design.md` for design truth, then vendored skills. The 16 vendored design and UX skills are routed in `design.md` section 10.

### Beads (`bd`) issue tracker: `docs/agents/issue-tracker.md`

Issues live in beads, a local store under `.beads/`, operated via the `bd` CLI. Run `bd prime` for workflow context. See `docs/agents/issue-tracker.md`.

### Triage labels

Triage roles are native beads labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`); set with `bd create -l` / `bd label add`, filter with `bd list -l <role>`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout when they exist. See `docs/agents/domain.md`.

### Grilling sessions

Open every grilling interview with the session setup in `docs/agents/grilling-session.md`: list topics, agree the structure, track topics with the todo tool.

### Docs retrieval

Docs fallthrough: MCP → `docs/agents/llms/` slices → Context7 (max 2) → web. See `docs/agents/docs-retrieval.md`.

### Verification

Stage the work and run `npm run verify` before you commit. Treat gate failures as findings and fix them.

Three gates decide the result: the no-comments gate on the staged diff, vitest in each app, and type coverage at a minimum of 80 percent. A failure ends with a `FAILED GATES:` line naming the failed gates. Never weaken a gate, an ignore pattern, or a test to make a failure disappear.

Steps labeled `report:` never fail the chain and carry no threshold. Their output is feedback for the agent: act on what it surfaces, and never weaken a gate because of it.

### Writing

These rules govern all prose an agent produces: replies, tickets, PRDs, review comments, commit messages, docs.

- Write in active voice, one idea per sentence. Name the actor. Prefer facts and numbers over feelings.
- Prefer the plain word ("use", not "utilize"). Cut filler ("in order to" becomes "to") and hedging.
- No AI tells: no em dashes, no puffery ("crucial", "seamless", "pivotal"), no "not just X, but Y", no bold-label list items that restate their own line, sentence-case headings, no chatbot phrases ("I hope this helps", "Great question!").
- Use the exact terms in `CONTEXT.md`'s glossary. If a concept has no glossary term, flag it instead of inventing one.
- When writing for the user, lean toward Simplified Technical English (short declarative sentences, common words) where it doesn't cost precision. Preference, not mandate.

===

## Project Overview

Bulletproof React is a scalable React application architecture that provides opinionated guidelines and best practices for building production-ready React applications. The project includes three different implementations:

- **React Vite**: Modern Vite-based React application
- **Next.js App Router**: Next.js 16 with App Router
- **Next.js Pages**: Traditional Next.js with Pages Router

### Application Domain
The demo application is a team collaboration platform where users can:
- Create and join teams
- Start discussions within teams
- Comment on discussions
- Manage user roles (ADMIN/USER permissions)

**Live Demo**: [https://bulletproof-react-app.netlify.app](https://bulletproof-react-app.netlify.app)

## Setup Commands

```bash
# Install dependencies in all three apps (from the repo root)
npm install

# Work in one app
cd apps/react-vite        # or apps/nextjs-app or apps/nextjs-pages

# Start development server
npm run dev

# Run tests
npm run test

# Run e2e tests
npm run test-e2e

# Lint code
npm run lint

# Build for production
npm run build
```

### Stack

React 19 with TypeScript across three apps: `apps/react-vite` (Vite 8), `apps/nextjs-app` (Next.js 16, App Router), and `apps/nextjs-pages` (Next.js 16, Pages Router). Each app installs its own dependencies with npm. Confirm a package's installed version before relying on its API: `npm ls <package> --prefix apps/<app>`.

Do not add dependencies, create new base folders, or create documentation files without approval.

## Project Structure

The codebase follows a feature-based architecture organized as follows:

```
src/
├── app/              # Application layer (routes, providers, router)
├── components/       # Shared UI components
├── config/          # Global configurations and env variables
├── features/        # Feature-based modules (auth, discussions, comments, etc.)
├── hooks/           # Shared React hooks
├── lib/             # Preconfigured libraries (react-query, auth, etc.)
├── testing/         # Test utilities and mocks
├── types/           # Shared TypeScript types
└── utils/           # Shared utility functions
```

### Feature Structure
Each feature should be self-contained:

```
src/features/awesome-feature/
├── api/         # API calls and hooks for this feature
├── components/  # Feature-specific components
├── hooks/       # Feature-specific hooks
├── stores/      # Feature-specific state
├── types/       # Feature-specific types
└── utils/       # Feature-specific utilities
```

## Code Standards

### TypeScript
- **Strict mode enabled** - All TypeScript strict checks are enforced
- **Type-first approach** - Define types before implementation
- **Absolute imports** - Use `@/` prefix for all src imports (e.g., `@/components/ui/button`)

### Code Style
- **ESLint + Prettier** configured for consistent formatting
- **Kebab-case** for file and folder names
- **PascalCase** for React components
- **camelCase** for functions and variables

### Architecture Rules
- **No cross-feature imports** - Features should not import from each other
- **Unidirectional flow** - Code flows: shared → features → app
- **Colocation** - Keep related code as close as possible to where it's used

## Component Guidelines

### Best Practices
- **Composition over props** - Use children/slots instead of many props
- **Single responsibility** - Each component should have one clear purpose
- **Extract render functions** - Move complex JSX into separate components
- **Limit prop count** - Consider composition if accepting too many props

### Styling
- **Tailwind CSS** is the primary styling solution
- **Headless UI components** using Radix UI primitives
- **ShadCN/UI pattern** - Components are copied into codebase, not installed as packages

## State Management Strategy

### Component State
- Use `useState` for simple independent state
- Use `useReducer` for complex state with multiple related updates

### Application State
- **Zustand** for global application state (modals, notifications, themes)
- Keep state as close to usage as possible
- Avoid premature globalization

### Server State
- **React Query (TanStack Query)** for all server state management
- **MSW (Mock Service Worker)** for API mocking during development
- Separate fetcher functions from hooks

### Form State
- **React Hook Form** for form management
- **Zod** for form validation schemas
- Create reusable Form and Input components

## API Layer

### Structure
Each API endpoint should have:
1. **Types & validation schemas** for request/response
2. **Fetcher function** using configured API client
3. **React Query hook** for data fetching/caching

### Example Pattern
```typescript
// api/get-discussions.ts
export const getDiscussions = (params: GetDiscussionsParams): Promise<Discussion[]> => {
  return api.get('/discussions', { params });
};

export const useDiscussions = (params: GetDiscussionsParams) => {
  return useQuery({
    queryKey: ['discussions', params],
    queryFn: () => getDiscussions(params),
  });
};
```

## Testing Strategy

### Testing Pyramid
1. **Integration Tests** (primary focus) - Test feature workflows
2. **Unit Tests** - Test shared utilities and complex logic
3. **E2E Tests** - Test critical user journeys

### Tools
- **Vitest** - Test runner (Jest-compatible but faster)
- **Testing Library** - Component testing utilities
- **Playwright** - E2E testing framework
- **MSW** - API mocking for tests

### Testing Patterns
- Test behavior, not implementation details
- Use real HTTP requests with MSW instead of mocking fetch
- Focus on user interactions and outcomes

## Security Considerations

### Authentication
- **JWT tokens** stored in HttpOnly cookies (preferred) or localStorage
- **React Query Auth** for user state management
- Automatic token refresh handling

### Authorization
- **RBAC** (Role-Based Access Control) for basic permissions
- **PBAC** (Permission-Based Access Control) for granular control
- Client-side authorization for UX (always validate server-side)

### XSS Prevention
- **Sanitize all user inputs** before rendering
- Use DOMPurify for HTML content sanitization
- Validate and escape data at boundaries

## Performance Optimization

### Code Splitting
- **Route-level splitting** - Lazy load pages/routes
- Avoid excessive splitting (balance requests vs. bundle size)

### React Optimizations
- **Children prop pattern** - Prevent unnecessary re-renders
- **State colocation** - Keep state close to where it's used
- **State initializer functions** - For expensive initial computations

### Image Optimization
- Lazy loading for images outside viewport
- Modern formats (WebP) with fallbacks
- Responsive images using srcset

## Error Handling

### API Errors
- Global error interceptor in API client
- Automatic error notifications via toast system
- Automatic token refresh on 401 errors

### Application Errors
- **Error Boundaries** at feature level (not just app level)
- **Sentry** integration for production error tracking
- Graceful fallbacks for broken components

## Build and Deployment

### Development
- **Vite** for fast development builds and HMR
- **TypeScript** strict mode for compile-time safety
- **ESLint + Prettier** for code quality

### Production
- Deploy to CDN platforms: **Vercel**, **Netlify**, or **AWS CloudFront**
- Source maps uploaded to Sentry for error tracking
- Environment-specific configuration via env files

## File Naming Conventions

- **Components**: `kebab-case.tsx` (e.g., `user-profile.tsx`)
- **Hooks**: `use-kebab-case.ts` (e.g., `use-discussions.ts`)
- **Utilities**: `kebab-case.ts` (e.g., `format-date.ts`)
- **Types**: `kebab-case.ts` (e.g., `api-types.ts`)
- **Folders**: `kebab-case` throughout

## Development Workflow

### Git Hooks (Husky)
- **Pre-commit**: lint-staged runs ESLint and the TypeScript check on staged files in each app
- Ensure all checks pass before allowing commits

### Code Generation
- **Plop.js** generators for consistent component creation: `npm run generate`
- Templates include component, stories, and test files
- Maintains consistent structure across team

## Key Libraries

### Core
- **React 19** with concurrent features
- **TypeScript** in strict mode
- **Vite** or **Next.js** for build tooling

### UI & Styling
- **Tailwind CSS** for styling
- **Radix UI** for headless components
- **Lucide React** for icons

### Data & State
- **TanStack Query** for server state
- **Zustand** for client state
- **React Hook Form + Zod** for forms

### Testing & Development
- **Vitest** for unit/integration tests
- **Playwright** for E2E tests
- **MSW** for API mocking
- **Storybook** for component development

## Common Patterns

### Feature Development
1. Start with API types and validation schemas
2. Create API fetcher functions and React Query hooks
3. Build UI components with proper TypeScript integration
4. Add integration tests covering the feature workflow
5. Update routing and navigation as needed

### Component Creation
1. Use Plop generator: `npm run generate`
2. Follow composition patterns over prop drilling
3. Add Storybook stories for complex components
4. Include unit tests for components with logic

### State Management
1. Start with local component state
2. Lift to parent component if needed by siblings
3. Move to global state only if needed across features
4. Use React Query for all server state

This architecture prioritizes developer experience, maintainability, and scalability while following React and JavaScript best practices.

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:970c3bf2 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Record durable knowledge on issues (`bd update <id> --notes`, or `bd create` when no issue fits). `bd memory` and `bd remember` are banned and blocked by the `.opencode/gates/no-memory.sh` gate

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Agent Context Profiles

The managed Beads block is task-tracking guidance, not permission to override repository, user, or orchestrator instructions.

- **Conservative (default)**: Use `bd` for task tracking. Do not run git commits, git pushes, or Dolt remote sync unless explicitly asked. At handoff, report changed files, validation, and suggested next commands.
- **Minimal**: Keep tool instruction files as pointers to `bd prime`; use the same conservative git policy unless active instructions say otherwise.
- **Team-maintainer**: Only when the repository explicitly opts in, agents may close beads, run quality gates, commit, and push as part of session close. A current "do not commit" or "do not push" instruction still wins.

## Session Completion

This protocol applies when ending a Beads implementation workflow. It is subordinate to explicit user, repository, and orchestrator instructions.

1. **File issues for remaining work** - Create beads for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **Handle git/sync by active profile**:
   ```bash
   # Conservative/minimal/default: report status and proposed commands; wait for approval.
   git status

   # Team-maintainer opt-in only, unless current instructions forbid it:
   git pull --rebase
   bd dolt push
   git push
   git status
   ```
5. **Hand off** - Summarize changes, validation, issue status, and any blocked sync/commit/push step

**Critical rules:**
- Explicit user or orchestrator instructions override this Beads block.
- Do not commit or push without clear authority from the active profile or the current user request.
- If a required sync or push is blocked, stop and report the exact command and error.
<!-- END BEADS INTEGRATION -->

<!-- BEGIN BEADS CODEX SETUP: generated by bd setup codex -->
## Beads Issue Tracker

Use Beads (`bd`) for durable task tracking in repositories that include it. Use the `beads` skill at `.agents/skills/beads/SKILL.md` (project install) or `~/.agents/skills/beads/SKILL.md` (global install) for Beads workflow guidance, then use the `bd` CLI for issue operations.

### Quick Reference

```bash
bd ready                # Find available work
bd show <id>            # View issue details
bd update <id> --claim  # Claim work
bd close <id>           # Complete work
bd prime                # Refresh Beads context
```

### Rules

- Use `bd` for all task tracking; do not create markdown TODO lists.
- Run `bd prime` when Beads context is missing or stale. Codex 0.129.0+ can load Beads context automatically through native hooks; use `/hooks` to inspect or toggle them.
- Record durable knowledge on issues (`bd update <id> --notes`, or `bd create` when no issue fits). `bd memory` and `bd remember` are banned and blocked by the `.opencode/gates/no-memory.sh` gate. See `docs/agents/issue-tracker.md`.

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.
<!-- END BEADS CODEX SETUP -->
