# Using the New Ink TUI

## Quick Start

Run the new Ink-based TUI:

```bash
COMPASS_TUI_INK=true bun run src/index.ts
```

Or use the traditional OpenTUI:

```bash
COMPASS_TUI=true bun run src/index.ts
```

## Features

### Configuration Panel
The left side displays all configuration options:
- **Agent** - Select which AI agent to benchmark (Copilot, OpenCode, Gemini, etc.)
- **Repository path** - Path to the git repository to test
- **Fixture file** - Path to the JSON fixture file with test prompts
- **Iterations** - Number of times to run each prompt
- **Output mode** - Format for output (Detailed, Concise, etc.)
- **Log level** - Logging verbosity (Info, Debug, Trace, etc.)
- **Use cache** - Whether to cache agent outputs
- **Stop on error** - Whether to halt on first error
- **Allow full access** - Grant full repository access to agent
- **Model** - LLM model to use
- **Eval model** - Model for evaluation

### Navigation & Interaction

#### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| **↑ / ↓** | Navigate between fields |
| **Tab / Shift+Tab** | Navigate between fields |
| **Ctrl+R** | Run benchmarks |
| **Ctrl+L** | Toggle logs panel |
| **q / Esc** | Quit application |
| **Ctrl+C** | Emergency exit |

### Logs Panel
Real-time display of application logs with color-coded severity:
- **TRACE** - Detailed trace information (cyan)
- **DEBUG** - Debug information (green)
- **INFO** - Informational messages (white)
- **WARN** - Warning messages (yellow)
- **ERROR** - Error messages (red)
- **FATAL** - Critical errors (bright red)

Toggle with **Ctrl+L** to make more room for other panels.

### Results Panel
After running benchmarks, see:
- Number of iteration results completed
- Sample iteration results with pass/fail status
- Aggregated statistics by prompt
- Average scores and iteration counts

### Configuration Persistence
Your configuration is automatically saved to `~/.compass/config.json` and loaded on startup, so your settings persist between sessions.

## Example Workflow

1. **Start the TUI:**
   ```bash
   COMPASS_TUI_INK=true bun run src/index.ts
   ```

2. **Configure the benchmark:**
   - Use arrow keys to navigate fields
   - Enter values for repository path and fixture file
   - Select agent type and other options

3. **Run the benchmark:**
   - Press **Ctrl+R** or navigate to "Run" and press Enter
   - Watch logs update in real-time
   - Results display when complete

4. **View results:**
   - See aggregated statistics and iteration summaries
   - Log panel shows detailed execution information

5. **Run again:**
   - Modify configuration as needed
   - Press **Ctrl+R** to run another benchmark

## Comparing with Original TUI

The Ink TUI provides:
- ✅ Cleaner, more maintainable codebase
- ✅ Better component structure
- ✅ More stable and mature underlying library
- ✅ Easier to extend and customize
- ✅ Full React component model

The main visual difference is a simpler, more straightforward layout optimized for clarity.

## Tips

1. **Large logs** - Ctrl+L to toggle logs if they're taking up too much space
2. **Long config values** - Values are truncated in display but stored in full
3. **Config changes** - Configuration is saved immediately to ~/.compass/config.json
4. **Multiple runs** - Run multiple benchmarks in sequence without restarting

## Troubleshooting

**No output after Ctrl+R?**
- Check the logs panel (Ctrl+L to toggle visibility)
- Verify repository path and fixture file are correct

**Need to edit a field?**
- Currently fields are set at startup
- Modify ~/.compass/config.json directly to change defaults
- Or restart and reconfigure

**Want the old TUI?**
- Use `COMPASS_TUI=true bun run src/index.ts`
- The original OpenTUI implementation is still available
