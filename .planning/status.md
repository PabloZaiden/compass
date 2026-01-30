# Status: Fix Agent Default Model Auto-Selection in TUI

## Current Phase: Planning Complete

## Summary

The issue has been identified as a **terminatui bug**, not a compass issue.

**Root Cause**: The terminatui framework's `ConfigController` does not call the command's `onConfigChange()` hook when field values are updated. This means the compass `RunCommand` and `GenerateCommand` implementations correctly define `onConfigChange()` to update the model when agent changes, but terminatui never invokes it.

---

## Task Status

| Task | Status | Notes |
|------|--------|-------|
| 1. Modify ConfigController to call onConfigChange | Not Started | Fix in terminatui package |
| 2. Add unit tests for onConfigChange integration | Not Started | In terminatui package |
| 3. Verify fix in compass | Not Started | After terminatui update |

---

## Key Findings

### What Works (Compass)
- `RunCommand.onConfigChange()` at `src/commands/run.ts:257-273`
- `GenerateCommand.onConfigChange()` at `src/commands/generate.ts:226-238`
- Default model mapping in `src/agents/factory.ts`

### What's Broken (Terminatui)
- `ConfigController.render()` at `node_modules/@pablozaiden/terminatui/src/tui/controllers/ConfigController.tsx:134-138`
- The `onSubmit` callback updates values without calling `onConfigChange`

---

## Next Steps

1. Fix must be implemented in **terminatui** repository
2. After terminatui is fixed and published, update compass dependency
3. Manual testing in TUI mode to verify the fix

---

## Timeline

- **Plan created**: Ready for implementation
- **Implementation**: Blocked - requires terminatui changes
- **Verification**: Pending terminatui fix
