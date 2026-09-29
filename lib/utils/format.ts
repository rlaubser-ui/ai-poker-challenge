/**
 * Deterministic number and chip formatting.
 * Avoids Next.js SSR hydration mismatch errors where server-side Node.js
 * formatting (e.g. European/French locale with space "1 000") differs from client browser ("1,000").
 */
export function formatChips(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) return '0';
  return Math.floor(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
