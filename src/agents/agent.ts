import type { AgentOutput } from "../models.ts";

export abstract class Agent {
  abstract get name(): string;
  abstract execute(prompt: string, model: string, workingDirectory: string): Promise<AgentOutput>;
  abstract ensureLogin(): Promise<void>;

  static async create(agentType: string): Promise<Agent> {
    const normalizedType = agentType.toLowerCase();
    
    switch (normalizedType) {
      case "githubcopilot": {
        const { GithubCopilot } = await import("./github-copilot.ts");
        return new GithubCopilot();
      }
      case "codex": {
        const { Codex } = await import("./codex.ts");
        return new Codex();
      }
      case "opencode": {
        const { OpenCode } = await import("./opencode.ts");
        return new OpenCode();
      }
      default:
        throw new Error(`Unsupported agent type: ${agentType}`);
    }
  }
}
