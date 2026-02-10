# AGENTS.md — Andus Labs Development Standards

## React / TypeScript Frontend

### Framework
- React 18, Vite, TypeScript (strict mode)
- Tailwind CSS for styling
- No default exports — use named exports everywhere

### Component Patterns
- Functional components only — no class components
- Props interfaces defined above the component in the same file
- Use `React.FC` sparingly — prefer explicit return types
- Hooks for state management — no Redux unless project specifically requires it
- Custom hooks in `src/hooks/` — prefix with `use`

### TypeScript Rules
- Strict mode enabled — no `any` types unless absolutely necessary
- Interfaces over types for object shapes (except unions/intersections)
- Enum alternatives: use `as const` objects or string literal unions
- Never use `!` non-null assertion — handle nullability explicitly

### Styling
- Tailwind utility classes — no inline `style` attributes except for dynamic values
- No separate CSS files per component — Tailwind handles everything
- Use `cn()` utility (clsx/tailwind-merge) for conditional classes
- Responsive: mobile-first, use Tailwind breakpoints (`sm:`, `md:`, `lg:`)

### API Integration
- API client functions in `src/api/` — one file per domain
- React Query (TanStack Query) for server state — no manual `useEffect` + `useState` for data fetching
- Custom hooks in `src/hooks/` wrapping React Query calls
- All API calls go through typed client functions — never raw `fetch` in components

### File Organisation
```
src/
  api/                 — API client functions (typed fetch wrappers)
  components/          — Reusable UI components (grouped by domain)
  hooks/               — Custom hooks (data fetching, WebSocket, etc.)
  pages/               — Route-level page components
  types/               — TypeScript type definitions
  utils/               — Pure utility functions
  App.tsx              — Router + providers
  main.tsx             — Entry point
```

### Naming Conventions
- Files: `PascalCase.tsx` for components, `camelCase.ts` for utilities/hooks
- Components: `PascalCase`
- Hooks: `useCamelCase`
- Types/Interfaces: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Event handlers: `handleVerbNoun` (`handleClickSubmit`, `handleChangeEmail`)

---

## Git & Version Control

- Conventional commit messages: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`
- Do not run linters, formatters, or dev tools (ruff, eslint, prettier, black) — the CI pipeline handles these
- Do not run test suites — the build system handles test execution separately
- Commit all changes before any branch operations
- Never force-push

---

## Environment Variables

- All secrets and configuration via environment variables
- Never hardcode API keys, database URLs, or credentials
- Use `.env` files for local development (never committed)
- Variable naming: `UPPER_SNAKE_CASE`
- API keys: `{SERVICE}_API_KEY` (e.g. `OPENAI_API_KEY`, `CLERK_API_KEY`)

---

## Auth (Clerk)

- Clerk for authentication when auth is required
- Frontend: `@clerk/clerk-react` provider at app root
- Protected routes: check auth state before rendering
- API auth: Bearer token in Authorization header, verified server-side
- Never store tokens in localStorage — use Clerk's session management

---

## Forbidden Patterns

- No `console.log` in committed code — use proper logging
- No `any` types in TypeScript
- No default exports
- No CSS-in-JS (styled-components, emotion) — use Tailwind
- No jQuery or direct DOM manipulation
- No `var` in TypeScript — always `const` or `let`
- Do not execute linters, formatters, or test runners (ruff, eslint, prettier, black, pytest, vitest)

---

## Build Manifest

When instructed to update `build-manifest.json`, add or update only your node's entry under the `"nodes"` key. Do not modify or remove entries for other nodes. Include:
- `title`: what this node built
- `completed_at`: ISO timestamp
- `contracts`: any API contracts or interfaces created (with full schemas)
- `files_created`: list of all files created or modified
- `decisions`: any implementation decisions that downstream work depends on
- `environment_variables`: any new env vars required
