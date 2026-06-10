import { describe, expect, test } from "vitest";

const { useUploadStore, setAppInitialized, isAppInitialized, onAppInit } =
	await import("../main");

describe("useUploadStore", () => {
	test("initial state has empty subjects", () => {
		const state = useUploadStore.getState();
		expect(state.subjects).toEqual([]);
		expect(state.isLoading).toBe(false);
		expect(state.error).toBeNull();
	});

	test("setSubjects updates subjects and clears error", () => {
		const subjects = [
			{
				routeKey: "math",
				fileTypes: [".pdf"],
				maxFileSize: "10MB",
				maxFileCount: 5,
				name: "Mathematics",
			},
		];
		useUploadStore.getState().setSubjects(subjects);
		const state = useUploadStore.getState();
		expect(state.subjects).toHaveLength(1);
		expect(state.subjects[0].routeKey).toBe("math");
		expect(state.error).toBeNull();
	});

	test("setLoading updates isLoading", () => {
		useUploadStore.getState().setLoading(true);
		expect(useUploadStore.getState().isLoading).toBe(true);
		useUploadStore.getState().setLoading(false);
		expect(useUploadStore.getState().isLoading).toBe(false);
	});

	test("setError sets error and stops loading", () => {
		const err = new Error("test error");
		useUploadStore.getState().setSubjects([
			{
				routeKey: "a",
				fileTypes: [],
				maxFileSize: "",
				maxFileCount: 0,
				name: "A",
			},
		]);
		useUploadStore.getState().setLoading(true);
		useUploadStore.getState().setError(err);
		const state = useUploadStore.getState();
		expect(state.error).toBe(err);
		expect(state.isLoading).toBe(false);
	});

	test("getSubject finds by routeKey", () => {
		useUploadStore.getState().setSubjects([
			{
				routeKey: "math",
				fileTypes: [".pdf"],
				maxFileSize: "10MB",
				maxFileCount: 5,
				name: "Mathematics",
			},
			{
				routeKey: "sci",
				fileTypes: [".pdf"],
				maxFileSize: "10MB",
				maxFileCount: 5,
				name: "Science",
			},
		]);
		const found = useUploadStore.getState().getSubject("math");
		expect(found).toBeDefined();
		expect(found?.name).toBe("Mathematics");
	});

	test("getSubject returns undefined for unknown key", () => {
		useUploadStore.getState().setSubjects([]);
		const found = useUploadStore.getState().getSubject("nonexistent");
		expect(found).toBeUndefined();
	});
});

describe("app initialization", () => {
	test("isAppInitialized returns false by default", () => {
		expect(isAppInitialized()).toBe(false);
	});

	test("setAppInitialized updates state", () => {
		setAppInitialized(true);
		expect(isAppInitialized()).toBe(true);
		setAppInitialized(false);
		expect(isAppInitialized()).toBe(false);
	});

	test("onAppInit fires callback on change", () => {
		let captured: boolean | null = null;
		const unsub = onAppInit((v) => {
			captured = v;
		});
		setAppInitialized(true);
		expect(captured).toBe(true);
		unsub();
	});

	test("onAppInit unsubscribes correctly", () => {
		let count = 0;
		const unsub = onAppInit(() => {
			count++;
		});
		unsub();
		setAppInitialized(true);
		expect(count).toBe(0);
		setAppInitialized(false);
	});
});
