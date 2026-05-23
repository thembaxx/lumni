<!-- LAST_SYNC: 2026-05-23 -->
# Memory Index

## Facts
- - **SM-2 spaced repetition**: Flashcard review uses SM-2 algorithm; existing cards use `reviewFlashcard()`, AI fallback for new content
- **Auth**: Anonymous users auto-created; sign-up upgrades anonymous session. Admin uses separate magic-link + OTP. Rate limits: 3 sign-in/5min, 1 magic link/5min.
- **Cross-topic awareness**: Quiz auto-selects weakest topic when none specified (uses `resolvedTopic` state)

## Decisions
- - **7 quality fixes**: Removed unused import, fixed dynamic Tailwind class in `AnimatedIcon`, removed redundant CSS vars, deleted dead barrel file `src/types/questions.ts`, removed recharts `isAnimationActive={true}`, moved import to top of `exam-paper.ts`, re-exported `QuestionType`
- **AI provider chain**: Gemini 2.0 Flash Lite (primary) → Nvidia NIM meta/llama-3.3-70b-instruct → Groq llama-3.3-70b-versatile. Defined in `src/lib/ai/client.ts`. DeepSeek was removed.

## Patterns
-

## Contacts/Resources
- Website: [lumni.ai](https://lumni.ai)
- Contact: hello@lumni.ai
