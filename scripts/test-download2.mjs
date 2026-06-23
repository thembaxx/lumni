import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import https from "https";

const OUT = resolve(__dirname, "..", "public", "animations", "new");
mkdirSync(OUT, { recursive: true });

function download(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    lib
      .get(url, (res) => {
        // Follow redirects
        if (res.statusCode === 301 || res.statusCode === 302) {
          const loc = res.headers.location;
          if (loc) {
            download(loc).then(resolve).catch(reject);
            return;
          }
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", reject);
  });
}

async function main() {
  // List of known public Lottie JSON files from various sources
  const sources = [
    // LottieFiles samples that are typically public
    {
      id: "loading-dots-alt",
      name: "Loading Dots Alternative",
      url: "https://lottie.host/2604b0d2-d071-45fc-822a-1d1696937422/LXwCso1Dg4.json",
    },
    // Sample Lottie from lottie-js repo
    {
      id: "celebration-fireworks",
      name: "Celebration Fireworks",
      url: "https://assets1.lottiefiles.com/packages/lf20_jiiqivn5.json",
    },
    // Public Lottie from community
    {
      id: "book-reading",
      name: "Book Reading",
      url: "https://assets1.lotties.com/animations/lf20_zxhEeJ.json",
    },
  ];

  // We already have the typing indicator, save it
  const typingIndicator = resolve(
    __dirname,
    "..",
    "public",
    "animations",
    "new",
    "typing-indicator.lottie",
  );
  if (existsSync(typingIndicator)) {
    const size = readFileSync(typingIndicator).length;
    console.log(`✓ typing-indicator.lottie already saved (${(size / 1024).toFixed(1)} KB)`);
  }

  let success = 0;
  let fail = 0;

  for (const { id, name, url } of sources) {
    try {
      const data = await download(url);
      const str = data.toString("utf-8");

      // Check if it's valid JSON
      const parsed = JSON.parse(str);
      if (parsed.v && parsed.fr) {
        // It's a valid Lottie JSON - save it and convert
        const tmpPath = resolve(OUT, `${id}.json`);
        writeFileSync(tmpPath, str);
        console.log(`✓ ${name} (${(data.length / 1024).toFixed(1)} KB) - Lottie v${parsed.v}`);
        success++;
      } else {
        console.log(`✗ ${name}: Not a valid Lottie file (missing v/fr)`);
        fail++;
      }
    } catch (e) {
      console.log(`✗ ${name}: ${e.message}`);
      fail++;
    }
  }

  console.log(`\n${success} succeeded, ${fail} failed`);
}

main().catch(console.error);
