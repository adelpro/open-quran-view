import { spawn } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function runScript(scriptPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`\n▶️  Running: ${scriptPath}\n`);

    const tsxPath = join(
      __dirname,
      "..",
      "node_modules",
      "tsx",
      "dist",
      "cli.mjs",
    );
    const child = spawn("node", [tsxPath, scriptPath], {
      cwd: join(__dirname, ".."),
      stdio: "inherit",
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script exited with code ${code}`));
      }
    });

    child.on("error", (error) => {
      reject(error);
    });
  });
}

async function main() {
  console.log("🚀 Generating all Quran data...\n");

  const scripts = [
    { name: "Metadata", path: "scripts/fetch-metadata.ts" },
    { name: "Pages", path: "scripts/fetch-pages.ts" },
    { name: "Fonts", path: "scripts/download-fonts.ts" },
    { name: "Split Pages", path: "scripts/split-pages.ts" },
    { name: "Static Fonts", path: "scripts/generate-static-fonts.ts" },
    { name: "Static Data", path: "scripts/generate-static-data.ts" },
  ];

  try {
    for (const script of scripts) {
      console.log(`\n${"=".repeat(50)}`);
      console.log(`📦 ${script.name}`);
      console.log(`${"=".repeat(50)}`);
      await runScript(script.path);
      console.log(`\n✅ ${script.name} complete`);
    }

    console.log("\n" + "=".repeat(50));
    console.log("✨ All data generated successfully!");
    console.log("=".repeat(50));
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

main();
