import { convert } from "@opendataloader/pdf";
import * as path from "path";

async function main() {
  const inputDir = path.join(__dirname, "files");
  const outputDir = path.join(__dirname, "markdown");

  await convert([inputDir], {
    outputDir: outputDir,
    format: "markdown",
  });
}

main().catch((error) => {
  console.error("Error converting PDF to Markdown:", error);
  process.exit(1);
});
