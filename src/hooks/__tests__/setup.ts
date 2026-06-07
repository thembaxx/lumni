import { Window } from "happy-dom";

const window = new Window();
globalThis.document = window.document as unknown as Document;
globalThis.window = window as unknown as Window & typeof globalThis;
globalThis.navigator = window.navigator as unknown as Navigator;
globalThis.location = window.location as unknown as Location;
globalThis.HTMLElement = window.HTMLElement as unknown as typeof HTMLElement;
globalThis.HTMLDivElement =
	window.HTMLDivElement as unknown as typeof HTMLDivElement;
globalThis.HTMLCanvasElement =
	window.HTMLCanvasElement as unknown as typeof HTMLCanvasElement;
globalThis.customElements =
	window.customElements as unknown as CustomElementRegistry;
globalThis.localStorage = window.localStorage;
globalThis.CSSStyleSheet = window.CSSStyleSheet;

// happy-dom CSS parser can't handle some KaTeX CSS selectors
// (this.window.SyntaxError is undefined). Stub replaceSync to
// prevent the TypeError from crashing tests across test files.
const origReplaceSync = CSSStyleSheet.prototype.replaceSync;
CSSStyleSheet.prototype.replaceSync = function (...args: unknown[]) {
	try {
		return origReplaceSync.apply(this, args);
	} catch {
		return;
	}
};
