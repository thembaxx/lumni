import { describe, expect, test } from "vitest";
import type { Validator } from "../diagram-mapper";
import {
  classifyAndMap,
  getDataForType,
  getValidator,
  isKonvaType,
  KONVA_TYPES,
} from "../diagram-mapper";

describe("KONVA_TYPES", () => {
  test("contains all 11 konva diagram types", () => {
    expect(KONVA_TYPES.size).toBe(11);
    expect(KONVA_TYPES.has("force-vector")).toBe(true);
    expect(KONVA_TYPES.has("circuit")).toBe(true);
    expect(KONVA_TYPES.has("wave")).toBe(true);
    expect(KONVA_TYPES.has("motion")).toBe(true);
    expect(KONVA_TYPES.has("geometry")).toBe(true);
    expect(KONVA_TYPES.has("chart")).toBe(true);
    expect(KONVA_TYPES.has("chemistry")).toBe(true);
    expect(KONVA_TYPES.has("graph")).toBe(true);
    expect(KONVA_TYPES.has("node-flow")).toBe(true);
    expect(KONVA_TYPES.has("node")).toBe(true);
    expect(KONVA_TYPES.has("custom-svg")).toBe(true);
  });

  test("does not contain mermaid", () => {
    expect(KONVA_TYPES.has("mermaid")).toBe(false);
  });
});

describe("isKonvaType", () => {
  test("returns true for known konva types", () => {
    expect(isKonvaType("geometry")).toBe(true);
    expect(isKonvaType("chart")).toBe(true);
  });

  test("returns false for mermaid", () => {
    expect(isKonvaType("mermaid")).toBe(false);
  });

  test("returns false for unknown types", () => {
    expect(isKonvaType("unknown")).toBe(false);
  });
});

describe("getValidator", () => {
  test("returns validator for known type", () => {
    const validator = getValidator("wave");
    expect(validator).toEqual(expect.any(Function));
  });

  test("returns undefined for unknown type", () => {
    expect(getValidator("unknown")).toBeUndefined();
  });
});

describe("validators", () => {
  describe("force-vector", () => {
    const validate = getValidator("force-vector") as Validator;

    test("accepts valid force-vector data", () => {
      expect(
        validate({
          objects: [{ type: "arrow", x: 0, y: 0, fill: "red" }],
        }),
      ).toBe(true);
    });

    test("rejects missing objects", () => {
      expect(validate({})).toBe(false);
    });

    test("rejects object missing required fields", () => {
      expect(validate({ objects: [{ type: "arrow", x: 0, fill: "red" }] })).toBe(false);
    });
  });

  describe("circuit", () => {
    const validate = getValidator("circuit") as Validator;

    test("accepts valid circuit data", () => {
      expect(validate({ components: [{ id: "r1" }] })).toBe(true);
    });

    test("rejects empty components", () => {
      expect(validate({ components: [] })).toBe(false);
    });

    test("rejects missing components", () => {
      expect(validate({})).toBe(false);
    });
  });

  describe("wave", () => {
    const validate = getValidator("wave") as Validator;

    test("accepts valid wave data", () => {
      expect(validate({ amplitude: 10, frequency: 5, type: "sine" })).toBe(true);
    });

    test("rejects missing amplitude", () => {
      expect(validate({ frequency: 5, type: "sine" })).toBe(false);
    });

    test("rejects missing frequency", () => {
      expect(validate({ amplitude: 10, type: "sine" })).toBe(false);
    });

    test("rejects missing type", () => {
      expect(validate({ amplitude: 10, frequency: 5 })).toBe(false);
    });
  });

  describe("motion", () => {
    const validate = getValidator("motion") as Validator;

    test("accepts projectiles array", () => {
      expect(validate({ projectiles: [{ x: 0, y: 0 }] })).toBe(true);
    });

    test("accepts paths array", () => {
      expect(validate({ paths: [{ points: [0, 0] }] })).toBe(true);
    });

    test("rejects empty projectiles and paths", () => {
      expect(validate({})).toBe(false);
    });
  });

  describe("geometry", () => {
    const validate = getValidator("geometry") as Validator;

    test("accepts valid geometry data", () => {
      expect(validate({ shapes: [{ type: "circle", radius: 5 }] })).toBe(true);
    });

    test("rejects empty shapes", () => {
      expect(validate({ shapes: [] })).toBe(false);
    });

    test("rejects missing shapes", () => {
      expect(validate({})).toBe(false);
    });
  });

  describe("chart", () => {
    const validate = getValidator("chart") as Validator;

    test("accepts bar chart with data", () => {
      expect(
        validate({
          chartType: "bar",
          data: [{ label: "A", value: 10 }],
        }),
      ).toBe(true);
    });

    test("accepts line chart with data", () => {
      expect(validate({ chartType: "line", data: [{ x: 1, y: 2 }] })).toBe(true);
    });

    test("accepts pie chart with data", () => {
      expect(validate({ chartType: "pie", data: [{ label: "A", value: 50 }] })).toBe(true);
    });

    test("rejects invalid chartType", () => {
      expect(validate({ chartType: "invalid", data: [{}] })).toBe(false);
    });

    test("rejects missing chartType", () => {
      expect(validate({ data: [{}] })).toBe(false);
    });

    test("rejects empty data", () => {
      expect(validate({ chartType: "bar", data: [] })).toBe(false);
    });
  });

  describe("chemistry", () => {
    const validate = getValidator("chemistry") as Validator;

    test("accepts valid chemistry data", () => {
      expect(validate({ molecules: [{ formula: "H2O" }] })).toBe(true);
    });

    test("rejects empty molecules", () => {
      expect(validate({ molecules: [] })).toBe(false);
    });

    test("rejects missing molecules", () => {
      expect(validate({})).toBe(false);
    });
  });

  describe("graph", () => {
    const validate = getValidator("graph") as Validator;

    test("accepts valid graph data", () => {
      expect(
        validate({
          functions: [{ expression: "x^2" }],
          axes: { xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
        }),
      ).toBe(true);
    });

    test("rejects missing functions", () => {
      expect(validate({ axes: { xMin: -10, xMax: 10, yMin: -10, yMax: 10 } })).toBe(false);
    });

    test("accepts empty functions array (validator only checks type)", () => {
      expect(
        validate({
          functions: [],
          axes: { xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
        }),
      ).toBe(true);
    });

    test("rejects missing axes properties", () => {
      expect(
        validate({
          functions: [{ expression: "x^2" }],
          axes: { xMin: -10, xMax: 10 },
        }),
      ).toBe(false);
    });
  });

  describe("node-flow", () => {
    const validate = getValidator("node-flow") as Validator;

    test("accepts valid node-flow data", () => {
      expect(validate({ nodes: [{ id: "n1" }] })).toBe(true);
    });

    test("rejects empty nodes", () => {
      expect(validate({ nodes: [] })).toBe(false);
    });

    test("rejects missing nodes", () => {
      expect(validate({})).toBe(false);
    });
  });

  describe("node", () => {
    const validate = getValidator("node") as Validator;

    test("accepts valid node data", () => {
      expect(validate({ nodes: [{ id: "n1" }] })).toBe(true);
    });

    test("rejects empty nodes", () => {
      expect(validate({ nodes: [] })).toBe(false);
    });
  });

  describe("custom-svg", () => {
    const validate = getValidator("custom-svg") as Validator;

    test("accepts SVG string containing svg tag", () => {
      expect(validate({ svg: "<svg><circle/></svg>" })).toBe(true);
    });

    test("rejects SVG without svg tag", () => {
      expect(validate({ svg: "<circle/>" })).toBe(false);
    });

    test("rejects non-string svg", () => {
      expect(validate({ svg: 123 })).toBe(false);
    });
  });
});

describe("getDataForType", () => {
  test("returns data for valid type and data", () => {
    const data = { amplitude: 10, frequency: 5, type: "sine" };
    expect(getDataForType("wave", data)).toEqual(data);
  });

  test("returns null when validator fails", () => {
    expect(getDataForType("wave", {})).toBeNull();
  });

  test("returns null for unknown type", () => {
    expect(getDataForType("unknown" as never, {})).toBeNull();
  });
});

describe("classifyAndMap", () => {
  test("returns konva type for known type with valid data and high confidence", () => {
    const result = classifyAndMap({
      diagramType: "wave",
      diagramData: { amplitude: 10, frequency: 5, type: "sine" },
      confidence: 0.8,
    });
    expect(result.type).toBe("wave");
    expect(result.confidence).toBe(0.8);
  });

  test("reads data from data field when diagramData is missing", () => {
    const result = classifyAndMap({
      diagramType: "wave",
      data: { amplitude: 10, frequency: 5, type: "sine" },
      confidence: 0.8,
    });
    expect(result.type).toBe("wave");
  });

  test("returns mermaid for unknown type with mermaidCode", () => {
    const result = classifyAndMap({
      mermaidCode: "graph TD; A-->B;",
    });
    expect(result.type).toBe("mermaid");
    expect(result.confidence).toBe(0.6);
  });

  test("returns custom-svg with 0 confidence for unknown type without mermaid code", () => {
    const result = classifyAndMap({});
    expect(result.type).toBe("custom-svg");
    expect(result.confidence).toBe(0);
  });

  test("falls back to mermaid when konva data validation fails", () => {
    const result = classifyAndMap({
      diagramType: "wave",
      diagramData: {},
      mermaidCode: "graph TD; A-->B;",
    });
    expect(result.type).toBe("mermaid");
  });

  test("falls back to custom-svg when validation fails and no mermaid code", () => {
    const result = classifyAndMap({
      diagramType: "wave",
      diagramData: {},
    });
    expect(result.type).toBe("custom-svg");
    expect(result.confidence).toBe(0);
  });

  test("falls back to mermaid when confidence is too low", () => {
    const result = classifyAndMap({
      diagramType: "wave",
      diagramData: { amplitude: 10, frequency: 5, type: "sine" },
      confidence: 0.1,
      mermaidCode: "graph TD; A-->B;",
    });
    expect(result.type).toBe("mermaid");
    expect(result.confidence).toBe(0.4);
  });

  test("uses default confidence of 0.5 when not provided", () => {
    const result = classifyAndMap({
      diagramType: "wave",
      diagramData: { amplitude: 10, frequency: 5, type: "sine" },
    });
    expect(result.confidence).toBe(0.5);
  });

  test("preserves mermaidCode in konva result", () => {
    const result = classifyAndMap({
      diagramType: "wave",
      diagramData: { amplitude: 10, frequency: 5, type: "sine" },
      confidence: 0.8,
      mermaidCode: "graph TD; A-->B;",
    });
    expect(result.mermaidCode).toBe("graph TD; A-->B;");
  });
});
