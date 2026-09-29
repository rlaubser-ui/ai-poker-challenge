export interface SNGPersona {
  id: string;
  name: string;
  avatar: string;
  style: string;
  badge: string;
  color: string;
  bio: string;
  // Poker strategy matrix parameters
  vpip: number; // 0.0 to 1.0 (frequency of playing preflop)
  pfr: number;  // 0.0 to 1.0 (frequency of raising preflop)
  aggression: number; // 0.0 to 1.0 (postflop aggression factor)
  bluffRate: number; // 0.0 to 1.0
  foldToPressure: number; // 0.0 to 1.0
  // Banter lines for key game events
  quotes: {
    greeting: string[];
    raise: string[];
    allIn: string[];
    winPot: string[];
    badBeat: string[];
    eliminatePlayer: string[];
  };
}

export const SNG_OPPONENTS: SNGPersona[] = [
  {
    id: 'bot_viktor',
    name: 'Viktor "The Shark"',
    avatar: '🦈',
    style: 'TAG (Tight-Aggressive)',
    badge: 'SHARK',
    color: 'emerald',
    bio: 'Disciplined tournament pro. Plays tight ranges preflop and punishes weakness with mathematical precision.',
    vpip: 0.22,
    pfr: 0.18,
    aggression: 0.75,
    bluffRate: 0.15,
    foldToPressure: 0.45,
    quotes: {
      greeting: ['Cards speak, math decides.', 'Let us see if you understand pot odds.'],
      raise: ['The price of poker just went up.', 'Position and equity. Raising.'],
      allIn: ['Maximum pressure. Put all your chips on the line.', 'This is +EV in the long run.'],
      winPot: ['Calculated and collected.', 'Standard line against your range.'],
      badBeat: ['Variances exist. The math will balance out.'],
      eliminatePlayer: ['Seat open. Better luck in the next tournament.'],
    },
  },
  {
    id: 'bot_rex',
    name: 'Rex "Bulldozer"',
    avatar: '🚜',
    style: 'LAG (Loose-Aggressive)',
    badge: 'BULLDOZER',
    color: 'red',
    bio: 'Hyper-aggressive table bully. Puts maximum pressure on every street and loves 3-betting light.',
    vpip: 0.42,
    pfr: 0.35,
    aggression: 0.88,
    bluffRate: 0.38,
    foldToPressure: 0.2,
    quotes: {
      greeting: ['Hope you brought a helmet!', 'This table belongs to me!'],
      raise: ['You cannot handle this heat! Boom!', 'Bumping it up. Pay up or get out!'],
      allIn: ['SHOVE! All of it! What are you gonna do?', 'All-in, baby! Time to gamble!'],
      winPot: ['Too easy! Get out of my way!', 'Fear is a great motivator, isn\'t it?'],
      badBeat: ['You called with THAT?! Ridiculous luck!'],
      eliminatePlayer: ['Busted! Back to the micro stakes with you!'],
    },
  },
  {
    id: 'bot_larry',
    name: 'Larry "Lucky"',
    avatar: '🍀',
    style: 'Calling Station',
    badge: 'CALLING STATION',
    color: 'yellow',
    bio: 'Chases every draw and hates folding pairs. Believes his lucky streak will always deliver on the river.',
    vpip: 0.55,
    pfr: 0.08,
    aggression: 0.25,
    bluffRate: 0.05,
    foldToPressure: 0.15,
    quotes: {
      greeting: ['Just here to have fun and hit some rivers!', 'Any two cards can win!'],
      raise: ['Wait, I have something good! Let\'s raise!'],
      allIn: ['I got a hunch on this one... I\'m all in!'],
      winPot: ['I knew that card was coming!', 'Lady luck is on my side today!'],
      badBeat: ['Aw shucks, I was sure my pair would hold.'],
      eliminatePlayer: ['Oops, didn\'t mean to knock you out! GG!'],
    },
  },
  {
    id: 'bot_pete',
    name: 'Pete "Old School"',
    avatar: '🪨',
    style: 'The Rock (Nit)',
    badge: 'THE ROCK',
    color: 'stone',
    bio: 'Old-school grinder. Folds 85% of hands and only raises with premiums. If Pete bets, watch out.',
    vpip: 0.14,
    pfr: 0.11,
    aggression: 0.4,
    bluffRate: 0.02,
    foldToPressure: 0.7,
    quotes: {
      greeting: ['Patience is a virtue, son.', 'I\'ve been playing this game since before you were born.'],
      raise: ['I\'ve got the goods. Proceed at your own risk.', 'Premium hand. Raising.'],
      allIn: ['The nuts. Everything goes in.', 'I wouldn\'t call if I were you.'],
      winPot: ['Discipline always wins in the end.', 'Simple, straightforward poker.'],
      badBeat: ['Kids these days chasing runner-runner nonsense...'],
      eliminatePlayer: ['Told you to fold. Good game, kid.'],
    },
  },
  {
    id: 'bot_sophia',
    name: 'Sophia "GTO"',
    avatar: '📐',
    style: 'GTO Solver',
    badge: 'GTO SOLVER',
    color: 'blue',
    bio: 'Pure game-theory enthusiast. Balances bluffing frequencies and bets with calibrated pot fractions.',
    vpip: 0.26,
    pfr: 0.22,
    aggression: 0.65,
    bluffRate: 0.22,
    foldToPressure: 0.4,
    quotes: {
      greeting: ['Nash equilibrium loaded. Good luck.', 'Every decision is pure EV optimization.'],
      raise: ['Betting 66% pot to balance my range.', 'Exploitative sizing triggered.'],
      allIn: ['Polarized all-in threshold reached.', 'Calling this is -EV according to the solver.'],
      winPot: ['The frequency played out as predicted.', 'Variance absorbed, EV realized.'],
      badBeat: ['An unexploitable play that fell within the 12% outcome range.'],
      eliminatePlayer: ['Your stack has been liquidated according to optimal play.'],
    },
  },
  {
    id: 'bot_vince',
    name: 'Vince "Vegas"',
    avatar: '🎲',
    style: 'Action Junkie',
    badge: 'ACTION JUNKIE',
    color: 'purple',
    bio: 'Adrenaline addict who loves suited connectors, gutshot draws, and reckless tournament hero calls.',
    vpip: 0.48,
    pfr: 0.28,
    aggression: 0.8,
    bluffRate: 0.32,
    foldToPressure: 0.25,
    quotes: {
      greeting: ['We didn\'t come here to fold, people!', 'Turn on the spotlights, let\'s roll!'],
      raise: ['Let\'s spice things up! Raise!', 'Double down or go home!'],
      allIn: ['VEGAS BABY! ALL IN! Let\'s go!', 'Scared money don\'t make money!'],
      winPot: ['THAT\'S WHAT I\'M TALKING ABOUT!', 'High roller taking down the pot!'],
      badBeat: ['Hey, live by the gamble, die by the gamble!'],
      eliminatePlayer: ['Bustout! Next customer please!'],
    },
  },
];

export function getSNGPersona(id: string): SNGPersona {
  return SNG_OPPONENTS.find((p) => p.id === id) || SNG_OPPONENTS[0];
}
