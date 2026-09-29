import { GameState, HandEvaluation, Player, SidePot, WinnerResult } from '@/types/poker';

/**
 * Helper to find the next active (non-eliminated) seat index clockwise.
 */
export function getNextActiveSeat(
  players: Player[],
  fromIndex: number,
  condition: (p: Player) => boolean = (p) => !p.isEliminated && p.chips > 0
): number {
  const n = players.length;
  for (let i = 1; i <= n; i++) {
    const idx = (fromIndex + i) % n;
    if (condition(players[idx])) {
      return idx;
    }
  }
  return fromIndex;
}

/**
 * Returns all active players who have chips or are all-in.
 */
export function getSeatedPlayersInHand(players: Player[]): Player[] {
  return players.filter((p) => !p.isEliminated && (p.chips > 0 || p.isAllIn || p.currentBet > 0));
}

/**
 * Posts the small blind and big blind (and optional antes) according to Texas Hold'em rules.
 * Handles both Heads-Up (2 players) and Multi-Way (3-9 players).
 */
export function postBlinds(state: GameState): GameState {
  const players = state.players.map((p) => ({
    ...p,
    currentBet: 0,
    totalInvestedThisHand: p.totalInvestedThisHand || 0,
    totalInvestedThisStreet: 0,
  }));

  const activePlayers = players.filter((p) => !p.isEliminated && p.chips > 0);
  const numActive = activePlayers.length;

  if (numActive < 2) {
    return state;
  }

  let pot = state.pot;
  const ante = state.ante || 0;

  // Post Antes if configured
  if (ante > 0) {
    for (const p of players) {
      if (!p.isEliminated && p.chips > 0) {
        const anteAmount = Math.min(p.chips, ante);
        p.chips -= anteAmount;
        p.totalInvestedThisHand = (p.totalInvestedThisHand || 0) + anteAmount;
        pot += anteAmount;
        if (p.chips === 0) {
          p.isAllIn = true;
        }
      }
    }
  }

  let sbIdx: number;
  let bbIdx: number;

  if (numActive === 2) {
    // In Heads-Up: Dealer is Small Blind, Non-dealer is Big Blind
    sbIdx = state.dealerIndex;
    bbIdx = getNextActiveSeat(players, sbIdx, (p) => !p.isEliminated && p.chips > 0);
  } else {
    // In Multi-Way (3+ players):
    // Small Blind is left of Dealer
    sbIdx = getNextActiveSeat(players, state.dealerIndex, (p) => !p.isEliminated && p.chips > 0);
    // Big Blind is left of Small Blind
    bbIdx = getNextActiveSeat(players, sbIdx, (p) => !p.isEliminated && p.chips > 0);
  }

  // Post Small Blind
  const sbPlayer = players[sbIdx];
  const sbAmount = Math.min(sbPlayer.chips, state.smallBlind);
  sbPlayer.chips -= sbAmount;
  sbPlayer.currentBet = sbAmount;
  sbPlayer.totalInvestedThisHand = (sbPlayer.totalInvestedThisHand || 0) + sbAmount;
  if (sbPlayer.chips === 0) {
    sbPlayer.isAllIn = true;
  }

  // Post Big Blind
  const bbPlayer = players[bbIdx];
  const bbAmount = Math.min(bbPlayer.chips, state.bigBlind);
  bbPlayer.chips -= bbAmount;
  bbPlayer.currentBet = bbAmount;
  bbPlayer.totalInvestedThisHand = (bbPlayer.totalInvestedThisHand || 0) + bbAmount;
  if (bbPlayer.chips === 0) {
    bbPlayer.isAllIn = true;
  }

  pot += sbAmount + bbAmount;
  const currentBet = Math.max(sbPlayer.currentBet, bbPlayer.currentBet);
  const minRaise = state.bigBlind;

  // Determine active player who acts first preflop
  let activePlayerIndex: number;
  if (numActive === 2) {
    // In Heads-Up preflop: Dealer acts first
    activePlayerIndex = state.dealerIndex;
  } else {
    // In Multi-Way preflop: UTG (Under The Gun, left of Big Blind) acts first
    activePlayerIndex = getNextActiveSeat(
      players,
      bbIdx,
      (p) => !p.isEliminated && !p.isFolded && p.chips > 0
    );
  }

  return {
    ...state,
    players,
    pot,
    currentBet,
    minRaise,
    activePlayerIndex,
  };
}

function formatWinDescription(name: string, detail: string): string {
  const verb = name.trim().toLowerCase() === 'you' ? 'win' : 'wins';
  return `${name} ${verb} ${detail}`;
}

/**
 * Calculates main pot and side pots based on each player's total investment.
 */
export function calculatePots(players: Player[]): SidePot[] {
  // Get all players who invested chips into this hand
  const investors = players
    .filter((p) => (p.totalInvestedThisHand || 0) > 0)
    .map((p) => ({
      id: p.id,
      invested: p.totalInvestedThisHand || 0,
      isFolded: p.isFolded,
      isAllIn: p.isAllIn,
    }));

  if (investors.length === 0) return [];

  // Find unique positive investment levels from all-in players + max investment
  const levels = Array.from(
    new Set(investors.map((i) => i.invested))
  ).sort((a, b) => a - b);

  const pots: SidePot[] = [];
  let previousLevel = 0;

  for (let i = 0; i < levels.length; i++) {
    const currentLevel = levels[i];
    const chunkPerPlayer = currentLevel - previousLevel;
    if (chunkPerPlayer <= 0) continue;

    let potAmount = 0;
    const eligiblePlayerIds: string[] = [];

    for (const inv of investors) {
      if (inv.invested > previousLevel) {
        const contributed = Math.min(inv.invested - previousLevel, chunkPerPlayer);
        potAmount += contributed;

        // If player has not folded, they are eligible to contest this pot
        if (!inv.isFolded) {
          eligiblePlayerIds.push(inv.id);
        }
      }
    }

    if (potAmount > 0) {
      pots.push({
        id: `pot_${i}`,
        amount: potAmount,
        eligiblePlayerIds,
      });
    }

    previousLevel = currentLevel;
  }

  return pots;
}

/**
 * Distributes the pot at the end of a hand or on a fold.
 * Handles single winner (all others folded), split pots, and multi-way side pots.
 */
export function distributePot(
  state: GameState,
  evaluations?: Record<string, HandEvaluation>
): GameState {
  const players = state.players.map((p) => ({ ...p }));
  const nonFolded = players.filter((p) => !p.isFolded && !p.isEliminated);

  let winners: WinnerResult[] = [];

  // Case 1: Only 1 non-folded player left (everyone else folded)
  if (nonFolded.length === 1) {
    const winner = nonFolded[0];
    winner.chips += state.pot;
    const foldedPlayers = players.filter((p) => p.isFolded);
    const reason = foldedPlayers.length === 1 ? `${foldedPlayers[0].name} folded` : 'others folded';
    winners = [
      {
        playerId: winner.id,
        amount: state.pot,
        description: formatWinDescription(winner.name, `${state.pot} chips (${reason})`),
      },
    ];

    return {
      ...state,
      players,
      pot: 0,
      sidePots: [],
      winners,
      stage: 'ended',
    };
  }

  // Case 2: Showdown evaluation
  if (!evaluations) {
    throw new Error('Showdown distribution requires hand evaluations for active players.');
  }

  // Calculate side pots based on total investments
  const calculatedPots = calculatePots(players);
  const potsToDistribute = calculatedPots.length > 0 ? calculatedPots : [{ id: 'main', amount: state.pot, eligiblePlayerIds: nonFolded.map(p => p.id) }];

  const playerWins: Record<string, { amount: number; description: string; bestCards?: HandEvaluation['bestFiveCards'] }> = {};

  for (const pot of potsToDistribute) {
    if (pot.amount <= 0) continue;

    // Filter eligible players who made it to showdown
    const eligibleContenders = pot.eligiblePlayerIds
      .map((id) => players.find((p) => p.id === id)!)
      .filter((p) => p && !p.isFolded && evaluations[p.id]);

    if (eligibleContenders.length === 0) {
      // Fallback: award to first non-folded player if eligibility empty
      if (nonFolded.length > 0) {
        nonFolded[0].chips += pot.amount;
      }
      continue;
    }

    if (eligibleContenders.length === 1) {
      const soleWinner = eligibleContenders[0];
      soleWinner.chips += pot.amount;
      const handEval = evaluations[soleWinner.id];
      if (!playerWins[soleWinner.id]) {
        playerWins[soleWinner.id] = { amount: 0, description: formatWinDescription(soleWinner.name, `with ${handEval.description}`), bestCards: handEval.bestFiveCards };
      }
      playerWins[soleWinner.id].amount += pot.amount;
      continue;
    }

    // Find highest hand score among eligible contenders
    let maxScore = -1;
    for (const contender of eligibleContenders) {
      const score = evaluations[contender.id]?.score ?? -1;
      if (score > maxScore) {
        maxScore = score;
      }
    }

    const winningContenders = eligibleContenders.filter(
      (c) => evaluations[c.id]?.score === maxScore
    );

    const share = Math.floor(pot.amount / winningContenders.length);
    let oddChips = pot.amount % winningContenders.length;

    // Distribute chips
    for (let i = 0; i < winningContenders.length; i++) {
      const winner = winningContenders[i];
      let winAmount = share;
      if (oddChips > 0) {
        winAmount += 1;
        oddChips--;
      }
      winner.chips += winAmount;

      const handEval = evaluations[winner.id];
      if (!playerWins[winner.id]) {
        playerWins[winner.id] = {
          amount: 0,
          description: winningContenders.length > 1
            ? `Split: ${handEval.description}`
            : formatWinDescription(winner.name, `with ${handEval.description}`),
          bestCards: handEval.bestFiveCards,
        };
      }
      playerWins[winner.id].amount += winAmount;
    }
  }

  winners = Object.entries(playerWins).map(([playerId, winData]) => ({
    playerId,
    amount: winData.amount,
    description: winData.description,
    bestFiveCards: winData.bestCards,
  }));

  return {
    ...state,
    players,
    pot: 0,
    sidePots: [],
    winners,
    stage: 'ended',
  };
}
