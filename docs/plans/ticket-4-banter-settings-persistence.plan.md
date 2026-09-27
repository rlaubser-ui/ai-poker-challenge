# Feature: TICKET-4 Live Banter Feed, Settings Modal & Session Persistence

The following plan should be complete, but it is important that you validate documentation and codebase patterns and task sanity before you start implementing.

## Feature Description
Complete the AI Poker Challenge application by implementing live banter chat history, a configurable AI thinking/reasoning drawer, a user settings modal for custom API keys and preferences, and browser `localStorage` persistence for bankrolls, win/loss stats, and settings using Zustand `persist`.

## User Story
```
As a poker player
I want to view the AI's live banter, customize its internal thinking visibility, input my own API keys securely, and keep my chip bankroll across browser sessions
So that I can have an immersive, personalized, and persistent poker challenge against diverse AI models
```

## Problem Statement
Currently, only the latest banter line appears in a temporary bubble, API keys must be hardcoded in `.env`, and refreshing the browser resets the bankroll and game history. Furthermore, players cannot inspect the AI's mathematical reasoning process unless it is explicitly surfaced.

## Solution Statement
1. `types/settings.ts`: Define `ReasoningVisibility` ('live' | 'showdown' | 'hidden'), `BanterMessage`, and `UserSettings`.
2. `store/usePokerStore.ts`: Add Zustand `persist` middleware to persist bankroll, win/loss stats, user API keys, and settings to `localStorage`. Maintain an append-only `banterLog` array.
3. `components/poker/BanterBox.tsx`: Scrollable chat box displaying AI and player commentary with persona avatar badges and timestamping.
4. `components/poker/ThinkingDrawer.tsx`: Collapsible accordion/drawer showing the AI's internal reasoning, respecting the player's preference (`live` during play, `showdown` when hand completes, or `hidden`).
5. `components/poker/SettingsModal.tsx`: Clean popup modal to configure API keys, opponent persona, reasoning visibility, and rebuy chips.
6. `app/page.tsx`: Connect BanterBox, ThinkingDrawer, and SettingsModal button in header.

## Out of Scope / Non-Goals
- Multi-table support or remote cloud database sync (PRD non-goals).
- Real-money banking.

## Feature Metadata
- **Feature Type**: Enhancement & Completion
- **Estimated Complexity**: Medium
- **Primary Systems Affected**: `types/settings.ts`, `store/usePokerStore.ts`, `components/poker/*`, `app/page.tsx`
- **Dependencies**: `zustand`, `lucide-react`, `framer-motion`

## Related Work
- **Implements**: [TICKET-4](file:///c:/Users/ryan_/OneDrive/Desktop/AI%20poker%20challenge/docs/tickets/ai-poker-challenge.md#ticket-4--live-banter-feed-settings-modal--session-persistence)
- **Epic**: [docs/tickets/ai-poker-challenge.md](file:///c:/Users/ryan_/OneDrive/Desktop/AI%20poker%20challenge/docs/tickets/ai-poker-challenge.md)
- **Architecture**: [architecture.md](file:///c:/Users/ryan_/OneDrive/Desktop/AI%20poker%20challenge/architecture.md) (Approach 4.1: LocalStorage + Session Memory)

---

## CONTEXT REFERENCES

### Relevant Codebase Files
- [store/usePokerStore.ts](file:///c:/Users/ryan_/OneDrive/Desktop/AI%20poker%20challenge/store/usePokerStore.ts) — Main store to extend with `persist` and banter messages.
- [types/ai.ts](file:///c:/Users/ryan_/OneDrive/Desktop/AI%20poker%20challenge/types/ai.ts) — AI personas and responses.
- [app/page.tsx](file:///c:/Users/ryan_/OneDrive/Desktop/AI%20poker%20challenge/app/page.tsx) — Main layout.

### New Files to Create
- `types/settings.ts` — Settings and banter types.
- `components/poker/BanterBox.tsx` — Live banter message log.
- `components/poker/ThinkingDrawer.tsx` — AI strategic thinking viewer.
- `components/poker/SettingsModal.tsx` — API key and options modal.

---

## IMPLEMENTATION PLAN

### Phase 1: Settings Types & Store Persistence
Add types in `types/settings.ts` and wrap `usePokerStore` with Zustand `persist` middleware.

### Phase 2: Live Banter & Dialogue Component
Create `BanterBox` with auto-scroll and styled message bubbles.

### Phase 3: AI Thinking Process Drawer
Create `ThinkingDrawer` with collapsible animation and conditional visibility logic.

### Phase 4: Settings Modal
Create `SettingsModal` with password masked API key inputs and preference selectors.

### Phase 5: Arena Integration & Final Validation
Integrate components into `app/page.tsx`, run full test suite, and verify production build.

---

## STEP-BY-STEP TASKS

### Task 1: CREATE types/settings.ts
- **IMPLEMENT**: `ReasoningVisibility`, `BanterMessage`, `UserSettings`.
- **VALIDATE**: `npx.cmd tsc --noEmit`
- **SATISFIES**: AC #1

### Task 2: UPDATE store/usePokerStore.ts
- **IMPLEMENT**:
  - Add `persist` middleware from `zustand/middleware`.
  - Add `banterLog: BanterMessage[]`.
  - Add `settings: UserSettings`.
  - Update `triggerAITurn` and `dispatchAction` to push new messages into `banterLog`.
  - Add `updateSettings` action.
- **VALIDATE**: `npx.cmd tsc --noEmit`
- **SATISFIES**: AC #2

### Task 3: CREATE components/poker/BanterBox.tsx
- **IMPLEMENT**: Scrollable message box showing AI trash talk and player action announcements.
- **VALIDATE**: `npx.cmd tsc --noEmit`
- **SATISFIES**: AC #3

### Task 4: CREATE components/poker/ThinkingDrawer.tsx
- **IMPLEMENT**: Collapsible drawer showing `lastAIResponse?.thinking` with badge indicating whether it's live or revealed post-hand.
- **VALIDATE**: `npx.cmd tsc --noEmit`
- **SATISFIES**: AC #4

### Task 5: CREATE components/poker/SettingsModal.tsx
- **IMPLEMENT**: Modal dialog with API key fields, reasoning visibility toggle, bankroll reset.
- **VALIDATE**: `npx.cmd tsc --noEmit`
- **SATISFIES**: AC #5

### Task 6: UPDATE app/page.tsx
- **IMPLEMENT**: Integrate settings button in header, embed `ThinkingDrawer` and `BanterBox` into arena layout.
- **VALIDATE**: `npx.cmd tsc --noEmit` & `npm.cmd run build`
- **SATISFIES**: AC #6

---

## VALIDATION COMMANDS
```bash
npx.cmd tsc --noEmit
npx.cmd vitest run
npm.cmd run build
```

---

## ACCEPTANCE CRITERIA
- [ ] Zustand store persists bankrolls, stats, and settings across browser refreshes.
- [ ] Banter box shows historical banter and auto-scrolls on new messages.
- [ ] Thinking drawer displays AI reasoning according to user setting (`live`, `showdown`, or `hidden`).
- [ ] Settings modal lets users input custom API keys and rebuy chips.
- [ ] `tsc --noEmit`, `vitest run`, and `next build` all pass with 0 errors.
