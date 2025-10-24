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
