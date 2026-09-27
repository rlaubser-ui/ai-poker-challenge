# Feature: TICKET-2 Multi-Provider AI Action API & Persona Prompts

The following plan should be complete, but it is important that you validate documentation and codebase patterns and task sanity before you start implementing.

## Feature Description
Build the backend AI integration layer for AI Poker Challenge, featuring distinct playing personas (Gemini 1.5 Pro, Claude 3.5 Sonnet, GPT-4o, and an offline Mock AI), strict Zod response validation for structured JSON actions (`action`, `amount`, `thinking`, `chat`), a 2.5s hard timeout using `AbortController`, and a rock-solid heuristic fallback so turns never freeze or cause illegal game states.

## User Story
```
As a poker player
I want the AI opponent to make strategic, persona-driven poker decisions accompanied by live banter and internal reasoning in under 3 seconds
So that gameplay feels like playing against a real, distinct personality without slow turns or game crashes
```

## Problem Statement
LLM APIs can suffer from variable latency, sporadic rate limits, network timeouts, and unpredictable response formatting (e.g. Markdown fences or missing keys). If an AI decision fails or takes too long, the player experience is ruined.

## Solution Statement
1. `types/ai.ts`: Define `AIPersonaId`, `AIPersonaConfig`, `AIActionRequest`, and Zod schemas `AIActionResponseSchema` enforcing valid poker actions and banter strings.
2. `lib/ai/personas/`: Define rich persona system prompts:
   - `gemini`: Analytical & Calculative (computes pot odds, pot equity, methodical).
   - `claude`: Balanced & Strategic (reads opponent patterns, game-theory grounded).
   - `gpt`: Aggressive & High-Bluffing (exploitative, pushes pressure, witty banter).
   - `mock`: Instant heuristic offline engine (evaluates hole cards, pot odds, bets accordingly).
3. `lib/ai/formatPrompt.ts`: Sanitizes game state (hides human player hole cards!), formats table context, pot sizes, chip stacks, and street history into concise LLM input.
4. `lib/ai/providers/`: Provider implementations supporting native JSON output modes and `AbortSignal`.
5. `app/api/poker/ai-action/route.ts`: Next.js Route Handler executing the provider call with 2500ms hard timeout, validating output with Zod, and falling back defensively to a valid Check/Fold heuristic if errors occur.

## Out of Scope / Non-Goals
- Table UI components and chat drawer (reserved for TICKET-3 and TICKET-4).
- Storing user API keys in a database (keys are passed via request headers from client `localStorage` or read from `.env.local`).

## Feature Metadata
- **Feature Type**: New Capability / Backend API
- **Estimated Complexity**: Medium
- **Primary Systems Affected**: `types/ai.ts`, `lib/ai/*`, `app/api/poker/ai-action/route.ts`
- **Dependencies**: `@google/genai`, `@anthropic-ai/sdk`, `openai`, `zod`

## Related Work
- **Implements**: [TICKET-2](file:///c:/Users/ryan_/OneDrive/Desktop/AI%20poker%20challenge/docs/tickets/ai-poker-challenge.md#ticket-2--multi-provider-ai-action-api--persona-prompts)
- **Epic**: [docs/tickets/ai-poker-challenge.md](file:///c:/Users/ryan_/OneDrive/Desktop/AI%20poker%20challenge/docs/tickets/ai-poker-challenge.md)
- **Architecture**: [architecture.md](file:///c:/Users/ryan_/OneDrive/Desktop/AI%20poker%20challenge/architecture.md) (Approach 2.1: Native SDKs + Zod + Fallback)

---

## CONTEXT REFERENCES

### Relevant Codebase Files
- [types/poker.ts](file:///c:/Users/ryan_/OneDrive/Desktop/AI%20poker%20challenge/types/poker.ts) — Core game state and player action types.
- [lib/poker/engine.ts](file:///c:/Users/ryan_/OneDrive/Desktop/AI%20poker%20challenge/lib/poker/engine.ts) — `getValidActions` for legal action boundaries and fallback heuristics.
- [lib/poker/evaluator.ts](file:///c:/Users/ryan_/OneDrive/Desktop/AI%20poker%20challenge/lib/poker/evaluator.ts) — Used by Mock AI for calculating hand strength.

### New Files to Create
- `types/ai.ts` — AI types and Zod schemas.
- `lib/ai/personas/types.ts` & `lib/ai/personas/index.ts` — Persona configurations.
- `lib/ai/personas/gemini.ts`, `claude.ts`, `gpt.ts`, `mock.ts` — Persona prompts.
- `lib/ai/formatPrompt.ts` — Prompt serializer and sanitizer.
- `lib/ai/providers/gemini.ts`, `claude.ts`, `openai.ts`, `mock.ts` — Provider clients.
- `lib/ai/fallback.ts` — Defensive heuristic fallback decision maker.
- `app/api/poker/ai-action/route.ts` — API route handler with timeout and error handling.
- `__tests__/ai/route.test.ts` — Unit tests for prompt formatting, mock AI, Zod schema validation, and fallback handling.

---

## IMPLEMENTATION PLAN

### Phase 1: AI Types & Zod Schemas
Define TypeScript types and runtime Zod schemas for AI actions and persona definitions.

### Phase 2: Persona Definitions & System Prompts
Craft distinct system prompts for Gemini, Claude, and GPT, and implement the intelligent Mock AI heuristic.

### Phase 3: Prompt Serializer & Fallback Module
Implement sanitized game state formatter and resilient fallback engine.

### Phase 4: Route Handler & Provider Integrations
Implement `/api/poker/ai-action` with `AbortController`, multi-provider dispatch, and Zod parsing.

### Phase 5: Testing & Validation
Verify mock engine, schema validation, timeout handling, and fallback behavior via Vitest.

---

## STEP-BY-STEP TASKS

### Task 1: CREATE types/ai.ts
- **IMPLEMENT**: Define `AIPersonaId` ('gemini' | 'claude' | 'gpt' | 'mock'), `AIActionResponseSchema` (Zod schema for `{ action, amount, thinking, chat }`), `AIPersonaConfig`, and `AIActionRequest`.
- **VALIDATE**: `npx.cmd tsc --noEmit`
- **SATISFIES**: AC #1

### Task 2: CREATE lib/ai/personas/*.ts
- **IMPLEMENT**:
  - `gemini.ts`: Analytical pot-odds and math-driven persona.
  - `claude.ts`: Balanced game-theory and strategic persona.
  - `gpt.ts`: Aggressive, table-talking, high-bluffing persona.
  - `mock.ts`: Fast offline heuristic decision maker.
  - `index.ts`: Registry exporting personas by ID.
- **VALIDATE**: `npx.cmd tsc --noEmit`
- **SATISFIES**: AC #2

### Task 3: CREATE lib/ai/formatPrompt.ts & lib/ai/fallback.ts
- **IMPLEMENT**:
  - `formatPrompt`: Formats community cards, pot, stacks, opponent actions, and valid raise boundaries into clean text. Strictly excludes human hole cards.
  - `getFallbackAction`: Inspects `validActions` and returns a valid `{ action: 'check' | 'fold', amount: 0, thinking, chat }`.
- **VALIDATE**: `npx.cmd tsc --noEmit`
- **SATISFIES**: AC #3

### Task 4: CREATE lib/ai/providers/*.ts
- **IMPLEMENT**:
  - `gemini.ts`: Calls `@google/genai` or Gemini REST API with schema.
  - `claude.ts`: Calls `@anthropic-ai/sdk` with JSON prompt instructions.
  - `openai.ts`: Calls `openai` with `response_format: { type: 'json_object' }`.
  - `mock.ts`: Instant local solver.
- **VALIDATE**: `npx.cmd tsc --noEmit`
- **SATISFIES**: AC #4

### Task 5: CREATE app/api/poker/ai-action/route.ts
- **IMPLEMENT**:
  - Route handler reading `gameState` and `personaId` from JSON body, reading API keys from headers or process.env.
  - Wraps provider call in a `Promise.race` with 2500ms timeout.
  - Parses result through `AIActionResponseSchema`.
  - On any failure or invalid move, falls back to `getFallbackAction`.
- **VALIDATE**: `npx.cmd tsc --noEmit`
- **SATISFIES**: AC #5

### Task 6: CREATE __tests__/ai/route.test.ts
- **IMPLEMENT**: Tests for prompt formatting, mock AI decisions, Zod parsing, and fallback on error.
- **VALIDATE**: `npx.cmd vitest run __tests__/ai/route.test.ts`
- **SATISFIES**: AC #6

---

## VALIDATION COMMANDS
```bash
npx.cmd tsc --noEmit
npx.cmd vitest run
```

---

## ACCEPTANCE CRITERIA
- [ ] Strict Zod schema validates all AI responses.
- [ ] Prompts sanitize state and hide player hole cards.
- [ ] Mock AI executes instantly (<10ms) without API keys.
- [ ] Route handler enforces 2.5s timeout.
- [ ] Route handler gracefully falls back to Check/Fold on error or timeout without crashing.
- [ ] All unit and integration tests pass with 0 failures.
