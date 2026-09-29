/**
 * Deterministic number, chip, and currency formatting.
 * Avoids Next.js SSR hydration mismatch errors where server-side Node.js
 * formatting (e.g. South African / European locale with space "1 000,00") differs from client browser ("1,000.00").
 */
export function formatChips(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) return '0';
  return Math.floor(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatCurrency(
  amount: number,
  currency: string = 'ZAR',
  includeDecimals: boolean = false
): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return includeDecimals ? `${currency} 0.00` : `${currency} 0`;
  }

  const intPart = Math.floor(Math.abs(amount))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  const sign = amount < 0 ? '-' : '';

  if (includeDecimals) {
    const decPart = (Math.abs(amount) % 1).toFixed(2).slice(2);
    return `${currency} ${sign}${intPart}.${decPart}`;
  }

  return `${currency} ${sign}${intPart}`;
}
