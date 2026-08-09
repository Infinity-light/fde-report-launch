import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = resolve(projectRoot, "dist");

await rm(outputRoot, { recursive: true, force: true });
await mkdir(resolve(outputRoot, "styles"), { recursive: true });
await mkdir(resolve(outputRoot, "scripts"), { recursive: true });

await cp(resolve(projectRoot, "index.html"), resolve(outputRoot, "index.html"));
await cp(resolve(projectRoot, "styles", "deck.css"), resolve(outputRoot, "styles", "deck.css"));
await cp(resolve(projectRoot, "scripts", "deck.js"), resolve(outputRoot, "scripts", "deck.js"));
await cp(resolve(projectRoot, "assets"), resolve(outputRoot, "assets"), { recursive: true });
await cp(resolve(projectRoot, "CNAME"), resolve(outputRoot, "CNAME"));

console.log(outputRoot);
