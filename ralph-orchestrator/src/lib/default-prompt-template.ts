/**
 * Generates a default PROMPT.md template for a project,
 * preserving project-specific variables (repo URL, branch).
 */
export function generateDefaultPromptMd(options: {
  repoUrl?: string;
  branch?: string;
}): string {
  const { repoUrl, branch } = options;

  const frontmatterLines: string[] = [
    `title: Ralph Agent Prompt`,
    `agent: ralph`,
    `iterations: 5`,
    `provider: claude-code`,
  ];

  const bodyLines: string[] = [
    `# Ralph Agent Instructions`,
    ``,
    `You are a Ralph autonomous coding agent.`,
    ``,
    `## Repository`,
    ``,
  ];

  if (repoUrl) {
    bodyLines.push(`- **Repo**: ${repoUrl}`);
  } else {
    bodyLines.push(`- **Repo**: _(not configured)_`);
  }

  bodyLines.push(`- **Branch**: ${branch || "main"}`);
  bodyLines.push(
    ``,
    `## Task`,
    ``,
    `Describe the task for the agent here.`,
    ``,
    `## Constraints`,
    ``,
    `- Keep changes focused and minimal`,
    `- Run quality checks before committing`,
    `- Follow existing code patterns`,
    ``
  );

  const fm = frontmatterLines.join("\n");
  const body = bodyLines.join("\n");

  return `---\n${fm}\n---\n${body}`;
}
