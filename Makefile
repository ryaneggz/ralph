.PHONY: ralph params archive

ENV ?= dev
MAX_ITERATIONS ?= 200

params:
	@echo "Environment: $(ENV) | Max iterations: $(MAX_ITERATIONS)"

ralph:
	./.ralph/ralph.sh --tool claude $(MAX_ITERATIONS)

archive:
	claude --dangerously-skip-permissions -p "Archive the latest prd.json & progress.json into `./.ralph/archives/YYYY-MM-DD/prd.json` and `./.ralph/archives/YYYY-MM-DD/progress.json` respectively. Create the directory if it doesn't exist."