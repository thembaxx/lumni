import { beforeEach, describe, expect, test } from "vitest";
import { useToolsStore } from "../tools";

beforeEach(() => {
	useToolsStore.setState({
		open: false,
		initialTab: "solver",
		cameraFocus: false,
	});
});

describe("useToolsStore", () => {
	test("initial state is closed with solver tab", () => {
		const { open, initialTab, cameraFocus } = useToolsStore.getState();
		expect(open).toBe(false);
		expect(initialTab).toBe("solver");
		expect(cameraFocus).toBe(false);
	});

	test("openTools sets open with default tab", () => {
		useToolsStore.getState().openTools();
		expect(useToolsStore.getState().open).toBe(true);
		expect(useToolsStore.getState().initialTab).toBe("solver");
	});

	test("openTools with custom tab", () => {
		useToolsStore.getState().openTools("calculator");
		expect(useToolsStore.getState().initialTab).toBe("calculator");
	});

	test("openTools with camera focus", () => {
		useToolsStore.getState().openTools("solver", true);
		expect(useToolsStore.getState().cameraFocus).toBe(true);
	});

	test("closeTools closes and resets camera", () => {
		useToolsStore.getState().openTools("solver", true);
		useToolsStore.getState().closeTools();
		expect(useToolsStore.getState().open).toBe(false);
		expect(useToolsStore.getState().cameraFocus).toBe(false);
	});
});
