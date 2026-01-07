import { describe, test } from "bun:test";
import { AgentTypes } from "../agents/factory";
import {
  basicTest,
  basicTestOptions,
  endToEnd,
  endToEndTestOptions,
  generateFixture,
  generateTestOptions,
  runAgentTests,
} from "./agent-test-utils";

describe.if(runAgentTests)("opencode", () => {
  test("basic", async () => {
    await basicTest(AgentTypes.OpenCode);
  }, basicTestOptions);

  test("end-to-end", async () => {
    await endToEnd(AgentTypes.OpenCode);
  }, endToEndTestOptions);

  test("generate", async () => {
    await generateFixture(AgentTypes.OpenCode);
  }, generateTestOptions);
});
