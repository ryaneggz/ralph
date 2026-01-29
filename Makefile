.PHONY: ralph

ENV ?= dev

example:
	@echo "Building for $(ENV) | Ralph directory: ./.ralph/"

ralph:
	./.ralph/ralph.sh --tool claude 200

archive:
	claude --dangerously-skip-permissions -p "Archive the latest prd.json & progress.json into `./.ralph/archives/YYYY-MM-DD/prd.json` and `./.ralph/archives/YYYY-MM-DD/progress.json` respectively. Create the directory if it doesn't exist."