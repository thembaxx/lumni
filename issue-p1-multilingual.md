## Description

Extend AI provider chain and prompt templates to generate high-quality questions, explanations, and feedback in all 11 SA official languages (en, af, zu, xh, st, tn, nso, ts, ss, ve, nd).

## Acceptance Criteria

- [ ] Prompt templates per language in `PromptManager` -- system prompt + few-shot examples in target language
- [ ] Language-specific quality validators: `ValidatorFactory.getValidator(language, questionType)`
- [ ] TinyFish RAG: CAPS/DBE source documents in target language (where available) -- `searchWithRAG(language)`
- [ ] AI provider chain: Gemini 2.0 Flash Lite (primary, multilingual) → Nvidia NIM (Llama-3.3-70B, multilingual) → Groq (fallback)
- [ ] Generation params: `GenerationParams.language?: Locale` threaded through `QuestionEngine.generate()`
- [ ] UI: language selector in quiz/flashcard/solve -- persists to user preferences
- [ ] Evaluation harness: native speaker eval set (50 questions × 11 langs) -- CI gate: quality score ≥ 4/5 on 3 priority langs (zu, af, xh)

## Technical Details

- `src/lib/question-engine/prompt-manager.ts` -- `getPrompt(type, params, language)`
- `src/lib/tinyfish/allowlist.ts` -- extend to 24 subjects × 11 languages = 264 combos (daily limit per user per language)
- `src/lib/ai/client.ts` -- provider chain already multilingual; verify Gemini/Nvidia support
- `src/lib/question-engine/competency-mapper.ts` -- bloom/difficulty mapping language-agnostic
- Dexie: `Question.language` field (already exists) -- index for querying

## Dependencies

- TinyFish RAG corpus for 9 low-resource languages (st, tn, nso, ts, ss, ve, nd) -- may need synthetic augmentation
- ElevenLabs/Google TTS voices for 11 languages (S50 VoiceEngine)
- Whisper fine-tune on SA accents for STT (S50 STTEngine)

## Effort

4-5 sprints (1 AI engineer + 1 linguist/contractor per language)

## Risks

- Low-resource language quality (ve, nd, ss) -- may need human-in-the-loop review queue
- Prompt injection via multilingual inputs -- sanitization per language
- Token costs: multilingual generation ~1.3x English tokens
- RAG corpus gaps -- CAPS docs not available in all languages
