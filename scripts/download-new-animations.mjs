import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import https from "https";
import http from "http";

const OUT = resolve(__dirname, "..", "public", "animations", "new");
mkdirSync(OUT, { recursive: true });

const downloads = [
  // Chat typing indicator - bouncing dots for chat typing states
  {
    id: "typing-indicator",
    url: "https://assets-v2.lottiefiles.com/a/90bdd36c-1152-11ee-bdb8-cb8fe6b15cf6/dh6UtgKB5z.lottie",
  },
  // Book open - study/learning empty states
  {
    id: "study-book",
    url: "https://assets-v2.lottiefiles.com/a/621daa70-1153-11ee-9d0e-33b4e64f6d9e/DPqRpJl8oe.lottie",
  },
  // Rocket launch - achievement/launch
  {
    id: "rocket-launch",
    url: "https://assets-v2.lottiefiles.com/a/93fc7936-117d-11ee-9e58-2f61b6f34691/8hB0ZCErzG.lottie",
  },
  // Trophy / award - gamification
  {
    id: "trophy",
    url: "https://assets-v2.lottiefiles.com/a/9b2b2176-1170-11ee-a5e8-6f2f3d0c5e5f/mk9YvQq0zP.lottie",
  },
  // Welcome / waving hand
  {
    id: "wave-hello",
    url: "https://assets-v2.lottiefiles.com/a/2cd09a28-1152-11ee-952c-8fa6a6e4450f/Fh3c5fGqkE.lottie",
  },
];

function download(url) {
  return new Promise((resolve2, reject) => {
    const lib = url.startsWith("https") ? https : http;
    lib
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve2(Buffer.concat(chunks)));
      })
      .on("error", reject);
  });
}

async function main() {
  let success = 0;
  let fail = 0;

  for (const { id, url } of downloads) {
    try {
      const data = await download(url);
      // Check if it's valid JSON/lottie
      const str = data.toString("utf-8");
      const parsed = JSON.parse(str);
      console.log(
        `✓ ${id} (${(data.length / 1024).toFixed(1)} KB) - valid JSON: v${parsed.v || "?"}`,
      );
      success++;
    } catch (e) {
      console.log(`✗ ${id}: ${e.message}`);
      fail++;
    }
  }

  console.log(`\n${success} succeeded, ${fail} failed`);
}

main().catch(console.error);
