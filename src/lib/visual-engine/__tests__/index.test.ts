import { describe, expect, test } from "bun:test";

import {
	classifyAndMap,
	getDataForType,
	getValidator,
	isKonvaType,
} from "../diagram-mapper";
import { searchImage } from "../image-resolver";
import { generateDiagram } from "../stem-renderer";
import { KONVA_TYPES, STEM_SUBJECTS } from "../types";
import { VisualEngine, visualEngine } from "../visual-engine";

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

	test("exports VisualEngine class and singleton", () => {
		expect(VisualEngine).toBeFunction();
		expect(visualEngine).toBeInstanceOf(VisualEngine);
	});

	test("visualEngine has resolve method", () => {
		expect(visualEngine.resolve).toBeFunction();
	});
});
