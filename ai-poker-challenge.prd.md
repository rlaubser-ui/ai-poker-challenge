# Product Requirement Document (PRD): AI Poker Challenge

## 1. Problem Statement
Poker players and AI enthusiasts lack an accessible, interactive, and entertaining arena to test their poker skills against diverse AI models (Gemini, Claude, GPT). Existing poker bots are either cold, purely algorithmic solvers without personality, or raw text prompts that lack a visual, real-time heads-up poker engine.

## 2. Evidence
- High user interest in LLM benchmark games (e.g., Chess vs AI, LLM Roleplaying).
- High demand for entertaining AI personas capable of strategic reasoning, bluffing, and live banter during gameplay.

## 3. Thesis (Why Build It)
Combining a modern, visual 1v1 Heads-Up Texas Hold'em web app with direct multi-provider LLM integrations (Gemini, Claude, OpenAI) delivers an engaging playground to explore how different LLMs reason, make risky decisions under uncertainty, and react to player moves.

## 4. Hypothesis
- **Bet**: We believe providing a 1v1 Heads-Up No-Limit Texas Hold'em web application with distinct AI model personas and live commentary will cause players to play multi-hand sessions to benchmark their skills against different models.
- **We'll know we're RIGHT if**: Players complete 5+ hands per session and switch between multiple AI personalities.
- **We'll know we're WRONG if**: Players abandon sessions after 1-2 hands due to slow turn times or unconvincing AI actions.

## 5. Target User & JTBD
- **Primary User**: Poker hobbyists, AI developers, and tech enthusiasts.
- **JTBD**: *"When I want to play a quick, strategic game of poker against an AI, I want an intuitive 1v1 heads-up interface with distinct AI model opponents so I can test my bluffing and playstyle against realistic AI personalities."*
- **Non-Users**: Real-money gamblers, high-stakes tournament players, multi-table grinders.

## 6. MVP Scope
- **Game Engine**: Pure TypeScript Heads-Up No-Limit Texas Hold'em state machine (deck management, betting rounds: pre-flop, flop, turn, river, showdown, and hand evaluation).
- **UI / UX**: Casino-themed Next.js app with green felt table, card visual assets, action bar (Fold, Check, Call, Raise slider), pot display, and live AI banter chat box.
- **AI Personas**:
  - *Gemini 1.5 Pro*: Analytical & Calculative.
  - *Claude 3.5 Sonnet*: Balanced & Strategic.
  - *GPT-4o*: Aggressive & High-Bluffing.
  - *Mock AI*: Instant response mode for testing without API keys.
- **AI Action API**: Endpoint that feeds formatted game state to LLMs and validates structured JSON output (`action`, `amount`, `thinking`, `chat`).

## 7. Success Metrics
- **Session Depth**: Average of 5+ hands played per session.
- **Turn Latency**: AI action decision & response in under 3.0s.
- **Engine Reliability**: 0 state illegal move errors across game sessions.

## 8. Non-goals
- Real-money wagering, deposit systems, or crypto/token integration.
- Human-vs-Human multiplayer online matchmaking.
- Complex multi-way solvers or GTO matrix overlays.

## 9. Open Questions
- [ ] Should internal AI reasoning ("thinking process") be revealed immediately, on showdown, or kept hidden?
- [ ] Should game stats & chip bankrolls persist via browser LocalStorage or a cloud database?
