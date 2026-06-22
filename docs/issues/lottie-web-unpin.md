# Track: Remove lottie-web version override

**Status**: Resolved  
**Priority**: Low

## Context

`lottie-web` was pinned to `5.12.2` via `package.json` `overrides` because v5.13.0 had a rendering regression.

## Resolution

Migrated from `lottie-react` (which depends on `lottie-web`) to `@lottiefiles/dotlottie-react`. The new player uses a self-contained WASM-based renderer via `@lottiefiles/dotlottie-web`, so no `lottie-web` override is needed anymore.

- `lottie-react` removed from dependencies
- `lottie-web` override removed from `package.json`
- Rendering engine: SVG (lottie-web) → Canvas (dotlottie-web/WASM)
