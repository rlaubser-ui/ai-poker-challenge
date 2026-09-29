# Product Requirement Document (PRD): AI Poker Challenge & Arena

## 1. Executive Summary & North Star Vision
**AI Poker Challenge** is an authentic, full-featured poker platform where human players and user-created custom AI bots coexist, compete, and evolve. Modeled after leading online poker rooms (such as PokerStars and GGPoker), the platform offers multi-format poker gameplay—including **Ring Cash Games**, **Sit & Go (SNG) Tournaments**, and **Multi-Table Tournaments (MTTs)**.

### The Long-Term North Star
- **Current Milestone (Phase 1 & 2)**: An immersive play-money poker ecosystem with custom bot creation, local and cloud LLM integrations (Gemini, Claude, GPT, local models), rapid simulation arenas, and rich audio-visual table dynamics.
- **Future Horizon (Phase 3 & 4)**: A future-ready, certified gaming architecture capable of bridging into real-money poker (RMG), featuring provably fair cryptographic shuffling, anti-collusion monitoring, wallet integrations, and licensed compliance when the project reaches that scale.

---

## 2. Global Objectives & Strategic Pillars

```
+-----------------------------------------------------------------------------------+
|                           AI POKER CHALLENGE ARENA                                |
+-----------------------------------------------------------------------------------+
|  Pillar 1: Authentic Room Emulation  |  Pillar 2: The Bot Forge & Custom AI       |
|  - Cash Games (Micro to High Stakes) |  - User-built bots (prompts + range charts)|
|  - Turbo SNGs & Multi-Table Tourneys |  - Personality, aggression & tilt tuning   |
|  - Blinds, table balancing, side pots|  - Multi-provider LLMs & local fast solver |
+--------------------------------------+--------------------------------------------+
|  Pillar 3: Mixed Human-Bot Tables    |  Pillar 4: Deep Telemetry & Analytics      |
|  - Humans & bots at the same felt    |  - Headless batch simulations (1000 hands) |
|  - Dynamic contextual table banter   |  - Live HUD stats (VPIP, PFR, AF, 3-Bet)   |
|  - Incomplete information parity     |  - Hand Replayer & AI Leak Buster coach    |
+-----------------------------------------------------------------------------------+
|             Pillar 5: Phased Growth (Play Money -> Real Money Horizon)            |
+-----------------------------------------------------------------------------------+
```

### Objective 1: Authentic Poker Room Emulation
Deliver the true look, feel, and mechanics of a professional online poker client:
- Dynamic table formats: Heads-Up (2-max), 6-Max, and 7-Max / 9-Max full ring tables.
- Comprehensive game modes: Ring Cash Games with flexible buy-ins, single-table Turbo Sit & Gos, and Multi-Table Tournaments (MTTs) with dynamic table breaking and balancing.
- Precision poker engine: Accurate multi-way side pot distributions, blind schedules with antes, dead buttons, split pots, and all-in runouts.
- Casino sensory immersion: Web Audio SFX (chip riffling, knocks, card deals, countdown chimes) and fluid visual animations.

### Objective 2: The "Bot Forge" — User-Created Custom Bots
Democratize AI agent engineering for poker enthusiasts:
- Enable players to easily create, configure, and train their own custom AI poker bots without needing deep coding knowledge.
- Parametric tuning: Configurable VPIP (Voluntarily Put In Pot), PFR (Pre-Flop Raise), 3-Bet frequency, bluff tendencies, and tilt thresholds.
- Prompt & Personality Studio: Custom system prompts, humor styles, banter flavors (e.g., Ice-Cold Pro, Trash Talker, Math GTO Solver, Degenerate Gambler), and custom avatars.
- Range Chart Matrix: Visual 13x13 grid where creators can define starting hand tiers and positional ranges.
- Dual-Brain Architecture: Instant local math solver (for fast 50-100ms actions and offline play) paired with multi-provider LLM reasoning (Gemini, Claude, OpenAI) for deep street play and colorful table talk.

### Objective 3: Mixed Human & AI Ecosystem
- Break the boundary between solitary bot play and multiplayer poker: humans and AI bots sit side by side as equals.
- Fair-information parity: All bots receive strictly sanitized public game state (hole cards are cryptographically shielded until showdown).
- Social table atmosphere: Context-aware banter triggered by bad beats, coolers, big river bluffs, and bubble eliminations.

### Objective 4: Simulation Arena & Performance Analytics
- Fast-Forward "Bot Brawl": Run 100 to 5,000 hand headless batch simulations in seconds to benchmark bots against each other.
- Comprehensive tracking: Track bb/100 winrate, ROI, VPIP, PFR, Aggression Factor (AF), and Won $ at Showdown (W$SD).
- Bot Leaderboard & ELO Ranking: Community standings ranking the most profitable custom bots and their creators.

### Objective 5: Play Money to Real Money Evolution
- **Tier 1 (Current)**: Free-to-play money chips, client-side bankroll tracking, instant local/mock modes for zero-friction access.
- **Tier 2 (Mid-Term)**: Persistent player accounts, backend database, play-money MTT leaderboards, and community bot sharing.
- **Tier 3 (Long-Term Horizon / "Crossing the Bridge")**: Real-money infrastructure—integrating provably fair RNG, state gaming compliance, KYC/AML, fraud/bot-collusion detection, and secure wallet/payment gateways when market readiness and regulatory approvals are attained.

---

## 3. Product Roadmap

### Phase 1: Engine Foundation & Single-Table Play (v0.1 — Complete)
- [x] Pure TypeScript poker state machine (evaluator, multi-way pots, side pots).
- [x] 1v1 Heads-Up and 7-Max Turbo Sit & Go tournament modes.
- [x] 6 Built-in AI personas (Shark, Bulldozer, Lucky, Old School, GTO Solver, Vegas).
- [x] Web Audio API sound effects synthesizer.
- [x] Initial Custom Bot types, store resolution, and multi-provider LLM routing with fallback.
- [x] Action controls with quick-bet presets (Min, 2.5x BB, 3x BB, Half Pot, Pot, All-in).

### Phase 2: The Bot Forge & Poker Room Lobby (v0.2 — Current Target)
- [ ] **The Bot Forge UI**: Dedicated studio to create, edit, test, and save custom bots in browser storage.
- [ ] **Sparring Dojo**: Test a custom bot's decision instantly against any custom board and hole cards.
- [ ] **Poker Room Lobby**: Main navigation hub displaying Cash Game stakes, Sit & Go tournaments, and active custom bot rosters.
- [ ] **Ring Cash Game Mode**: Free-play cash tables with auto-rebuy, customizable blinds ($0.50/$1 up to $50/$100), and dynamic table join/leave.
- [ ] **Settings & Key Vault**: Encrypted client-side storage for custom model IDs and LLM API keys.

### Phase 3: MTTs, Simulation Arena & Telemetry (v0.3 — v0.5)
- [ ] **Multi-Table Tournaments (MTTs)**: Multi-table bracket engine with table balancing, blind escalation, and spectator railbirding.
- [ ] **Headless Bot Brawl**: Fast-forward multi-hand simulation runner (1,000 hands in seconds) with net chip graphs.
- [ ] **In-Game HUD**: Real-time player overlay displaying VPIP, PFR, and Aggression Factor.
- [ ] **Hand History Replayer**: Street-by-street visual playback with equity calculations and hand tagging.
- [ ] **AI Leak Buster Coach**: Post-session debrief highlighting tactical leaks, bluff errors, and range tuning tips.

### Phase 4: Multiplayer, Social Marketplace & Real-Money Bridge (v1.0+)
- [ ] Real-time WebSockets / Supabase multiplayer connecting human players and remote custom bot endpoints.
- [ ] Bot Marketplace: Share and download community custom bots.
- [ ] Provably Fair RNG (cryptographic seed commitment and verification).
- [ ] Real-money regulatory framework, wallet architecture, and anti-collusion security.

---

## 4. Target Users & Jobs To Be Done (JTBD)

| User Persona | Motivation | Job To Be Done |
| :--- | :--- | :--- |
| **Poker Hobbyist / Grinder** | Practice strategy without risking money | *"When I want to sharpen my poker skills, I want to play against diverse, unpredictable AI styles and review my hand histories so I can eliminate leaks."* |
| **AI / Prompt Engineer** | Experiment with autonomous game agents | *"When I design a poker bot prompt or logic, I want to deploy it directly into realistic tournaments to benchmark its reasoning against other models."* |
| **Gamer / Bot Manager** | Strategic competition & creator pride | *"When I create my dream bot team, I want to pit them against friends and community bots on an authentic leaderboard."* |

---

## 5. Non-Goals (Current Scope Guardrails)
- **Immediate Real-Money Gambling**: No fiat deposits, cash withdrawals, or real-money wagering during current phases. The architecture remains cleanly modular so RMG can be layered on in Phase 4.
- **Server-Side Key Custody**: User LLM API keys remain stored locally in client `localStorage`, never stored unencrypted in external databases.
- **Cheating / Unfair Bots**: No bot is ever given access to opponents' unrevealed hole cards. Fair-play game state guarantees apply to both humans and AI.

---

## 6. Success Metrics & Key Results (OKRs)

- **Engagement**: Players average 15+ hands per session across Cash and Tournament modes.
- **Bot Customization**: Over 40% of returning players create and play with at least one custom bot.
- **Simulation Throughput**: Headless Bot Brawl runs 500 hands in under 3 seconds.
- **Game Engine Integrity**: 0 unhandled state errors, negative chip states, or incorrect side pot distributions across 100,000 simulated hands.
- **Response Latency**: AI decisions resolve within 100ms for local engine and under 2.5s for live LLM API calls.
