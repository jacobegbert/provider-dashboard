# Claude Code Techniques

A reference of 35 techniques for working effectively with Claude Code.

## Essential Commands (01–08)

**01. Plan Mode (Shift + Tab)** — Before any implementation, switch to plan mode. Claude Code analyzes the codebase and creates an architecture plan without writing code. Review, approve, then switch back to implementation.

**02. Compact (`/compact`)** — After 30–45 minutes, compress the conversation history into a focused summary of key decisions and current state.

**03. Clear (`/clear`)** — Starting a new task? Clear the slate. Carrying context from a database refactor into a frontend redesign produces confused, conflicting code. One conversation per feature.

**04. Init (`/init`)** — At the start of any new project, scan the codebase and generate a `CLAUDE.md` that Claude Code reads automatically in every future session.

**05. Cost Check (`/cost`)** — Displays token usage for the current session. Check hourly during long sessions.

**06. Memory (`/memory`)** — Add persistent instructions Claude Code remembers across all sessions (e.g., "Always use TypeScript strict mode", "Always add JSDoc comments to public functions").

**07. Terminal Integration (`!` prefix)** — Prefix any message with `!` to run it as a terminal command instead of sending it to Claude.

**08. Multi-Model Switching** — Opus for planning and architecture, Sonnet for implementation. Plan with the thinker, build with the builder.

## Productivity Techniques (09–18)

**09. Reference File Technique** — Point to an existing file rather than describing style: "Look at how authentication is implemented in `src/auth/login.ts`. Implement password reset following the exact same patterns."

**10. Screenshot Debug** — Paste a screenshot with Ctrl+V rather than writing paragraphs about UI issues.

**11. Test-First Workflow** — "Write tests for X covering these cases. Then implement to pass all tests."

**12. Incremental Build** — Never say "build the entire feature." Break into steps: schema → test → API → test → validation → test → frontend → test.

**13. Codebase Question** — Before implementing in an unfamiliar area: "Read `src/services/` and explain how data flows from API routes to the database. What patterns are used?"

**14. Diff Review** — After changes: "Show me a diff of every file you modified. Explain each change in one sentence."

**15. Error Paste** — Paste the COMPLETE error and stack trace. "Diagnose the root cause step by step before suggesting a fix."

**16. Undo Checkpoint** — Before major changes: `git add . && git commit -m "checkpoint before [change]"`.

**17. Parallel Session** — For large features, run two Claude Code sessions (backend + frontend) in separate terminals.

**18. Documentation Pass** — After completing a feature: "Read every file you created or modified. Generate comprehensive documentation."

## Architecture Techniques (19–26)

**19. Architecture Audit** — "Propose 2 architectural approaches. For each: component diagram, pros, cons, complexity, what could go wrong. Recommend one."

**20. Dependency Check** — "Is [package] actively maintained? Security issues? Bundle size impact? Lighter alternatives?"

**21. Pattern Enforcer** — Add to `CLAUDE.md`: "API routes follow `src/api/example-route.ts`. DB queries use the repository pattern in `src/repositories/example-repo.ts`. Components follow `src/components/ExampleComponent.tsx`."

**22. Migration Builder** — "Generate the migration, update repositories, update all API routes, update TS types. Show me every file that needs to change before making any modifications."

**23. API Design Review** — "Check for inconsistent naming, missing error responses, endpoints that should be paginated, missing auth, REST violations."

**24. Security Scan** — "Scan for SQL injection, XSS, exposed secrets, missing input validation, IDOR, missing rate limiting. For each: severity, location, why dangerous, fix."

**25. Performance Profiler** — "Analyze for N+1 queries, missing indexes, unnecessary re-renders, large bundle imports, uncached endpoints. Prioritize by impact."

**26. Refactoring Planner** — "Propose a refactoring plan. Show the proposed file structure, what moves where, verify no external imports will break. Do NOT start refactoring yet."

## Workflow Automation (27–31)

**27. Git Hook Writer** — Pre-commit hook running linter, type check, `console.log` detection, blocking failures.

**28. CI Pipeline Builder** — GitHub Actions workflow: install, test, lint, build, PR comment. With caching.

**29. Environment Setup Script** — `setup.sh` for new developers: deps, `.env`, local DB, migrations, seed, verify via tests.

**30. Release Notes Generator** — From git log since last tag: features / bug fixes / performance / breaking changes. User-friendly language.

**31. Database Seed Builder** — Realistic seed data with edge cases (archived project, deleted user, project with no members).

## Debug and Recovery (32–35)

**32. Reproduction Prompt** — From a bug report: minimal repro steps → failing test → fix.

**33. Blame Investigator** — "Read the git log for this file over the past week. Which commit likely introduced the issue?"

**34. Dependency Conflict Resolver** — "Identify packages requiring conflicting versions. Suggest resolution with fewest changes."

**35. Recovery Mode** — When going back and forth too long: "Stop. Read the original working version from git. The previous approach isn't working. Start fresh."

## Recommended New-Project Sequence

1. `/init` — generate `CLAUDE.md`
2. Add coding standards and patterns to `CLAUDE.md`
3. `/memory` — add persistent rules for every session
4. Plan mode — design architecture before writing code
5. Build incrementally — one feature at a time, tested at each step
