import { existsSync } from "fs";
import { join, dirname } from "path";

export class TestUtils {
  static repoRoot(): string {
    let current = process.cwd();

    while (current) {
      if (existsSync(join(current, "compass.sln")) || existsSync(join(current, "package.json"))) {
        return current;
      }

      const parent = dirname(current);
      if (parent === current) {
        break;
      }

      current = parent;
    }

    throw new Error("Unable to locate repository root");
  }
}
