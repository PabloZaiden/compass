# Plan: Fix Agent Default Model Auto-Selection in TUI

## Problem Statement

When selecting a different agent in the run action (ink or opentui mode), the default model for that agent should be automatically selected. This feature stopped working.

## Root Cause Analysis

After investigating the codebase:

1. **Compass has the correct implementation**: Both `RunCommand` and `GenerateCommand` in compass correctly implement `onConfigChange()` to return updated model values when the agent changes:
   - `src/commands/run.ts:257-273` - Updates `model` and `eval-model` when agent changes
   - `src/commands/generate.ts:226-238` - Updates `model` when agent changes

2. **Terminatui does NOT call `onConfigChange()`**: The issue is in the terminatui framework. In `ConfigController.tsx:134-138`, when a field value is updated via the editor modal, the code simply merges the new value without invoking the command's `onConfigChange` hook:
   ```typescript
   onSubmit: (value: unknown) => {
       this.navigation.replace("config" satisfies TuiRoute, {
           ...params,
           values: { ...params.values, [fieldId]: value },  // <-- Missing onConfigChange call
       });
       this.navigation.closeModal();
   },
   ```

3. **Test exists but implementation is missing**: There's a unit test (`__tests__/configOnChange.test.ts`) that demonstrates how `onConfigChange` should work, but the actual TUI code never integrates this functionality.

## Conclusion

**This is a terminatui issue, not a compass issue.** The fix needs to be made in the `@pablozaiden/terminatui` package, specifically in the `ConfigController` class.

---

## Objectives

1. Implement proper `onConfigChange` invocation in terminatui's `ConfigController`
2. Ensure model fields automatically update when agent type changes in TUI mode
3. Maintain backward compatibility for commands that don't implement `onConfigChange`

---

## Step-by-Step Tasks

### Task 1: Modify ConfigController to call onConfigChange
**Location**: terminatui - `src/tui/controllers/ConfigController.tsx`  
**Complexity**: Low  
**Dependencies**: None

**Description**:
Update the `onSubmit` callback in the `render()` method to:
1. Call `params.command.onConfigChange?.(fieldId, value, { ...params.values, [fieldId]: value })`
2. Merge the returned updates (if any) with the new values
3. Update navigation state with the merged values

**Implementation approach**:
```typescript
onSubmit: (value: unknown) => {
    let newValues = { ...params.values, [fieldId]: value };
    
    // Call onConfigChange if defined and merge any returned updates
    const updates = params.command.onConfigChange?.(fieldId, value, newValues);
    if (updates && typeof updates === 'object') {
        newValues = { ...newValues, ...updates };
    }
    
    this.navigation.replace("config" satisfies TuiRoute, {
        ...params,
        values: newValues,
    });
    this.navigation.closeModal();
},
```

### Task 2: Add unit tests for onConfigChange integration
**Location**: terminatui - `src/__tests__/configController.test.ts` (new file or existing)  
**Complexity**: Low  
**Dependencies**: Task 1

**Description**:
Create integration tests to verify:
1. `onConfigChange` is called when a field value changes
2. Returned updates are properly merged into values
3. Commands without `onConfigChange` continue to work normally
4. Multiple cascading updates work correctly

### Task 3: Verify fix in compass
**Location**: compass  
**Complexity**: Low  
**Dependencies**: Tasks 1-2

**Description**:
After terminatui is updated:
1. Update the `@pablozaiden/terminatui` dependency to the new version
2. Manually test the run command in TUI mode:
   - Select an agent
   - Verify model and eval-model fields update automatically
3. Test the generate command similarly

---

## Summary

| Task | Description | Location | Complexity | Dependencies |
|------|-------------|----------|------------|--------------|
| 1 | Modify ConfigController to call onConfigChange | terminatui | Low | None |
| 2 | Add unit tests for onConfigChange integration | terminatui | Low | Task 1 |
| 3 | Verify fix in compass | compass | Low | Tasks 1-2 |

---

## Notes

- The fix is entirely in the **terminatui** package, not compass
- Compass already has the correct `onConfigChange` implementations
- The existing unit test in terminatui (`configOnChange.test.ts`) provides a good reference for the expected behavior
- After the terminatui fix is released, compass just needs to update its dependency version
