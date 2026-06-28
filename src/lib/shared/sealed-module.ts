/**
 * Factory for creating sealed DI modules.
 *
 * For EXISTING modules that use the `let _deps` pattern:
 *   - Wrap the default value in `Object.freeze(...)` on init
 *   - Use `_deps = Object.freeze({ ...deps })` in __setDepsForTesting
 *
 * For NEW modules, use createSealedModule factory pattern:
 *   const sealed = createSealedModule(defaultDeps, (deps) => ({ ...exports }));
 *   export const { fn1, fn2 } = sealed.exports;
 *   export const __setDepsForTesting = sealed.__test;
 *
 * This prevents accidental property mutation while preserving
 * the __setDepsForTesting mechanism for test injection.
 */

export interface SealedModule<TDeps extends object, TExports extends Record<string, unknown>> {
  readonly exports: TExports;
  __test: (deps: TDeps) => void;
}

export function createSealedModule<TDeps extends object, TExports extends Record<string, unknown>>(
  defaultDeps: TDeps,
  factory: (deps: TDeps) => TExports,
): SealedModule<TDeps, TExports> {
  let currentExports: TExports = factory(defaultDeps);

  return {
    get exports() {
      return currentExports;
    },
    __test(deps: TDeps) {
      currentExports = factory(deps);
    },
  };
}
