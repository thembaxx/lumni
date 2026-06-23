import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import https from "https";

const OUT = resolve(__dirname, "..", "public", "animations", "new");
mkdirSync(OUT, { recursive: true });

function download(url) {
  return new Promise((resolve2, reject) => {
    https
      .get(url, (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve2(Buffer.concat(chunks)));
      })
      .on("error", reject);
  });
}

async function main() {
  // Download the typing indicator - this one actually works
  try {
    const data = await download(
      "https://assets-v2.lottiefiles.com/a/90bdd36c-1152-11ee-bdb8-cb8fe6b15cf6/dh6UtgKB5z.lottie",
    );
    const outPath = resolve(OUT, "typing-indicator.lottie");
    writeFileSync(outPath, data);
    console.log(`✓ typing-indicator.lottie (${(data.length / 1024).toFixed(1)} KB)`);
    // Check raw bytes
    const firstBytes = data.slice(0, 2).toString("hex");
    console.log(
      `  First 2 bytes: ${firstBytes} (${firstBytes === "504b" ? "Valid ZIP" : "Not ZIP"})`,
    );
  } catch (e) {
    console.log(`✗ typing-indicator: ${e.message}`);
  }

  // Let's also try some different URLs from LottieFiles
  const animations = [
    {
      id: "book-open",
      // From LottieFiles CDN - try a known working public animation
      url: "https://assets1.lottiefiles.com/packages/lf20_D938zjFFab.json",
    },
  ];

  for (const { id, url } of animations) {
    try {
      const data = await download(url);
      const parsed = JSON.parse(data.toString("utf-8"));
      console.log(`✓ ${id} - valid Lottie JSON (v${parsed.v})`);
    } catch (e) {
      console.log(`✗ ${id}: ${e.message}`);
    }
  }
}

main().catch(console.error);
