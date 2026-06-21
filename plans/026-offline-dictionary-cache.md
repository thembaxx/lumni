# Plan 026: Offline dictionary pre-cache

## Status
- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none

## Why this matters
Dictionary lookups hit `api.dictionaryapi.dev` (cross-origin, not cached by SW). Offline = no lookups. Pre-populating common SA curriculum words ensures basic dictionary functionality without network.

## Scope
**In scope**:
- `src/lib/dictionary/seed-words.ts` — new file with curated word list
- `src/lib/dictionary/service.ts` — add `preCacheCommonWords()` function
- `src/app/[locale]/dictionary/dictionary-client.tsx` — trigger pre-cache on first visit

**Out of scope**: Afrikaans/isiZulu dictionary API support, lesson/story auto-capture

## Steps

### Step 1: Create seed word list
New file `src/lib/dictionary/seed-words.ts` with ~200 common SA curriculum words organized by subject:

- **Mathematics** (50): add, subtract, multiply, divide, equation, fraction, decimal, percentage, ratio, proportion, algebra, geometry, angle, triangle, circle, square, volume, area, perimeter, graph, function, coordinate, axis, slope, intercept, variable, constant, theorem, proof, probability, mean, median, mode, range, integer, prime, factor, multiple, numerator, denominator, exponent, root, logarithm, derivative, integral, vector, matrix, symmetry, transformation, sequence
- **Physical Sciences** (40): force, mass, velocity, acceleration, energy, work, power, momentum, friction, gravity, wave, frequency, amplitude, wavelength, current, voltage, resistance, circuit, magnet, field, electron, proton, neutron, atom, molecule, compound, element, reaction, acid, base, pH, solution, concentration, pressure, volume, temperature, heat, conduction, convection, radiation
- **Biology** (30): cell, nucleus, membrane, organ, tissue, photosynthesis, respiration, chromosome, gene, DNA, protein, enzyme, bacteria, virus, immune, antibody, vaccine, ecosystem, habitat, species, population, evolution, adaptation, mutation, reproduction, fertilization, embryo, organism, metabolism, homeostasis
- **Geography** (20): latitude, longitude, equator, climate, erosion, deposition, continent, ocean, biome, desert, savanna, rainforest, population, migration, urban, rural, resource, sustainability, conservation, atmosphere
- **English** (30): noun, verb, adjective, adverb, pronoun, preposition, conjunction, subject, predicate, clause, phrase, tense, grammar, vocabulary, metaphor, simile, idiom, rhyme, rhythm, stanza, theme, plot, character, setting, conflict, resolution, narrator, dialogue, paragraph, essay
- **General** (30): analyze, evaluate, calculate, define, describe, explain, identify, interpret, justify, predict, summarize, compare, contrast, classify, categorize, sequence, measure, observe, demonstrate, investigate, experiment, hypothesis, theory, principle, concept, method, technique, strategy, process, structure

### Step 2: Add pre-cache function
In `src/lib/dictionary/service.ts`:
```typescript
export async function preCacheCommonWords(db: DataAccess): Promise<void> {
  // Check if already cached
  const count = await db.dictionaryCache.count();
  if (count >= 200) return; // already seeded

  // Fire background lookups for each word (throttled)
  for (const word of COMMON_WORDS) {
    try {
      await lookupWord(word);
    } catch {
      // individual word failure is ok
    }
  }
}
```

### Step 3: Wire into dictionary page
In `dictionary-client.tsx`, on mount, fire `preCacheCommonWords()` in background with try/catch.

### Step 4: Verify
```bash
npx tsc --noEmit
npx biome check
bun run test
```

## Done criteria
- Seed word list created (~200 words across 6 domains)
- preCacheCommonWords() fires on dictionary page mount
- Existing lookups still work
- Tests pass with no regressions
