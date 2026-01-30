# Reset Init State: Repository Architecture Proposal

**Author:** AGENT_1: REPO_ARCHITECT
**Date:** 2026-01-29
**Status:** Proposed

---

## 1. Executive Summary

This repository contains the Ralph orchestrator tooling — a reusable autonomous AI agent loop system that can be integrated into any project as a Git submodule. However, it currently contains project-specific artifacts (ICP.md, PRD.md, next-app scaffold, etc.) from the "Ralph Platform" SaaS product development. To make this repo truly reusable across all projects, we need to remove project-specific leftovers, reset working files to clean init state, and rewrite documentation to reflect its purpose as a generic, portable tooling submodule.

**Impact:** Low-risk cleanup operation that transforms a project-specific repo into a clean, documented, reusable submodule that teams can drop into any codebase.

---

## 2. Files to DELETE (Project-Specific Leftovers)

These files are specific to the "Ralph Platform" SaaS product and have no place in a generic orchestrator tooling repo:

### 2.1 Product Strategy Documents
```
.ralph/ICP.md                    # Ideal Customer Profile for Ralph Platform SaaS
.ralph/PRD.md                    # 1500+ line Product Requirements Doc for platform features
```

**Rationale:** These are business/product strategy documents for building a commercial Ralph platform. They describe user personas, pricing, UI/UX requirements, infrastructure architecture for a SaaS product — none of which are relevant to the core Ralph orchestrator tooling that this repo should provide.

### 2.2 Archived Project Files
```
.ralph/archives/2026-01-29/      # Old prd.json and progress.txt from previous runs
```

**Rationale:** Archives from a specific project's Ralph runs. New projects using this as a submodule should start with empty archives.

### 2.3 Scaffold Application (Conditional — See Section 8)
```
next-app/                        # Next.js scaffold app
```

**Rationale:** This appears to be either:
- A scaffold/template app for the Ralph Platform product, OR
- A reference implementation/demo

**Decision Point:** If it's a generic scaffold that demonstrates Ralph integration, keep it but rename to `examples/next-app-scaffold/` and add a clear README explaining it's an example. If it's platform-specific, delete it entirely. Based on the generic README content, this looks like a basic Next.js starter — recommend moving to examples or deleting as it adds ~230KB of dependencies with minimal value.

**Recommendation:** DELETE `next-app/` unless there's a compelling reason it demonstrates Ralph integration patterns (currently it's just a vanilla Next.js starter).

---

## 3. Files to RESET/CLEAN (Make Generic)

These files are part of the Ralph tooling but need to be reset to a clean, example-driven state:

### 3.1 Working State Files
```
.ralph/progress.txt              # Currently: "## Codebase Patterns\n---" (nearly empty)
.ralph/prd.json                  # (gitignored, but any existing should be removed)
.ralph/.last-branch              # (gitignored, contains "ralph/scaffold-platform")
```

**Action:**
- `progress.txt`: Reset to clean template showing the expected structure
- Ensure `prd.json` and `.last-branch` are removed if present (already in .gitignore)

**New progress.txt template:**
```markdown
## Codebase Patterns
- Add patterns discovered during Ralph iterations here
- Example: Use server actions for all mutations
- Example: Run `npm run typecheck` before committing
---

## [Date] - [Story ID]
- What was implemented
- Files changed
- **Learnings for future iterations:**
  - Patterns discovered
  - Gotchas encountered
  - Useful context
---
```

### 3.2 Example Files
```
.ralph/prd.json.example          # Currently contains task priority system example
```

**Action:** KEEP but verify it's a good generic example. Current example (task priority system) is project-agnostic and demonstrates the PRD JSON format well. Good as-is.

### 3.3 Agent Instructions
```
.ralph/AGENTS.md                 # References next-app and platform-specific paths
.ralph/CLAUDE.md                 # Generic agent instructions (good!)
.ralph/prompt.md                 # Generic Amp instructions (good!)
```

**Action:**
- `AGENTS.md`: Rewrite to be generic, remove next-app references, focus on Ralph orchestrator usage
- `CLAUDE.md`: Keep as-is (already generic)
- `prompt.md`: Keep as-is (already generic)

**New AGENTS.md template:**
```markdown
# Ralph — Orchestrator Instructions

## Overview

Ralph is an autonomous AI agent loop that runs AI coding tools (Amp or Claude Code) repeatedly until all PRD items are complete. Each iteration is a fresh instance with clean context.

## Commands

```bash
# Run Ralph loop with Claude Code
./.ralph/ralph.sh --tool claude [max_iterations]

# Run Ralph loop with Amp (default)
./.ralph/ralph.sh [max_iterations]

# Quality checks (customize for your project)
npm run typecheck  # or yarn typecheck, make typecheck, etc.
npm run lint
npm run test
```

## Key Files

| File               | Purpose                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------- |
| `ralph.sh`         | The bash loop that spawns fresh AI instances (supports `--tool amp` or `--tool claude`) |
| `prompt.md`        | Prompt template for Amp                                                                 |
| `CLAUDE.md`        | Prompt template for Claude Code                                                         |
| `prd.json`         | User stories with `passes` status (the task list) — gitignored, created per-project     |
| `prd.json.example` | Example PRD format for reference                                                        |
| `progress.txt`     | Append-only learnings for future iterations                                             |
| `.last-branch`     | Tracks current feature branch — gitignored                                              |
| `archives/`        | Old task archives — created when switching branches                                     |

## Getting Started

1. **Add as submodule to your project:**
   ```bash
   git submodule add https://github.com/ryaneggz/ralph-orchestrator .ralph
   git submodule update --init --recursive
   ```

2. **Create your PRD:**
   ```bash
   # Option A: Use the PRD skill (if using Claude Code with skills)
   # Load the prd skill and create a PRD for [your feature description]

   # Option B: Copy the example and customize
   cp .ralph/prd.json.example .ralph/prd.json
   # Edit prd.json with your user stories
   ```

3. **Run Ralph:**
   ```bash
   cd .ralph
   ./ralph.sh --tool claude 10  # Run up to 10 iterations with Claude Code
   ```

4. **Customize for your project:**
   - Update quality check commands in `CLAUDE.md` and `prompt.md`
   - Add project-specific patterns to the top of `progress.txt`
   - Configure your AI tool preferences

## Critical Concepts

### Each Iteration = Fresh Context

Each iteration spawns a **new AI instance** (Amp or Claude Code) with clean context. The only memory between iterations is:

- Git history (commits from previous iterations)
- `progress.txt` (learnings and context)
- `prd.json` (which stories are done)

### Small Tasks

Each PRD item should be small enough to complete in one context window. If a task is too big, the LLM runs out of context before finishing and produces poor code.

Right-sized stories:
- Add a database column and migration
- Add a UI component to an existing page
- Update a server action with new logic
- Add a filter dropdown to a list

Too big (split these):
- "Build the entire dashboard"
- "Add authentication"
- "Refactor the API"

### Feedback Loops

Ralph only works if there are feedback loops:
- Typecheck catches type errors
- Tests verify behavior
- CI must stay green (broken code compounds across iterations)

### Stop Condition

When all stories have `passes: true`, Ralph outputs `<promise>COMPLETE</promise>` and the loop exits.

## Customizing for Your Project

After adding Ralph as a submodule, customize it for your project:

1. **Quality checks** — Update the quality check commands in `CLAUDE.md` and `prompt.md` to match your project's tooling
2. **Codebase patterns** — Add project-specific conventions to `progress.txt` Codebase Patterns section
3. **Success criteria** — Define what "passing" means for each story type in your project
4. **Tools** — Configure which AI coding tool you prefer (Amp, Claude Code, etc.)

## Archiving

Ralph automatically archives previous runs when you start a new feature (different `branchName`). Archives are saved to `archives/YYYY-MM-DD-feature-name/`.

## References

- [Geoffrey Huntley's Ralph article](https://ghuntley.com/ralph/)
- [Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code)
```

---

## 4. Files to KEEP As-Is

These are the core Ralph orchestrator tooling files that are already generic and reusable:

### 4.1 Core Orchestrator Scripts
```
.ralph/ralph.sh                  # Main loop script — PERFECT as-is
.ralph/CLAUDE.md                 # Claude Code agent instructions — PERFECT as-is
.ralph/prompt.md                 # Amp agent instructions — PERFECT as-is
.ralph/LICENSE                   # MIT license — KEEP as-is
.ralph/prd.json.example          # Good example format — KEEP as-is
```

### 4.2 Claude Code Configuration
```
.claude/                         # Claude Code workspace configuration
  .example.env.claude            # Example environment file
  agents/                        # Generic agent builders (agent-builder.md, etc.)
  commands/                      # Generic commands (team.md, ticket.md)
  hooks/                         # Git hooks
  settings.local.json            # Local settings
  skills/                        # PRD and Ralph skills — REUSABLE
  templates/                     # Task templates
```

**Status:** These are generic Claude Code workspace tools for building agents, skills, and commands. They're not project-specific — they're meta-tools for creating Ralph-compatible workflows. KEEP all.

### 4.3 Repository Configuration
```
.gitignore                       # Correctly ignores prd.json, progress.txt, .last-branch
.cursorignore                    # IDE configuration
Makefile                         # Convenient shortcuts for Ralph commands
```

**Status:** All good as-is. The .gitignore is already correct for preventing project-specific state from being committed.

---

## 5. README.md Rewrite Strategy

The current README.md describes Ralph as a tool ("Workflow" for creating PRDs and running loops) but assumes it's being used in the Ralph Platform project. It needs to be rewritten from the perspective of a **submodule consumer**.

### 5.1 Current README Issues
- Describes workflow assuming you're IN the repo already
- References `./scripts/ralph/ralph.sh` (wrong path)
- Talks about "NextApp" which may be project-specific
- Doesn't explain how to add as submodule
- Doesn't explain the value proposition clearly

### 5.2 New README.md Structure

```markdown
# Ralph Orchestrator

> Autonomous AI agent loops for incremental software development

Ralph is a **reusable orchestration system** that runs AI coding tools (Amp, Claude Code) in iterative loops until all tasks in a Product Requirements Document (PRD) are complete. Add it as a Git submodule to any project to automate feature development, bug fixes, and refactoring with autonomous AI agents.

## What is Ralph?

Ralph Wiggum is an autonomous coding agent loop pattern created by [Geoffrey Huntley](https://ghuntley.com/ralph/). Each iteration:

1. Spawns a fresh AI agent (clean context)
2. Reads the PRD and progress log
3. Picks the highest-priority incomplete story
4. Implements it
5. Runs quality checks (typecheck, test, lint)
6. Commits if passing
7. Updates PRD and progress
8. Repeats

**Key insight:** Each iteration is a fresh AI instance. Memory persists only through:
- Git commits
- `progress.txt` learnings
- `prd.json` status tracking

This prevents context pollution and enables long-running development workflows that would otherwise hit token limits.

## Features

- **Tool-agnostic**: Supports Amp, Claude Code, or any AI coding assistant
- **Incremental progress**: Small, focused tasks that fit in one context window
- **Persistent memory**: Via git history, progress logs, and PRD status
- **Automatic archiving**: Saves previous runs when switching feature branches
- **Quality gates**: Only commits code that passes typecheck, tests, and lint
- **Extensible**: Includes PRD generation and conversion skills for Claude Code

## Quick Start

### 1. Add as Submodule

```bash
# In your project root
git submodule add https://github.com/ryaneggz/ralph-orchestrator .ralph
cd .ralph
git submodule update --init --recursive
```

### 2. Create a PRD

**Option A: Use PRD Skill (Claude Code)**
```bash
# Load the prd skill and create a PRD for [your feature description]
# Answer the clarifying questions
# Output saved to prd.json
```

**Option B: Manual**
```bash
cp .ralph/prd.json.example .ralph/prd.json
# Edit prd.json with your user stories
```

### 3. Run Ralph

```bash
cd .ralph

# Using Claude Code (recommended)
./ralph.sh --tool claude 10

# Using Amp
./ralph.sh --tool amp 10
```

Ralph will iterate until all stories have `passes: true` or max iterations is reached.

### 4. Customize for Your Project

Update these files to match your project's needs:

- `CLAUDE.md` or `prompt.md` — Add project-specific quality check commands
- `progress.txt` — Add codebase patterns in the "Codebase Patterns" section
- Verify the PRD stories are small enough to complete in one context window

## How It Works

### Iteration Flow

```
┌─────────────────────────────────────────────┐
│  1. Read prd.json + progress.txt            │
│  2. Pick highest priority story (passes=false)│
│  3. Implement story                          │
│  4. Run quality checks                       │
│  5. Commit if passing                        │
│  6. Update prd.json (passes=true)            │
│  7. Append to progress.txt                   │
└─────────────────────────────────────────────┘
         │
         ▼
   All stories complete?
         │
    ┌────┴────┐
   Yes       No
    │         │
    ▼         ▼
  DONE    Next iteration
```

### File Structure

```
.ralph/
├── ralph.sh              # Main orchestrator loop
├── CLAUDE.md             # Agent instructions (Claude Code)
├── prompt.md             # Agent instructions (Amp)
├── prd.json              # Your task list (gitignored)
├── prd.json.example      # Example format
├── progress.txt          # Iteration learnings (gitignored)
├── .last-branch          # Current feature branch (gitignored)
├── archives/             # Previous run archives
└── LICENSE               # MIT license
```

### PRD Format

Each user story in `prd.json`:

```json
{
  "id": "US-001",
  "title": "Add login page",
  "description": "As a user, I want to log in with email/password",
  "acceptanceCriteria": [
    "Login form with email and password fields",
    "Submit calls /api/auth/login",
    "Redirects to dashboard on success",
    "Shows error message on failure",
    "Typecheck passes",
    "Tests pass"
  ],
  "priority": 1,
  "passes": false,
  "notes": ""
}
```

**Important:** Keep stories small (completable in one AI context window).

## Best Practices

### Writing Good Stories

**Good (small, focused):**
- "Add email validation to login form"
- "Create database migration for users table"
- "Add error handling to API route"

**Bad (too large):**
- "Build authentication system"
- "Implement entire dashboard"
- "Refactor backend"

### Quality Checks

Ralph relies on automated checks to prevent broken code from compounding across iterations. Configure these in `CLAUDE.md` or `prompt.md`:

```bash
# Customize these for your project
npm run typecheck   # or: tsc --noEmit, make typecheck, etc.
npm run lint        # or: eslint ., make lint, etc.
npm run test        # or: pytest, make test, etc.
```

### Codebase Patterns

Add project-specific patterns to the top of `progress.txt`:

```markdown
## Codebase Patterns
- Use server actions for all mutations (not API routes)
- Database queries use Drizzle ORM with prepared statements
- UI components live in src/components/ui/
- Always run `npm run typecheck` before committing
---
```

Future iterations read this first, reducing repeated mistakes.

## Makefile Shortcuts

For convenience, add these to your project's Makefile:

```makefile
.PHONY: ralph ralph-amp

ralph:
	./.ralph/ralph.sh --tool claude 10

ralph-amp:
	./.ralph/ralph.sh --tool amp 10
```

Then run: `make ralph`

## Claude Code Skills

This repo includes two Claude Code skills:

### PRD Skill
Generates structured PRDs through interactive questions.

```bash
# Load the prd skill and create a PRD for [feature description]
```

Output: `prd.json` ready for Ralph

### Ralph Skill
Converts markdown PRDs to Ralph JSON format.

```bash
# Load the ralph skill and convert tasks/prd-feature.md to prd.json
```

## Archiving

When you switch to a new feature (different `branchName` in PRD), Ralph automatically archives the previous run:

```
archives/
└── 2026-01-29-user-authentication/
    ├── prd.json
    └── progress.txt
```

## Debugging

```bash
# Check which stories are complete
cat .ralph/prd.json | jq '.userStories[] | {id, title, passes}'

# See learnings from previous iterations
cat .ralph/progress.txt

# Check git history
git log --oneline -10
```

## Requirements

- Bash shell
- Git
- `jq` (for JSON parsing in ralph.sh)
- AI coding tool:
  - [Amp](https://ampcode.com) (`npm install -g @amp/cli`), OR
  - [Claude Code](https://docs.anthropic.com/en/docs/claude-code)

## Repository Structure

This is designed as a **Git submodule**. Do not fork unless you're maintaining a variant. Instead:

1. Add as submodule: `git submodule add <url> .ralph`
2. Customize `CLAUDE.md`/`prompt.md` for your project
3. Create project-specific PRDs
4. Run iterations

## Contributing

Ralph Orchestrator is a thin wrapper around the Ralph pattern. Contributions welcome for:

- Bug fixes in `ralph.sh`
- Improvements to agent instructions (`CLAUDE.md`, `prompt.md`)
- Better example PRDs
- Additional Claude Code skills

Do NOT contribute project-specific code or documentation.

## License

MIT — see [LICENSE](./.ralph/LICENSE)

## References

- [Ralph pattern by Geoffrey Huntley](https://ghuntley.com/ralph/)
- [Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code)
- [Amp documentation](https://docs.ampcode.com)

---

**Made for autonomous software development**
```

---

## 6. Risk Assessment

### 6.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Accidentally delete needed files | Low | Medium | Review each deletion decision carefully; use git for reversibility |
| Break existing users of the repo | Low | Low | Unlikely to have many external users yet; breaking changes are acceptable for init state reset |
| Lose valuable documentation | Low | Medium | Audit ICP.md and PRD.md for any Ralph-orchestrator-specific insights before deletion |
| next-app deletion removes useful example | Medium | Low | Review next-app for Ralph integration patterns before deletion |

### 6.2 Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Confusion about repo purpose | Medium | Medium | Clear README rewrite explaining submodule usage |
| Users don't know how to integrate | Medium | High | Add comprehensive Quick Start and integration examples in README |
| Missing critical getting-started info | Low | High | Include Prerequisites, Requirements, and Debugging sections |

### 6.3 Strategic Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Still looks project-specific after cleanup | Low | Medium | Thorough review of all .md files for platform references |
| Submodule pattern unclear | Medium | High | Explicit submodule instructions and examples in README |
| Value proposition not clear | Medium | Medium | Strong "What is Ralph?" and "Why use this?" sections in README |

---

## 7. Complexity: Scope and Risk Level

### 7.1 Scope

**File Operations:**
- DELETE: 2-4 files (ICP.md, PRD.md, archives/, possibly next-app/)
- RESET: 2 files (progress.txt template, AGENTS.md rewrite)
- REWRITE: 1 file (README.md major rewrite)
- KEEP: ~15 files/directories as-is

**Estimated Effort:**
- File deletions: 5 minutes
- progress.txt reset: 5 minutes
- AGENTS.md rewrite: 15 minutes
- README.md rewrite: 30-45 minutes
- Review and testing: 15 minutes

**Total: 70-85 minutes of focused work**

### 7.2 Risk Level

**Overall Risk: LOW**

**Justification:**
1. **Git safety net**: All changes are reversible via git history
2. **No code changes**: Only documentation and example file cleanup
3. **Clear criteria**: Obvious distinction between generic tooling and project-specific artifacts
4. **Low external impact**: Repository appears to be primarily for internal use so far
5. **No breaking changes to core tooling**: ralph.sh, CLAUDE.md, prompt.md remain unchanged

### 7.3 Rollback Plan

If issues arise post-cleanup:

```bash
# Full rollback
git reset --hard HEAD~1

# Selective restore of deleted file
git checkout HEAD~1 -- .ralph/PRD.md

# Restore specific directory
git checkout HEAD~1 -- next-app/
```

### 7.4 Testing Plan

Before considering this complete:

1. **Verify file structure**: Confirm no broken links or references to deleted files
2. **Test submodule addition**: In a fresh test repo, add this as submodule and verify README instructions work
3. **Run ralph.sh**: Verify the orchestrator still runs with example prd.json
4. **Check .gitignore**: Confirm working files (prd.json, progress.txt, .last-branch) are ignored
5. **Review all .md files**: Search for any remaining platform-specific references
6. **Validate links**: Check all markdown links resolve correctly

---

## 8. Decision Points for Implementer

### 8.1 Critical Decision: next-app/

**Question:** Should we delete `next-app/` entirely or preserve it as an example?

**Option A: DELETE (Recommended)**
- **Pros:** Eliminates 230KB of dependencies, removes any confusion about purpose, keeps repo focused on orchestration tooling
- **Cons:** Loses potential reference implementation
- **When to choose:** If next-app doesn't demonstrate Ralph integration patterns (currently it's just vanilla Next.js starter)

**Option B: MOVE to examples/ and document**
- **Pros:** Preserves as reference implementation, shows how Ralph integrates with Next.js projects
- **Cons:** Adds maintenance burden, may confuse users about core vs. examples
- **When to choose:** If next-app demonstrates valuable Ralph integration patterns
- **Action required:**
  ```bash
  mkdir -p examples
  mv next-app examples/next-app-scaffold
  # Add examples/next-app-scaffold/README.md explaining it's an example
  ```

**Recommendation:** DELETE unless implementer finds Ralph-specific integration patterns worth preserving.

### 8.2 Secondary Decision: Archives

**Question:** Should we keep the `archives/2026-01-29/` directory as an example of archive structure?

**Option A: DELETE (Recommended)**
- Clean slate for new users
- Archive structure is self-explanatory from ralph.sh code

**Option B: KEEP as empty example**
- Create `archives/.gitkeep` with comment explaining structure
- Requires adding to .gitignore to prevent example from being committed

**Recommendation:** DELETE. The archive structure is obvious when it's created, and documented in README.

### 8.3 Tertiary Decision: .claude/ Contents

**Question:** Are the .claude/ files (agent-builder.md, command-builder.md, skill-builder.md) generic or Ralph-Platform-specific?

**Analysis:** Based on preview, these are meta-tools for building Claude Code agents/commands/skills. They're generic tooling for the Claude Code ecosystem, not Ralph Platform specific.

**Decision:** KEEP all .claude/ contents. These are part of the reusable tooling that makes this repo valuable.

---

## 9. Implementation Checklist

For the implementer, execute in this order:

### Phase 1: Audit (5 min)
- [ ] Review ICP.md and PRD.md for any Ralph-orchestrator insights to preserve
- [ ] Check next-app/ for Ralph integration patterns (decide DELETE vs. MOVE)
- [ ] Confirm all files in DELETE section are safe to remove

### Phase 2: Delete (5 min)
- [ ] Delete `.ralph/ICP.md`
- [ ] Delete `.ralph/PRD.md`
- [ ] Delete `.ralph/archives/2026-01-29/`
- [ ] DELETE or MOVE `next-app/` based on decision point 8.1

### Phase 3: Reset (10 min)
- [ ] Reset `.ralph/progress.txt` to clean template (see Section 3.1)
- [ ] Rewrite `.ralph/AGENTS.md` to generic version (see Section 3.3)

### Phase 4: README Rewrite (45 min)
- [ ] Rewrite `README.md` using structure from Section 5.2
- [ ] Add Quick Start section with submodule instructions
- [ ] Add "What is Ralph?" value proposition
- [ ] Add "How It Works" with flow diagram
- [ ] Add Best Practices section
- [ ] Add Contributing section (emphasize no project-specific contributions)
- [ ] Verify all links and references are correct

### Phase 5: Testing (15 min)
- [ ] Search all .md files for "platform", "SaaS", "Ralph Platform" (should find none)
- [ ] Test submodule addition in fresh test repo
- [ ] Verify `./ralph.sh --tool claude 1` runs without errors
- [ ] Check that .gitignore correctly ignores working files
- [ ] Validate all markdown links resolve

### Phase 6: Commit (5 min)
- [ ] Git add all changes
- [ ] Commit with message: "Reset to clean init state for submodule reuse"
- [ ] Push to main branch
- [ ] Update repository description on GitHub to: "Autonomous AI agent orchestration system for incremental software development"

---

## 10. Post-Implementation Validation

After implementation, verify:

1. **Submodule works**: Clone into a test project as submodule, follow README Quick Start
2. **No project references**: `grep -r "Ralph Platform" .` returns nothing
3. **No SaaS references**: `grep -r -i "saas\|subscription\|pricing" .` returns nothing (except in git history)
4. **Documentation clarity**: README clearly explains purpose and integration
5. **Examples work**: prd.json.example is valid and demonstrates format
6. **Tools run**: ralph.sh executes without errors (even with empty prd.json)

---

## 11. Success Criteria

This proposal is successfully implemented when:

- [ ] Repository contains ONLY generic, reusable Ralph orchestrator tooling
- [ ] No project-specific documents (ICP, PRD, platform specs)
- [ ] README clearly positions this as a submodule for any project
- [ ] Quick Start guide enables 0-to-running in <5 minutes
- [ ] All documentation uses generic examples (not Ralph Platform)
- [ ] Submodule integration is thoroughly documented
- [ ] Repository description and documentation match actual scope
- [ ] A developer unfamiliar with Ralph can add this to their project and understand how to use it from the README alone

---

## Appendix A: Before/After File Tree

### Before
```
ralph-orchestrator/
├── .claude/                    # ✅ KEEP (generic tooling)
├── .ralph/
│   ├── ICP.md                  # ❌ DELETE (platform-specific)
│   ├── PRD.md                  # ❌ DELETE (platform-specific)
│   ├── AGENTS.md               # ⚠️  REWRITE (has platform refs)
│   ├── CLAUDE.md               # ✅ KEEP (generic)
│   ├── prompt.md               # ✅ KEEP (generic)
│   ├── ralph.sh                # ✅ KEEP (core tooling)
│   ├── prd.json.example        # ✅ KEEP (good example)
│   ├── progress.txt            # ⚠️  RESET (to template)
│   ├── .last-branch            # ✅ IGNORE (gitignored)
│   ├── archives/2026-01-29/    # ❌ DELETE (project-specific)
│   └── LICENSE                 # ✅ KEEP (MIT)
├── next-app/                   # ❌ DELETE (or MOVE to examples/)
├── README.md                   # ⚠️  REWRITE (major changes)
├── Makefile                    # ✅ KEEP (convenient shortcuts)
└── .gitignore                  # ✅ KEEP (correct as-is)
```

### After
```
ralph-orchestrator/
├── .claude/                    # Generic Claude Code tooling
│   ├── agents/                 # Agent builders
│   ├── commands/               # Commands
│   ├── skills/                 # PRD & Ralph skills
│   └── ...
├── .ralph/
│   ├── AGENTS.md               # Generic orchestrator instructions
│   ├── CLAUDE.md               # Claude Code agent prompt
│   ├── prompt.md               # Amp agent prompt
│   ├── ralph.sh                # Main orchestrator loop
│   ├── prd.json.example        # Example PRD format
│   ├── progress.txt            # Clean template
│   ├── archives/               # Empty (will be populated per-project)
│   └── LICENSE                 # MIT license
├── .specs/                     # (NEW) Spec documents
│   └── reset-init-state/
│       └── PROPOSAL_REPO_ARCHITECT.md
├── README.md                   # Rewritten for submodule consumers
├── Makefile                    # Convenient shortcuts
└── .gitignore                  # Ignores working files
```

---

**End of Proposal**
