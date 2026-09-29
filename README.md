# ♠️ AI Poker Challenge (PokerBet)

An interactive, casino-grade Texas Hold'em poker web application where players challenge various Large Language Models (Gemini, Claude, GPT) equipped with distinct playing styles, tactical reasoning, and live table banter.

![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)
![Vitest](https://img.shields.io/badge/Vitest-2.1-green?logo=vitest)
![License](https://img.shields.io/badge/license-MIT-purple)

---

## 🎯 Overview

AI Poker Challenge bridges the gap between cold, algorithmic poker solvers and text-only LLM roleplays. By combining a pure TypeScript poker engine with direct multi-provider LLM integrations, it delivers a real-time, visual heads-up and multi-player tournament arena where players can benchmark their play against different AI personalities.

---

## ✨ Features

- **🎮 Tournament & Heads-Up Modes**:
  - **7-Max Turbo Sit & Go**: High-octane tournament structure with escalating blind levels, chip stacks, payout distribution, and action timers (15s).
  - **1v1 Heads-Up**: Fast-paced one-on-one battles against any selected AI model.
- **🤖 Multi-Model AI Opponents**:
  - **Gemini 1.5 Pro**: Analytical, math-heavy, pot-odds focused.
  - **Claude 3.5 Sonnet**: Balanced, disciplined, and strategic.
  - **GPT-4o**: Aggressive, unpredictable, and bluff-heavy.
  - **Mock AI**: Fast, offline bot with heuristic betting—no API keys required.
  - **Custom Bot Creator**: Design your own AI opponent by configuring playstyle (tight/loose, aggressive/passive), risk appetite, and banter style.
- **💭 Live Banter & AI "Thinking" Drawer**:
  - Opponents react in real time with context-aware chat banter after big bets, bad beats, or bluffs.
  - Peek under the hood: Open the AI Thinking drawer to inspect the exact reasoning and hand assessment the model used to make its decision.
- **🎨 Sleek Casino UI**:
  - Oval dark navy felt with realistic table rail and capsule seats.
  - Live pot chip stacks, dealer button rotation, and turn timers.
  - Customizable card deck themes (Classic, Cyber, Neon, Luxury).
  - Pop-out tournament table windows and full action history log drawer.
- **🛡️ Rock-Solid Poker Engine**:
  - Fully decoupled, pure TypeScript poker state machine.
  - Complete 7-card Texas Hold'em hand evaluator.
  - Accurate multi-way side-pot and split-pot calculation.
  - Rigorous test suite with 40+ unit tests across engine and AI components.

---

## 🏗️ Architecture

```
ai-poker-challenge/
├── app/                  # Next.js App Router (pages, layout, API routes)
│   ├── api/poker/action/ # AI action decision endpoint (LLM caller & Zod validator)
│   ├── table/            # Pop-out dedicated table window route
│   └── page.tsx          # Main lobby & tournament browser
├── components/           # Modular React components
│   ├── lobby/            # Tournament lists, lobby headers, registration modal
│   └── poker/            # Table, PlayerSeat, ActionControls, BanterBox, Modals
├── lib/
│   ├── ai/               # Multi-provider integrations (Gemini, Claude, OpenAI, Mock)
│   │   ├── personas/     # System prompts and personality configurations
│   │   └── providers/    # API callers and error/timeout fallbacks
│   └── poker/            # Pure TypeScript poker game engine
│       ├── deck.ts       # 52-card deck, shuffling, dealing
│       ├── engine.ts     # State machine (pre-flop, flop, turn, river, showdown)
│       └── evaluator.ts  # Hand strength evaluation & ranking
├── store/                # Zustand global game & client state
├── types/                # Strict TypeScript type definitions
└── __tests__/            # Vitest unit test suite (engine, multiway pots, AI routes)
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.17+ or v20+)
- npm or yarn / pnpm

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/rlaubser-ui/ai-poker-challenge.git
   cd ai-poker-challenge
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables (Optional)**:
   To play against live cloud AI models, create a `.env.local` file in the root directory:
   ```env
   # Google Gemini (Default recommended)
   GEMINI_API_KEY=your_gemini_api_key_here

   # Anthropic Claude
   ANTHROPIC_API_KEY=your_anthropic_api_key_here

   # OpenAI GPT-4o
   OPENAI_API_KEY=your_openai_api_key_here
   ```
   > **Note**: You can play immediately without any API keys using the built-in **Mock AI** bot mode!

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Validation

Run the test suite and TypeScript verification:

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# TypeScript type check
npm run type-check

# Production build test
npm run build
```

---

## 🧠 AI Decision Pipeline

When an AI player faces an action:
1. **State Serialization**: The table state (hole cards, community cards, pot size, current bet, stack depths, position) is formatted into structured markdown context.
2. **Prompt Injection**: The model's persona prompt (personality, risk profile, banter tone) is prepended.
3. **Structured Response**: The LLM outputs strict JSON containing:
   ```json
   {
     "action": "raise",
     "amount": 120,
     "thinking": "Player showed weakness on turn with check. Raising 2.5x to apply pressure with top pair.",
     "chat": "Let's see if you really have that flush!"
   }
   ```
4. **Validation & Fallback**: The response is parsed with [Zod](https://zod.dev). If a timeout, network hiccup, or invalid output occurs, the engine gracefully falls back to a deterministic heuristic action (check/fold).

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
