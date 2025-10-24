# Compass

Console tool to benchmark Copilot models across prompts against expected outcomes.

## Usage

dotnet run --project Compass -- \
  --repo-path ../path-to-target-repo \
  --config Compass/sample-config.json \
  --runs 3 \
  --output both \
  --eval-model gpt-4o-copilot

## Config File
See sample-config.json for structure.

## Notes
- Adjust the copilot CLI invocation flags inside Program.cs to match actual installed CLI syntax.
- Classification parsing is heuristic; refine as needed.

## Troubleshooting
1. Copilot CLI not found: Ensure GitHub CLI extension is installed and in PATH.
2. Models invalid error: Use one of allowed models shown in 'copilot --help' (e.g. gpt-5, claude-sonnet-4.5).
3. No file edits produced: Add --allow-all-tools and --allow-all-paths flags; confirm repository is writable.
