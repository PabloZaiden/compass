import { CompassApp } from "./app.ts";

const app = new CompassApp();
await app.run(Bun.argv.slice(2));