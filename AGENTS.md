Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Always run `bun run build` before running tests, to make sure there are no build errors.
Use `bun test` to run all the tests that don't require agent interaction.

Always run `bun test` when you think you are done making changes.

Use `bun test:agents src/tests/<agent>.test.ts` to run tests for a specific agent (e.g., `bun test:agents src/tests/copilot.test.ts`, `bun test:agents src/tests/gemini.test.ts`).

Use `bun test:agents src/tests/opencode.test.ts` to run tests for an agent that won't require authentication.

Only run `bun test:agents <...>` after user confirmation.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.mdx`.
