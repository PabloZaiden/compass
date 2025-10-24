# Compass

Console tool to benchmark Coding agents using different agents and models across prompts against expected outcomes.

## Usage

```bash
dotnet run --project Compass -- \
  --repo-path ../path-to-target-repo \
  --config Compass/sample-config.json \
  --runs 3 \
  --output json \
  --eval-model gpt-4o
```

## Configuration File

See `Compass/config/sample-config.json` for structure.

