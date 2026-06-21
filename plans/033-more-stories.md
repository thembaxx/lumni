# Plan 033: More stories — AI-generated + more Gutenberg

## Status: In Progress

## Problem
English has 5 stories (1 existing + 4 new from Gutenberg). The other 10 languages have only 1 AI-generated story each. The roadmap calls for "AI-generate stories for curriculum topics not covered."

## Scope
- `src/curriculum/stories/{lang}/` — add 1-2 more AI-generated stories per language
- `src/curriculum/stories/` — add Native Life full text from Gutenberg if available
- `src/curriculum/stories/english-home-language/` — add any remaining Gutenberg works

## Steps
1. For each of the 7 non-English languages (sepedi, setswana, sesotho, xitsonga, siswati, tshivenda, isi-ndebele): create a second story (new topic, e.g., "wisdom" or "nature")
2. For Afrikaans, isiZulu, isiXhosa: add a second AI-generated story
3. Try to download Native Life full text from Gutenberg cache
4. Update all index.ts files and story-data.ts
5. Verify: `npx tsc --noEmit`, `npx biome check`, `bun run test`

## Done criteria
- Each of the 11 languages has at least 2 stories (22+ total)
- Native Life has full text (or noted as unavailable)
- All stories indexed and loadable
