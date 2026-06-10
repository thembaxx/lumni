import { describe, expect, test } from "vitest";

import {
	classifyAndMap,
	getDataForType,
	getValidator,
	isKonvaType,
	KONVA_TYPES,
} from "../diagram-mapper";
import { searchImage } from "../image-resolver";
import { generateDiagram } from "../stem-renderer";
import { STEM_SUBJECTS } from "../types";

describe("barrel exports", () => {
	test("exports diagram-mapper functions", () => {
		expect(classifyAndMap).toEqual(expect.any(Function));
		expect(getDataForType).toEqual(expect.any(Function));
		expect(getValidator).toEqual(expect.any(Function));
		expect(isKonvaType).toEqual(expect.any(Function));
		expect(KONVA_TYPES).toBeDefined();
	});

	test("exports image-resolver function", () => {
		expect(searchImage).toEqual(expect.any(Function));
	});

	test("exports stem-renderer function", () => {
		expect(generateDiagram).toEqual(expect.any(Function));
	});

	test("exports types constant", () => {
		expect(STEM_SUBJECTS).toBeInstanceOf(Set);
	});
});
