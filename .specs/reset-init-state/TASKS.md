# Implementation Tasks: Reset to Clean Init State

## Pre-Flight Safety

- [ ] Task: Verify clean working directory state
  - Files: `git status` output
  - Acceptance: No uncommitted changes or untracked files that would interfere with cleanup

- [ ] Task: Create snapshot tag before any modifications
  - Files: Git tag `ralph-platform-snapshot`
  - Acceptance: Tag created locally and pushed to origin successfully with message "Snapshot before cleanup to generic init state"

- [ ] Task: Audit repository for project-specific references
  - Files: All files except `.git/`
  - Command: `grep -r "next-app" --exclude-dir=.git .`
  - Acceptance: Only expected files contain references (AGENTS.md, README.md, next-app/)

- [ ] Task: Audit repository for PRD.md and ICP.md references
  - Files: All files except `.git/`
  - Command: `grep -r "PRD.md\|ICP.md" --exclude-dir=.git .`
  - Acceptance: Only expected files contain references (if any)

- [ ] Task: Audit repository for "ralph platform" references
  - Files: All files except `.git/`
  - Command: `grep -r "ralph platform" --exclude-dir=.git . -i`
  - Acceptance: Only expected files contain references (PRD.md, ICP.md, README.md)

## Documentation

- [ ] Task: Draft new README.md focused on submodule usage
  - Files: `README-new.md` (temporary)
  - Acceptance:
    - 300-350 lines total
    - Contains all 16 sections from unified plan
    - No project-specific references (Ralph Platform, deepagentsjs, next-app)
    - Contains "submodule" and "Quick Start" sections
    - All code examples are executable and tested

- [ ] Task: Update .ralph/AGENTS.md to remove next-app references
  - Files: `.ralph/AGENTS.md`
  - Lines to remove: 32, 38-39
  - Acceptance:
    - Lines 32, 38-39 removed or replaced with generic examples
    - No "next-app" references remain in file
    - All remaining content is generic and reusable

- [ ] Task: Test all README.md code examples
  - Files: `README-new.md`
  - Acceptance:
    - Every bash/shell code block executes without errors
    - Integration example can be followed from scratch
    - Example PRD runs successfully

## Configuration

- [ ] Task: Update .gitignore with explicit .ralph/ paths
  - Files: `.gitignore`
  - Changes:
    - Add explicit: `prd.json`, `.ralph/prd.json`, `progress.txt`, `.ralph/progress.txt`, `.ralph/.last-branch`
    - Uncomment/ensure: `.ralph/archives/`
    - Add defensive patterns: `**/node_modules/`, `**/.next/`
  - Acceptance:
    - All specified patterns present in .gitignore
    - No duplicate patterns
    - Comments preserved and clear

- [ ] Task: Add documentation comments to Makefile targets
  - Files: `Makefile`
  - Acceptance:
    - Every target has a clear comment explaining its purpose
    - No functionality changes, only documentation
    - Comments use consistent style

## Deletions

- [ ] Task: Delete .ralph/ICP.md
  - Files: `.ralph/ICP.md` (154 lines)
  - Command: `rm .ralph/ICP.md`
  - Acceptance: File no longer exists, verified with `test ! -f .ralph/ICP.md`

- [ ] Task: Delete .ralph/PRD.md
  - Files: `.ralph/PRD.md` (1,518 lines)
  - Command: `rm .ralph/PRD.md`
  - Acceptance: File no longer exists, verified with `test ! -f .ralph/PRD.md`

- [ ] Task: Delete .ralph/archives/2026-01-29/ directory
  - Files: `.ralph/archives/2026-01-29/` (entire directory)
  - Command: `rm -rf .ralph/archives/2026-01-29/`
  - Acceptance: Directory no longer exists, verified with `test ! -d .ralph/archives/2026-01-29/`

- [ ] Task: Delete next-app/ directory
  - Files: `next-app/` (entire scaffolded Next.js application)
  - Command: `rm -rf next-app/`
  - Acceptance: Directory no longer exists, verified with `test ! -d next-app/`

- [ ] Task: Replace old README.md with new version
  - Files: `README.md` (old), `README-new.md` (new)
  - Commands: `mv README.md README.md.backup`, `mv README-new.md README.md`
  - Acceptance: New README.md in place, old version backed up temporarily

## Verification

- [ ] Task: Verify no "Ralph platform" references remain
  - Files: All files except `.git/`
  - Command: `! grep -r "Ralph platform" --exclude-dir=.git . -i`
  - Acceptance: Grep returns no results (exit code 1 when using `!`)

- [ ] Task: Verify no "deepagentsjs" references remain
  - Files: All files except `.git/`
  - Command: `! grep -r "deepagentsjs" --exclude-dir=.git . -i`
  - Acceptance: Grep returns no results (exit code 1 when using `!`)

- [ ] Task: Verify no "next-app" references remain
  - Files: All files except `.git/`
  - Command: `! grep -r "next-app" --exclude-dir=.git .`
  - Acceptance: Grep returns no results (exit code 1 when using `!`)

- [ ] Task: Verify all core files are present
  - Files: `.ralph/ralph.sh`, `.ralph/CLAUDE.md`, `.ralph/prompt.md`, `.ralph/prd.json.example`
  - Commands: `test -f .ralph/ralph.sh`, `test -f .ralph/CLAUDE.md`, `test -f .ralph/prompt.md`, `test -f .ralph/prd.json.example`
  - Acceptance: All test commands return success (exit code 0)

- [ ] Task: Verify README contains submodule documentation
  - Files: `README.md`
  - Commands: `grep "submodule" README.md`, `grep "Quick Start" README.md`
  - Acceptance: Both grep commands return matches

- [ ] Task: Verify .gitignore properly configured
  - Files: `.gitignore`
  - Command: `grep ".ralph/archives/" .gitignore`
  - Acceptance: Pattern found in .gitignore

- [ ] Task: Functional test - Copy example PRD
  - Files: `.ralph/prd.json.example`, `.ralph/prd.json`
  - Command: `cp .ralph/prd.json.example .ralph/prd.json`
  - Acceptance: Copy succeeds, prd.json exists

- [ ] Task: Functional test - Execute Ralph with example PRD
  - Files: `.ralph/ralph.sh`, `.ralph/prd.json`
  - Command: `./.ralph/ralph.sh --tool claude 1`
  - Acceptance: Script executes without errors, completes one iteration

- [ ] Task: Verify working files are gitignored
  - Files: `prd.json`, `progress.txt`
  - Command: `git status | grep -v "prd.json\|progress.txt"`
  - Acceptance: Generated files do not appear in git status as untracked

## Commit

- [ ] Task: Stage all changes for commit
  - Files: All modified and deleted files
  - Command: `git add -A`
  - Acceptance: `git status` shows all changes staged, no untracked files

- [ ] Task: Create atomic commit with comprehensive message
  - Files: All staged changes
  - Acceptance:
    - Single commit created
    - Commit message follows template from unified plan (Section 4, Phase 6)
    - Message includes: removed files, updated files, preserved files, recovery info, testing notes
    - Co-Authored-By line included

- [ ] Task: Push commit to origin/master
  - Files: N/A (git operation)
  - Command: `git push origin master`
  - Acceptance: Push succeeds, commit visible on remote

- [ ] Task: Clean up temporary backup file
  - Files: `README.md.backup`
  - Command: `rm README.md.backup`
  - Acceptance: Backup file removed after successful push

## Post-Implementation Testing

- [ ] Task: Test submodule addition in a test repository
  - Files: External test repository
  - Commands: `git submodule add <repo-url> .ralph`, `git submodule update --init --recursive`
  - Acceptance: Submodule adds cleanly, no errors, all files present

- [ ] Task: Verify GitHub repository description matches new scope
  - Files: GitHub repository settings (web UI)
  - Acceptance: Description mentions "autonomous agent orchestration toolkit" or similar, not project-specific language

- [ ] Task: Verify repository size reduced
  - Files: Repository (du command)
  - Command: `du -sh .`
  - Acceptance: Repository size < 10MB (next-app node_modules removed)

## Completion Signature

- Total Tasks: 32
- Estimated Duration: 90-120 minutes
- Risk Level: LOW
- Reversibility: Complete (tag ralph-platform-snapshot + git history)
- Dependencies:
  - Git with write access to origin
  - Claude Code or Amp for functional testing
  - Bash shell for verification commands
  - Text editor for documentation updates

## Rollback Plan (If Needed)

```bash
# Full rollback to pre-cleanup state
git reset --hard ralph-platform-snapshot

# Restore specific deleted file
git checkout ralph-platform-snapshot -- .ralph/PRD.md

# Restore directory
git checkout ralph-platform-snapshot -- next-app/

# Compare changes
git diff ralph-platform-snapshot master
```

## Success Criteria Summary

**Developer Experience:**
- Developer unfamiliar with Ralph can understand purpose in < 5 minutes from README
- Integration as submodule takes < 15 minutes (add → PRD → run)
- Zero confusion about project-specific vs. generic artifacts

**Technical Quality:**
- No project-specific references in active files (verified via grep)
- All README code examples execute correctly
- Ralph orchestrator runs successfully with example PRD
- .gitignore properly excludes working files

**Repository Hygiene:**
- < 10MB total size (removing next-app node_modules)
- Clear LICENSE and attribution
- Documentation matches actual scope
- Git history preserves deleted content

**Maintainability:**
- No framework dependencies to update (Next.js, React removed)
- Reduced maintenance surface area
- Clear contribution guidelines (no project-specific additions)
