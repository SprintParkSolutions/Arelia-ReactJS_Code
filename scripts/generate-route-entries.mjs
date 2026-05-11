import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

const distDir = path.resolve("dist");
const sourceIndex = path.join(distDir, "index.html");
const routes = ["about-us", "services", "contact-us"];

for (const route of routes) {
  const routeDir = path.join(distDir, route);
  const routeIndex = path.join(routeDir, "index.html");
  await mkdir(routeDir, { recursive: true });
  await copyFile(sourceIndex, routeIndex);
}
