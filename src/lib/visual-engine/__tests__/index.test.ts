import { describe, expect, test } from "bun:test";

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
		expect(classifyAndMap).toBeFunction();
		expect(getDataForType).toBeFunction();
		expect(getValidator).toBeFunction();
		expect(isKonvaType).toBeFunction();
		expect(KONVA_TYPES).toBeDefined();
	});

	test("exports image-resolver function", () => {
		expect(searchImage).toBeFunction();
	});

	test("exports stem-renderer function", () => {
		expect(generateDiagram).toBeFunction();
	});

	test("exports types constant", () => {
		expect(STEM_SUBJECTS).toBeInstanceOf(Set);
	});
});
