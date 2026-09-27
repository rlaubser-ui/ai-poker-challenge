# Feature: TICKET-1 Project Scaffolding & Pure TypeScript Poker Engine

The following plan should be complete, but it is important that you validate documentation and codebase patterns and task sanity before you start implementing.

## Feature Description
Establish the foundational Next.js 14+ project structure with TypeScript strict mode, Tailwind CSS, and Vitest, and implement a pure, decoupled, 100% test-covered Texas Hold'em poker engine in TypeScript. The engine handles standard 52-card deck management, 7-card hand evaluation with exact kicker tiebreaking, pot calculation and split-pot distribution, and a pure state reducer for heads-up betting rounds from preflop through showdown.

## User Story
```
As a poker player and AI developer
I want a deterministic, mathematically verified Texas Hold'em game engine
So that every card dealt, bet placed, pot distributed, and showdown evaluated strictly follows official heads-up poker rules without bugs or invalid states
```

## Problem Statement
The application requires a robust game state machine that can operate deterministically both on the client (React/Zustand) and server (Next.js API route handlers) without relying on DOM or UI frameworks. Without a pure engine decoupled from React, game state bugs, desynchronization, and illegal betting actions become rampant.

## Solution Statement
Build a zero-dependency pure TypeScript engine in `lib/poker/` paired with comprehensive Vitest unit tests:
1. `types/poker.ts`: Explicit interfaces for cards, players, actions, stages, and game state.
2. `deck.ts`: 52-card standard deck creation, Fisher-Yates shuffling with optional deterministic seed/RNG, and immutable dealing.
3. `evaluator.ts`: 7-card Texas Hold'em evaluator scoring all 9 hand ranks (High Card to Royal Flush) with numerical scores covering all kicker tiebreakers (including the A-2-3-4-5 wheel straight).
4. `pot.ts`: Heads-up pot calculations, blinds posting, and payout distribution.
5. `engine.ts`: Pure functional state reducer `applyAction(state, action)` advancing streets (`preflop` -> `flop` -> `turn` -> `river` -> `showdown` -> `ended`) and enforcing valid move rules.

## Out of Scope / Non-Goals
- Multi-way (3+ players) table logic (heads-up 1v1 only for MVP).
- Real-money banking, rake calculations, or tournament blinds clocks.
- UI rendering and React components (reserved for TICKET-3).
- LLM API integrations (reserved for TICKET-2).

## Feature Metadata
- **Feature Type**: New Capability / Core Foundation
- **Estimated Complexity**: Medium-High
- **Primary Systems Affected**: `lib/poker/*`, `types/poker.ts`, project root config
- **Dependencies**: Next.js, React, Tailwind CSS, TypeScript, Vitest

## Related Work
- **Implements**: [TICKET-1](file:///c:/Users/ryan_/OneDrive/Desktop/AI%20poker%20challenge/docs/tickets/ai-poker-challenge.md#ticket-1--project-scaffolding--pure-typescript-poker-engine)
- **Epic**: [docs/tickets/ai-poker-challenge.md](file:///c:/Users/ryan_/OneDrive/Desktop/AI%20poker%20challenge/docs/tickets/ai-poker-challenge.md)
- **Architecture**: [architecture.md](file:///c:/Users/ryan_/OneDrive/Desktop/AI%20poker%20challenge/architecture.md) (Approach 1.1: Functional Pure Reducer)

---

## CONTEXT REFERENCES

### Relevant Codebase Files
- [AGENTS.md](file:///c:/Users/ryan_/OneDrive/Desktop/AI%20poker%20challenge/AGENTS.md) — Ground rules for type safety, pure engine seams, and testing.
- [architecture.md](file:///c:/Users/ryan_/OneDrive/Desktop/AI%20poker%20challenge/architecture.md) — Architectural decision record for state machine and data shapes.

### New Files to Create
- `package.json` — Project dependencies and scripts (`dev`, `build`, `test`, `type-check`).
- `tsconfig.json` — Strict TypeScript configuration with `@/*` path alias.
- `tailwind.config.ts` — Tailwind styling configuration with dark mode and casino colors.
- `postcss.config.js` — PostCSS setup for Tailwind.
- `vitest.config.ts` — Vitest configuration for fast TypeScript unit testing.
- `types/poker.ts` — Core poker domain types.
- `lib/poker/deck.ts` — Deck generation, shuffling, dealing.
- `lib/poker/evaluator.ts` — Hand evaluation and scoring algorithm.
- `lib/poker/pot.ts` — Pot tracking and payout distribution.
- `lib/poker/engine.ts` — Pure functional state machine reducer.
- `__tests__/poker/evaluator.test.ts` — Unit tests for hand evaluations and kicker tiebreakers.
- `__tests__/poker/engine.test.ts` — Unit tests for betting rounds, blinds, folds, and all-ins.

### Patterns to Follow
- **Pure Functions**: Every function in `lib/poker/` must be pure and return new immutable copies of state (`{ ...state, ... }`).
- **Strict Typing**: No `any` types. Full type annotations for inputs, returns, and unions.
- **Node & NPM Execution**: On Windows PowerShell, use `npm.cmd` and `npx.cmd` with execution policy handled.

---

## IMPLEMENTATION PLAN

### Phase 1: Project Scaffolding
Set up the base Next.js 14+ / TypeScript / Vitest environment.

### Phase 2: Core Domain Types & Deck Module
Define poker domain types and immutable deck operations.

### Phase 3: Texas Hold'em 7-Card Hand Evaluator
Implement comprehensive hand evaluator capable of scoring any 5-7 cards and resolving kickers and split pots.

### Phase 4: Pot & Betting Engine State Machine
Implement pot calculations and the pure game reducer advancing betting rounds, player turns, and showdowns.

### Phase 5: Test Suite Verification
Write and execute Vitest suites covering all hand categories, edge cases (wheel straight, quads kicker, split pot), and hand lifecycles.

---

## STEP-BY-STEP TASKS

### Task 1: CREATE package.json & Configuration Files
- **IMPLEMENT**: Create `package.json` with Next.js, React, React-DOM, Tailwind CSS, TypeScript, Vitest, and Lucide React. Create `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, and `vitest.config.ts`.
- **VALIDATE**: `npm.cmd install` then `npx.cmd tsc --noEmit`
- **SATISFIES**: AC #1 (Scaffolding)

### Task 2: CREATE types/poker.ts
- **IMPLEMENT**:
  - `Suit`: `'s' | 'h' | 'd' | 'c'`
  - `Rank`: `'2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A'`
  - `Card`: `{ suit: Suit, rank: Rank }`
  - `HandRankType`: `'high_card' | 'pair' | 'two_pair' | 'three_of_a_kind' | 'straight' | 'flush' | 'full_house' | 'four_of_a_kind' | 'straight_flush' | 'royal_flush'`
  - `HandEvaluation`: `{ rankType: HandRankType, score: number, description: string, bestFiveCards: Card[] }`
  - `Player`: `{ id: string, name: string, chips: number, currentBet: number, holeCards: Card[], isFolded: boolean, isAllIn: boolean, isAI: boolean }`
  - `GameStage`: `'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'ended'`
  - `PlayerAction`: `{ type: 'fold' | 'check' | 'call' | 'raise', amount?: number }`
  - `GameState`: Complete round state.
- **VALIDATE**: `npx.cmd tsc --noEmit`
- **SATISFIES**: AC #2 (Type Safety)

### Task 3: CREATE lib/poker/deck.ts
- **IMPLEMENT**:
  - `createDeck()`: Generates standard 52 cards.
  - `shuffleDeck(deck: Card[], rng?: () => number)`: Fisher-Yates shuffle with optional RNG for testing.
  - `dealCards(deck: Card[], count: number)`: Returns dealt cards and remaining deck.
- **VALIDATE**: `npx.cmd vitest run __tests__/poker/deck.test.ts`
- **SATISFIES**: AC #3 (Deck Management)

### Task 4: CREATE lib/poker/evaluator.ts
- **IMPLEMENT**:
  - 7-card hand evaluation algorithm:
    - Identifies flush (5+ cards of same suit).
    - Identifies straight (5 consecutive ranks, with A-2-3-4-5 wheel support).
    - Straight Flush / Royal Flush detection.
    - Rank frequencies (Quads, Full House, Trips, Two Pair, One Pair, High Card).
    - Accurate 32-bit integer scoring allowing direct `scoreA > scoreB` comparisons with exact kicker differentiation.
- **VALIDATE**: `npx.cmd vitest run __tests__/poker/evaluator.test.ts`
- **SATISFIES**: AC #4 (Hand Evaluation)

### Task 5: CREATE lib/poker/pot.ts
- **IMPLEMENT**:
  - `postBlinds(state: GameState)`: Posts SB and BB according to Heads-up dealer rules.
  - `calculatePots(players: [Player, Player], mainPot: number)`: Side pot & main pot calculation.
  - `distributePot(state: GameState, evaluations: Record<string, HandEvaluation>)`: Distributes chips to winner(s), handling splits.
- **VALIDATE**: `npx.cmd vitest run __tests__/poker/pot.test.ts`
- **SATISFIES**: AC #5 (Pot Logic)

### Task 6: CREATE lib/poker/engine.ts
- **IMPLEMENT**:
  - `createInitialGameState(config)`: Sets up new hand with shuffled deck and blinds posted.
  - `getValidActions(state: GameState)`: Returns allowed actions (`canCheck`, `canCall`, `callAmount`, `canRaise`, `minRaise`, `maxRaise`).
  - `applyAction(state: GameState, action: PlayerAction)`: Applies fold, check, call, or raise, validates legality, updates pot/bets, advances turn, and advances street when round completes.
  - `advanceStreet(state: GameState)`: Deals Flop (3 cards), Turn (1 card), River (1 card), or triggers Showdown.
- **VALIDATE**: `npx.cmd vitest run __tests__/poker/engine.test.ts`
- **SATISFIES**: AC #6 (State Machine)

### Task 7: RUN Full Validation Suite
- **VALIDATE**: `npm.cmd test`, `npx.cmd tsc --noEmit`
- **SATISFIES**: All ACs

---

## TESTING STRATEGY

### Unit Tests
- **Evaluator**:
  - Test all 9 hand ranks against known 7-card combinations.
  - Test A-2-3-4-5 straight (5-high) vs 2-3-4-5-6 straight (6-high).
  - Test kicker tiebreakers (e.g. Pair of Aces with King kicker vs Pair of Aces with Queen kicker).
  - Test chop pot (identical hands).
- **Engine**:
  - Test preflop dealing (2 cards each) and blinds posting (Dealer = SB).
  - Test check/check advancing from preflop to flop.
  - Test fold ending hand immediately with pot awarded.
  - Test raise, re-raise, and all-in transitions.
  - Test showdown chip distribution.

---

## VALIDATION COMMANDS
```bash
# Type check
npx.cmd tsc --noEmit

# Unit tests
npx.cmd vitest run
```

---

## ACCEPTANCE CRITERIA
- [ ] Next.js 14+ project is scaffolded and builds without TypeScript errors.
- [ ] 52-card deck generator and Fisher-Yates shuffler work deterministically with custom RNG seed.
- [ ] 7-card evaluator correctly ranks all 9 hand types and handles kicker comparisons and wheel straights.
- [ ] State reducer strictly enforces heads-up rules (Dealer is SB preflop, acts first preflop, acts last postflop).
- [ ] Pot logic distributes split pots and all-in payouts correctly.
- [ ] 100% of unit tests pass via Vitest.
- [ ] `npx tsc --noEmit` exits with 0 errors.

---

## COMPLETION CHECKLIST
- [ ] All files created and formatted cleanly
- [ ] Unit tests written for evaluator, deck, pot, and engine
- [ ] Validation commands pass with zero failures
- [ ] Zero unhandled edge cases
