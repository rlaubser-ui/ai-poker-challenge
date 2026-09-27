# Feature: TICKET-3 Zustand Client Store & Casino Table UI

The following plan should be complete, but it is important that you validate documentation and codebase patterns and task sanity before you start implementing.

## Feature Description
Build the complete interactive client-side poker table experience using Zustand, Tailwind CSS, Framer Motion, and Next.js 14+ App Router. The UI features a casino-themed green felt table with wood rail trim, animated playing card deals and flips, 3D-styled chip stacks and pot display, intuitive heads-up bet controls (Fold, Check, Call, Raise slider + quick bet presets), and an automated game loop connecting human player moves with AI responses.

## User Story
```
As a poker player
I want a responsive, beautifully styled casino heads-up table with smooth card animations and intuitive betting controls
So that I can easily read the board, place bets, and play consecutive hands against AI opponents without visual lag or confusion
```

## Problem Statement
A poker engine and AI endpoint are useless without an engaging, responsive UI. Players need clear visual indicators for whose turn it is, current pot size, bet sizes, chip stacks, dealer button position, and available legal actions.

## Solution Statement
1. `store/usePokerStore.ts`: Global Zustand store encapsulating `GameState`, active persona, AI action triggers, loading states, and move dispatchers (`dispatchAction`, `startNewHand`).
2. `components/poker/CardView.tsx`: Framer Motion animated playing cards with realistic face fronts and casino pattern backs.
3. `components/poker/ChipStack.tsx`: Visual chip badges with realistic chip denomination styling.
4. `components/poker/PlayerSeat.tsx`: Avatar seat component with chip count badge, turn glow ring, dealer button badge, and hole cards.
5. `components/poker/ActionControls.tsx`: Fold, Check, Call, and dynamic Raise slider with quick-bet shortcut buttons (Min, 2.5x, Half-Pot, Pot, All-in).
6. `components/poker/Table.tsx`: Master green felt oval layout anchoring dealer button, pot chip stack, community board, and seats.
7. `app/layout.tsx` & `app/page.tsx`: Casino-themed dark layout hosting the poker arena.

## Out of Scope / Non-Goals
- Full historical chat log drawer & settings modal (reserved for TICKET-4).
- Audio sound effects synthesis (reserved for TICKET-4).

## Feature Metadata
- **Feature Type**: New Capability / Frontend UI & State
- **Estimated Complexity**: High
- **Primary Systems Affected**: `store/usePokerStore.ts`, `components/poker/*`, `app/*`
- **Dependencies**: `zustand`, `framer-motion`, `lucide-react`, `tailwindcss`

## Related Work
- **Implements**: [TICKET-3](file:///c:/Users/ryan_/OneDrive/Desktop/AI%20poker%20challenge/docs/tickets/ai-poker-challenge.md#ticket-3--zustand-client-store--casino-table-ui)
- **Epic**: [docs/tickets/ai-poker-challenge.md](file:///c:/Users/ryan_/OneDrive/Desktop/AI%20poker%20challenge/docs/tickets/ai-poker-challenge.md)
- **Architecture**: [architecture.md](file:///c:/Users/ryan_/OneDrive/Desktop/AI%20poker%20challenge/architecture.md) (Approach 3.1: Zustand Store)

---

## CONTEXT REFERENCES

### Relevant Codebase Files
- [types/poker.ts](file:///c:/Users/ryan_/OneDrive/Desktop/AI%20poker%20challenge/types/poker.ts) — Core domain types (`GameState`, `Card`, `Player`, `PlayerAction`).
- [lib/poker/engine.ts](file:///c:/Users/ryan_/OneDrive/Desktop/AI%20poker%20challenge/lib/poker/engine.ts) — `createInitialGameState`, `applyAction`, `getValidActions`.
- [app/api/poker/ai-action/route.ts](file:///c:/Users/ryan_/OneDrive/Desktop/AI%20poker%20challenge/app/api/poker/ai-action/route.ts) — API endpoint invoked when it is the AI's turn.

### New Files to Create
- `store/usePokerStore.ts` — Zustand store.
- `components/poker/CardView.tsx` — Playing card component.
- `components/poker/ChipStack.tsx` — Chip stack component.
- `components/poker/PlayerSeat.tsx` — Player avatar and card display.
- `components/poker/ActionControls.tsx` — Betting controls bar.
- `components/poker/Table.tsx` — Table layout component.
- `app/globals.css` — Tailwind base styling and casino gradients.
- `app/layout.tsx` — Next.js root layout.
- `app/page.tsx` — Main arena page.

---

## IMPLEMENTATION PLAN

### Phase 1: Client State Management (Zustand Store)
Implement `usePokerStore` with game state initialization, action dispatching, and automated AI turn sequencing.

### Phase 2: Card & Chip Visual Components
Create reusable `CardView` and `ChipStack` with Framer Motion animations.

### Phase 3: Player Seats & Action Controls
Create `PlayerSeat` and responsive `ActionControls` with raise slider and quick presets.

### Phase 4: Master Table & Arena Page
Assemble `Table` and build `app/layout.tsx` and `app/page.tsx`.

### Phase 5: Verification & End-to-End Hand Play
Validate with TypeScript type-checking and manual testing of complete hands.

---

## STEP-BY-STEP TASKS

### Task 1: CREATE store/usePokerStore.ts
- **IMPLEMENT**:
  - State: `gameState`, `selectedPersonaId`, `isAITurn`, `lastAIResponse`, `userApiKeys`.
  - Actions: `initGame()`, `dispatchAction(action)`, `startNewHand()`, `setPersona(id)`.
  - Automated trigger: When `activePlayer.isAI` and `stage !== 'ended'`, invoke `/api/poker/ai-action` after brief natural delay (600ms), apply returned action to engine.
- **VALIDATE**: `npx.cmd tsc --noEmit`
- **SATISFIES**: AC #1

### Task 2: CREATE components/poker/CardView.tsx & ChipStack.tsx
- **IMPLEMENT**:
  - `CardView`: Renders rank, suit with correct colors (red for hearts/diamonds, slate-900 for spades/clubs), back face design, Framer Motion entry/flip animations.
  - `ChipStack`: Renders chip icon with formatted denomination badge and color coding.
- **VALIDATE**: `npx.cmd tsc --noEmit`
- **SATISFIES**: AC #2

### Task 3: CREATE components/poker/PlayerSeat.tsx & ActionControls.tsx
- **IMPLEMENT**:
  - `PlayerSeat`: Shows avatar, name, chip stack, hole cards (face up for human, face down or revealed at showdown for AI), dealer button badge ('D'), active turn pulse glow.
  - `ActionControls`: Dynamic Fold button, Check/Call button with amount, Raise button + slider with Min/Max and quick presets (Min, 2.5x BB, 1/2 Pot, Pot, All-in). Disabled during AI turns.
- **VALIDATE**: `npx.cmd tsc --noEmit`
- **SATISFIES**: AC #3

### Task 4: CREATE components/poker/Table.tsx
- **IMPLEMENT**:
  - Master poker table component:
    - Outer wood rail with dark gold trim.
    - Inner green felt oval with subtle texture.
    - Community cards area with Flop, Turn, River card slots.
    - Centered Pot badge and chip display.
    - Opponent (AI) seat positioned at top, Human player seat at bottom.
    - Showdown result overlay banner with winner details and "Next Hand" button.
- **VALIDATE**: `npx.cmd tsc --noEmit`
- **SATISFIES**: AC #4

### Task 5: CREATE app/globals.css, app/layout.tsx, and app/page.tsx
- **IMPLEMENT**:
  - `globals.css`: Tailwind directives and custom scrollbar / font styling.
  - `layout.tsx`: Dark theme layout with metadata.
  - `page.tsx`: Casino arena page rendering navigation header, poker table, and action controls.
- **VALIDATE**: `npx.cmd tsc --noEmit` & `npm.cmd run build`
- **SATISFIES**: AC #5

---

## VALIDATION COMMANDS
```bash
npx.cmd tsc --noEmit
npx.cmd vitest run
npm.cmd run build
```

---

## ACCEPTANCE CRITERIA
- [ ] Zustand store manages game state and dispatches legal actions.
- [ ] Turn progression flows smoothly between human and AI.
- [ ] Casino-themed table with green felt and wood rail renders responsively.
- [ ] Cards render with proper suits, ranks, and flip animations.
- [ ] Betting controls disable during AI turn and enforce legal raise boundaries.
- [ ] Full hands can be played end-to-end to showdown with pot awarded to winner.
- [ ] `tsc --noEmit` passes with 0 errors.
- [ ] `next build` builds successfully without errors.
