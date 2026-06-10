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
