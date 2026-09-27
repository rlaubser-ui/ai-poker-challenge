import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Poker Challenge — 1v1 Heads-Up Texas Hold\'em',
  description:
    'Test your poker strategy against Gemini 1.5 Pro, Claude 3.5 Sonnet, and GPT-4o with real-time banter and personality.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 antialiased selection:bg-amber-500 selection:text-zinc-950 min-h-screen">
        {children}
      </body>
    </html>
  );
}
