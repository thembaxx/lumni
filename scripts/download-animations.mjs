import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import https from "https";

const OUT = resolve(__dirname, "..", "public", "animations", "new");
mkdirSync(OUT, { recursive: true });

function download(url) {
  return new Promise((resolve2, reject) => {
    const req = https.get(url, (res) => {
      // Follow redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        const loc = res.headers.location;
        if (loc) {
          download(loc).then(resolve2).catch(reject);
          return;
        }
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve2(Buffer.concat(chunks)));
    });
    req.on("error", reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject2(new Error("Timeout"));
    });
    let reject2 = reject;
  });
}

async function tryUrls(urls) {
  for (const url of urls) {
    try {
      const data = await download(url);
      const str = data.toString("utf-8");
      const parsed = JSON.parse(str);
      if (parsed.v && parsed.layers) {
        return parsed;
      }
    } catch {
      // Try next
    }
  }
  return null;
}

async function main() {
  // Download the typing indicator - already saved
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

  // Try multiple CDN URLs for each animation type
  const animations = {
    // LottieFiles raw storage
    "loading-ellipsis": [
      "https://assets1.lottiefiles.com/packages/lf20_T9pceQ.json",
      "https://assets6.lottiefiles.com/packages/lf20_T9pceQ.json",
    ],
    celebration: [
      "https://assets1.lottiefiles.com/packages/lf20_gKQRQx.json",
      "https://assets1.lottiefiles.com/packages/lf20_jiiqivn5.json",
    ],
    book: [
      "https://assets2.lottiefiles.com/packages/lf20_9xq5tvxm.json",
      "https://assets3.lottiefiles.com/packages/lf20_9xq5tvxm.json",
    ],
  };

  let success = 0;
  let fail = 0;

  for (const [id, urls] of Object.entries(animations)) {
    try {
      const data = await tryUrls(urls);
      if (data) {
        const outPath = resolve(OUT, `${id}.json`);
        writeFileSync(outPath, JSON.stringify(data));
        console.log(`✓ ${id} (${(JSON.stringify(data).length / 1024).toFixed(1)} KB) - v${data.v}`);
        success++;
      } else {
        console.log(`✗ ${id}: All URLs failed`);
        fail++;
      }
    } catch (e) {
      console.log(`✗ ${id}: ${e.message}`);
      fail++;
    }
  }

  console.log(`\n${success} succeeded, ${fail} failed`);
}

main().catch(console.error);
