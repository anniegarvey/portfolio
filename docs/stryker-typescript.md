# Stryker TypeScript Integration

## Configuration

Stryker is now configured with TypeScript type checking to catch more mutants automatically.

### Installed Package
```bash
pnpm add -D @stryker-mutator/typescript-checker
```

### Configuration (`stryker.config.json`)
```json
{
  "plugins": [
    "@stryker-mutator/vitest-runner",
    "@stryker-mutator/typescript-checker"
  ],
  "checkers": ["typescript"],
  "tsconfigFile": "tsconfig.json"
}
```

## Benefits

The TypeScript checker automatically **rejects mutants that cause type errors**, preventing them from being tested. This:

1. **Speeds up mutation testing** - No need to run tests for type-invalid mutants
2. **Improves mutation score accuracy** - Only semantically valid mutants are counted
3. **Catches more bugs** - Type-level mutations are automatically detected

## Results

### Before TypeScript Checker:
- **utils.ts**: 95.35% mutation score
- 2 survived mutants out of 43

### After TypeScript Checker:
- **utils.ts**: **100% mutation score** 🎉
- 0 survived mutants
- 15 mutants rejected by TypeScript checker
- 9 mutants timed out (likely infinite loops)
- 19 mutants killed by tests

## Running Mutation Tests

### Test all files:
```bash
pnpm stryker run
```

### Test specific file:
```bash
pnpm stryker run --mutate "src/lib/energy-planner/utils.ts"
```

### View HTML report:
```
reports/mutation/mutation.html
```

## What the TypeScript Checker Catches

The checker rejects mutants that would cause:
- Type mismatches
- Missing properties
- Invalid function signatures
- Incorrect return types
- And other TypeScript compilation errors

This ensures only **semantically valid** mutations are tested, making the mutation score more meaningful.
