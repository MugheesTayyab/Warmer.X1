import JSZip from "jszip";
import fs from "fs";
import path from "path";

/**
 * Creates a buffer containing the zipped project source files
 */
export async function createProjectZip(): Promise<Buffer> {
  const zip = new JSZip();
  const rootDir = process.cwd();

  const includePaths = [
    ".env.example",
    "index.html",
    "metadata.json",
    "package.json",
    "tsconfig.json",
    "vite.config.ts",
    "server.ts",
    "README.md",
    "src",
  ];

  function addFilesToZip(targetPath: string, zipFolder: JSZip) {
    const fullPath = path.join(rootDir, targetPath);
    if (!fs.existsSync(fullPath)) return;

    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      const entries = fs.readdirSync(fullPath);
      for (const entry of entries) {
        if (entry === "node_modules" || entry === "dist" || entry === ".git") continue;
        addFilesToZip(path.join(targetPath, entry), zipFolder);
      }
    } else if (stats.isFile()) {
      const content = fs.readFileSync(fullPath);
      zipFolder.file(targetPath, content);
    }
  }

  for (const item of includePaths) {
    addFilesToZip(item, zip);
  }

  const zipContent = await zip.generateAsync({ type: "nodebuffer" });
  return zipContent;
}
