# AI Poker Challenge — Global Project Rules

## What This Is
An authentic online poker platform and AI battleground where humans and custom AI bots compete in No-Limit Texas Hold'em across Tournaments, Sit & Gos, and Cash Games. Players can create, customize, and battle their own custom AI bots (Gemini, Claude, GPT, local) equipped with distinct playing styles, strategic reasoning, and live commentary/banter. Modeled for play money with an intentional path toward full poker room emulation.

**Stack**: Next.js 14+ (App Router, TypeScript), Tailwind CSS, Framer Motion, TypeScript Poker Engine.

## Architecture Map
- `app/`: Next.js App Router routes, pages (`page.tsx`), layout (`layout.tsx`), and API routes (`api/poker/action/route.ts`).
- `components/`: UI components (poker table, cards, chip stack, controls, AI avatar, chat/banter box).
- `lib/poker/`: Pure TypeScript game engine (deck, dealing, hand evaluator, pot tracking, state machine).
- `lib/ai/`: AI model prompt templates, API integrations (Gemini, Claude, OpenAI), JSON output validators.
- `types/`: Core TypeScript interfaces for game state, player actions, AI personas, and hand evaluation results.

## Ground Rules
- **Type Safety**: Use TypeScript strict mode. Define explicit types in `types/` for game state, player actions, and AI responses. Validate LLM JSON output against schemas.
- **Game Engine Seams**: Keep poker engine logic pure and decoupled from React components. Test game rules independently.
- **AI Integration**: All LLM API calls must handle timeouts, invalid JSON responses, and fallback actions gracefully (e.g., fallback to check/fold on failure).
- **Styling**: Use Tailwind CSS for all UI styling with dark mode / casino-themed aesthetics.

## Working Principles (Agent Steering)
- **Plan Before Non-Trivial Code**: Always break down poker state engine updates or UI changes into clear steps before implementing.
- **Clarify When Ambiguous**: Ask user preference on rule variations or UI design decisions instead of assuming.
- **Scope Discipline**: Keep features modular (e.g., single table 1v1 first before adding multi-player).
- **Verification**: Always run build (`npm run build`) and type check (`npx tsc --noEmit`) before declaring task complete.

## Commands
- Dev Server: `npm run dev`
- Build: `npm run build`
- Type Check: `npx tsc --noEmit`
- Lint: `npm run lint`
- Test: `npm test`

## Where New Code Goes
- New AI Personas / Models: Add configuration and system prompts in `lib/ai/personas/`.
- New Poker Variants or Rules: Extend state machine in `lib/poker/engine.ts`.
- UI Widgets: Add reusable components in `components/poker/`.
