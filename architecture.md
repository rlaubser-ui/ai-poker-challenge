# Architecture — AI Poker Challenge

## Problem & goals
Poker players and AI enthusiasts lack an accessible, real-time heads-up Texas Hold'em arena to play against diverse LLMs (Gemini, Claude, GPT) featuring distinct playstyles, strategic reasoning, and live banter. The goal of this architecture is to provide an ultra-responsive (<3.0s turn latency), deterministic, and zero-error poker web application that cleanly decouples poker engine logic, multi-provider AI actions, and client-side casino rendering.

---

## Approaches considered

### 1. Game Engine
- **Option A (Chosen): Functional Pure Reducer + Pure Utility Modules** — Stateless, deterministic functions: `(state: GameState, action: PlayerAction) => GameState`. Evaluator, deck, and pot split into pure modules in `lib/poker/`.
- **Option B: Object-Oriented Domain Model Class** — Stateful `PokerGame` class instance with mutating methods.
- **Option C: XState FSM** — Heavy formal state chart library.
- *Trade-off & Rationale*: Option A provides 100% deterministic reproducibility, frictionless JSON serialization over Next.js API / client boundaries, and isolated unit testing with zero mocks.

### 2. AI Action API & LLM Output
- **Option A (Chosen): Route Handler (`/api/poker/ai-action`) + Native SDKs + Zod + Fast Fallback** — Direct provider calls with 2.5s hard timeout (`AbortController`), native JSON output modes, and instant fallback to heuristic Check/Fold on error/timeout.
- **Option B: Vercel AI SDK Abstraction** — Unified `generateObject` / `streamObject`.
- **Option C: Direct Client-Side Browser Calls** — Browser calling LLMs with client-side keys.
- *Trade-off & Rationale*: Option A keeps server-side secret API keys safe, gives direct access to model hyper-parameters (temperature, system instructions), and guarantees zero game-freezing bugs via defensive fallback.

### 3. Client State Management
- **Option A (Chosen): Zustand Store (`usePokerStore`)** — Fine-grained atomic subscriptions for pot, cards, chip slider, and banter feed.
- **Option B: React Context + `useReducer`** — Standard React context.
- *Trade-off & Rationale*: Option A prevents unnecessary full-table re-renders, delivering 60fps animations for chip movements and card dealing.

### 4. Data Persistence & Session Memory
- **Option A (Chosen): Browser `localStorage` + In-Memory Session History** — Persisting bankrolls, persona win/loss stats, API keys, and settings locally via Zustand `persist`.
- **Option B: Remote Database (PostgreSQL / SQLite via Prisma/Drizzle)** — Relational DB for cloud accounts.
- *Trade-off & Rationale*: Option A provides instant loads, zero backend hosting overhead, and matches the MVP non-goals.

---

## Recommended approach
A Next.js 14+ (App Router, TypeScript) application powered by a pure functional poker state engine (`lib/poker/`), an isolated AI action route handler (`app/api/poker/ai-action/route.ts`) enforcing strict Zod schema validation and a sub-3.0s fallback, and a Zustand-driven client store powering a casino-themed Tailwind CSS + Framer Motion UI.

---

## Key decisions

### 1. Stack & libraries
- **Framework**: Next.js 14+ (App Router), React 18/19, TypeScript strict mode.
- **Styling & Motion**: Tailwind CSS (casino dark mode / green felt theme), Framer Motion (chip movement, card flips).
- **State Management**: Zustand (with `persist` middleware for local storage).
- **Poker Hand Evaluation**: `pokersolver` (or a zero-dependency 7-card evaluator utility).
- **Validation**: Zod (for runtime validation of LLM JSON payloads and player actions).
- **AI SDKs**: `@google/genai` (Gemini), `@anthropic-ai/sdk` (Claude), `openai` (GPT), plus a built-in Mock provider.

### 2. Data model & schema shape
- **Core Game Entities** (`types/poker.ts`):
  - `Card`: `{ suit: 's'|'h'|'d'|'c', rank: '2'..'A' }`
  - `Player`: `{ id: string, name: string, chips: number, currentBet: number, holeCards: Card[], isFolded: boolean, isAllIn: boolean, isAI: boolean }`
  - `GameState`: `{ handId: string, stage: 'preflop'|'flop'|'turn'|'river'|'showdown'|'ended', communityCards: Card[], pot: number, currentBet: number, minRaise: number, activePlayerIndex: number, dealerIndex: number, players: [Player, Player], winners?: string[], handHistory: ActionRecord[] }`
  - `PlayerAction`: `{ type: 'fold' | 'check' | 'call' | 'raise', amount?: number }`
- **AI Output Schema** (`types/ai.ts`):
  - `AIActionResponse`: `{ action: 'fold'|'check'|'call'|'raise', amount: number, thinking: string, chat: string }`
- **User Settings & Persona Configuration** (`types/settings.ts`):
  - `revealReasoning`: `'live' | 'showdown' | 'hidden'` (configurable per persona or globally in settings).
  - `apiKeys`: `{ gemini?: string, anthropic?: string, openai?: string }` (stored client-side in `localStorage`, optionally sent in request headers or via server `.env.local`).

### 3. Boundaries & contracts
- **Engine Seam**: `lib/poker/` is 100% decoupled from React and Next.js APIs. It imports no UI or network code and is thoroughly covered by unit tests.
- **AI Boundary**: `POST /api/poker/ai-action` receives sanitized public game state (hiding player hole cards from AI prompt!) and persona profile. It returns validated `AIActionResponse`.
- **Security & Privacy**: User API keys provided in the UI are kept in the browser's `localStorage` and passed to the backend via headers (`x-gemini-key`, `x-anthropic-key`, `x-openai-key`) or use server-provided `.env.local` fallback.

### 4. Other architectural decisions
- **AI Thinking Visibility**: User-controlled setting configured during persona setup (`Live`, `On Showdown`, or `Hidden`).
- **Resilient Fallback Policy**: If the model takes > 2500ms, throws an API error, or produces malformed JSON, the server intercepts and returns `{ action: currentBet === playerBet ? 'check' : 'fold', amount: 0, thinking: 'Fallback triggered due to latency/error', chat: 'Let\'s keep the game moving.' }`.

---

## Missing pieces (Building blocks to create)
1. `lib/poker/deck.ts` — Standard 52-card deck generator and Fisher-Yates shuffler.
2. `lib/poker/evaluator.ts` — 7-card Texas Hold'em hand ranker.
3. `lib/poker/engine.ts` — Pure functional state machine reducer (`advanceBettingRound`, `applyAction`, `distributePot`).
4. `lib/ai/prompts/` — Persona system prompts (Gemini Analytical, Claude Strategic, GPT Aggressive Bluff, Mock Instant).
5. `app/api/poker/ai-action/route.ts` — Multi-provider route handler with timeout and Zod validation.
6. `components/poker/` — PokerTable, CardView, ChipStack, BetControls, BanterBox, and SettingsModal.

---

## Spikes & experiments
- **Spike 1: Hand Evaluator Benchmark**
  - *Question*: Does `pokersolver` integrate cleanly in Next.js App Router (ESM vs CJS) or should we write/import a lightweight pure TS evaluator?
  - *Spike*: Test evaluator import in a simple test file.
  - *Decision rule*: If `pokersolver` has bundle or CommonJS interop issues in Next.js, use a zero-dependency pure TypeScript 7-card evaluator.
- **Spike 2: LLM JSON Output Reliability & Latency**
  - *Question*: Can Gemini 1.5 Flash/Pro and GPT-4o consistently return valid JSON in under 2.5s?
  - *Decision rule*: Enforce strict JSON mode (`response_format: { type: "json_object" }` or Gemini `responseSchema`) and maintain the heuristic fallback.

---

## Open questions
- None blocking. All core choices aligned with PRD and architectural review.
