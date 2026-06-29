import { describe, expect, test } from "vitest";
import { getSubjectIcon } from "../icons";

describe("getSubjectIcon", () => {
  test("returns an icon component for a known icon name", () => {
    const Icon = getSubjectIcon("calculator");
    expect(Icon).toBeDefined();
  });

  test("returns BookOpen01Icon for unknown icon name", () => {
    const Icon = getSubjectIcon("unknown-icon-name");
    expect(Icon).toBeDefined();
  });

  test("getSubjectIcon does not throw for various icon names", () => {
    const names = ["book", "atom", "dna", "globe", "music", "palette"];
    for (const name of names) {
      expect(() => getSubjectIcon(name)).not.toThrow();
    }
  });
});
