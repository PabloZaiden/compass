import { readFile } from "fs/promises";
import { join } from "path";

export class Prompts {
  private static readonly CONFIG_DIRECTORY = "Compass/config";
  private static readonly PROMPTS_FILE_NAME = "prompts.json";

  private config: Record<string, unknown>;

  static getPromptsFilePath(): string {
    return join(this.CONFIG_DIRECTORY, this.PROMPTS_FILE_NAME);
  }

  constructor(config: Record<string, unknown>) {
    this.config = config;
  }

  static async load(filePath?: string): Promise<Prompts> {
    const path = filePath ?? this.getPromptsFilePath();
    const content = await readFile(path, "utf-8");
    const config = JSON.parse(content);
    return new Prompts(config);
  }

  get evaluator(): string {
    return (this.config.evaluator as string) ?? "";
  }
}
