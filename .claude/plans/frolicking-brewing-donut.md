# Plan: Create Post Bridge API Skill

## Context
The project needs a skill for interacting with the Post Bridge social media publishing API. The branch `feat/3-post-bridge-skill` is already checked out. The skill will guide Claude through the full API workflow: listing accounts, uploading media, creating/scheduling posts, and checking results.

## Approach
Create a single file: `.claude/skills/post-bridge/SKILL.md`

No changes to `settings.local.json` needed — existing skills aren't registered there either.

## Skill Structure (matching existing patterns from `prd/SKILL.md` and `ralph/SKILL.md`)
- YAML frontmatter with `name` and `description` (including trigger phrases)
- Sections: Purpose, Prerequisites (auth/base URL), Core Workflow (3-step), Endpoints Reference, Platform Configurations, Scheduling, Examples, Checklist
- Trigger phrases: "post to social media", "schedule a post", "upload media to post bridge", "list social accounts", "publish content", "post bridge"
- Base URL: `https://api.post-bridge.com`
- Target: ~120 lines, under 5,000 words

## Files to Create
- `.claude/skills/post-bridge/SKILL.md` — the complete skill definition

## Files to Reference
- `.claude/skills/prd/SKILL.md` — pattern reference
- `.claude/skills/ralph/SKILL.md` — pattern reference

## Verification
1. Confirm the skill file exists and follows the YAML frontmatter pattern
2. Confirm trigger phrases are embedded in the description
3. Confirm all API endpoints are documented
4. Confirm examples cover both immediate and scheduled posting workflows
