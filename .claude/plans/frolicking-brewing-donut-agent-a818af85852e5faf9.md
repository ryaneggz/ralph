# Plan: Create post-bridge Skill

## Goal
Create `.claude/skills/post-bridge/SKILL.md` following the exact patterns of the existing `prd` and `ralph` skills.

## Observations from Existing Skills

### Pattern
- Both skills use YAML frontmatter with `name` and `description` keys
- `description` is a quoted string that includes trigger phrases inline
- Body uses `# Title`, `---` horizontal rules as section dividers, `## Section` headers
- Instructions use imperative form ("Receive", "Ask", "Generate", "Take")
- Examples show input/output pairs with concrete detail
- Checklists at the end with `- [ ]` items
- No nested folders needed for this skill (no scripts/references/assets required)

### Settings
- `.claude/settings.local.json` does NOT register skills — only hooks and plugins
- No changes needed to settings

## Skill Design

### Frontmatter
```yaml
name: post-bridge
description: "Interact with the Post Bridge social media publishing API. Use when posting to social media, scheduling content, uploading media, listing social accounts, publishing content, or checking post results. Triggers on: post to social media, schedule a post, upload media to post bridge, list social accounts, publish content, post bridge."
```

### Degrees of Freedom: Medium
The API workflow has a defined order (accounts -> media -> post) but caption content and scheduling choices are flexible.

### Sections
1. The Job — one-liner purpose statement
2. Prerequisites — base URL and auth setup
3. Workflow — the 3-step core flow (accounts, media upload, post creation)
4. Endpoints Reference — organized by resource (social accounts, media, posts, post results)
5. Content Hierarchy — explain override precedence
6. Scheduling — immediate vs scheduled vs queue
7. Examples — two realistic scenarios (immediate post, scheduled post with media)
8. Checklist

### Size Target
Medium skill (~100-130 lines). The API has enough detail to warrant more than a simple skill but should stay concise.

## Files to Create
- `/home/ryaneggz/sandbox/2026/ralph-orchestrator/.claude/skills/post-bridge/SKILL.md`

## Files NOT to Modify
- `.claude/settings.local.json` — no skill registration needed
