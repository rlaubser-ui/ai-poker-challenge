# Sprint 1 Implementation Plan: 7-Max Turbo Sit & Go Tournament

## Overview
Transform the AI Poker Challenge from a 1v1 heads-up game into an authentic 7-Max Turbo Sit & Go (SNG) tournament against 6 distinct AI personas. Modeled on standard online poker clients (PokerStars / GGPoker), featuring 1,000 starting chips, a 3-minute turbo blind structure, multi-way pot & side pot engine, realistic table layout, and immersive audio effects.

---

## 1. Domain Modeling & Types
- **Files**: `types/poker.ts` & `types/tournament.ts`
  - Update `GameState` from `players: [Player, Player]` to `players: Player[]` (supporting 2 to 9 players).
  - Add `SidePot`: `{ amount: number, eligiblePlayerIds: string[] }`.
  - Create `types/tournament.ts`:
    - `BlindLevel`: `{ level: number; smallBlind: number; bigBlind: number; ante: number; durationSeconds: number }`.
    - `BLIND_STRUCTURE`: 10-level turbo schedule (10/20, 15/30, 25/50, 50/100, 75/150 a15, 100/200 a25, 150/300 a30, 200/400 a50, 300/600 a75, 500/1000 a100).
    - `TournamentState`: tracks buy-in ($10), prize pool ($70), level, time remaining, eliminations (ranking 1st–7th), payouts (1st: 70% = $49, 2nd: 30% = $21), and status.

## 2. Multi-Way Poker Engine & Side Pots
- **Files**: `lib/poker/pot.ts`, `lib/poker/engine.ts`, `lib/poker/evaluator.ts`
  - Update `postBlinds`:
    - Support N active players.
    - Rotate Button ("D"), Small Blind (Button + 1), Big Blind (Button + 2), and ante collection for levels with antes.
  - Action order:
    - Preflop: UTG (Big Blind + 1) acts first.
    - Postflop: First active player to the left of the Button acts first.
    - Skipping folded and all-in players.
  - Pot & Side Pot calculation:
    - Implements standard poker side pot splitting when one or more players are all-in.
    - Resolves each pot at showdown to the highest hand among eligible players.
    - Handles split pots and odd chips.
  - Multi-way unit tests:
    - Test dealing to 7 players.
    - Test correct betting order preflop and postflop with 7 players.
    - Test side pot allocation with multiple all-in stack sizes.
    - Test elimination when chips reach 0.

## 3. 6 Distinct AI Personas & Decision Engine
- **Files**: `lib/ai/personas/sng-personas.ts`, `lib/poker/ai-decision.ts`
  - 6 AI Opponents:
    1. **Viktor "The Shark"** (TAG): Strict preflop ranges, value bets relentlessly, exploits passive play.
    2. **Rex "Bulldozer"** (LAG): High aggression, frequent 3-bets, pushes draws and bluffs rivers.
    3. **Larry "Lucky"** (Calling Station): Loose passive, limps frequently, hates folding pairs.
    4. **Pete "Old School"** (Rock / Nit): Only enters with premium cards (top 15% hands), folds quickly under pressure.
    5. **Sophia "GTO Solver"** (Balanced): Optimal sizing, calculates pot odds, mixed bluffing frequencies.
    6. **Vince "Vegas"** (Wild Gambler): Loves high-variance plays, suited connectors, overbets.
  - Fast Local Decision Matrix (`determineAIAction`):
    - Instant math-based calculation (50–150ms) factoring in hole card tier, board texture, pot odds, position, and personality sliders.
    - Allows seamless, rapid table action without API bottlenecks.
    - Rich contextual banter generation for key moments (all-ins, bad beats, eliminations).

## 4. Web Audio SFX (Authentic Casino Audio)
- **File**: `lib/audio/sfx.ts`
  - Clean, zero-dependency Web Audio API synthesizer for:
    - Card deal whoosh
    - Chip clink / bet sound
    - Check tap / table knock
    - Fold card slide
    - All-in alert chime
    - Countdown tick
    - Win pot celebration

## 5. Store & Tournament Orchestration
- **File**: `store/usePokerStore.ts`
  - Tournament lifecycle:
    - `startTournament()`: initializes human + 6 AIs with 1,000 chips each.
    - 3-minute turbo clock ticker: decrements every second, triggers blind level advancement.
    - Hand progression: auto-rotates dealer button to next active player, deals next hand.
    - Elimination detector: records busted players in order (7th -> 6th -> ... -> 1st).
    - Fast-forward option: if human folds, they can watch remaining AIs quickly or jump to showdown.

## 6. Table UI & Tournament HUD
- **Files**:
  - `components/poker/TournamentHeader.tsx`: Blind clock (03:00 countdown, level bar), players remaining, avg stack, prize pool button.
  - `components/poker/Table.tsx`: 7-max stadium layout with seats positioned around the rail, active turn timer ring, community cards, main pot & side pot badges.
  - `components/poker/PlayerSeat.tsx`: Dynamic seat rendering (active, folded, all-in, busted), chips, bet markers, avatar with personality badge.
  - `components/poker/ActionControls.tsx`: Enhanced bet slider with quick-bet buttons (Min, 2.5x BB, 3x BB, Half Pot, Pot, All-in).
  - `components/poker/TournamentSummaryModal.tsx`: Podium, place finished, prize won, replay button.

## 7. Verification & Testing
- Unit tests for 7-player engine and side pots (`npm.cmd test`).
- Type check (`npx tsc --noEmit`).
- Production build (`npm.cmd run build`).
