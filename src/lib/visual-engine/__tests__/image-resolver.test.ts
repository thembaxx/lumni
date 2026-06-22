import { describe, expect, test, vi } from "vitest";

import { searchImage } from "../image-resolver";

const validWikimediaResponse = {
  query: {
    pages: {
      "12345": {
        title: "File:Photosynthesis.png",
        imageinfo: [
          {
            url: "https://upload.wikimedia.org/wikipedia/commons/photo.png",
            extmetadata: {
              Artist: { value: "John Doe" },
              LicenseShortName: { value: "CC-BY-SA" },
            },
            width: 800,
            height: 600,
          },
        ],
      },
    },
  },
};

function mockFetchResponse(response: object, status = 200) {
  const original = globalThis.fetch;
  globalThis.fetch = vi.fn(() =>
    Promise.resolve(
      new Response(JSON.stringify(response), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
    ),
  );
  return original;
}

function restoreFetch(original: typeof globalThis.fetch) {
  globalThis.fetch = original;
}

describe("searchImage", () => {
  test("returns image data when Wikimedia search succeeds", async () => {
    const orig = mockFetchResponse(validWikimediaResponse);
    const result = await searchImage("What is photosynthesis?", "life-sciences", "photosynthesis");

    expect(result).not.toBeNull();
    expect(result?.url).toBe("https://upload.wikimedia.org/wikipedia/commons/photo.png");
    expect(result?.title).toBe("File:Photosynthesis.png");
    expect(result?.attribution).toBe("John Doe");
    expect(result?.license).toBe("CC-BY-SA");
    expect(result?.width).toBe(800);
    expect(result?.height).toBe(600);
    restoreFetch(orig);
  });

  test("returns null when Wikimedia search returns no pages", async () => {
    const orig = mockFetchResponse({ query: { pages: {} } });
    const result = await searchImage("test", "mathematics", "algebra");
    expect(result).toBeNull();
    restoreFetch(orig);
  });

  test("returns null when API response is not ok", async () => {
    const orig = mockFetchResponse({ error: "not found" }, 404);
    const result = await searchImage("test", "mathematics", "algebra");
    expect(result).toBeNull();
    restoreFetch(orig);
  });

  test("returns null on network error", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = vi.fn(() => Promise.reject(new Error("Network failure")));
    const result = await searchImage("test", "mathematics", "algebra");
    expect(result).toBeNull();
    globalThis.fetch = original;
  });

  test("skips pages without imageinfo", async () => {
    const noInfoResponse = {
      query: {
        pages: {
          "1": { title: "File:NoInfo.svg" },
          "2": {
            title: "File:HasInfo.png",
            imageinfo: [
              {
                url: "https://upload.wikimedia.org/wikipedia/commons/img.png",
                extmetadata: {},
              },
            ],
          },
        },
      },
    };
    const orig = mockFetchResponse(noInfoResponse);
    const result = await searchImage("test", "mathematics", "algebra");
    expect(result).not.toBeNull();
    expect(result?.url).toContain("img.png");
    restoreFetch(orig);
  });

  test("filters out non-image file extensions", async () => {
    const nonImageResponse = {
      query: {
        pages: {
          "1": {
            title: "File:Doc.pdf",
            imageinfo: [{ url: "https://example.com/doc.pdf" }],
          },
        },
      },
    };
    const orig = mockFetchResponse(nonImageResponse);
    const result = await searchImage("test", "mathematics", "algebra");
    expect(result).toBeNull();
    restoreFetch(orig);
  });

  test("handles missing extmetadata for attribution and license", async () => {
    const noMetaResponse = {
      query: {
        pages: {
          "1": {
            title: "File:Image.png",
            imageinfo: [
              {
                url: "https://example.com/image.png",
              },
            ],
          },
        },
      },
    };
    const orig = mockFetchResponse(noMetaResponse);
    const result = await searchImage("test", "mathematics", "algebra");
    expect(result).not.toBeNull();
    expect(result?.attribution).toBe("File:Image.png");
    expect(result?.license).toBe("unknown");
    restoreFetch(orig);
  });

  test("uses correct User-Agent header", async () => {
    const orig = mockFetchResponse(validWikimediaResponse);
    await searchImage("test", "life-sciences", "photosynthesis");

    const callArgs = (globalThis.fetch as ReturnType<typeof mock>).mock.calls[0] as unknown as [
      string,
      { headers?: Record<string, string> },
    ];
    expect(callArgs[1].headers?.["User-Agent"]).toBe("Lumni/1.0 (educational app)");
    restoreFetch(orig);
  });
});
