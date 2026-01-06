import { describe, test } from "bun:test";
import { AgentTypes } from "../agents/factory";
import {
  basicTest,
  basicTestOptions,
  endToEnd,
  endToEndTestOptions,
  runAgentTests,
} from "./agent-test-utils";

describe.if(runAgentTests)("gemini", () => {
  test("basic", async () => {
    await basicTest(AgentTypes.Gemini);
  }, basicTestOptions);

  test("end-to-end", async () => {
    await endToEnd(AgentTypes.Gemini);
  }, endToEndTestOptions);
});
